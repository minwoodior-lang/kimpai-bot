/**
 * scripts/refreshExchangeMarketsFixed.ts
 * Upbit/Bithumb/Coinone 마켓 데이터를 exchange_markets 테이블에 동기화
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 업비트 마켓 수집
async function fetchUpbitMarkets() {
  try {
    console.log("[Upbit] 마켓 수집 시작...");
    const response = await fetch("https://api.upbit.com/v1/market/all?is_details=false");
    const data = await response.json();
    
    const markets = data
      .filter((m: any) => m.market.startsWith("KRW-"))
      .map((m: any) => ({
        exchange: "upbit",
        market_code: m.market,
        base_symbol: m.market.replace("KRW-", ""),
        quote_symbol: "KRW",
        name_ko: m.korean_name || "",
        name_en: m.english_name || m.market.replace("KRW-", ""),
        icon_url: m.candle_acc_trade_price || "",
        is_active: true,
      }));

    console.log(`[Upbit] 수집 완료: ${markets.length}개 마켓`);
    return markets;
  } catch (err) {
    console.error("[Upbit] 수집 실패:", err);
    return [];
  }
}

// 빗썸 마켓 (커스텀)
function getBithumbMarkets() {
  const markets = [
    { base: "BTC", ko: "비트코인" },
    { base: "ETH", ko: "이더리움" },
    { base: "XRP", ko: "리플" },
    { base: "BCH", ko: "비트코인 캐시" },
    { base: "LTC", ko: "라이트코인" },
    { base: "ETC", ko: "이더리움 클래식" },
    { base: "ADA", ko: "에이다" },
    { base: "SOL", ko: "솔라나" },
    { base: "AVAX", ko: "아발란체" },
    { base: "DOGE", ko: "도지코인" },
    { base: "POLKA", ko: "폴카닷" },
    { base: "LINK", ko: "체인링크" },
  ];

  return markets.map((m) => ({
    exchange: "bithumb",
    market_code: `${m.base}_KRW`,
    base_symbol: m.base,
    quote_symbol: "KRW",
    name_ko: m.ko,
    name_en: m.base,
    icon_url: "",
    is_active: true,
  }));
}

// 코인원 마켓 (커스텀)
function getCoinoneMarkets() {
  const markets = [
    { base: "BTC", ko: "비트코인" },
    { base: "ETH", ko: "이더리움" },
    { base: "XRP", ko: "리플" },
    { base: "BCH", ko: "비트코인 캐시" },
    { base: "LTC", ko: "라이트코인" },
    { base: "ETC", ko: "이더리움 클래식" },
    { base: "ADA", ko: "에이다" },
    { base: "SOL", ko: "솔라나" },
    { base: "AVAX", ko: "아발란체" },
    { base: "DOGE", ko: "도지코인" },
    { base: "LINK", ko: "체인링크" },
  ];

  return markets.map((m) => ({
    exchange: "coinone",
    market_code: `${m.base}/KRW`,
    base_symbol: m.base,
    quote_symbol: "KRW",
    name_ko: m.ko,
    name_en: m.base,
    icon_url: "",
    is_active: true,
  }));
}

async function insertMarkets(markets: any[]) {
  if (markets.length === 0) return 0;

  try {
    const { data, error, status } = await supabase
      .from("exchange_markets")
      .upsert(markets, { 
        onConflict: "exchange,market_code",
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error(`[DB Error] Status ${status}:`, error.message);
      return 0;
    }

    return data?.length || markets.length;
  } catch (err) {
    console.error("[Insert Error]:", err instanceof Error ? err.message : String(err));
    return 0;
  }
}

async function main() {
  console.log("[refreshExchangeMarketsFixed] 시작");

  // 기존 데이터 삭제 (선택사항)
  // await supabase.from("exchange_markets").delete().neq("id", -1);

  const [upbitMarkets, bithumbMarkets, coinoneMarkets] = await Promise.all([
    fetchUpbitMarkets(),
    Promise.resolve(getBithumbMarkets()),
    Promise.resolve(getCoinoneMarkets()),
  ]);

  const allMarkets = [...upbitMarkets, ...bithumbMarkets, ...coinoneMarkets];
  console.log(`[Total] ${allMarkets.length}개 마켓 준비`);

  // 배치 삽입 (500개씩)
  let inserted = 0;
  for (let i = 0; i < allMarkets.length; i += 500) {
    const batch = allMarkets.slice(i, i + 500);
    const count = await insertMarkets(batch);
    inserted += count;
    console.log(`[Batch] ${i / 500 + 1} / ${Math.ceil(allMarkets.length / 500)} 완료 (+${count})`);
  }

  console.log(`[완료] ${inserted}개 마켓 저장됨`);
}

main().catch(console.error);
