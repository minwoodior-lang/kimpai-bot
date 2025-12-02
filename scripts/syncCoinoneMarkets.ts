import fs from "fs";
import path from "path";

async function syncCoinoneMarkets() {
  console.log("🔄 [syncCoinoneMarkets] Starting Coinone market sync...");

  try {
    const marketsRes = await fetch(
      "https://api.coinone.co.kr/public/v2/markets/KRW"
    );
    const json = await marketsRes.json();
    const markets = (json.markets ?? []) as any[];

    const rows = markets.map((m) => ({
      exchange: "COINONE",
      market: m.market,
      base_symbol: (m.target_currency ?? "").toUpperCase(),
      quote_symbol: m.base_currency,
      name_ko: null,
      name_en: null,
      icon_url: null,
    }));

    console.log(`📊 [syncCoinoneMarkets] Found ${rows.length} Coinone markets`);

    const dataPath = path.join(process.cwd(), "data", "exchange_markets.json");
    let allMarkets: any[] = [];

    if (fs.existsSync(dataPath)) {
      const existing = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
      allMarkets = Array.isArray(existing)
        ? existing.filter((m: any) => m.exchange !== "COINONE")
        : [];
    }

    allMarkets = [...allMarkets, ...rows];

    fs.writeFileSync(dataPath, JSON.stringify(allMarkets, null, 2));
    console.log(`✅ [syncCoinoneMarkets] Saved ${rows.length} Coinone markets`);
  } catch (err) {
    console.error("❌ [syncCoinoneMarkets] Error:", err);
    process.exit(1);
  }
}

syncCoinoneMarkets();
