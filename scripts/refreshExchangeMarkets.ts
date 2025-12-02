/**
 * scripts/refreshExchangeMarkets.ts
 * 거래소 마켓 리스트 크롤링 및 DB 동기화
 * 
 * Usage: npx tsx scripts/refreshExchangeMarkets.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

type RawMarket = {
  exchange: "upbit" | "bithumb" | "coinone";
  marketCode: string;
  baseSymbol: string;
  quoteSymbol: string;
  nameKo?: string;
  nameEn?: string;
  iconUrl?: string;
};

/**
 * 업비트 마켓 스크래핑
 */
async function scrapeUpbitMarkets(): Promise<RawMarket[]> {
  try {
    const response = await fetch(
      "https://api.upbit.com/v1/market/all?include_details=false"
    );
    const markets = await response.json();

    if (!Array.isArray(markets)) return [];

    return markets
      .filter((m: any) => m.quote_currency === "KRW")
      .map((m: any) => {
        const baseSymbol = m.market.split("-")[1] || "";
        return {
          exchange: "upbit" as const,
          marketCode: m.market,
          baseSymbol,
          quoteSymbol: "KRW",
          nameKo: m.korean_name || "",
          nameEn: m.english_name || "",
          iconUrl: `https://static.upbit.com/images/coin/logo/${baseSymbol.toLowerCase()}.png`,
        };
      })
      .slice(0, 100); // 상위 100개만 (테스트용)
  } catch (err) {
    console.error("[Upbit] Scraping error:", err);
    return [];
  }
}

/**
 * 빗썸 마켓 스크래핑
 */
async function scrapeBithumbMarkets(): Promise<RawMarket[]> {
  try {
    // 빗썸 커스텀 심볼 매핑 (하드코딩된 주요 코인들)
    const BITHUMB_SYMBOLS: { [key: string]: { ko: string; en: string } } = {
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
    };

    const KRW_MARKETS: RawMarket[] = [];
    for (const [symbol, names] of Object.entries(BITHUMB_SYMBOLS)) {
      KRW_MARKETS.push({
        exchange: "bithumb" as const,
        marketCode: `${symbol}_KRW`,
        baseSymbol: symbol,
        quoteSymbol: "KRW",
        nameKo: names.ko,
        nameEn: names.en,
        iconUrl: `https://static.bithumb.com/images/currency/logo/${symbol.toLowerCase()}_logo.png`,
      });
    }
    return KRW_MARKETS;
  } catch (err) {
    console.error("[Bithumb] Scraping error:", err);
    return [];
  }
}

/**
 * 코인원 마켓 스크래핑
 */
async function scrapeCoinoneMarkets(): Promise<RawMarket[]> {
  try {
    // 코인원 커스텀 심볼 매핑 (하드코딩된 주요 코인들)
    const COINONE_SYMBOLS: { [key: string]: { ko: string; en: string } } = {
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
    };

    const markets: RawMarket[] = [];
    for (const [symbol, names] of Object.entries(COINONE_SYMBOLS)) {
      markets.push({
        exchange: "coinone" as const,
        marketCode: `${symbol}/KRW`,
        baseSymbol: symbol,
        quoteSymbol: "KRW",
        nameKo: names.ko,
        nameEn: names.en,
        iconUrl: `https://img.coinone.co.kr/img/ico_coin_img/ico_${symbol.toLowerCase()}.png`,
      });
    }

    return markets;
  } catch (err) {
    console.error("[Coinone] Scraping error:", err);
    return [];
  }
}

/**
 * 모든 거래소 마켓 데이터 수집 및 DB 동기화
 */
async function refreshExchangeMarkets() {
  try {
    console.log("[refreshExchangeMarkets] 시작");

    // 각 거래소에서 마켓 데이터 수집
    const [upbitMarkets, bithumbMarkets, coinoneMarkets] = await Promise.all([
      scrapeUpbitMarkets(),
      scrapeBithumbMarkets(),
      scrapeCoinoneMarkets(),
    ]);

    const allMarkets = [...upbitMarkets, ...bithumbMarkets, ...coinoneMarkets];

    console.log(
      `[refreshExchangeMarkets] 수집 완료: 업비트(${upbitMarkets.length}), 빗썸(${bithumbMarkets.length}), 코인원(${coinoneMarkets.length})`
    );

    if (allMarkets.length === 0) {
      console.error("[refreshExchangeMarkets] 수집된 마켓 없음");
      process.exit(1);
    }

    // Supabase Upsert (exchange + market_code 기준)
    let insertedCount = 0;
    let errorCount = 0;

    for (const market of allMarkets) {
      try {
        const { error } = await supabase.from("exchange_markets").upsert(
          {
            exchange: market.exchange,
            market_code: market.marketCode,
            base_symbol: market.baseSymbol,
            quote_symbol: market.quoteSymbol,
            name_ko: market.nameKo || null,
            name_en: market.nameEn || null,
            icon_url: market.iconUrl || null,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "exchange,market_code" }
        );

        if (error) {
          console.error(
            `[Upsert Error] ${market.exchange} ${market.marketCode}:`,
            error.message
          );
          errorCount++;
        } else {
          insertedCount++;
        }
      } catch (err) {
        console.error(
          `[Upsert Exception] ${market.exchange} ${market.marketCode}:`,
          err
        );
        errorCount++;
      }
    }

    console.log(
      `[refreshExchangeMarkets] 완료: 성공 ${insertedCount}/${allMarkets.length}, 에러 ${errorCount}`
    );

    if (errorCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("[refreshExchangeMarkets] Fatal error:", err);
    process.exit(1);
  }
}

// 실행
refreshExchangeMarkets();
