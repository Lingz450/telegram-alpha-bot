import type { Browser } from 'puppeteer';
let _browser: Browser | null = null;
async function getBrowser() {
  const puppeteer = await import('puppeteer');
  if (_browser && _browser.isConnected()) return _browser;
  _browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.CHROME_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  return _browser;
}

type OB = { bids: [number, number][], asks: [number, number][] };

export async function renderHeatmap(opts: {
  symbol: string;
  mode?: 'normal'|'extended';
  orderbook: OB;
  width?: number;
  height?: number;
}): Promise<Buffer> {
  const width = opts.width ?? 900;
  const height = opts.height ?? 480;
  const depth = opts.mode === 'extended' ? 160 : 60;
  const bids = (opts.orderbook.bids || []).slice(0, depth);
  const asks = (opts.orderbook.asks || []).slice(0, depth);

  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });

  const html = `<!doctype html><meta charset="utf-8"/><style>
html,body{margin:0;background:#0f1115;color:#cbd5e1;font-family:system-ui,Segoe UI,Roboto,Arial}
.wrap{position:relative;width:${width}px;height:${height}px}
canvas{display:block;width:100%;height:100%;background:#0f1115}
.badge{position:absolute;left:8px;top:8px;padding:6px 10px;background:#111827;border:1px solid #1f2937;border-radius:8px;font-size:12px;color:#e5e7eb}
</style>
<div class="wrap"><div class="badge">${opts.symbol} • book ${opts.mode || 'normal'}</div><canvas id="c" width="${width}" height="${height}"></canvas></div>
<script>
const bids=${JSON.stringify(bids)},asks=${JSON.stringify(asks)},W=${width},H=${height},padL=16,padR=16,padT=36,padB=16,midX=W/2;
const ctx=document.getElementById('c').getContext('2d');
ctx.strokeStyle='#1f2937';ctx.beginPath();ctx.moveTo(midX,padT);ctx.lineTo(midX,H-padB);ctx.stroke();
function col(r,g,b,a){return 'rgba('+r+','+g+','+b+','+a+')'}
const maxBid=bids.reduce((m,r)=>Math.max(m,+r[1]||0),0)||1;
const maxAsk=asks.reduce((m,r)=>Math.max(m,+r[1]||0),0)||1;
const rowH=Math.max(8,Math.min(14,(H-padT-padB)/Math.max(bids.length,asks.length,1)));
const barMaxW=(W/2-padL-30);
ctx.font='12px system-ui,Segoe UI,Roboto,Arial';
bids.forEach((r,i)=>{const p=r[0],s=r[1],y=padT+i*rowH+2,w=Math.max(1,Math.floor((s/maxBid)*barMaxW)),x=midX-6-w;const a=0.35+0.55*(s/maxBid);ctx.fillStyle=col(34,197,94,a);ctx.fillRect(x,y,w,rowH-3);ctx.fillStyle='#9ca3af';ctx.fillText(String(p),padL,y+rowH-6);});
asks.forEach((r,i)=>{const p=r[0],s=r[1],y=padT+i*rowH+2,w=Math.max(1,Math.floor((s/maxAsk)*barMaxW)),x=midX+6;const a=0.35+0.55*(s/maxAsk);ctx.fillStyle=col(239,68,68,a);ctx.fillRect(x,y,w,rowH-3);ctx.fillStyle='#9ca3af';const txt=String(p);const tw=ctx.measureText(txt).width;ctx.fillText(txt,W-padR-tw,y+rowH-6);});
window.__done=true;
</script>`;
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction('window.__done===true', { timeout: 10000 });
  const png = (await page.screenshot({ type: 'png' })) as Buffer;
  await page.close();
  return png;
}
