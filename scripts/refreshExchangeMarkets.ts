/**
 * scripts/refreshExchangeMarkets.ts
 * 3개 거래소(업비트/빗썸/코인원) 마켓 완전 자동화 동기화
 * - Upbit: API에서 한글명 직접 수집
 * - Bithumb: API + HTML 크롤링으로 한글명 자동 추출
 * - Coinone: API + HTML 크롤링으로 한글명 자동 추출
 * 
 * Usage: npm run refresh:exchange-markets
 */

import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

type ExchangeMarketRow = {
  exchange: string;
  market_code: string;
  base_symbol: string;
  quote_symbol: string;
  name_ko: string | null;
  name_en: string | null;
};

// 빗썸 수동 매핑 (fallback용)
const BITHUMB_NAMES: Record<string, string> = {
  // 주요 코인들
  BTC: "비트코인",
  ETH: "이더리움",
  XRP: "리플",
  LTC: "라이트코인",
  BCH: "비트코인캐시",
  EOS: "이오스",
  TRX: "트론",
  ZEC: "지캐시",
  XLM: "스텔라루멘",
  ADA: "에이다",
  QTUM: "퀀텀",
  NEO: "네오",
  ELF: "엘프",
  WAVES: "웨이브스",
  IOT: "아이오타",
  VET: "비체인",
  THETA: "세타토큰",
  TFUEL: "세타퓨엘",
  IOST: "아이오에스티",
  CRO: "크로노스",
  CELO: "셀로",
  FLOW: "플로우",
  SAND: "더샌드박스",
  MANA: "디센트럴랜드",
  ENJ: "엔진코인",
  CHZ: "칠리즈",
  HBAR: "헤데라",
  SXP: "솔라르엑스체인지",
  UNI: "유니스왑",
  SUSHI: "스시",
  "1INCH": "1인치",
  AAVE: "에이브",
  SNX: "신세틱스",
  YFI: "예일드파밍",
  COMP: "컴파운드",
  LINK: "체인링크",
  MKR: "메이커",
  DAI: "다이",
  USDC: "USDC",
  USDT: "테더",
  BUSD: "비유에스디",
  TUSD: "트루USD",
  PAX: "팍스",
  TRUE: "트루",
  PAXG: "팍스골드",
  AAPL: "애플",
  TSLA: "테슬라",
};

/**
 * 업비트: KRW/BTC/USDT 마켓 - API 직접 호출
 */
async function fetchUpbitMarkets(): Promise<ExchangeMarketRow[]> {
  try {
    console.log("[Upbit] 마켓 수집 중...");
    const response = await fetch("https://api.upbit.com/v1/market/all");
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    const markets: any[] = await response.json();
    if (!Array.isArray(markets)) {
      console.warn("[Upbit] 응답이 배열이 아님");
      return [];
    }
    
    console.log(`[Upbit DEBUG] 전체 응답 마켓 수: ${markets.length}`);
    if (markets.length > 0) {
      console.log(`[Upbit DEBUG] 첫 샘플:`, JSON.stringify(markets[0]).substring(0, 150));
    }
    
    const result = markets
      .filter((m: any) => {
        const market = m.market || "";
        // 마지막 "-" 이후가 quote_symbol (KRW, BTC, USDT)
        const lastDashIndex = market.lastIndexOf("-");
        if (lastDashIndex === -1) return false;
        const quote = market.substring(lastDashIndex + 1);
        return quote === "KRW" || quote === "BTC" || quote === "USDT";
      })
      .map((m: any) => {
        const market = m.market || "";
        const lastDashIndex = market.lastIndexOf("-");
        const baseSymbol = market.substring(0, lastDashIndex) || "";
        const quoteSymbol = market.substring(lastDashIndex + 1) || "KRW";
        
        return {
          exchange: "UPBIT",
          market_code: market,
          base_symbol: baseSymbol,
          quote_symbol: quoteSymbol,
          name_ko: m.korean_name || null,
          name_en: m.english_name || null,
        };
      });
    
    console.log(`[Upbit] ✅ ${result.length}개 마켓 (KRW/BTC/USDT)`);
    return result;
  } catch (err) {
    console.error("[Upbit] 수집 실패:", err instanceof Error ? err.message : String(err));
    return [];
  }
}

/**
 * 빗썸: API + HTML 크롤링으로 한글명 자동 추출
 */
