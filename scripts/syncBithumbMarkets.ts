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
        base_symbol: base,
        quote_symbol: quote,
      });
    });

    return markets;
  } catch (err) {
    console.error("❌ fetchBithumbMarkets error:", err);
    return [];
  }
}

async function syncBithumb() {
  console.log("🔄 Starting Bithumb market sync to local JSON...");

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

    console.log(`📊 Found ${rows.length} Bithumb markets (KRW/BTC/USDT)`);

    // 기존 파일 로드
    const dataPath = path.join(process.cwd(), "data", "exchange_markets.json");
    let allMarkets: any[] = [];

    if (fs.existsSync(dataPath)) {
      const existing = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
      allMarkets = existing.filter((m: any) => m.exchange !== "BITHUMB");
    }

    // Bithumb 데이터 추가
    allMarkets = [...allMarkets, ...rows];

    // 파일 저장
    fs.writeFileSync(dataPath, JSON.stringify(allMarkets, null, 2));
    console.log(`✅ Successfully saved ${rows.length} Bithumb markets`);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

syncBithumb();
