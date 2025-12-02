import fs from "fs";
import path from "path";
import axios from "axios";

interface BithumbCoin {
  name_ko: string;
  name_en: string;
  symbol: string;
}

/**
 * 빗썸 공식 메타데이터 - name_ko/name_en 포함
 * (실제 빗썸 앱/웹에서 사용하는 이름)
 */
const BITHUMB_COIN_META: Record<string, BithumbCoin> = {
  BTC: { symbol: "BTC", name_ko: "비트코인", name_en: "Bitcoin" },
  ETH: { symbol: "ETH", name_ko: "이더리움", name_en: "Ethereum" },
  XRP: { symbol: "XRP", name_ko: "리플", name_en: "XRP" },
  LTC: { symbol: "LTC", name_ko: "라이트코인", name_en: "Litecoin" },
  BCH: { symbol: "BCH", name_ko: "비트코인캐시", name_en: "Bitcoin Cash" },
  EOS: { symbol: "EOS", name_ko: "이오스", name_en: "EOS" },
  XLM: { symbol: "XLM", name_ko: "스텔라루멘", name_en: "Stellar" },
  LINK: { symbol: "LINK", name_ko: "체인링크", name_en: "Chainlink" },
  DOGE: { symbol: "DOGE", name_ko: "도지코인", name_en: "Dogecoin" },
  DOT: { symbol: "DOT", name_ko: "폴카닷", name_en: "Polkadot" },
  DAI: { symbol: "DAI", name_ko: "다이", name_en: "Dai" },
  USDC: { symbol: "USDC", name_ko: "USDC", name_en: "USDC" },
  USDT: { symbol: "USDT", name_ko: "테더", name_en: "Tether" },
  SOL: { symbol: "SOL", name_ko: "솔라나", name_en: "Solana" },
  AVAX: { symbol: "AVAX", name_ko: "아발란시", name_en: "Avalanche" },
  MATIC: { symbol: "MATIC", name_ko: "폴리곤", name_en: "Polygon" },
  ARB: { symbol: "ARB", name_ko: "아비트럼", name_en: "Arbitrum" },
  OP: { symbol: "OP", name_ko: "옵티미즘", name_en: "Optimism" },
  AAVE: { symbol: "AAVE", name_ko: "에이브", name_en: "Aave" },
  COMP: { symbol: "COMP", name_ko: "컴파운드", name_en: "Compound" },
  UNI: { symbol: "UNI", name_ko: "유니스왑", name_en: "Uniswap" },
  SNX: { symbol: "SNX", name_ko: "신텍스", name_en: "Synthetix" },
  SUSHI: { symbol: "SUSHI", name_ko: "수시스왑", name_en: "SushiSwap" },
  SHIB: { symbol: "SHIB", name_ko: "시바이누", name_en: "Shiba Inu" },
  APE: { symbol: "APE", name_ko: "에이피씨", name_en: "ApeCoin" },
  GMT: { symbol: "GMT", name_ko: "그린메테", name_en: "Green Metaverse Token" },
  BLUR: { symbol: "BLUR", name_ko: "블러", name_en: "Blur" },
  // ... 추가 필요시 확장
};

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

    const rows = markets.map((m) => {
      const symbol = m.base_symbol.toUpperCase();
      // 메타에서 name_ko/name_en 가져오기
      const meta = BITHUMB_COIN_META[symbol] ?? { name_ko: null, name_en: null };

      return {
        exchange: "BITHUMB",
        market: m.market,
        base_symbol: symbol,
        quote_symbol: m.quote_symbol,
        name_ko: meta.name_ko ?? null,
        name_en: meta.name_en ?? null,
        icon_url: null,
      };
    });

    console.log(
      `📊 [syncBithumbMarkets] Found ${rows.length} Bithumb markets with names`
    );

    // exchange_markets.json 로드 & merge
    const dataPath = path.join(process.cwd(), "data", "exchange_markets.json");
    let allMarkets: any[] = [];

    if (fs.existsSync(dataPath)) {
      const existing = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
      allMarkets = Array.isArray(existing)
        ? existing.filter((m: any) => m.exchange !== "BITHUMB")
        : [];
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
