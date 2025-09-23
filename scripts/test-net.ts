// scripts/test-net.ts
import { request } from 'undici';

async function ping(url: string) {
  try {
    const res = await request(url, { maxRedirections: 2 });
    console.log(url, res.statusCode);
  } catch (e:any) {
    console.error(url, 'ERR:', e?.message || e);
  }
}

(async () => {
  await ping('https://api.binance.com/api/v3/ping');
  await ping('https://fapi.binance.com/fapi/v1/ping'); // futures
  await ping('https://api.bybit.com/v5/market/time');
  await ping('https://www.okx.com/api/v5/public/time');
})();
