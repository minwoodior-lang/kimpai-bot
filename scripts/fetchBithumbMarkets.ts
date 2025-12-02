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

interface BithumbNameMap {
  [symbol: string]: { name_ko?: string; name_en?: string };
}

// 기본 Bithumb 한글/영문명 매핑
const BITHUMB_NAMES: BithumbNameMap = {
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
  USDC: { name_ko: "USDC", name_en: "USDC" },
  USDT: { name_ko: "테더", name_en: "Tether" },
  DAI: { name_ko: "다이", name_en: "Dai" },
};

async function fetchBithumbMarkets() {
  const res = await fetch("https://api.bithumb.com/public/ticker/ALL_KRW", {
    timeout: 8000,
  });

  if (!res.ok) {
    throw new Error(`Bithumb API error: ${res.status}`);
  }

  const json = (await res.json()) as any;

  if (json?.status !== "0000" || !json?.data) {
    throw new Error("Invalid Bithumb API response");
  }

  const markets: RawMarket[] = [];

  for (const symbol in json.data) {
    if (symbol === "date") continue;

    const baseSymbol = symbol.toUpperCase();
    const names = BITHUMB_NAMES[baseSymbol] || {};

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
  fs.writeFileSync(namesPath, JSON.stringify(BITHUMB_NAMES, null, 2), "utf-8");

  console.log(`✅ Bithumb markets saved: ${markets.length} rows`);
}

fetchBithumbMarkets().catch((err) => {
  console.error("❌ fetchBithumbMarkets failed:", err);
  process.exit(1);
});
