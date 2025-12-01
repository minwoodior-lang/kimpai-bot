import type { NextApiRequest, NextApiResponse } from 'next';

const BINANCE_SPOT_URL = 'https://api.binance.com/api/v3/ticker/24hr';
const BINANCE_FUTURES_URL = 'https://fapi.binance.com/fapi/v1/ticker/24hr';
const COINGECKO_FALLBACK = 'https://api.coingecko.com/api/v3/coins/markets';

let cachedSpotData: any = null;
let cachedFuturesData: any = null;
let cachedCoingeckoData: any = null;
let lastSpotFetch = 0;
let lastFuturesFetch = 0;
let lastCoingeckoFetch = 0;
const CACHE_DURATION = 5000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { market = 'spot' } = req.query;
  const now = Date.now();

  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    if (market === 'futures') {
      if (cachedFuturesData && now - lastFuturesFetch < CACHE_DURATION) {
        return res.status(200).json({ source: 'binance_futures_cached', data: cachedFuturesData });
      }

      const response = await fetch(BINANCE_FUTURES_URL, {
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
      });

      if (response.ok) {
        cachedFuturesData = await response.json();
        lastFuturesFetch = now;
        return res.status(200).json({ source: 'binance_futures', data: cachedFuturesData });
      }

      console.log('Binance Futures API blocked, using CoinGecko spot data as fallback');
      
      if (cachedCoingeckoData && now - lastCoingeckoFetch < CACHE_DURATION * 6) {
        return res.status(200).json({ source: 'coingecko_futures_fallback_cached', data: transformCoingeckoData(cachedCoingeckoData) });
      }

      const cgResponse = await fetch(
        `${COINGECKO_FALLBACK}?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (cgResponse.ok) {
        cachedCoingeckoData = await cgResponse.json();
        lastCoingeckoFetch = now;
        return res.status(200).json({ source: 'coingecko_futures_fallback', data: transformCoingeckoData(cachedCoingeckoData) });
      }

      return res.status(200).json({ source: 'cache', data: cachedFuturesData || transformCoingeckoData(cachedCoingeckoData) || [] });
    }

    if (cachedSpotData && now - lastSpotFetch < CACHE_DURATION) {
      return res.status(200).json({ source: 'binance_spot_cached', data: cachedSpotData });
    }

    const response = await fetch(BINANCE_SPOT_URL, {
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
    });

    if (response.ok) {
      cachedSpotData = await response.json();
      lastSpotFetch = now;
      return res.status(200).json({ source: 'binance_spot', data: cachedSpotData });
    }

    console.log('Binance API blocked, falling back to CoinGecko');

    if (cachedCoingeckoData && now - lastCoingeckoFetch < CACHE_DURATION * 6) {
      return res.status(200).json({ source: 'coingecko_cached', data: transformCoingeckoData(cachedCoingeckoData) });
    }

    const cgResponse = await fetch(
      `${COINGECKO_FALLBACK}?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h`,
      {
        headers: { 'Accept': 'application/json' },
      }
    );

    if (cgResponse.ok) {
      cachedCoingeckoData = await cgResponse.json();
      lastCoingeckoFetch = now;
      return res.status(200).json({ source: 'coingecko', data: transformCoingeckoData(cachedCoingeckoData) });
    }

    return res.status(200).json({ source: 'cache', data: cachedSpotData || transformCoingeckoData(cachedCoingeckoData) || [] });

  } catch (error) {
    console.error('Binance proxy error:', error);
    const fallbackData = cachedSpotData || transformCoingeckoData(cachedCoingeckoData) || [];
    return res.status(200).json({ source: 'error_cache', data: fallbackData });
  }
}

function transformCoingeckoData(cgData: any[]): any[] {
  if (!Array.isArray(cgData)) return [];
  
  return cgData.map(coin => ({
    symbol: `${coin.symbol.toUpperCase()}USDT`,
    lastPrice: String(coin.current_price || 0),
    priceChangePercent: String(coin.price_change_percentage_24h || 0),
    quoteVolume: String(coin.total_volume || 0),
    openPrice: String((coin.current_price || 0) / (1 + (coin.price_change_percentage_24h || 0) / 100)),
    highPrice: String(coin.high_24h || 0),
    lowPrice: String(coin.low_24h || 0),
    volume: String((coin.total_volume || 0) / (coin.current_price || 1)),
    count: 0,
    bidPrice: String(coin.current_price || 0),
    askPrice: String(coin.current_price || 0),
    weightedAvgPrice: String(coin.current_price || 0),
    prevClosePrice: String((coin.current_price || 0) / (1 + (coin.price_change_percentage_24h || 0) / 100)),
    closeTime: Date.now(),
    openTime: Date.now() - 86400000,
    firstId: 0,
    lastId: 0,
    _source: 'coingecko'
  }));
}
