import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SYMBOLS = [
  { symbol: "BTC", name: "Bitcoin", upbitCode: "KRW-BTC", coingeckoId: "bitcoin" },
  { symbol: "ETH", name: "Ethereum", upbitCode: "KRW-ETH", coingeckoId: "ethereum" },
  { symbol: "XRP", name: "Ripple", upbitCode: "KRW-XRP", coingeckoId: "ripple" },
  { symbol: "SOL", name: "Solana", upbitCode: "KRW-SOL", coingeckoId: "solana" },
  { symbol: "ADA", name: "Cardano", upbitCode: "KRW-ADA", coingeckoId: "cardano" },
  { symbol: "DOGE", name: "Dogecoin", upbitCode: "KRW-DOGE", coingeckoId: "dogecoin" },
  { symbol: "AVAX", name: "Avalanche", upbitCode: "KRW-AVAX", coingeckoId: "avalanche-2" },
];

interface UpbitTicker {
  market: string;
  trade_price: number;
  acc_trade_price_24h: number;
  signed_change_rate: number;
}

interface CoinGeckoPrice {
  [id: string]: {
    usd: number;
    usd_24h_vol: number;
    usd_24h_change: number;
  };
}

async function fetchUpbitPrices(): Promise<Map<string, UpbitTicker>> {
  const markets = SYMBOLS.map((s) => s.upbitCode).join(",");
  const response = await fetch(`https://api.upbit.com/v1/ticker?markets=${markets}`);
  const data: UpbitTicker[] = await response.json();
  
  const priceMap = new Map<string, UpbitTicker>();
  for (const ticker of data) {
    const symbol = SYMBOLS.find((s) => s.upbitCode === ticker.market)?.symbol;
    if (symbol) {
      priceMap.set(symbol, ticker);
    }
  }
  return priceMap;
}

async function fetchGlobalPrices(): Promise<Map<string, { usd: number; volume: number; change: number }>> {
  const ids = SYMBOLS.map((s) => s.coingeckoId).join(",");
  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true`
  );
  const data: CoinGeckoPrice = await response.json();
  
  const priceMap = new Map<string, { usd: number; volume: number; change: number }>();
  for (const coin of SYMBOLS) {
    const coinData = data[coin.coingeckoId];
    if (coinData) {
      priceMap.set(coin.symbol, {
        usd: coinData.usd,
        volume: coinData.usd_24h_vol,
        change: coinData.usd_24h_change,
      });
    }
  }
  return priceMap;
}

async function fetchExchangeRate(): Promise<number> {
  try {
    const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    const data = await response.json();
    return data.rates.KRW || 1400;
  } catch {
    return 1400;
  }
}

async function updatePrices(): Promise<void> {
  const startTime = Date.now();
  
  try {
    const [upbitPrices, globalPrices, fxRate] = await Promise.all([
      fetchUpbitPrices(),
      fetchGlobalPrices(),
      fetchExchangeRate(),
    ]);

    const snapshots = [];

    for (const coin of SYMBOLS) {
      const upbit = upbitPrices.get(coin.symbol);
      const global = globalPrices.get(coin.symbol);

      if (upbit && global) {
        const globalPriceKrw = global.usd * fxRate;
        const premium = ((upbit.trade_price - globalPriceKrw) / globalPriceKrw) * 100;

        snapshots.push({
          symbol: coin.symbol,
          name: coin.name,
          upbit_price: upbit.trade_price,
          binance_price_usd: global.usd,
          fx_rate: fxRate,
          premium: Math.round(premium * 100) / 100,
          volume_24h: Math.round(global.volume),
          change_24h: Math.round(global.change * 100) / 100,
        });
      }
    }

    if (snapshots.length > 0) {
      const { error } = await supabase.from("price_snapshots").insert(snapshots);
      if (error) {
        console.error(`[${new Date().toISOString()}] Insert error:`, error.message);
      } else {
        const elapsed = Date.now() - startTime;
        const premiums = snapshots.map((s) => `${s.symbol}:${s.premium}%`).join(" ");
        console.log(`[${new Date().toISOString()}] Updated ${snapshots.length} prices (${elapsed}ms) | ${premiums}`);
      }
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Update error:`, error);
  }
}

async function cleanupOldSnapshots(): Promise<void> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { error } = await supabase
    .from("price_snapshots")
    .delete()
    .lt("created_at", oneDayAgo);
  
  if (error) {
    console.error("Cleanup error:", error.message);
  } else {
    console.log(`[${new Date().toISOString()}] Cleaned up snapshots older than 24h`);
  }
}

const UPDATE_INTERVAL = 5000;
const CLEANUP_INTERVAL = 60 * 60 * 1000;

console.log(`[${new Date().toISOString()}] Price worker started (${UPDATE_INTERVAL / 1000}s interval)`);

updatePrices();

setInterval(updatePrices, UPDATE_INTERVAL);

setInterval(cleanupOldSnapshots, CLEANUP_INTERVAL);

process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down...");
  process.exit(0);
});
