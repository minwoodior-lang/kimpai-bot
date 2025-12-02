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
import pg from "pg";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Supabase 연결 시도 (클라우드) 또는 로컬 PostgreSQL로 fallback
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 로컬 PostgreSQL 연결 (fallback)
const localPool = process.env.DATABASE_URL 
  ? new pg.Pool({ connectionString: process.env.DATABASE_URL })
  : null;

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
    
    // Upbit 필터링: KRW/BTC/USDT 마켓만 선택
    const result = markets
      .filter((m: any) => {
        const market = m.market || "";
        // 형식: "KRW-BTC", "BTC-BTC", "USDT-ETH" 등
        const parts = market.split("-");
        if (parts.length < 2) return false;
        const quote = parts[0];
        return quote === "KRW" || quote === "BTC" || quote === "USDT";
      })
      .map((m: any) => {
        const market = m.market || "";
        // "KRW-BTC" → quote="KRW", base="BTC"
        // "KRW-BTC-BERA" → quote="KRW", base="BTC-BERA"
        const [quote, ...rest] = market.split("-");
        const base = rest.join("-");
        
        return {
          exchange: "UPBIT",
          market_code: market,
          base_symbol: base,
          quote_symbol: quote,
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
 * 빗썸: v1/market/all API로 마켓 + 한글명 수집
 */
type BithumbMarketApiRow = {
  market: string;
  korean_name: string;
  english_name: string;
  market_warning?: string;
};

async function fetchBithumbMarkets(): Promise<ExchangeMarketRow[]> {
  try {
    console.log("[Bithumb] 마켓 + 한글명 수집 중...");
    
    const response = await fetch("https://api.bithumb.com/v1/market/all");
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    const json = await response.json();
    
    // 응답 구조: { data: [...] } 또는 { ... } 형식
    const data = (json.data || json) as BithumbMarketApiRow[];
    
    if (!Array.isArray(data)) {
      console.warn("[Bithumb] API 응답이 배열이 아님");
      return [];
    }
    
    const markets: ExchangeMarketRow[] = [];
    
    for (const m of data) {
      // KRW/BTC/USDT 마켓만 필터링
      if (!m.market.includes("-")) continue;
      
      const parts = m.market.split("-");
      const quote = parts[0]; // "KRW", "BTC", "USDT"
      const base = parts.slice(1).join("-"); // 대시 포함 심볼 처리 (예: "BERA")
      
      if (quote !== "KRW" && quote !== "BTC" && quote !== "USDT") continue;
      
      // 우선순위: API 한글명 > BITHUMB_NAMES fallback > null
      const nameKo = m.korean_name ?? BITHUMB_NAMES[base] ?? null;
      
      markets.push({
        exchange: "BITHUMB",
        market_code: m.market,
        base_symbol: base,
        quote_symbol: quote,
        name_ko: nameKo,
        name_en: m.english_name || null,
      });
    }
    
    console.log(`[Bithumb] ✅ ${markets.length}개 마켓`);
    return markets;
  } catch (err) {
    console.error("[Bithumb] 수집 실패:", err instanceof Error ? err.message : String(err));
    return [];
  }
}


/**
 * Coinone 공식 currencies API에서 한글명/영문명 매핑
 */
async function fetchCoinoneNameMap(): Promise<Record<string, { ko: string | null; en: string | null }>> {
  try {
    const response = await fetch("https://api.coinone.co.kr/public/v2/currencies/");
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const json = await response.json();
    
    // 응답 구조 확인: currencies 또는 바로 배열 또는 다른 구조
    let currencies: any[] = [];
    if (Array.isArray(json)) {
      currencies = json;
    } else if (json.currencies && Array.isArray(json.currencies)) {
      currencies = json.currencies;
    } else if (json.data && Array.isArray(json.data)) {
      currencies = json.data;
    } else {
      // 응답 구조 디버깅
      const keys = Object.keys(json || {});
      console.log(`[Coinone NameMap] 응답 구조: ${keys.slice(0, 5).join(", ")} (${keys.length}개 키)`);
      
      // 배열을 찾기 위해 모든 키 순회
      for (const key of keys) {
        if (Array.isArray(json[key])) {
          currencies = json[key];
          console.log(`[Coinone NameMap] 배열 발견: ${key} (${currencies.length}개)`);
          break;
        }
      }
    }
    
    const map: Record<string, { ko: string | null; en: string | null }> = {};
    for (const c of currencies) {
      if (c.currency) {
        const symbol = c.currency.toUpperCase();
        map[symbol] = {
          ko: c.display_name ?? null,
          en: c.display_name_en ?? null,
        };
      }
    }
    
    console.log(`[Coinone NameMap] ✅ ${Object.keys(map).length}개 심볼 매핑됨`);
    return map;
  } catch (err) {
    console.log("[Coinone NameMap] 수집 실패:", err instanceof Error ? err.message : String(err));
    return {};
  }
}

/**
 * 코인원: v2/markets/KRW + currencies 정식 API
 */
async function fetchCoinoneMarkets(): Promise<ExchangeMarketRow[]> {
  try {
    console.log("[Coinone] 마켓 + 한글명 수집 중...");
    
    // 1단계: nameMap 먼저 가져오기
    const nameMap = await fetchCoinoneNameMap();
    
    // 2단계: Coinone v2/markets/KRW API 사용
    const response = await fetch("https://api.coinone.co.kr/public/v2/markets/KRW");
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const json = await response.json();
    
    // 응답이 { markets: [...] } 또는 { data: [...] } 또는 [...] 형식
    let data = Array.isArray(json) ? json : (Array.isArray(json.markets) ? json.markets : (Array.isArray(json.data) ? json.data : []));
    
    if (!Array.isArray(data) || data.length === 0) {
      console.log("[Coinone] 응답 데이터가 없음:", typeof json, Object.keys(json || {}).slice(0, 5));
      return [];
    }
    
    // data는 { symbol, ... } 배열 - nameMap에서 한글명/영문명 추가
    const markets: ExchangeMarketRow[] = data
      .filter((m: any) => {
        // symbol이 없으면 이전 필드명 확인
        const sym = m.symbol || m.target_currency || m.currency || m.code;
        return sym && String(sym).trim();
      })
      .map((m: any) => {
        const symbol = (m.symbol || m.target_currency || m.currency || m.code || "").toUpperCase().trim();
        const nameInfo = nameMap[symbol] || { ko: null, en: null };
        
        return {
          exchange: "COINONE",
          market_code: `${symbol}/KRW`,
          base_symbol: symbol,
          quote_symbol: "KRW",
          name_ko: nameInfo.ko || m.name_ko || null,
          name_en: nameInfo.en || m.name_en || null,
        };
      });
    
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
  
  if (!supabase) {
    console.error("❌ Supabase 클라이언트 없음");
    return 0;
  }
  
  console.log("[Supabase] 기존 마켓 삭제 중...");
  try {
    await supabase
      .from("exchange_markets")
      .delete()
      .gte("id", 0);
  } catch (delErr) {
    console.log("[Supabase] DELETE 스킵:", delErr instanceof Error ? delErr.message : String(delErr));
  }
  
  console.log(`[Supabase] ${markets.length}개 마켓 삽입 중...`);
  
  // 배치 INSERT (500개씩)
  let inserted = 0;
  for (let i = 0; i < markets.length; i += 500) {
    const batch = markets.slice(i, i + 500);
    const { data, error: insertError } = await supabase
      .from("exchange_markets")
      .insert(batch as any)
      .select("id");
    
    if (insertError) {
      console.error("❌ INSERT 실패:", insertError.message);
      throw insertError;
    }
    
    const batchCount = (data as any[])?.length || 0;
    inserted += batchCount;
    console.log(`[Supabase] ✅ 배치 ${Math.floor(i/500) + 1}: ${batchCount}개 저장됨`);
  }
  
  console.log(`[Supabase] ✅ 총 ${inserted}개 행 저장됨`);
  return inserted;
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
