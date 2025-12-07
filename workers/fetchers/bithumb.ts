import axios from 'axios';
import type { MarketInfo, PriceMap, MarketStatsMap } from './types';

const BITHUMB_API = 'https://api.bithumb.com/public/ticker/ALL_';

// 빗썸 전용 axios 인스턴스 (최고 성능 연결 풀링)
const bithumbInstance = axios.create({
  timeout: 2000,
  httpAgent: new (require('http').Agent)({ keepAlive: true, maxSockets: 20, maxFreeSockets: 20 }),
  httpsAgent: new (require('https').Agent)({ keepAlive: true, maxSockets: 20, maxFreeSockets: 20 })
});

async function fetchBithumbQuote(quote: string, markets: MarketInfo[]): Promise<{ quote: string; data: any; status: string }> {
  try {
    const url = `${BITHUMB_API}${quote}`;
    const res = await bithumbInstance.get(url);
    
    if (res.data.status !== '0000') {
      return { quote, data: {}, status: res.data.status };
    }
    
    return { quote, data: res.data.data || {}, status: '0000' };
  } catch (err: any) {
    console.error(`[Bithumb] Fetch error (${quote}):`, err.message);
    return { quote, data: {}, status: 'error' };
  }
}

export async function fetchBithumbPrices(markets: MarketInfo[]): Promise<PriceMap> {
  if (markets.length === 0) return {};

  const prices: PriceMap = {};
  const ts = Date.now();
  const quotes = Array.from(new Set(markets.map(m => m.quote)));

  // KRW, BTC를 병렬로 요청 (순차가 아니라 동시에!)
  const results = await Promise.all(
    quotes.map(quote => fetchBithumbQuote(quote, markets))
  );

  // 결과 처리
  for (const { quote, data, status } of results) {
    if (status !== '0000') continue;

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
          const rawVolume24h = Number(item.acc_trade_value_24H);
          prices[key] = {
            price,
            ts,
            volume24hKrw: Number.isFinite(rawVolume24h) ? rawVolume24h : null,
            change24hRate,
            change24hAbs,
            high24h: parseFloat(item.max_price) || undefined,
            low24h: parseFloat(item.min_price) || undefined,
            prev_price: prevPrice || undefined
          };
        }
      }
    }
  }

  return prices;
}

export async function fetchBithumbStats(markets: MarketInfo[]): Promise<MarketStatsMap> {
  if (markets.length === 0) return {};

  const stats: MarketStatsMap = {};
  const quotes = Array.from(new Set(markets.map(m => m.quote)));

  // KRW, BTC를 병렬로 요청
  const results = await Promise.all(
    quotes.map(quote => fetchBithumbQuote(quote, markets))
  );

  // 결과 처리
  for (const { quote, data, status } of results) {
    if (status !== '0000') continue;

    const quoteMarkets = markets.filter(m => m.quote === quote);

    for (const market of quoteMarkets) {
      const base = market.base;
      if (data[base]) {
        const item = data[base];
        let closingPrice = parseFloat(item.closing_price) || 0;
        const prevClosingPrice = parseFloat(item.prev_closing_price) || 0;
        
        if (closingPrice === 0 && prevClosingPrice > 0) {
          const fluctate = parseFloat(item.fluctate_24H) || 0;
          closingPrice = prevClosingPrice + fluctate;
        }
        
        const change24hRate = parseFloat(item.fluctate_rate_24H) || 0;
        const change24hAbs = parseFloat(item.fluctate_24H) || 0;
        
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
  }

  return stats;
}
