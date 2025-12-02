// scripts/syncSymbols.ts

import { createClient } from "@supabase/supabase-js";

// Supabase 클라이언트 (Server / Script 용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  console.error(
    "❌ SUPABASE env 가 없습니다. NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 확인하세요."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

// -----------------------------
// 업비트 전체 마켓 리스트 (한글명 포함)
// -----------------------------
async function fetchUpbitMarkets() {
  const res = await fetch(
    "https://api.upbit.com/v1/market/all?isDetails=true"
  );
  if (!res.ok) throw new Error(`Upbit API error: ${res.status}`);
  const data = await res.json();

  // data: [{ market: "KRW-BTC", korean_name: "비트코인", english_name: "Bitcoin", ... }, ...]
  return (data as any[]).map((m) => {
    const [quote, base] = (m.market as string).split("-");
    return {
      symbol: base.toUpperCase(), // BTC
      ko_name_upbit: m.korean_name as string, // 비트코인
      en_name: (m.english_name as string) || null,
    };
  });
}

// -----------------------------
// 코인원 마켓 리스트
// -----------------------------
async function fetchCoinoneMarkets() {
  const res = await fetch(
    "https://api.coinone.co.kr/public/v2/markets/KRW"
  );
  if (!res.ok) {
    console.warn("⚠️ Coinone API error, 건너뜀:", res.status);
    return [];
  }
  const json = await res.json();
  const markets = (json.markets ?? []) as any[];

  // markets[i]: { target_currency: "BTC", korean_name: "비트코인", ... } 형태라고 가정
  return markets.map((m) => ({
    symbol: (m.target_currency as string).toUpperCase(),
    ko_name_coinone: (m.korean_name as string | undefined) ?? null,
  }));
}

// -----------------------------
// 빗썸 마켓 리스트 (지금은 심볼만; 한글명은 나중에)
// -----------------------------
async function fetchBithumbMarkets() {
  const res = await fetch("https://api.bithumb.com/public/ticker/ALL_KRW");
  if (!res.ok) {
    console.warn("⚠️ Bithumb API error, 건너뜀:", res.status);
    return [];
  }
  const json = await res.json();
  const data = json.data || {};
  return Object.keys(data)
    .filter((k) => k !== "date")
    .map((symbol) => ({
      symbol: symbol.toUpperCase(),
      // ko_name_bithumb: 나중에 필요하면 여기서 추가
    }));
}

// -----------------------------
// 메인 로직
// -----------------------------
async function main() {
  console.log("🔄 심볼/한글명 동기화 시작...");

  const [upbit, coinone, bithumb] = await Promise.all([
    fetchUpbitMarkets(),
    fetchCoinoneMarkets(),
    fetchBithumbMarkets(),
  ]);

  const map = new Map<string, any>();

  function merge(list: any[]) {
    list.forEach((row) => {
      const key = (row.symbol as string).toUpperCase();
      const existing = map.get(key) || { symbol: key };
      map.set(key, { ...existing, ...row, symbol: key });
    });
  }

  merge(upbit);
  merge(coinone);
  merge(bithumb);

  const rows = Array.from(map.values());

  console.log(`📦 총 심볼 수집: ${rows.length}개, Supabase upsert 중...`);

  const { error } = await supabase
    .from("master_symbols")
    .upsert(
      rows.map((r) => ({
        symbol: r.symbol,
        ko_name_upbit: r.ko_name_upbit ?? null,
        // 🔑 ko_name_bithumb 안 보냄 (컬럼 없어도 됨)
                en_name: r.en_name ?? null,
        last_seen_at: new Date().toISOString(),
      })),
      { onConflict: "symbol" }
    );

  if (error) {
    console.error("❌ upsert error:", error);
    process.exit(1);
  }

  console.log("✅ upsert 완료, ko_name_primary 자동 채우기 중...");

  const { error: rpcError } = await supabase.rpc("fill_ko_name_primary");
  if (rpcError) {
    console.error("❌ fill_ko_name_primary 호출 실패:", rpcError);
    process.exit(1);
  }

  console.log("🎉 심볼/한글명 자동 동기화 완료");
}

main().catch((e) => {
  console.error("❌ syncSymbols error:", e);
  process.exit(1);
});
