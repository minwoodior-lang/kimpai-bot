import { createClient } from "@supabase/supabase-js";
import {
  fetchExchangeRate,
  fetchUpbitKRW,
  fetchUpbitBTC,
  fetchUpbitUSDT,
  fetchBithumbKRW,
  fetchBithumbBTC,
  fetchCoinoneKRW,
  fetchBinanceUSDT,
  fetchBinanceBTC,
  fetchBinanceFutures,
  fetchOKX,
  fetchBybit,
  fetchBitget,
  fetchGate,
  fetchHTX,
  fetchMEXC,
  ExchangePrice,
} from "./exchangeFetchers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SYMBOLS = [
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "XRP", name: "Ripple" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "ADA", name: "Cardano" },
  { symbol: "DOGE", name: "Dogecoin" },
  { symbol: "AVAX", name: "Avalanche" },
];

async function insertExchangePrices(records: any[]): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("exchange_prices")
      .insert(records);

    if (error) {
      console.error(`[${new Date().toISOString()}] Exchange prices insert error:`, error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Exchange prices insert error:`, error);
    return false;
  }
}

async function updateExchangePrices(): Promise<void> {
  const startTime = Date.now();

  try {
    const fxRate = await fetchExchangeRate();

    const [
      upbitKrw,
      upbitBtc,
      upbitUsdt,
      bithumbKrw,
      bithumbBtc,
      coinoneKrw,
      binanceUsdt,
      binanceBtc,
      binanceFutures,
      okx,
      bybit,
      bitget,
      gate,
      htx,
      mexc,
    ] = await Promise.all([
      fetchUpbitKRW(fxRate),
      fetchUpbitBTC(fxRate),
      fetchUpbitUSDT(fxRate),
      fetchBithumbKRW(fxRate),
      fetchBithumbBTC(fxRate),
      fetchCoinoneKRW(fxRate),
      fetchBinanceUSDT(fxRate),
      fetchBinanceBTC(fxRate),
      fetchBinanceFutures(fxRate),
      fetchOKX(fxRate),
      fetchBybit(fxRate),
      fetchBitget(fxRate),
      fetchGate(fxRate),
      fetchHTX(fxRate),
      fetchMEXC(fxRate),
    ]);

    const allPrices: ExchangePrice[] = [
      ...upbitKrw,
      ...upbitBtc,
      ...upbitUsdt,
      ...bithumbKrw,
      ...bithumbBtc,
      ...coinoneKrw,
      ...binanceUsdt,
      ...binanceBtc,
      ...binanceFutures,
      ...okx,
      ...bybit,
      ...bitget,
      ...gate,
      ...htx,
      ...mexc,
    ];

    let insertedCount = 0;
    if (allPrices.length > 0) {
      const records = allPrices.map((p) => ({
        exchange: p.exchange.toLowerCase(),
        symbol: p.symbol,
        base: p.base,
        quote: p.quote,
        price: p.price,
        volume_24h: p.volume24h || 0,
        change_24h: p.change24h || 0,
      }));

      const success = await insertExchangePrices(records);
      if (success) {
        insertedCount = records.length;
      }
    }

    const elapsed = Date.now() - startTime;
    const exchangeCounts: Record<string, number> = {};
    for (const p of allPrices) {
      const key = p.exchange.toLowerCase();
      exchangeCounts[key] = (exchangeCounts[key] || 0) + 1;
    }
    const countSummary = Object.entries(exchangeCounts)
      .map(([ex, count]) => `${ex}:${count}`)
      .join(" ");

    const upbitBtcPrice = upbitKrw.find((p) => p.symbol === "BTC");
    const binanceBtcPrice = binanceUsdt.find((p) => p.symbol === "BTC");
    const btcPremium = upbitBtcPrice && binanceBtcPrice
      ? ((upbitBtcPrice.priceKrw - binanceBtcPrice.priceKrw) / binanceBtcPrice.priceKrw * 100).toFixed(2)
      : "N/A";

    console.log(
      `[${new Date().toISOString()}] Inserted ${insertedCount} rows (${elapsed}ms) | BTC김프:${btcPremium}% | ${countSummary}`
    );
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Update error:`, error);
  }
}

async function cleanupOldData(): Promise<void> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { error: exchangeError } = await supabase
    .from("exchange_prices")
    .delete()
    .lt("created_at", oneDayAgo);

  if (exchangeError) {
    console.error("Exchange prices cleanup error:", exchangeError.message);
  }

  console.log(`[${new Date().toISOString()}] Cleaned up data older than 24h`);
}

const UPDATE_INTERVAL = 5000;
const CLEANUP_INTERVAL = 60 * 60 * 1000;

console.log(`[${new Date().toISOString()}] Multi-exchange price worker started (${UPDATE_INTERVAL / 1000}s interval)`);
console.log(`[${new Date().toISOString()}] Domestic: UPBIT(KRW/BTC/USDT), BITHUMB(KRW/BTC), COINONE(KRW)`);
console.log(`[${new Date().toISOString()}] Foreign: BINANCE(USDT/BTC/Futures), OKX, BYBIT, BITGET, GATE, HTX, MEXC`);

updateExchangePrices();

setInterval(updateExchangePrices, UPDATE_INTERVAL);

setInterval(cleanupOldData, CLEANUP_INTERVAL);

process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down...");
  process.exit(0);
});
