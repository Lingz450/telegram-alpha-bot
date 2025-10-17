// src/core/tone.ts
export function toneReply(symbol: string, price: number): string {
  const tones = [
    `📈 ${symbol} flexing right now around $${price.toFixed(2)} — momentum looking solid.`,
    `💀 ${symbol} moving sus, hovering near $${price.toFixed(2)}. Tight stops, don’t get cooked.`,
    `🔥 ${symbol} just vibing at $${price.toFixed(2)} — might squeeze shorts if it holds.`,
    `🧊 ${symbol} chilling around $${price.toFixed(2)} — looks like crab season.`,
    `💫 ${symbol} hovering $${price.toFixed(2)}, volume cooling, wait for reclaim.`,
    `👀 ${symbol} price $${price.toFixed(2)} — pick your poison, scalp or swing.`,
  ];

  return tones[Math.floor(Math.random() * tones.length)];
}
