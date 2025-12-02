import fs from "fs";
import path from "path";

async function fetchBithumbMarkets() {
  try {
    const res = await fetch("https://api.bithumb.com/public/ticker/ALL");
    const data = await res.json();

    if (data.status !== "0000") {
      throw new Error(`Bithumb API error: ${data.message}`);
    }

    const markets: any[] = [];
    Object.entries(data.data).forEach(([market, _]: any) => {
      if (market === "date") return;

      const [base, quote] = market.split("_");
      if (!["KRW", "BTC", "USDT"].includes(quote) || !base) return;

      markets.push({
        market: `${quote}-${base}`,
        base_symbol: base.toUpperCase(),
        quote_symbol: quote,
      });
    });

    return markets;
  } catch (err) {
    console.error("❌ [Bithumb] fetchBithumbMarkets error:", err);
    return [];
  }
}

async function syncBithumbMarkets() {
  console.log("🔄 [syncBithumbMarkets] Starting Bithumb market sync...");

  try {
    const markets = await fetchBithumbMarkets();

    const rows = markets.map((m) => ({
      exchange: "BITHUMB",
      market: m.market,
      base_symbol: m.base_symbol,
      quote_symbol: m.quote_symbol,
      name_ko: null,
      name_en: null,
      icon_url: null,
    }));

    console.log(`📊 [syncBithumbMarkets] Found ${rows.length} Bithumb markets`);

    const dataPath = path.join(process.cwd(), "data", "exchange_markets.json");
    let allMarkets: any[] = [];

    if (fs.existsSync(dataPath)) {
      const existing = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
      allMarkets = Array.isArray(existing)
        ? existing.filter((m: any) => m.exchange !== "BITHUMB")
        : [];
    }

    allMarkets = [...allMarkets, ...rows];

    fs.writeFileSync(dataPath, JSON.stringify(allMarkets, null, 2));
    console.log(`✅ [syncBithumbMarkets] Saved ${rows.length} Bithumb markets`);
  } catch (err) {
    console.error("❌ [syncBithumbMarkets] Error:", err);
    process.exit(1);
  }
}

syncBithumbMarkets();
