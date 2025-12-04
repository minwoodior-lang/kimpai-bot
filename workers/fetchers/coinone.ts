import axios from 'axios';
import type { MarketInfo, PriceMap } from './types';

const COINONE_API = 'https://api.coinone.co.kr/public/v2/ticker_new/KRW';

export async function fetchCoinonePrices(markets: MarketInfo[]): Promise<PriceMap> {
  if (markets.length === 0) return {};

  try {
    const res = await axios.get(COINONE_API, { timeout: 5000 });

    if (res.data.result !== 'success') return {};

    const prices: PriceMap = {};
    const ts = Date.now();
    const tickers = res.data.tickers || [];

    const marketBases = new Set(markets.map(m => m.base.toUpperCase()));

    for (const ticker of tickers) {
      const base = ticker.target_currency?.toUpperCase();
      if (base && marketBases.has(base) && ticker.last) {
        const key = `COINONE:${base}:KRW`;
        prices[key] = {
          price: parseFloat(ticker.last),
          ts
        };
      }
    }

    return prices;
  } catch (err: any) {
    console.error('[Coinone] Fetch error:', err.message);
    return {};
  }
}
