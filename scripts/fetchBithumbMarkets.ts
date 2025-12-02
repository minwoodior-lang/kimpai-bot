import fs from "fs";
import path from "path";

interface RawMarket {
  exchange: "UPBIT" | "BITHUMB" | "COINONE";
  market_code: string;
  base_symbol: string;
  quote_symbol: string;
  name_ko?: string;
  name_en?: string;
}

interface HtmlNameMap {
  [symbol: string]: { name_ko?: string; name_en?: string };
}

// Fallback 매핑 (HTML에서 못 가져올 때)
const BITHUMB_NAMES: { [symbol: string]: { name_ko?: string; name_en?: string } } = {
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
  USDC: { name_ko: "유에스디", name_en: "USDC" },
  USDT: { name_ko: "테더", name_en: "Tether" },
  DAI: { name_ko: "다이", name_en: "Dai" },
  WBTC: { name_ko: "래핑된비트코인", name_en: "Wrapped Bitcoin" },
  SNX: { name_ko: "신세틱스", name_en: "Synthetix" },
  CRV: { name_ko: "커브", name_en: "Curve" },
  YFI: { name_ko: "예피나인스", name_en: "Yearn Finance" },
  SUSHI: { name_ko: "스시", name_en: "Sushi" },
  COMP: { name_ko: "컴파운드", name_en: "Compound" },
  MKR: { name_ko: "메이커", name_en: "Maker" },
  GRT: { name_ko: "더그래프", name_en: "The Graph" },
  ENS: { name_ko: "이더리움네임서비스", name_en: "Ethereum Name Service" },
};

function loadHtmlNames(): HtmlNameMap {
  const namesPath = path.join("data", "raw", "bithumb", "names.json");
  
  if (!fs.existsSync(namesPath)) {
    console.warn("⚠ HTML names file not found, using fallback only");
    return {};
  }

  const text = fs.readFileSync(namesPath, "utf-8");
  if (!text.trim()) return {};

  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as HtmlNameMap;
    }
    return {};
  } catch (e) {
    console.warn("⚠ Failed to parse HTML names file:", e);
    return {};
  }
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

  // HTML에서 크롤링한 이름 맵 로드
  const htmlNameMap = loadHtmlNames();

  const markets: RawMarket[] = [];

  for (const symbol in json.data) {
    if (symbol === "date") continue;

    const base = symbol.toUpperCase();
    const marketCode = `${base}-KRW`;

    // HTML에서 가져온 이름
    const nameFromHtml = htmlNameMap[base] ?? null;
    
    // Fallback 매핑에서 가져온 이름
    const nameFromFallback = BITHUMB_NAMES[base] ?? null;

    // 우선순위: HTML > Fallback
    const name_ko =
      nameFromHtml?.name_ko?.trim() ||
      nameFromFallback?.name_ko?.trim() ||
      undefined;

    const name_en =
      nameFromHtml?.name_en?.trim() ||
      nameFromFallback?.name_en?.trim() ||
      undefined;

    // 값이 없으면 필드 제외
    const market: RawMarket = {
      exchange: "BITHUMB",
      market_code: marketCode,
      base_symbol: base,
      quote_symbol: "KRW",
      ...(name_ko ? { name_ko } : {}),
      ...(name_en ? { name_en } : {}),
    };

    markets.push(market);
  }

  const marketPath = path.join("data", "raw", "bithumb", "markets.json");
  fs.mkdirSync(path.dirname(marketPath), { recursive: true });
  fs.writeFileSync(marketPath, JSON.stringify(markets, null, 2), "utf-8");

  // 검증 로그
  const total = markets.length;
  const withName = markets.filter((m) => m.name_ko || m.name_en).length;
  const withoutName = total - withName;

  console.log(
    `✅ Bithumb markets saved: total=${total}, withName=${withName}, withoutName=${withoutName}`
  );

  if (withoutName > 0) {
    console.log(
      `📝 Coins without names:`,
      markets
        .filter((m) => !m.name_ko && !m.name_en)
        .map((m) => m.base_symbol)
        .join(", ")
    );
  }
}

fetchBithumbMarkets().catch((err) => {
  console.error("❌ fetchBithumbMarkets failed:", err);
  process.exit(1);
});
