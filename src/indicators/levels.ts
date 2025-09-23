// src/indicators/levels.ts
type Candle = { t:number,o:number,h:number,l:number,c:number };

function isPivotHigh(arr:Candle[], i:number, left:number, right:number){
  for (let j=1;j<=left;j++) if (arr[i].h <= arr[i-j]?.h) return false;
  for (let j=1;j<=right;j++) if (arr[i].h <= arr[i+j]?.h) return false;
  return true;
}
function isPivotLow(arr:Candle[], i:number, left:number, right:number){
  for (let j=1;j<=left;j++) if (arr[i].l >= arr[i-j]?.l) return false;
  for (let j=1;j<=right;j++) if (arr[i].l >= arr[i+j]?.l) return false;
  return true;
}

export function findKeyLevels(candles:Candle[], left=3, right=3){
  const highs:number[] = [];
  const lows:number[] = [];
  for (let i=left; i < candles.length-right; i++){
    if (isPivotHigh(candles,i,left,right)) highs.push(candles[i].h);
    if (isPivotLow(candles,i,left,right))  lows.push(candles[i].l);
  }
  const lastClose = candles.at(-1)!.c;
  // Sort by distance from last close (nearest first)
  const resistances = highs.filter(x => x > lastClose).sort((a,b)=>Math.abs(a-lastClose)-Math.abs(b-lastClose));
  const supports    = lows.filter(x => x < lastClose).sort((a,b)=>Math.abs(a-lastClose)-Math.abs(b-lastClose));
  return { supports, resistances };
}
