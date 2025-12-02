import fs from "fs";
import path from "path";

/**
 * 코인원 공식 메타데이터 - name_ko/name_en 포함
 * (실제 코인원 앱/웹에서 사용하는 이름)
 */
const COINONE_COIN_META: Record<string, { name_ko: string; name_en: string }> =
  {
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
    DAI: { name_ko: "다이", name_en: "Dai" },
    USDC: { name_ko: "USDC", name_en: "USDC" },
    USDT: { name_ko: "테더", name_en: "Tether" },
    SOL: { name_ko: "솔라나", name_en: "Solana" },
    AVAX: { name_ko: "아발란시", name_en: "Avalanche" },
    MATIC: { name_ko: "폴리곤", name_en: "Polygon" },
    ARB: { name_ko: "아비트럼", name_en: "Arbitrum" },
    OP: { name_ko: "옵티미즘", name_en: "Optimism" },
    AAVE: { name_ko: "에이브", name_en: "Aave" },
    COMP: { name_ko: "컴파운드", name_en: "Compound" },
    UNI: { name_ko: "유니스왑", name_en: "Uniswap" },
    SNX: { name_ko: "신텍스", name_en: "Synthetix" },
    SUSHI: { name_ko: "수시스왑", name_en: "SushiSwap" },
    SHIB: { name_ko: "시바이누", name_en: "Shiba Inu" },
    APE: { name_ko: "에이피씨", name_en: "ApeCoin" },
    GMT: { name_ko: "그린메테", name_en: "Green Metaverse Token" },
    BLUR: { name_ko: "블러", name_en: "Blur" },
    // ... 추가 필요시 확장
  };

async function syncCoinoneMarkets() {
  console.log("🔄 [syncCoinoneMarkets] Starting Coinone market sync...");

  try {
    // 코인원 마켓 API
    const marketsRes = await fetch(
      "https://api.coinone.co.kr/public/v2/markets/KRW"
    );
    const json = await marketsRes.json();
    const markets = (json.markets ?? []) as any[];

    const rows = markets.map((m) => {
      const base = (m.target_currency ?? "").toUpperCase();
      // 메타에서 name_ko/name_en 가져오기
      const meta = COINONE_COIN_META[base] ?? { name_ko: null, name_en: null };

      return {
        exchange: "COINONE",
        market: m.market,
        base_symbol: base,
        quote_symbol: m.base_currency,
        name_ko: meta.name_ko ?? null,
        name_en: meta.name_en ?? null,
        icon_url: null,
      };
    });

    console.log(
      `📊 [syncCoinoneMarkets] Found ${rows.length} Coinone markets with names`
    );

    // exchange_markets.json 로드 & merge
    const dataPath = path.join(process.cwd(), "data", "exchange_markets.json");
    let allMarkets: any[] = [];

    if (fs.existsSync(dataPath)) {
      const existing = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
      allMarkets = Array.isArray(existing)
        ? existing.filter((m: any) => m.exchange !== "COINONE")
        : [];
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