async function fetchBithumbMarkets(): Promise<ExchangeMarketRow[]> {
  try {
    console.log("[Bithumb] 마켓 + 한글명 수집 중...");
    
    // 1단계: API에서 심볼 목록
    const apiResponse = await fetch("https://api.bithumb.com/public/ticker/all", {
      headers: { "Accept": "application/json" }
    });
    
    if (!apiResponse.ok) throw new Error(`API error: ${apiResponse.status}`);
    
    const data = await apiResponse.json();
    if (data.status !== "0000" || !data.data) {
      console.warn("[Bithumb] API 응답 오류");
      return [];
    }
    
    const symbols = Object.keys(data.data).filter(s => s.toUpperCase() !== "DATE");
    
    // 2단계: HTML 크롤링으로 한글명 수집
    const htmlMap = await fetchBithumbKoreanNames();
    
    const markets: ExchangeMarketRow[] = [];
    for (const symbol of symbols) {
      const upperSymbol = symbol.toUpperCase();
      
      // 우선순위: HTML 크롤링 > BITHUMB_NAMES fallback > null
      const nameKo = htmlMap[upperSymbol] ?? BITHUMB_NAMES[upperSymbol] ?? null;
      
      // KRW 마켓
      markets.push({
        exchange: "BITHUMB",
        market_code: `${upperSymbol}_KRW`,
        base_symbol: upperSymbol,
        quote_symbol: "KRW",
        name_ko: nameKo,
        name_en: null,
      });
      
      // BTC 마켓
      markets.push({
        exchange: "BITHUMB",
        market_code: `${upperSymbol}_BTC`,
        base_symbol: upperSymbol,
        quote_symbol: "BTC",
        name_ko: nameKo,
        name_en: null,
      });
    }
    
    console.log(`[Bithumb] ✅ ${markets.length}개 마켓 (${symbols.length} 심볼 × 2 페어)`);
    return markets;
  } catch (err) {
    console.error("[Bithumb] 수집 실패:", err instanceof Error ? err.message : String(err));
    return [];
  }
}

/**
 * 빗썸 API에서 한글명 가져오기 (CSR 페이지 대신 내부 API 사용)
 */
async function fetchBithumbKoreanNames(): Promise<Record<string, string>> {
  const nameMap: Record<string, string> = {};
  try {
    // 방법 1: assetsstatus API 시도 (심볼과 한글명 포함 가능)
    let apiEndpoint = "https://api.bithumb.com/public/assetsstatus/ticker/ALL_KRW";
    let response = await fetch(apiEndpoint, {
      headers: { "Accept": "application/json" }
    });
    
    if (response.status === 404) {
      // 방법 2: ticker API 시도
      apiEndpoint = "https://api.bithumb.com/public/ticker/ALL_KRW";
      response = await fetch(apiEndpoint, {
        headers: { "Accept": "application/json" }
      });
    }
    
    if (response.status === 404) {
      // 방법 3: 소문자 시도
      apiEndpoint = "https://api.bithumb.com/public/ticker/all_krw";
      response = await fetch(apiEndpoint, {
        headers: { "Accept": "application/json" }
      });
    }
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    // API 응답 포맷에 따라 처리
    if (data && typeof data === "object") {
      // 응답이 { symbol: { name_ko, ... }, ... } 형식인 경우
      for (const [symbol, coinData] of Object.entries(data)) {
        if (symbol.toUpperCase() === "DATE") continue;
        
        const coin = coinData as any;
        
        // 한글명이 있는지 확인
        let koreanName = null;
        if (coin.name_ko) {
          koreanName = coin.name_ko;
        } else if (coin.korean_name) {
          koreanName = coin.korean_name;
        } else if (coin.name && typeof coin.name === "string") {
          // name 필드에서 한글 추출
          const match = coin.name.match(/[\uAC00-\uD7AF]+/);
          if (match) {
            koreanName = match[0];
          }
        }
        
        if (koreanName) {
          nameMap[symbol.toUpperCase()] = koreanName;
        }
      }
    }
    
    console.log(`[Bithumb API] 한글명 ${Object.keys(nameMap).length}개 수집 (from ${apiEndpoint})`);
  } catch (err) {
    console.log(`[Bithumb API] 수집 실패:`, err instanceof Error ? err.message : String(err));
    console.log(`[Bithumb API] HTML 크롤링 방식은 CSR 페이지라 사용 불가능 - BITHUMB_NAMES fallback으로만 진행`);
  }
  
  return nameMap;
}

/**
 * 코인원: API + HTML 크롤링으로 한글명 자동 추출
 */
