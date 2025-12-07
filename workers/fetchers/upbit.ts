import axios from 'axios';
import type { MarketInfo, PriceMap } from './types';

const UPBIT_API = 'https://api.upbit.com/v1/ticker';

// 업빗 전용 axios 인스턴스 (연결 풀링 활성화)
const upbitInstance = axios.create({
  timeout: 3000,
  httpAgent: new (require('http').Agent)({ keepAlive: true, maxSockets: 10 }),
  httpsAgent: new (require('https').Agent)({ keepAlive: true, maxSockets: 10 })
});

export async function fetchUpbitPrices(markets: MarketInfo[]): Promise<PriceMap> {
  if (markets.length === 0) return {};

  const marketCodes = markets.map(m => `${m.quote}-${m.base}`).join(',');
  
  try {
    const res = await upbitInstance.get(UPBIT_API, {
      params: { markets: marketCodes }
    });

    const prices: PriceMap = {};
    const ts = Date.now();

    for (const item of res.data) {
      const [quote, base] = item.market.split('-');
      const key = `UPBIT:${base}:${quote}`;
      const accTradePrice24h = Number(item.acc_trade_price_24h);
      prices[key] = {
        price: item.trade_price,
        ts,
        volume24hKrw: Number.isFinite(accTradePrice24h) ? accTradePrice24h : null,
        change24hRate: (item.signed_change_rate ?? 0) * 100,
        change24hAbs: item.signed_change_price ?? 0,
        high24h: item.high_price ?? undefined,
        low24h: item.low_price ?? undefined,
        prev_price: item.prev_closing_price ?? undefined
      };
    }

    return prices;
  } catch (err: any) {
    console.error('[Upbit] Fetch error:', err.message);
    return {};
  }
}
