import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";

type CoinoneNameMap = Record<string, { ko: string | null; en: string | null }>;

/**
 * 코인원 고객센터에서 지원 중인 가상자산 종류 테이블을 크롤링
 * (형님 제공 로직 기준)
 */
async function fetchCoinoneSupportNameMap(): Promise<CoinoneNameMap> {
  try {
    console.log("🔍 [Coinone] Fetching support name map from customer center...");

    // 고객센터 페이지
    const url = "https://guide.coinone.co.kr/guide/faq/537";
    const res = await fetch(url);
    const html = await res.text();

    const $ = cheerio.load(html);
    const nameMap: CoinoneNameMap = {};

    // 테이블 tbody tr 순회
    const rows = $("table tbody tr");

    rows.each((_, row) => {
      const cells = $(row).find("td");
      if (cells.length < 3) return;

      const symbol = $(cells[0]).text().trim().toUpperCase();
      const ko = $(cells[1]).text().trim() || null;
      const en = $(cells[2]).text().trim() || null;

      if (symbol) {
        nameMap[symbol] = { ko, en };
      }
    });

    console.log(`📊 [Coinone] Fetched ${Object.keys(nameMap).length} coin names`);
    return nameMap;
  } catch (err) {
    console.error("⚠️ [Coinone] Failed to fetch name map (fallback to empty):", err);
    return {};
  }
}

async function syncCoinoneMarkets() {
  console.log("🔄 [syncCoinoneMarkets] Starting Coinone market sync...");

  try {
    // 병렬로 마켓과 이름맵 수집
    const [marketsRes, nameMap] = await Promise.all([
      fetch("https://api.coinone.co.kr/public/v2/markets/KRW"),
      fetchCoinoneSupportNameMap(),
    ]);

    const json = await marketsRes.json();
    const markets = (json.markets ?? []) as any[];

    const rows = markets.map((m) => {
      const base = (m.target_currency ?? "").toUpperCase();
      const names = nameMap[base] ?? { ko: null, en: null };

      return {
        exchange: "COINONE",
        market: m.market,
        base_symbol: base,
        quote_symbol: m.base_currency,
        name_ko: names.ko,
        name_en: names.en,
        icon_url: null,
      };
    });

    console.log(`📊 [syncCoinoneMarkets] Found ${rows.length} Coinone markets`);

    // exchange_markets.json 로드 & merge
    const dataPath = path.join(process.cwd(), "data", "exchange_markets.json");
    let allMarkets: any[] = [];

    if (fs.existsSync(dataPath)) {
      const existing = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
      allMarkets = Array.isArray(existing) ? existing.filter((m: any) => m.exchange !== "COINONE") : [];
    }

    // COINONE 추가
    allMarkets = [...allMarkets, ...rows];

    fs.writeFileSync(dataPath, JSON.stringify(allMarkets, null, 2));
    console.log(`✅ [syncCoinoneMarkets] Saved ${rows.length} Coinone markets`);
  } catch (err) {
    console.error("❌ [syncCoinoneMarkets] Error:", err);
    process.exit(1);
  }
}

syncCoinoneMarkets();
