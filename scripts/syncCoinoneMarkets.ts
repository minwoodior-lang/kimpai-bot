import fs from "fs";
import path from "path";

async function fetchCoinoneMarkets() {
  try {
    const res = await fetch("https://api.coinone.co.kr/public/v2/markets/tickers/");
    const data = await res.json();

    if (!data.markets) {
      console.log("⚠️ No Coinone market data available");
      return [];
    }

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
    return [];
  }
}

async function syncCoinone() {
  console.log("🔄 Starting Coinone market sync to local JSON...");

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

    // 기존 파일 로드
    const dataPath = path.join(process.cwd(), "data", "exchange_markets.json");
    let allMarkets: any[] = [];

    if (fs.existsSync(dataPath)) {
      const existing = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
      allMarkets = existing.filter((m: any) => m.exchange !== "COINONE");
    }

    // Coinone 데이터 추가
    if (rows.length > 0) {
      allMarkets = [...allMarkets, ...rows];
    }

    // 파일 저장
    fs.writeFileSync(dataPath, JSON.stringify(allMarkets, null, 2));
    console.log(`✅ Successfully saved Coinone markets (or skipped if unavailable)`);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

syncCoinone();
