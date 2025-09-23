"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHelp = registerHelp;
function helpText() {
    return [
        '*Core commands*',
        '- /alpha <symbol> → AI market take (or type $symbol)',
        '- /alert <symbol> <price>',
        '- /alertlist',
        '- /alertreset [symbol] [price] (admin)',
        '- /chart <symbol> [ltf=5m|15m|1h|2h|4h|1d]',
        '- /ema <50|100|200> <5m|15m|1h|2h|4h|1d>',
        '- /rsi <5m|15m|1h|2h|4h|1d> <overbought|oversold>',
        '- /heatmap <pair> [normal|extended]',
        '- /findpair <price>',
        '- /call <pair> entry=<p> sl=<p> lev=<x> tp=<p1,p2,...> (admin)',
        '- /margin cmp=<p> sl=<p> risk=<amt> lev=<x>',
        '- /pnl <pair> [channelId]',
        '- /wallet',
        '- /giveaway <durationSec> <prize> winners=N (admin)',
        '- /div (admin)',
        '',
        'Shortcuts:',
        '- $btc            → AI market take (same as /alpha btc)',
        '- $btc 65000      → set alert quickly (same as /alert BTC 65000)',
    ].join('\n');
}
function registerHelp(bot) {
    var reply = function (ctx) { return ctx.reply(helpText(), { parse_mode: 'Markdown' }); };
    bot.start(reply);
    bot.command('help', reply);
    bot.hears(/^help$/i, reply);
}
