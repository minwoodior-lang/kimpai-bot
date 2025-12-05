import axios from 'axios';
import type { MarketInfo, PriceMap } from './types';

const UPBIT_API = 'https://api.upbit.com/v1/ticker';

export async function fetchUpbitPrices(markets: MarketInfo[]): Promise<PriceMap> {
  if (markets.length === 0) return {};

  const marketCodes = markets.map(m => `${m.quote}-${m.base}`).join(',');
  
  try {
    const res = await axios.get(UPBIT_API, {
      params: { markets: marketCodes },
      timeout: 5000
    });

    const prices: PriceMap = {};
    const ts = Date.now();

    for (const item of res.data) {
      const [quote, base] = item.market.split('-');
      const key = `UPBIT:${base}:${quote}`;
      prices[key] = {
        price: item.trade_price,
        ts,
        volume24hKrw: item.acc_trade_price_24h || 0,
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
