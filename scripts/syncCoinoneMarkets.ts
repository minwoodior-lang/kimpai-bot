import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function fetchCoinoneMarkets() {
  try {
    // Coinone API: 마켓 정보 조회
    const res = await fetch("https://api.coinone.co.kr/public/v2/markets/tickers/");
    const data = await res.json();

    if (!data.markets) {
      throw new Error("Invalid Coinone API response");
    }

    // 코인원은 KRW만 지원
    const markets = data.markets
      .filter((m: any) => m.quote === "KRW")
      .map((m: any) => ({
        market: `KRW-${m.base}`,
        base_symbol: m.base.toUpperCase(),
        quote_symbol: "KRW",
      }));

    return markets;
  } catch (err) {
    console.error("⚠️ fetchCoinoneMarkets error (fallback to empty):", err);
    // Coinone API가 불안정할 수 있으니, 에러 시 빈 배열 반환
    return [];
  }
}

async function syncCoinone() {
  console.log("🔄 Starting Coinone market sync...");

  try {
    const markets = await fetchCoinoneMarkets();

    const rows = markets.map((m) => ({
      exchange: "COINONE",
      market: m.market,
      base_symbol: m.base_symbol,
      quote_symbol: m.quote_symbol,
      name_ko: null,
      name_en: null,
      icon_url: null,
    }));

    console.log(`📊 Found ${rows.length} Coinone markets (KRW)`);

    if (rows.length === 0) {
      console.log("⚠️ No Coinone markets found (API may be unavailable)");
      return;
    }

    const { error } = await supabase
      .from("exchange_markets")
      .upsert(rows, { onConflict: "exchange,market" });

    if (error) {
      console.error("❌ syncCoinone error:", error);
      throw error;
    }

    console.log(`✅ Successfully synced ${rows.length} Coinone markets`);
  } catch (err) {
    console.error("❌ Fatal error:", err);
    process.exit(1);
  }
}

syncCoinone();
