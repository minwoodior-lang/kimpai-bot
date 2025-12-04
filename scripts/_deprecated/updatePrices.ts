import { supabaseAdmin } from './supabaseAdmin';

const SYMBOLS = [
  { upbit: 'KRW-BTC', coingecko: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
  { upbit: 'KRW-ETH', coingecko: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { upbit: 'KRW-XRP', coingecko: 'ripple', name: 'Ripple', symbol: 'XRP' },
  { upbit: 'KRW-SOL', coingecko: 'solana', name: 'Solana', symbol: 'SOL' },
  { upbit: 'KRW-ADA', coingecko: 'cardano', name: 'Cardano', symbol: 'ADA' },
  { upbit: 'KRW-DOGE', coingecko: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE' },
  { upbit: 'KRW-AVAX', coingecko: 'avalanche-2', name: 'Avalanche', symbol: 'AVAX' },
];

interface UpbitTicker {
  market: string;
  trade_price: number;
  acc_trade_price_24h: number;
  signed_change_rate: number;
}

interface CoinGeckoPrice {
  usd: number;
  usd_24h_change?: number;
  usd_24h_vol?: number;
}

async function fetchUpbitPrices(): Promise<Map<string, UpbitTicker>> {
  const markets = SYMBOLS.map(s => s.upbit).join(',');
  const url = `https://api.upbit.com/v1/ticker?markets=${markets}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Upbit API error: ${response.status}`);
  }
  
  const data: UpbitTicker[] = await response.json();
  const priceMap = new Map<string, UpbitTicker>();
  
  for (const ticker of data) {
    priceMap.set(ticker.market, ticker);
  }
  
  return priceMap;
}

async function fetchGlobalPrices(): Promise<Map<string, CoinGeckoPrice>> {
  const ids = SYMBOLS.map(s => s.coingecko).join(',');
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`;
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    }
  });
  
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }
  
  const data = await response.json();
  const priceMap = new Map<string, CoinGeckoPrice>();
  
  for (const coin of SYMBOLS) {
    if (data[coin.coingecko]) {
      priceMap.set(coin.coingecko, {
        usd: data[coin.coingecko].usd,
        usd_24h_change: data[coin.coingecko].usd_24h_change,
        usd_24h_vol: data[coin.coingecko].usd_24h_vol,
      });
    }
  }
  
  return priceMap;
}

async function fetchExchangeRate(): Promise<number> {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (!response.ok) {
      console.warn('Exchange rate API failed, using fallback rate');
      return 1350;
    }
    const data = await response.json();
    return data.rates?.KRW || 1350;
  } catch (error) {
    console.warn('Exchange rate fetch error, using fallback rate:', error);
    return 1350;
  }
}

async function updatePrices() {
  console.log('Starting price update...', new Date().toISOString());
  
  try {
    const [upbitPrices, globalPrices, fxRate] = await Promise.all([
      fetchUpbitPrices(),
      fetchGlobalPrices(),
      fetchExchangeRate(),
    ]);
    
    console.log(`Fetched ${upbitPrices.size} Upbit prices, ${globalPrices.size} global prices`);
    console.log(`Exchange rate: ${fxRate} KRW/USD`);
    
    const snapshots = [];
    
    for (const coin of SYMBOLS) {
      const upbitTicker = upbitPrices.get(coin.upbit);
      const globalPrice = globalPrices.get(coin.coingecko);
      
      if (!upbitTicker || !globalPrice) {
        console.warn(`Missing data for ${coin.symbol}: Upbit=${!!upbitTicker}, Global=${!!globalPrice}`);
        continue;
      }
      
      const upbitPriceKrw = upbitTicker.trade_price;
      const globalPriceUsd = globalPrice.usd;
      const globalPriceKrw = globalPriceUsd * fxRate;
      const premiumPercent = ((upbitPriceKrw / globalPriceKrw) - 1) * 100;
      const volume24h = upbitTicker.acc_trade_price_24h;
      const change24h = upbitTicker.signed_change_rate * 100;
      
      snapshots.push({
        symbol: coin.symbol,
        name: coin.name,
        upbit_price: upbitPriceKrw,
        binance_price_usd: globalPriceUsd,
        fx_rate: fxRate,
        premium: Math.round(premiumPercent * 100) / 100,
        volume_24h: Math.round(volume24h),
        change_24h: Math.round(change24h * 100) / 100,
      });
    }
    
    if (snapshots.length === 0) {
      console.error('No snapshots to insert');
      return;
    }
    
    console.log(`Inserting ${snapshots.length} snapshots...`);
    
    const { error } = await supabaseAdmin
      .from('price_snapshots')
      .insert(snapshots);
    
    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
    
    console.log('Price update completed successfully!');
    console.log('Snapshots:', snapshots.map(s => `${s.symbol}: ${s.premium.toFixed(2)}%`).join(', '));
    
  } catch (error) {
    console.error('Price update failed:', error);
    process.exit(1);
  }
}

updatePrices().then(() => {
  console.log('Script finished');
  process.exit(0);
}).catch((error) => {
  console.error('Script error:', error);
  process.exit(1);
});
