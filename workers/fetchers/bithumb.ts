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
        if (data[base]) {
          const item = data[base];
          let price = parseFloat(item.closing_price) || 0;
          const prevPrice = parseFloat(item.prev_closing_price) || 0;
          
          if (price === 0 && prevPrice > 0) {
            const fluctate = parseFloat(item.fluctate_24H) || 0;
            price = prevPrice + fluctate;
          }
          
          if (price > 0) {
            const key = `BITHUMB:${base}:${quote}`;
            const change24hAbs = parseFloat(item.fluctate_24H) || 0;
            const change24hRate = parseFloat(item.fluctate_rate_24H) || 0;
            prices[key] = {
              price,
              ts,
              volume24hKrw: parseFloat(item.acc_trade_value_24H) || 0,
              change24hRate,
              change24hAbs,
              high24h: parseFloat(item.max_price) || undefined,
              low24h: parseFloat(item.min_price) || undefined,
              prev_price: prevPrice || undefined
            };
          }
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
          let closingPrice = parseFloat(item.closing_price) || 0;
          const prevClosingPrice = parseFloat(item.prev_closing_price) || 0;
          
          // 빗썸 API 특이사항: 당일 거래가 적은 코인은 closing_price가 0
          // 이 경우 prev_closing_price + fluctate_24H로 현재가 계산
          if (closingPrice === 0 && prevClosingPrice > 0) {
            const fluctate = parseFloat(item.fluctate_24H) || 0;
            closingPrice = prevClosingPrice + fluctate;
          }
          
          // 변동률/변동액은 API에서 제공하는 24H 기준 값 사용
          const change24hRate = parseFloat(item.fluctate_rate_24H) || 0;
          const change24hAbs = parseFloat(item.fluctate_24H) || 0;
          
          // high/low도 0이면 현재가로 대체
          let high24h: number | null = parseFloat(item.max_price) || 0;
          let low24h: number | null = parseFloat(item.min_price) || 0;
          if (high24h === 0 && closingPrice > 0) high24h = closingPrice;
          if (low24h === 0 && closingPrice > 0) low24h = closingPrice;
          if (high24h === 0) high24h = null;
          if (low24h === 0) low24h = null;

          const key = `BITHUMB:${base}:${quote}`;
          stats[key] = {
            change24hRate,
            change24hAbs,
            high24h,
            low24h,
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
