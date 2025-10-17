// src/utils/tradeFeed.ts
import chalk from 'chalk';
import dayjs from 'dayjs';

/**
 * Trade feed logger for alerts, signals, and scalps.
 * Adds human-readable timestamps + trader emojis.
 */

function timestamp() {
  return chalk.gray(`[${dayjs().format('HH:mm:ss')}]`);
}

function formatPct(pct: number | null | undefined) {
  if (pct == null) return '';
  const color = pct >= 0 ? chalk.greenBright : chalk.redBright;
  return color(`${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`);
}

export const tradeFeed = {
  /**
   * 🔔 Alert trigger (price cross)
   */
  alert(symbol: string, price: number, change?: number) {
    const pct = change ? formatPct(change) : '';
    console.log(
      `${timestamp()} ${chalk.yellowBright('🔔')} ${chalk.bold(
        symbol
      )} hit alert ${chalk.cyan(price.toLocaleString())} ${pct}`
    );
  },

  /**
   * ⚡ EMA or MA cross signal
   */
  cross(symbol: string, direction: 'up' | 'down', level: string) {
    const arrow =
      direction === 'up'
        ? chalk.greenBright('↑')
        : chalk.redBright('↓');
    console.log(
      `${timestamp()} ⚡ ${chalk.bold(symbol)} crossed ${chalk.magenta(
        level
      )} ${arrow}`
    );
  },

  /**
   * 💎 RSI condition
   */
  rsi(symbol: string, value: number, state: 'overbought' | 'oversold') {
    const color = state === 'overbought' ? chalk.redBright : chalk.greenBright;
    console.log(
      `${timestamp()} 💎 ${chalk.bold(symbol)} RSI ${color(
        value.toFixed(1)
      )} | ${chalk.gray(state.toUpperCase())}`
    );
  },

  /**
   * 📈 Regular pulse (market heartbeat)
   */
  pulse(symbol: string, price: number) {
    console.log(
      `${timestamp()} 📊 ${chalk.bold(symbol)} @ ${chalk.cyan(
        `$${price.toLocaleString()}`
      )}`
    );
  },

  /**
   * 🧠 Custom message (AI / Alpha / Backtest output)
   */
  insight(msg: string) {
    console.log(`${timestamp()} 🧠 ${chalk.cyanBright(msg)}`);
  },

  /**
   * 🔥 Trade executed or simulated (buy/sell)
   */
  trade(symbol: string, side: 'buy' | 'sell', price: number, size?: number) {
    const color = side === 'buy' ? chalk.greenBright : chalk.redBright;
    console.log(
      `${timestamp()} 💥 ${color(side.toUpperCase())} ${chalk.bold(
        symbol
      )} @ ${chalk.cyan(price)} ${size ? chalk.gray(`(${size} qty)`) : ''}`
    );
  },
};
