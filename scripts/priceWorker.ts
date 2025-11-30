import { createClient } from "@supabase/supabase-js";
import {
  fetchExchangeRate,
  fetchUpbitKRW,
  fetchUpbitBTC,
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
    const { data, error } = await supabase.rpc('bulk_insert_exchange_prices', {
      data: records
    });

    if (error) {
      console.error(`[${new Date().toISOString()}] Exchange prices RPC insert error:`, error.message);
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

    if (allPrices.length > 0) {
      const records = allPrices.map((p) => ({
        exchange: p.exchange,
        symbol: p.symbol,
        base: p.base,
        quote: p.quote,
        price: p.price,
        price_krw: p.priceKrw,
        volume_24h: p.volume24h,
        change_24h: p.change24h,
      }));

      await insertExchangePrices(records);
    }

    const upbitBtcPrice = upbitKrw.find((p) => p.symbol === "BTC");
    const binanceBtcPrice = binanceUsdt.find((p) => p.symbol === "BTC");

    if (upbitBtcPrice && binanceBtcPrice) {
      const snapshots = SYMBOLS.map((coin) => {
        const upbit = upbitKrw.find((p) => p.symbol === coin.symbol);
        const binance = binanceUsdt.find((p) => p.symbol === coin.symbol);

        if (upbit && binance) {
          const premium = ((upbit.priceKrw - binance.priceKrw) / binance.priceKrw) * 100;
          return {
            symbol: coin.symbol,
            name: coin.name,
            upbit_price: upbit.price,
            binance_price_usd: binance.price,
            fx_rate: fxRate,
            premium: Math.round(premium * 100) / 100,
            volume_24h: Math.round(binance.volume24h || 0),
            change_24h: Math.round((binance.change24h || 0) * 100) / 100,
          };
        }
        return null;
      }).filter(Boolean);

      if (snapshots.length > 0) {
        const { error } = await supabase.from("price_snapshots").insert(snapshots);
        if (error) {
          console.error(`[${new Date().toISOString()}] Snapshots insert error:`, error.message);
        }
      }
    }

    const elapsed = Date.now() - startTime;
    const exchangeCounts: Record<string, number> = {};
    for (const p of allPrices) {
      exchangeCounts[p.exchange] = (exchangeCounts[p.exchange] || 0) + 1;
    }
    const countSummary = Object.entries(exchangeCounts)
      .map(([ex, count]) => `${ex}:${count}`)
      .join(" ");
    
    const btcPremium = upbitBtcPrice && binanceBtcPrice
      ? ((upbitBtcPrice.priceKrw - binanceBtcPrice.priceKrw) / binanceBtcPrice.priceKrw * 100).toFixed(2)
      : "N/A";
    
    console.log(
      `[${new Date().toISOString()}] Updated ${allPrices.length} prices (${elapsed}ms) | BTC김프:${btcPremium}% | ${countSummary}`
    );
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Update error:`, error);
  }
}

async function cleanupOldData(): Promise<void> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { error: snapshotsError } = await supabase
    .from("price_snapshots")
    .delete()
    .lt("created_at", oneDayAgo);

  if (snapshotsError) {
    console.error("Snapshots cleanup error:", snapshotsError.message);
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/exchange_prices?created_at=lt.${oneDayAgo}`,
      {
        method: "DELETE",
        headers: {
          "apikey": supabaseServiceKey,
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
      }
    );
    if (!response.ok) {
      console.error("Exchange prices cleanup error:", await response.text());
    }
  } catch (error) {
    console.error("Exchange prices cleanup error:", error);
  }

  console.log(`[${new Date().toISOString()}] Cleaned up data older than 24h`);
}

const UPDATE_INTERVAL = 5000;
const CLEANUP_INTERVAL = 60 * 60 * 1000;

console.log(`[${new Date().toISOString()}] Multi-exchange price worker started (${UPDATE_INTERVAL / 1000}s interval)`);
console.log(`[${new Date().toISOString()}] Domestic: UPBIT, BITHUMB, COINONE | Foreign: BINANCE, OKX, BYBIT, BITGET, GATE, HTX, MEXC`);

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
