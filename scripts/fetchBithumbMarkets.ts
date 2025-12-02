import fs from "fs";
import path from "path";
import cheerio from "cheerio";

interface RawMarket {
  exchange: "UPBIT" | "BITHUMB" | "COINONE";
  market_code: string;
  base_symbol: string;
  quote_symbol: string;
  name_ko?: string;
  name_en?: string;
}

interface BithumbNameMap {
  [symbol: string]: { name_ko?: string; name_en?: string };
}

// Bithumb 공지사항 크롤링으로 한글명 가져오기
async function fetchBithumbNames(): Promise<BithumbNameMap> {
  const nameMap: BithumbNameMap = {};

  try {
    // Bithumb 거래 정보 페이지에서 크롤링
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const res = await fetch("https://bithumb.com/information/trade", {
      signal: controller.signal,
    });
    
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn("⚠ Bithumb 공지사항 크롤링 실패, 기본값 사용");
      return getDefaultBithumbNames();
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Bithumb 페이지에서 코인 정보 추출 (예: data-coin-name 속성 등)
    $("[data-coin-symbol]").each((_, el) => {
      const symbol = $(el).attr("data-coin-symbol")?.toUpperCase();
      const koName = $(el).attr("data-coin-ko-name");
      const enName = $(el).attr("data-coin-en-name");

      if (symbol) {
        nameMap[symbol] = {
          ...(koName && { name_ko: koName }),
          ...(enName && { name_en: enName }),
        };
      }
    });

    // 크롤링 결과가 없으면 기본값 사용
    if (Object.keys(nameMap).length === 0) {
      console.warn("⚠ 크롤링 결과 없음, 기본값 사용");
      return getDefaultBithumbNames();
    }

    console.log(`✅ Bithumb 공지사항에서 ${Object.keys(nameMap).length}개 코인 이름 추출`);
    return nameMap;
  } catch (err) {
    console.warn("⚠ Bithumb 크롤링 오류:", err);
    return getDefaultBithumbNames();
  }
}

function getDefaultBithumbNames(): BithumbNameMap {
  return {
    BTC: { name_ko: "비트코인", name_en: "Bitcoin" },
    ETH: { name_ko: "이더리움", name_en: "Ethereum" },
    XRP: { name_ko: "리플", name_en: "XRP" },
    LTC: { name_ko: "라이트코인", name_en: "Litecoin" },
    BCH: { name_ko: "비트코인캐시", name_en: "Bitcoin Cash" },
    EOS: { name_ko: "이오스", name_en: "EOS" },
    XLM: { name_ko: "스텔라루멘", name_en: "Stellar" },
    LINK: { name_ko: "체인링크", name_en: "Chainlink" },
    DOGE: { name_ko: "도지코인", name_en: "Dogecoin" },
    DOT: { name_ko: "폴카닷", name_en: "Polkadot" },
    SOL: { name_ko: "솔라나", name_en: "Solana" },
    AVAX: { name_ko: "아발란시", name_en: "Avalanche" },
    MATIC: { name_ko: "폴리곤", name_en: "Polygon" },
    ADA: { name_ko: "카르다노", name_en: "Cardano" },
    UNI: { name_ko: "유니스왑", name_en: "Uniswap" },
    AAVE: { name_ko: "에이브", name_en: "Aave" },
    SHIB: { name_ko: "시바이누", name_en: "Shiba Inu" },
    USDC: { name_ko: "유에스디씨", name_en: "USDC" },
    USDT: { name_ko: "테더", name_en: "Tether" },
    DAI: { name_ko: "다이", name_en: "Dai" },
    WBTC: { name_ko: "래핑된비트코인", name_en: "Wrapped Bitcoin" },
    SNX: { name_ko: "신세틱스", name_en: "Synthetix" },
    CRV: { name_ko: "커브", name_en: "Curve" },
    YFI: { name_ko: "예피나인스", name_en: "Yearn Finance" },
    UNISWAP: { name_ko: "유니스왑", name_en: "Uniswap" },
  };
}

async function fetchBithumbMarkets() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  
  const res = await fetch("https://api.bithumb.com/public/ticker/ALL_KRW", {
    signal: controller.signal,
  });
  
  clearTimeout(timeout);

  if (!res.ok) {
    throw new Error(`Bithumb API error: ${res.status}`);
  }

  const json = (await res.json()) as any;

  if (json?.status !== "0000" || !json?.data) {
    throw new Error("Invalid Bithumb API response");
  }

  // 공지사항에서 한글명 가져오기
  const nameMap = await fetchBithumbNames();

  const markets: RawMarket[] = [];

  for (const symbol in json.data) {
    if (symbol === "date") continue;

    const baseSymbol = symbol.toUpperCase();
    const names = nameMap[baseSymbol] || {};

    markets.push({
      exchange: "BITHUMB",
      market_code: `${baseSymbol}-KRW`,
      base_symbol: baseSymbol,
      quote_symbol: "KRW",
      name_ko: names.name_ko,
      name_en: names.name_en,
    });
  }

  const marketPath = path.join("data", "raw", "bithumb", "markets.json");
  fs.mkdirSync(path.dirname(marketPath), { recursive: true });
  fs.writeFileSync(marketPath, JSON.stringify(markets, null, 2), "utf-8");

  const namesPath = path.join("data", "raw", "bithumb", "names.json");
  fs.writeFileSync(namesPath, JSON.stringify(nameMap, null, 2), "utf-8");

  console.log(`✅ Bithumb markets saved: ${markets.length} rows`);
}

fetchBithumbMarkets().catch((err) => {
  console.error("❌ fetchBithumbMarkets failed:", err);
  process.exit(1);
});
