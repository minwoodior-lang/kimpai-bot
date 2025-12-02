import axios from "axios";
import fs from "fs";
import path from "path";

interface UpbitMarket {
  market: string;
  korean_name: string;
  english_name: string;
}

interface MarketData {
  exchange: string;
  market_code: string;
  base_symbol: string;
  quote_symbol: string;
  name_ko: string;
  name_en: string;
}

async function fetchUpbitMarkets() {
  console.log("🔄 [Upbit] Fetching markets from API...");

  try {
    const res = await axios.get(
      "https://api.upbit.com/v1/market/all?isDetails=true",
      { timeout: 10000 }
    );

    const markets: UpbitMarket[] = Array.isArray(res.data) ? res.data : [];

    if (markets.length === 0) {
      console.error("❌ [Upbit] Empty API response, trying fallback");
      throw new Error("No markets returned from API");
    }

    const data: MarketData[] = markets
      .filter((m) => m.market && m.market.includes("-KRW"))
      .map((m) => {
        const [quote, base] = m.market.split("-");
        return {
          exchange: "UPBIT",
          market_code: m.market,
          base_symbol: base.toUpperCase(),
          quote_symbol: quote.toUpperCase(),
          name_ko: m.korean_name || "",
          name_en: m.english_name || "",
        };
      });

    console.log(`✅ [Upbit] Found ${data.length} KRW markets`);

    const outputPath = path.join(
      process.cwd(),
      "data",
      "raw",
      "upbit",
      "markets.json"
    );
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

    console.log(`✅ [Upbit] Saved to ${outputPath}`);
    return data;
  } catch (err) {
    console.error("❌ [Upbit] Error:", (err as any).message);
    process.exit(1);
  }
}

fetchUpbitMarkets();
