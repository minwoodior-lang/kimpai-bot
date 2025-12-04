import axios from 'axios';
import type { MarketInfo, PriceMap, MarketStatsMap } from './types';

const BITHUMB_API = 'https://api.bithumb.com/public/ticker/ALL_';

export async function fetchBithumbPrices(markets: MarketInfo[]): Promise<PriceMap> {
  if (markets.length === 0) return {};

  const prices: PriceMap = {};
  const ts = Date.now();

  const quotes = Array.from(new Set(markets.map(m => m.quote)));

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

export async function fetchBithumbStats(markets: MarketInfo[]): Promise<MarketStatsMap> {
  if (markets.length === 0) return {};

  const stats: MarketStatsMap = {};
  const quotes = Array.from(new Set(markets.map(m => m.quote)));

  for (const quote of quotes) {
    try {
      const url = `${BITHUMB_API}${quote}`;
      const res = await axios.get(url, { timeout: 5000 });

      if (res.data.status !== '0000') continue;

      const data = res.data.data;
      const quoteMarkets = markets.filter(m => m.quote === quote);

      for (const market of quoteMarkets) {
        const base = market.base;
        if (data[base]) {
          const item = data[base];
          const closingPrice = parseFloat(item.closing_price) || 0;
          const prevClosingPrice = parseFloat(item.prev_closing_price) || 0;
          const change24hAbs = closingPrice - prevClosingPrice;
          const change24hRate = prevClosingPrice > 0 ? (change24hAbs / prevClosingPrice) * 100 : 0;

          const key = `BITHUMB:${base}:${quote}`;
          stats[key] = {
            change24hRate,
            change24hAbs,
            high24h: parseFloat(item.max_price) || null,
            low24h: parseFloat(item.min_price) || null,
            volume24hQuote: parseFloat(item.acc_trade_value_24H) || 0
          };
        }
      }
    } catch (err: any) {
      console.error(`[Bithumb Stats] Fetch error (${quote}):`, err.message);
    }
  }

  return stats;
}
