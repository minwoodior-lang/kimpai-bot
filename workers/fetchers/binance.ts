import axios from 'axios';
import type { MarketInfo, PriceMap, MarketStatsMap } from './types';

const PROXY_BASE = 'https://kimpai-price-proxy-1.onrender.com';
const BINANCE_SPOT_API = `${PROXY_BASE}/binance/api/v3/ticker/price`;
const BINANCE_SPOT_24HR_API = `${PROXY_BASE}/binance/api/v3/ticker/24hr`;
const BINANCE_FUTURES_API = `${PROXY_BASE}/binance/fapi/v1/ticker/price`;
const BINANCE_FUTURES_24HR_API = `${PROXY_BASE}/binance/fapi/v1/ticker/24hr`;

export async function fetchBinanceSpotPrices(markets: MarketInfo[]): Promise<PriceMap> {
  if (markets.length === 0) return {};

  try {
    const res = await axios.get(BINANCE_SPOT_API, { timeout: 15000 });

    const prices: PriceMap = {};
    const ts = Date.now();
    const priceMap = new Map<string, number>();

    for (const item of res.data) {
      priceMap.set(item.symbol, parseFloat(item.price));
    }

    for (const market of markets) {
      const symbol = `${market.base}${market.quote}`;
      const price = priceMap.get(symbol);
      if (price !== undefined && price > 0) {
        const key = `BINANCE:${market.base}:${market.quote}`;
        prices[key] = { price, ts, volume24hKrw: 0 };
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
    const res = await axios.get(BINANCE_FUTURES_API, { timeout: 15000 });

    const prices: PriceMap = {};
    const ts = Date.now();
    const priceMap = new Map<string, number>();

    for (const item of res.data) {
      priceMap.set(item.symbol, parseFloat(item.price));
    }

    for (const market of markets) {
      const symbol = `${market.base}${market.quote}`;
      const price = priceMap.get(symbol);
      if (price !== undefined && price > 0) {
        const key = `BINANCE_FUTURES:${market.base}:${market.quote}`;
        prices[key] = { price, ts, volume24hKrw: 0 };
      }
    }

    return prices;
  } catch (err: any) {
    console.error('[Binance Futures] Fetch error:', err.message);
    return {};
  }
}

export async function fetchBinanceStats(markets: MarketInfo[]): Promise<MarketStatsMap> {
  if (markets.length === 0) return {};

  try {
    const res = await axios.get(BINANCE_SPOT_24HR_API, { timeout: 15000 });
    const stats: MarketStatsMap = {};
    const marketBases = new Set(markets.map(m => m.base.toUpperCase()));

    for (const item of res.data) {
      const symbol = item.symbol;
      if (symbol.endsWith('USDT')) {
        const base = symbol.replace('USDT', '');
        if (marketBases.has(base)) {
          const key = `BINANCE:${base}:USDT`;
          stats[key] = {
            change24hRate: parseFloat(item.priceChangePercent) || 0,
            change24hAbs: parseFloat(item.priceChange) || 0,
            high24h: parseFloat(item.highPrice) || null,
            low24h: parseFloat(item.lowPrice) || null,
            volume24hQuote: parseFloat(item.quoteVolume) || 0
          };
        }
      }
    }

    return stats;
  } catch (err: any) {
    console.error('[Binance Stats] Fetch error:', err.message);
    return {};
  }
}

export async function fetchBinanceFuturesStats(markets: MarketInfo[]): Promise<MarketStatsMap> {
  if (markets.length === 0) return {};

  try {
    const res = await axios.get(BINANCE_FUTURES_24HR_API, { timeout: 15000 });
    const stats: MarketStatsMap = {};
    const marketBases = new Set(markets.map(m => m.base.toUpperCase()));

    for (const item of res.data) {
      const symbol = item.symbol;
      if (symbol.endsWith('USDT')) {
        const base = symbol.replace('USDT', '');
        if (marketBases.has(base)) {
          const key = `BINANCE_FUTURES:${base}:USDT`;
          stats[key] = {
            change24hRate: parseFloat(item.priceChangePercent) || 0,
            change24hAbs: parseFloat(item.priceChange) || 0,
            high24h: parseFloat(item.highPrice) || null,
            low24h: parseFloat(item.lowPrice) || null,
            volume24hQuote: parseFloat(item.quoteVolume) || 0
          };
        }
      }
    }

    return stats;
  } catch (err: any) {
    console.error('[Binance Futures Stats] Fetch error:', err.message);
    return {};
  }
}
