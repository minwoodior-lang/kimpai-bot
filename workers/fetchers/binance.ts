import axios from 'axios';
import type { MarketInfo, PriceMap } from './types';

const BINANCE_SPOT_API = 'https://api.binance.com/api/v3/ticker/price';
const BINANCE_FUTURES_API = 'https://fapi.binance.com/fapi/v1/ticker/price';

export async function fetchBinanceSpotPrices(markets: MarketInfo[]): Promise<PriceMap> {
  if (markets.length === 0) return {};

  try {
    const res = await axios.get(BINANCE_SPOT_API, { timeout: 5000 });

    const prices: PriceMap = {};
    const ts = Date.now();
    const priceMap = new Map<string, number>();

    for (const item of res.data) {
      priceMap.set(item.symbol, parseFloat(item.price));
    }

    for (const market of markets) {
      const symbol = `${market.base}${market.quote}`;
      const price = priceMap.get(symbol);
      if (price !== undefined) {
        const key = `BINANCE:${market.base}:${market.quote}`;
        prices[key] = { price, ts };
      }
    }

    return prices;
  } catch (err: any) {
    console.error('[Binance Spot] Fetch error:', err.message);
    return {};
  }
}

export async function fetchBinanceFuturesPrices(markets: MarketInfo[]): Promise<PriceMap> {
  if (markets.length === 0) return {};

  try {
    const res = await axios.get(BINANCE_FUTURES_API, { timeout: 5000 });

    const prices: PriceMap = {};
    const ts = Date.now();
    const priceMap = new Map<string, number>();

    for (const item of res.data) {
      priceMap.set(item.symbol, parseFloat(item.price));
    }

    for (const market of markets) {
      const symbol = `${market.base}${market.quote}`;
      const price = priceMap.get(symbol);
      if (price !== undefined) {
        const key = `BINANCE_FUTURES:${market.base}:${market.quote}`;
        prices[key] = { price, ts };
      }
    }

    return prices;
  } catch (err: any) {
    console.error('[Binance Futures] Fetch error:', err.message);
    return {};
  }
}
