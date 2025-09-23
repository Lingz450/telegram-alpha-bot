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
export type Candle = { t: number; o: number; h: number; l: number; c: number };

export async function renderChart(opts: {
  symbol: string;
  timeframe: '5m'|'15m'|'1h'|'2h'|'4h'|'1d';
  candles: Candle[];
  width?: number;
  height?: number;
}): Promise<Buffer> {
  const width = opts.width ?? 900;
  const height = opts.height ?? 480;
  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });

  const html = `<!doctype html>
<meta charset="utf-8"/>
<style>
html,body{margin:0;background:#0f1115;color:#cbd5e1;font-family:system-ui,Segoe UI,Roboto,Arial}
.wrap{position:relative;width:${width}px;height:${height}px}
canvas{display:block;width:100%;height:100%;background:#0f1115}
.badge{position:absolute;left:8px;top:8px;padding:6px 10px;background:#111827;border:1px solid #1f2937;border-radius:8px;font-size:12px;color:#e5e7eb}
</style>
<div class="wrap">
  <div class="badge">${opts.symbol} • ${opts.timeframe}</div>
  <canvas id="c" width="${width}" height="${height}"></canvas>
</div>
<script>
const rows = ${JSON.stringify(opts.candles.slice(-500))};
const W=${width},H=${height},padL=54,padR=12,padT=22,padB=28;
const ctx=document.getElementById('c').getContext('2d');
function yScale(min,max,v){const h=H-padT-padB;return padT+(max-v)*h/(max-min||1)}
function xScale(i,n){const w=W-padL-padR;return padL+i*(w/Math.max(1,n-1))}
const closes=rows.map(r=>r.c),min=Math.min(...closes),max=Math.max(...closes),pad=(max-min)*0.08||1,yMin=min-pad,yMax=max+pad;
ctx.strokeStyle='#1f2937';ctx.setLineDash([3,4]);for(let i=0;i<=5;i++){const y=padT+i*(H-padT-padB)/5;ctx.beginPath();ctx.moveTo(padL,y);ctx.lineTo(W-padR,y);ctx.stroke()}ctx.setLineDash([]);
ctx.lineWidth=2;ctx.strokeStyle='#60a5fa';ctx.beginPath();rows.forEach((r,i)=>{const x=xScale(i,rows.length),y=yScale(yMin,yMax,r.c);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)});ctx.stroke();
const last=rows.at(-1),yLast=yScale(yMin,yMax,last.c);ctx.strokeStyle='#374151';ctx.fillStyle='#e5e7eb';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(padL,yLast);ctx.lineTo(W-padR,yLast);ctx.stroke();const txt=String(last.c);ctx.fillStyle='#111827';const w=ctx.measureText(txt).width+10;ctx.fillRect(W-padR-w,yLast-10,w,20);ctx.strokeStyle='#4b5563';ctx.strokeRect(W-padR-w,yLast-10,w,20);ctx.fillStyle='#f9fafb';ctx.fillText(txt,W-padR-w+5,yLast+4);
window.__done=true;
</script>`;
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction('window.__done===true', { timeout: 10000 });
  const png = (await page.screenshot({ type: 'png' })) as Buffer;
  await page.close();
  return png;
}