async function fetchCoinoneMarkets(): Promise<ExchangeMarketRow[]> {
  try {
    console.log("[Coinone] 마켓 + 한글명 수집 중...");
    
    let data: any[] = [];
    
    // Coinone 공식 ticker API 사용 (모든 KRW 마켓)
    try {
      const response = await fetch("https://api.coinone.co.kr/public/ticker/all", {
        headers: { "Accept": "application/json" }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const jsonData = await response.json();
      
      // data 객체의 각 심볼을 markets로 변환
      if (jsonData && jsonData.data && typeof jsonData.data === "object") {
        data = Object.keys(jsonData.data)
          .filter(symbol => symbol.toUpperCase() !== "RESULT_CODE" && symbol.toUpperCase() !== "RESULT_MSG")
          .map(symbol => ({
            target_currency: symbol.toUpperCase(),
          }));
        console.log(`[Coinone] ✅ API에서 ${data.length}개 심볼 수집`);
      } else {
        console.log("[Coinone] API 응답 형식 예상 벗어남");
        data = [];
      }
    } catch (apiErr) {
      console.log("[Coinone] API 수집 실패:", apiErr instanceof Error ? apiErr.message : String(apiErr));
      // fallback: 공통 코인들만 반환
      data = [];
    }
    
    if (!Array.isArray(data)) {
      console.warn("[Coinone] 최종 데이터 형식 오류");
      return [];
    }
    
    // 2단계: HTML 크롤링으로 한글명 수집
    const htmlMap = await fetchCoinoneKoreanNames();
    
    const markets: ExchangeMarketRow[] = [];
    for (const market of data) {
      const symbol = market.target_currency?.toUpperCase() || "";
      if (!symbol) continue;
      
      const nameKo = htmlMap[symbol] || null;
      
      markets.push({
        exchange: "COINONE",
        market_code: `${symbol}/KRW`,
        base_symbol: symbol,
        quote_symbol: "KRW",
        name_ko: nameKo,
        name_en: null,
      });
    }
    
    console.log(`[Coinone] ✅ ${markets.length}개 마켓`);
    return markets;
  } catch (err) {
    console.error("[Coinone] 수집 실패:", err instanceof Error ? err.message : String(err));
    return [];
  }
}

/**
 * 코인원 HTML에서 한글명 크롤링
 */
async function fetchCoinoneKoreanNames(): Promise<Record<string, string>> {
  const nameMap: Record<string, string> = {};
  try {
    const response = await fetch("https://www.coinone.co.kr/exchange/trade/btc", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // 코인원 마켓 리스트에서 심볼과 한글명 쌍 찾기
    // 일반적인 패턴: <span class="symbol">BTC</span><span class="name">비트코인</span>
    $("span.symbol").each((_, el) => {
      const symbol = $(el).text().trim().toUpperCase();
      const koreanEl = $(el).next();
      const korean = koreanEl.text().trim();
      
      if (symbol && korean) {
        const koreanMatch = korean.match(/[\uAC00-\uD7AF]+/);
        if (koreanMatch) {
          nameMap[symbol] = koreanMatch[0];
        }
      }
    });
    
    console.log(`[Coinone HTML] 한글명 ${Object.keys(nameMap).length}개 추출`);
  } catch (err) {
    console.log(`[Coinone HTML] 크롤링 스킵 (안전 경고):`, err instanceof Error ? err.message : String(err));
  }
  
  return nameMap;
}

/**
 * DB에 완전 동기화 (TRUNCATE + INSERT)
 */
async function upsertMarkets(markets: ExchangeMarketRow[]): Promise<number> {
  if (markets.length === 0) return 0;
  
  console.log("[DB] 기존 마켓 삭제 중...");
  try {
    await supabase
      .from("exchange_markets")
      .delete()
      .gte("id", 0);
  } catch (delError) {
    console.log("[DB] DELETE 스킵:", delError instanceof Error ? delError.message : String(delError));
  }
  
  console.log(`[DB] ${markets.length}개 마켓 삽입 중...`);
  const { data, error: insertError } = await supabase
    .from("exchange_markets")
    .insert(markets as any)
    .select("id");
  
  if (insertError) {
    console.error("❌ INSERT 실패:", insertError.message);
    throw insertError;
  }
  
  const actualCount = (data as any[])?.length || 0;
  console.log(`[DB] ✅ ${actualCount}개 행 저장됨`);
  return actualCount;
}

export async function refreshExchangeMarkets() {
  console.log("\n========== 거래소 마켓 완전 자동화 동기화 시작 ==========\n");
  
  try {
    const [upbit, bithumb, coinone] = await Promise.all([
      fetchUpbitMarkets(),
      fetchBithumbMarkets(),
      fetchCoinoneMarkets(),
    ]);
    
    console.log("counts", {
      upbit: upbit.length,
      bithumb: bithumb.length,
      coinone: coinone.length,
    });
    
    const allMarkets = [...upbit, ...bithumb, ...coinone];
    
    console.log(`\n[집계] Upbit: ${upbit.length}, Bithumb: ${bithumb.length}, Coinone: ${coinone.length}`);
    console.log(`[총계] ${allMarkets.length}개 마켓 준비\n`);
    
    if (allMarkets.length === 0) {
      throw new Error("수집된 마켓이 없습니다");
    }
    
    const totalInserted = await upsertMarkets(allMarkets);
    
    console.log(`\n========== 완료: ${totalInserted}개 마켓 저장 ==========\n`);
    return totalInserted;
  } catch (err) {
    console.error("\n❌ 마켓 동기화 실패:");
    console.error("Error:", err instanceof Error ? err.message : String(err));
    throw err;
  }
}

if (process.argv[1]?.includes("refreshExchangeMarkets.ts")) {
  refreshExchangeMarkets().catch(() => process.exit(1));
}
