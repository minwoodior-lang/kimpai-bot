import fs from "fs";
import path from "path";

// syncBithumbNames.ts에서 생성된 이름맵을 가져오기
interface BithumbNameEntry {
  name_ko: string;
  name_en: string;
}

/**
 * 기존 syncBithumbNames.ts에서 생성한 이름맵을 재사용
 * 또는 인라인으로 정의 (여기서는 동적 로드 시뮬레이션)
 */
function getBithumbNameMap(): Record<string, BithumbNameEntry> {
  // 실제로는 이전 실행 결과에서 로드하거나,
  // 아래처럼 하드코딩 또는 별도 API 호출
  // 예: data/bithumbNames.json 파일이 있으면 로드
  const mapPath = path.join(process.cwd(), "data", "bithumbNames.json");

  if (fs.existsSync(mapPath)) {
    try {
      return JSON.parse(fs.readFileSync(mapPath, "utf-8"));
    } catch {
      console.warn("⚠️ [Bithumb] Failed to load bithumbNames.json, using empty map");
      return {};
    }
  }

  // 폴백: 빈 맵 (각 심볼 name_ko/name_en이 null)
  return {};
}

async function fetchBithumbMarkets() {
  try {
    // Bithumb 마켓 리스트 API (ticker/ALL에서 마켓 정보 추출)
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
    // 마켓 목록 수집
    const markets = await fetchBithumbMarkets();
    const nameMap = getBithumbNameMap();

    const rows = markets.map((m) => {
      const symbol = m.base_symbol.toUpperCase();
      const names = nameMap[symbol] ?? { name_ko: null, name_en: null };

      return {
        exchange: "BITHUMB",
        market: m.market,
        base_symbol: symbol,
        quote_symbol: m.quote_symbol,
        name_ko: names.name_ko,
        name_en: names.name_en,
        icon_url: null,
      };
    });

    console.log(`📊 [syncBithumbMarkets] Found ${rows.length} Bithumb markets`);

    // exchange_markets.json 로드 & merge
    const dataPath = path.join(process.cwd(), "data", "exchange_markets.json");
    let allMarkets: any[] = [];

    if (fs.existsSync(dataPath)) {
      const existing = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
      allMarkets = Array.isArray(existing) ? existing.filter((m: any) => m.exchange !== "BITHUMB") : [];
    }

    // BITHUMB 추가
    allMarkets = [...allMarkets, ...rows];

    fs.writeFileSync(dataPath, JSON.stringify(allMarkets, null, 2));
    console.log(`✅ [syncBithumbMarkets] Saved ${rows.length} Bithumb markets`);
  } catch (err) {
    console.error("❌ [syncBithumbMarkets] Error:", err);
    process.exit(1);
  }
}

syncBithumbMarkets();
