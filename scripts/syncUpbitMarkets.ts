import fs from "fs";
import path from "path";

async function syncUpbit() {
  console.log("🔄 Starting Upbit market sync to local JSON...");

  try {
    const res = await fetch(
      "https://api.upbit.com/v1/market/all?isDetails=true"
    );
    const data = await res.json();

    const rows = data
      .filter((m: any) => {
        const [quote] = m.market.split("-");
        return ["KRW", "BTC", "USDT"].includes(quote);
      })
      .map((m: any) => {
        const [quote, base] = m.market.split("-");
        return {
          exchange: "UPBIT",
          market: m.market,
          base_symbol: base,
          quote_symbol: quote,
          name_ko: m.korean_name,
          name_en: m.english_name,
          icon_url: null,
        };
      });

    console.log(`📊 Found ${rows.length} Upbit markets (KRW/BTC/USDT)`);

    // 기존 파일 로드
    const dataPath = path.join(process.cwd(), "data", "exchange_markets.json");
    let allMarkets: any[] = [];

    if (fs.existsSync(dataPath)) {
      const existing = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
      allMarkets = existing.filter((m: any) => m.exchange !== "UPBIT");
    }

    // Upbit 데이터 추가
    allMarkets = [...allMarkets, ...rows];

    // 파일 저장
    fs.writeFileSync(dataPath, JSON.stringify(allMarkets, null, 2));
    console.log(`✅ Successfully saved ${rows.length} Upbit markets`);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

syncUpbit();
