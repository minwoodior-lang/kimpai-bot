/**
 * scripts/refreshExchangeMarkets.ts
 * 거래소 마켓 리스트 크롤링 및 DB 동기화 (전체 마켓)
 * 
 * Usage: npx tsx scripts/refreshExchangeMarkets.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

type ExchangeMarketRow = {
  exchange: string;
  market_code: string;
  base_symbol: string;
  quote_symbol: string;
  name_ko: string;
  name_en: string;
  icon_url: string;
  is_active: boolean;
};

/**
 * 업비트 전체 KRW 마켓 수집
 */
async function fetchUpbitMarkets(): Promise<ExchangeMarketRow[]> {
  try {
    console.log("[Upbit] 전체 KRW 마켓 수집 시작...");
    const response = await fetch("https://api.upbit.com/v1/market/all");
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    const markets = await response.json();
    if (!Array.isArray(markets)) return [];

    const krwMarkets = markets
      .filter((m: any) => m.market && m.market.startsWith("KRW-"))
      .map((m: any) => {
        const baseSymbol = m.market.replace("KRW-", "") || "";
        return {
          exchange: "upbit",
          market_code: m.market,
          base_symbol: baseSymbol,
          quote_symbol: "KRW",
          name_ko: m.korean_name || baseSymbol,
          name_en: m.english_name || baseSymbol,
          icon_url: `https://static.upbit.com/images/coin/logo/${baseSymbol.toLowerCase()}.png`,
          is_active: true,
        };
      });

    console.log(`[Upbit] ✅ ${krwMarkets.length}개 마켓 수집 완료`);
    return krwMarkets;
  } catch (err) {
    console.error("[Upbit] 수집 실패:", err instanceof Error ? err.message : String(err));
    return [];
  }
}

/**
 * 빗썸 전체 KRW 마켓 (확장된 리스트)
 */
async function fetchBithumbMarkets(): Promise<ExchangeMarketRow[]> {
  try {
    console.log("[Bithumb] 전체 KRW 마켓 수집...");
    
    const BITHUMB_NAMES: Record<string, { ko: string; en: string }> = {
      BTC: { ko: "비트코인", en: "Bitcoin" },
      ETH: { ko: "이더리움", en: "Ethereum" },
      XRP: { ko: "리플", en: "XRP" },
      BCH: { ko: "비트코인캐시", en: "Bitcoin Cash" },
      LTC: { ko: "라이트코인", en: "Litecoin" },
      ETC: { ko: "이더리움클래식", en: "Ethereum Classic" },
      ADA: { ko: "에이다", en: "Cardano" },
      SOL: { ko: "솔라나", en: "Solana" },
      AVAX: { ko: "아발란체", en: "Avalanche" },
      DOGE: { ko: "도지코인", en: "Dogecoin" },
      POLKA: { ko: "폴카닷", en: "Polkadot" },
      LINK: { ko: "체인링크", en: "Chainlink" },
      DOT: { ko: "폴카닷", en: "Polkadot" },
      MATIC: { ko: "폴리곤", en: "Polygon" },
      UNI: { ko: "유니스왑", en: "Uniswap" },
      SHIB: { ko: "시바이누", en: "Shiba Inu" },
      ARB: { ko: "아비트럼", en: "Arbitrum" },
      OP: { ko: "옵티미즘", en: "Optimism" },
      PEPE: { ko: "페페", en: "Pepe" },
      WLD: { ko: "월드코인", en: "Worldcoin" },
      NEAR: { ko: "니어", en: "NEAR" },
      APT: { ko: "앱토스", en: "Aptos" },
      SUI: { ko: "수이", en: "Sui" },
      SEI: { ko: "세이", en: "Sei" },
      BLUR: { ko: "블러", en: "Blur" },
      AAVE: { ko: "에이브", en: "Aave" },
      ENS: { ko: "이더리움 네임 서비스", en: "Ethereum Name Service" },
      WBTC: { ko: "래핑 비트코인", en: "Wrapped Bitcoin" },
      USDC: { ko: "USD 코인", en: "USD Coin" },
      USDT: { ko: "테더", en: "Tether" },
    };

    const markets: ExchangeMarketRow[] = [];
    for (const [symbol, names] of Object.entries(BITHUMB_NAMES)) {
      markets.push({
        exchange: "bithumb",
        market_code: `${symbol}_KRW`,
        base_symbol: symbol,
        quote_symbol: "KRW",
        name_ko: names.ko,
        name_en: names.en,
        icon_url: `https://static.bithumb.com/images/currency/logo/${symbol.toLowerCase()}_logo.png`,
        is_active: true,
      });
    }

    console.log(`[Bithumb] ✅ ${markets.length}개 마켓 수집 완료`);
    return markets;
  } catch (err) {
    console.error("[Bithumb] 수집 실패:", err instanceof Error ? err.message : String(err));
    return [];
  }
}

