import axios from 'axios';
import type { MarketInfo, PriceMap } from './types';

const BITHUMB_API = 'https://api.bithumb.com/public/ticker/ALL_';

export async function fetchBithumbPrices(markets: MarketInfo[]): Promise<PriceMap> {
  if (markets.length === 0) return {};

  const prices: PriceMap = {};
  const ts = Date.now();

  const quotes = [...new Set(markets.map(m => m.quote))];

  for (const quote of quotes) {
    try {
      const url = `${BITHUMB_API}${quote}`;
      const res = await axios.get(url, { timeout: 5000 });

      if (res.data.status !== '0000') continue;

      const data = res.data.data;
      const quoteMarkets = markets.filter(m => m.quote === quote);

      for (const market of quoteMarkets) {
        const base = market.base;
        if (data[base] && data[base].closing_price) {
          const key = `BITHUMB:${base}:${quote}`;
          prices[key] = {
            price: parseFloat(data[base].closing_price),
            ts
          };
        }
      }
    } catch (err: any) {
      console.error(`[Bithumb] Fetch error (${quote}):`, err.message);
    }
  }

  return prices;
}
