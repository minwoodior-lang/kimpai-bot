import fs from "fs";
import path from "path";

interface UpbitMarket {
  market: string;
  korean_name: string;
  english_name: string;
}

async function syncUpbitMarkets() {
  console.log("🔄 [syncUpbitMarkets] Starting Upbit market sync...");

  try {
    const res = await fetch("https://api.upbit.com/v1/market/all?isDetails=true");
    const markets: UpbitMarket[] = await res.json();

    // KRW/BTC/USDT만 필터
    const filtered = markets.filter((m) => {
      const [quote] = m.market.split("-");
      return ["KRW", "BTC", "USDT"].includes(quote);
    });

    const rows = filtered.map((m) => {
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

    console.log(`📊 [syncUpbitMarkets] Found ${rows.length} Upbit markets`);

    // 파일 저장 (항상 새로 생성 - 업비트가 기준!)
    const dataPath = path.join(process.cwd(), "data", "exchange_markets.json");
    fs.writeFileSync(dataPath, JSON.stringify(rows, null, 2));
    console.log(`✅ [syncUpbitMarkets] Saved ${rows.length} Upbit markets (완전 리셋)`);
  } catch (err) {
    console.error("❌ [syncUpbitMarkets] Error:", err);
    process.exit(1);
  }
}

syncUpbitMarkets();