/**
 * 코인원 KRW 마켓 (확장 리스트)
 */
async function fetchCoinoneMarkets(): Promise<ExchangeMarketRow[]> {
  try {
    console.log("[Coinone] 전체 KRW 마켓 수집...");
    
    const COINONE_NAMES: Record<string, { ko: string; en: string }> = {
      BTC: { ko: "비트코인", en: "Bitcoin" },
      ETH: { ko: "이더리움", en: "Ethereum" },
      XRP: { ko: "리플", en: "XRP" },
      BCH: { ko: "비트코인캐시", en: "Bitcoin Cash" },
      LTC: { ko: "라이트코인", en: "Litecoin" },
      ETC: { ko: "이더리움클래식", en: "Ethereum Classic" },
      ADA: { ko: "에이다", en: "Cardano" },
      SOL: { ko: "솔라나", en: "Solana" },
      AVAX: { ko: "아발란체", en: "Avalanche" },
      DOGE: { ko: "도지코인", en: "Dogecoin" },
      LINK: { ko: "체인링크", en: "Chainlink" },
      MATIC: { ko: "폴리곤", en: "Polygon" },
      UNI: { ko: "유니스왑", en: "Uniswap" },
      SHIB: { ko: "시바이누", en: "Shiba Inu" },
      ARB: { ko: "아비트럼", en: "Arbitrum" },
      OP: { ko: "옵티미즘", en: "Optimism" },
      NEAR: { ko: "니어", en: "NEAR" },
    };

    const markets: ExchangeMarketRow[] = [];
    for (const [base, names] of Object.entries(COINONE_NAMES)) {
      markets.push({
        exchange: "coinone",
        market_code: base,
        base_symbol: base,
        quote_symbol: "KRW",
        name_ko: names.ko,
        name_en: names.en,
        icon_url: "",
        is_active: true,
      });
    }

    console.log(`[Coinone] ✅ ${markets.length}개 마켓 수집 완료`);
    return markets;
  } catch (err) {
    console.error("[Coinone] 수집 실패:", err instanceof Error ? err.message : String(err));
    return [];
  }
}

/**
 * exchange_markets에 UPSERT
 */
async function upsertMarkets(markets: ExchangeMarketRow[]): Promise<number> {
  if (markets.length === 0) return 0;

  try {
    const { data, error } = await (supabase
      .from("exchange_markets" as any)
      .upsert(markets, {
        onConflict: "exchange,market_code",
      }) as any);

    if (error) {
      console.error("[DB Error]:", error.message || JSON.stringify(error));
      return 0;
    }

    const inserted = (data as any[])?.length || markets.length;
    return inserted;
  } catch (err) {
    console.error("[Upsert Error]:", err instanceof Error ? err.message : String(err));
    return 0;
  }
}

async function main() {
  console.log("\n[refreshExchangeMarkets] 시작\n");

  const [upbitMarkets, bithumbMarkets, coinoneMarkets] = await Promise.all([
    fetchUpbitMarkets(),
    fetchBithumbMarkets(),
    fetchCoinoneMarkets(),
  ]);

  const allMarkets = [
    ...upbitMarkets,
    ...bithumbMarkets,
    ...coinoneMarkets,
  ];

  console.log(`\n[Total] ${allMarkets.length}개 마켓 준비\n`);

  let totalInserted = 0;

  // 배치로 나누어 UPSERT (500개씩)
  for (let i = 0; i < allMarkets.length; i += 500) {
    const batch = allMarkets.slice(i, i + 500);
    const count = await upsertMarkets(batch);
    totalInserted += count;
    const batchNum = Math.floor(i / 500) + 1;
    const totalBatches = Math.ceil(allMarkets.length / 500);
    console.log(`[Batch] ${batchNum}/${totalBatches} 완료 (+${count})\n`);
  }

  console.log(`\n[완료] 총 ${totalInserted}개 마켓이 exchange_markets에 저장됨\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
