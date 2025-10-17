// src/telegram/buttons.ts
import { Telegraf, Context } from "telegraf";
import type { Cfg } from "../config";
import { prisma } from "../db/prisma";
import { sendOpts } from "../ui";

// Simple human price parser: "65k", "1.2m", "64,200"
function parseHumanPrice(input: string): number | null {
  const raw = input.trim().toLowerCase().replace(/[, ]/g, "");
  const m = raw.match(/^(\d+(?:\.\d+)?)([kmb])?$/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  const suf = (m[2] || "").toLowerCase();
  const mul = suf === "k" ? 1e3 : suf === "m" ? 1e6 : suf === "b" ? 1e9 : 1;
  return n * mul;
}

/** Buttons row you can attach under any market card */
export function actionButtons(symbol: string) {
  return {
    inline_keyboard: [
      [
        { text: "➕ Set Alert", callback_data: `alert:${symbol}` },
        { text: "👁️ Watch", callback_data: `watch:add:${symbol}` },
        {
          text: "🧭 Chart",
          url: `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(
            symbol
          )}`,
        },
      ],
    ],
  } as const;
}

/** Internal: remember who clicked “Set Alert” and for which symbol */
const pendingAlert = new Map<string, { chatId: string; symbol: string }>();
const keyOf = (ctx: Context) => `${ctx.chat?.id}:${ctx.from?.id}`;

/** Hook all button callbacks and the follow-up text for alert price */
export function registerInlineButtons(bot: Telegraf<Context>, cfg: Cfg, _log?: any) {
  // 1) User pressed “Set Alert”
  bot.on("callback_query", async (ctx, next) => {
    const data = (ctx.callbackQuery as any)?.data as string | undefined;
    if (!data) return next();

    // alert:<symbol>
    if (data.startsWith("alert:")) {
      const symbol = data.slice("alert:".length);
      pendingAlert.set(keyOf(ctx), { chatId: String(ctx.chat?.id), symbol });
      await ctx.answerCbQuery("OK! Reply with a price (e.g. 65000 or 65k).");
      return ctx.reply(
        `Set alert for <b>${symbol}</b> — reply with a price (e.g. <code>65000</code> or <code>65k</code>).`,
        sendOpts
      );
    }

    // watch:add:<symbol>
    if (data.startsWith("watch:add:")) {
      const symbol = data.slice("watch:add:".length);
      try {
        await prisma.watchItem.create({
          data: {
            chatId: String(ctx.chat?.id),
            userId: String(ctx.from?.id),
            symbol,
          },
        });
        await ctx.answerCbQuery(`Added ${symbol} to your watchlist ✅`, { show_alert: false });
      } catch {
        await ctx.answerCbQuery(`Already on your watchlist`, { show_alert: false });
      }
      return;
    }

    // watch:rm:<symbol>  (not used in default row, but available)
    if (data.startsWith("watch:rm:")) {
      const symbol = data.slice("watch:rm:".length);
      const r = await prisma.watchItem.deleteMany({
        where: { chatId: String(ctx.chat?.id), userId: String(ctx.from?.id), symbol },
      });
      await ctx.answerCbQuery(r.count ? `Removed ${symbol}` : `Not found`, { show_alert: false });
      return;
    }

    return next();
  });

  // 2) If user is in “awaiting price” state, capture their next text
  bot.on("text", async (ctx, next) => {
    const k = keyOf(ctx);
    const pending = pendingAlert.get(k);
    if (!pending) return next();

    const priceNum = parseHumanPrice((ctx.message as any).text || "");
    if (!priceNum) {
      return ctx.reply("That doesn’t look like a price. Try again like <code>65000</code> or <code>65k</code>.", sendOpts);
    }

    pendingAlert.delete(k);

    await prisma.alert.create({
      data: {
        chatId: pending.chatId,
        userId: String(ctx.from?.id),
        symbol: pending.symbol,
        triggerPrice: String(priceNum),
        direction: "either",
      },
    });

    return ctx.reply(
      `🔔 Alert set on <b>${pending.symbol}</b> at <code>${priceNum}</code>.`,
      sendOpts
    );
  });
}
