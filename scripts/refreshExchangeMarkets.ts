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
  market: string;
  base_symbol: string;
  quote_symbol: string;
  name_ko: string | null;
  name_en: string | null;
};

/**
 * 업비트: KRW/BTC/USDT 마켓 - API 직접 호출
 */
async function fetchUpbitMarkets(): Promise<ExchangeMarketRow[]> {
  try {
    console.log("[Upbit] 마켓 수집 중...");
    const response = await fetch("https://api.upbit.com/v1/market/all?include_details=false");
    
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    const markets: any[] = await response.json();
    if (!Array.isArray(markets)) {
      console.warn("[Upbit] 응답이 배열이 아님");
      return [];
    }
    
    const result = markets
      .filter((m: any) => {
        const market = m.market || "";
        return market.endsWith("-KRW") || market.endsWith("-BTC") || market.endsWith("-USDT");
      })
      .map((m: any) => {
        const market = m.market || "";
        const parts = market.split("-");
        const baseSymbol = parts[0] || "";
        const quoteSymbol = parts[1] || "KRW";
        
        return {
          exchange: "UPBIT",
          market,
          base_symbol: baseSymbol,
          quote_symbol: quoteSymbol,
          name_ko: m.korean_name || null,
          name_en: m.english_name || null,
        };
      });
    
    console.log(`[Upbit] ✅ ${result.length}개 마켓`);
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
      const nameKo = htmlMap[upperSymbol] || null;
      
      // KRW 마켓
      markets.push({
        exchange: "BITHUMB",
        market: `${upperSymbol}_KRW`,
        base_symbol: upperSymbol,
        quote_symbol: "KRW",
        name_ko: nameKo,
        name_en: null,
      });
      
      // BTC 마켓
      markets.push({
        exchange: "BITHUMB",
        market: `${upperSymbol}_BTC`,
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
 * 빗썸 HTML에서 한글명 크롤링
 */
async function fetchBithumbKoreanNames(): Promise<Record<string, string>> {
  const nameMap: Record<string, string> = {};
  try {
    const response = await fetch("https://www.bithumb.com/trade/detail/BTC", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // 빗썸 마켓 리스트에서 symbol-name 패턴 찾기
    // 예: data-symbol="BTC", 한글명 텍스트
    $("[data-symbol]").each((_, el) => {
      const symbol = $(el).attr("data-symbol")?.toUpperCase();
      const text = $(el).text().trim();
      
      if (symbol && text) {
        // 간단한 한글 검증 (유니코드 범위)
        const koreanMatch = text.match(/[\uAC00-\uD7AF]+/);
        if (koreanMatch) {
          nameMap[symbol] = koreanMatch[0];
        }
      }
    });
    
    console.log(`[Bithumb HTML] 한글명 ${Object.keys(nameMap).length}개 추출`);
  } catch (err) {
    console.log(`[Bithumb HTML] 크롤링 스킵 (안전 경고):`, err instanceof Error ? err.message : String(err));
  }
  
  return nameMap;
}

/**
 * 코인원: API + HTML 크롤링으로 한글명 자동 추출
 */
async function fetchCoinoneMarkets(): Promise<ExchangeMarketRow[]> {
  try {
    console.log("[Coinone] 마켓 + 한글명 수집 중...");
    
    // 1단계: API에서 심볼 목록
    const apiResponse = await fetch("https://api.coinone.co.kr/public/v2/markets", {
      headers: { "Accept": "application/json" }
    });
    
    if (!apiResponse.ok) throw new Error(`API error: ${apiResponse.status}`);
    
    const data = await apiResponse.json();
    if (!Array.isArray(data)) {
      console.warn("[Coinone] API 응답 형식 오류");
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
        market: `${symbol}/KRW`,
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
  const { error: delError } = await supabase
    .from("exchange_markets")
    .delete()
    .gte("id", 0);
  
  if (delError) {
    console.error("❌ DELETE 실패:", delError.message);
    throw delError;
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
