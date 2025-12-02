import axios from "axios";
import fs from "fs";
import path from "path";

interface CoinoneNamesMap {
  [symbol: string]: { name_ko: string | null; name_en: string | null };
}

interface MarketData {
  exchange: string;
  market_code: string;
  base_symbol: string;
  quote_symbol: string;
  name_ko: string | null;
  name_en: string | null;
}

// 코인원 고객센터 HTML에서 이름 크롤링
async function fetchCoinoneNamesFromHTML(): Promise<CoinoneNamesMap> {
  console.log("🔄 [Coinone Names] Fetching from support page...");

  try {
    const url =
      "https://support.coinone.co.kr/support/solutions/articles/31000163237";
    const res = await axios.get(url, { timeout: 10000 });
    const html = res.data;

    const $ = cheerio.load(html);
    const namesMap: CoinoneNamesMap = {};

    // 테이블 행 파싱
    $("table tbody tr").each((_, row) => {
      const tds = $(row).find("td");
      if (tds.length < 3) return;

      const symbol = $(tds.eq(0)).text().trim().toUpperCase();
      const name_ko = $(tds.eq(1)).text().trim() || null;
      const name_en = $(tds.eq(2)).text().trim() || null;

      if (symbol && symbol.length > 0 && symbol !== "심" && symbol !== "SYMBOL") {
        namesMap[symbol] = { name_ko, name_en };
      }
    });

    console.log(`✅ [Coinone Names] Crawled ${Object.keys(namesMap).length} symbols`);
    return namesMap;
  } catch (err) {
    console.error(
      "⚠️  [Coinone Names] HTML crawling failed, using defaults:",
      (err as any).message
    );
    return {};
  }
}

// Coinone API에서 마켓 정보 수집
async function fetchCoinoneMarkets() {
  console.log("🔄 [Coinone] Fetching markets from API...");

  try {
    const res = await axios.get(
      "https://api.coinone.co.kr/public/v2/markets/KRW",
      { timeout: 8000 }
    );

    if (!res.data?.markets || !Array.isArray(res.data.markets)) {
      throw new Error("Invalid Coinone API response");
    }

    const namesMap = await fetchCoinoneNamesFromHTML();

    const markets: MarketData[] = res.data.markets.map((m: any) => {
      const baseSymbol = (m.target_currency || "").toUpperCase();
      const names = namesMap[baseSymbol] || { name_ko: null, name_en: null };

      return {
        exchange: "COINONE",
        market_code: m.market,
        base_symbol: baseSymbol,
        quote_symbol: m.base_currency || "KRW",
        name_ko: names.name_ko,
        name_en: names.name_en,
      };
    });

    console.log(`✅ [Coinone] Found ${markets.length} markets`);

    // markets.json 저장
    const marketPath = path.join(
      process.cwd(),
      "data",
      "raw",
      "coinone",
      "markets.json"
    );
    fs.writeFileSync(marketPath, JSON.stringify(markets, null, 2));

    // names.json 저장
    const namesPath = path.join(
      process.cwd(),
      "data",
      "raw",
      "coinone",
      "names.json"
    );
    fs.writeFileSync(namesPath, JSON.stringify(namesMap, null, 2));

    console.log(`✅ [Coinone] Saved markets and names`);
    return markets;
  } catch (err) {
    console.error("❌ [Coinone] Error:", (err as any).message);
    process.exit(1);
  }
}

fetchCoinoneMarkets();
