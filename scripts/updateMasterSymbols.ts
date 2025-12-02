/**
 * scripts/updateMasterSymbols.ts
 * exchange_markets를 기반으로 master_symbols 재생성
 * 
 * 우선순위:
 * - name_ko: Upbit > Bithumb > Coinone
 * - name_en: Upbit > 기타
 * 
 * Usage: npm run update:master-symbols
 */

import pg from "pg";

// 로컬 PostgreSQL 연결
const pool = process.env.DATABASE_URL 
  ? new pg.Pool({ connectionString: process.env.DATABASE_URL })
  : null;

type MasterSymbolRow = {
  base_symbol: string;
  name_ko: string | null;
  name_en: string | null;
  exchanges: string;
};

/**
 * exchange_markets에서 모든 데이터 읽기
 */
async function fetchExchangeMarkets(): Promise<any[]> {
  if (!pool) throw new Error("DATABASE_URL 환경변수 없음");
  
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT * FROM public.exchange_markets");
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * base_symbol별로 그룹핑하고 master_symbols 생성
 */
function buildMasterSymbols(markets: any[]): MasterSymbolRow[] {
  const symbolMap = new Map<string, any>();
  
  for (const market of markets) {
    const symbol = market.base_symbol;
    if (!symbolMap.has(symbol)) {
      symbolMap.set(symbol, {
        base_symbol: symbol,
        exchanges: new Set<string>(),
        names_by_exchange: {} as Record<string, { ko?: string; en?: string }>,
      });
    }
    
    const entry = symbolMap.get(symbol);
    entry.exchanges.add(market.exchange);
    
    if (!entry.names_by_exchange[market.exchange]) {
      entry.names_by_exchange[market.exchange] = {};
    }
    entry.names_by_exchange[market.exchange].ko = market.name_ko;
    entry.names_by_exchange[market.exchange].en = market.name_en;
  }
  
  // 우선순위에 따라 name_ko/name_en 선택
  const result: MasterSymbolRow[] = [];
  const entries = Array.from(symbolMap.entries());
  for (const [symbol, entry] of entries) {
    // name_ko 우선순위: UPBIT > BITHUMB > COINONE
    let nameKo: string | null = null;
    if (entry.names_by_exchange["UPBIT"]?.ko) {
      nameKo = entry.names_by_exchange["UPBIT"].ko;
    } else if (entry.names_by_exchange["BITHUMB"]?.ko) {
      nameKo = entry.names_by_exchange["BITHUMB"].ko;
    } else if (entry.names_by_exchange["COINONE"]?.ko) {
      nameKo = entry.names_by_exchange["COINONE"].ko;
    }
    
    // name_en 우선순위: UPBIT > 기타
    let nameEn: string | null = null;
    if (entry.names_by_exchange["UPBIT"]?.en) {
      nameEn = entry.names_by_exchange["UPBIT"].en;
    } else {
      // BITHUMB, COINONE에서 첫번째 영문명 찾기
      for (const exchange of ["BITHUMB", "COINONE"]) {
        if (entry.names_by_exchange[exchange]?.en) {
          nameEn = entry.names_by_exchange[exchange].en;
          break;
        }
      }
    }
    
    result.push({
      base_symbol: symbol,
      name_ko: nameKo,
      name_en: nameEn,
      exchanges: Array.from(entry.exchanges).sort().join(","),
    });
  }
  
  return result.sort((a, b) => a.base_symbol.localeCompare(b.base_symbol));
}

/**
 * master_symbols에 완전 동기화
 */
async function upsertMasterSymbols(symbols: MasterSymbolRow[]): Promise<number> {
  if (symbols.length === 0) return 0;
  
  if (!pool) throw new Error("DATABASE_URL 환경변수 없음");
  
  const client = await pool.connect();
  try {
    console.log("[Master Symbols] 기존 데이터 삭제 중...");
    await client.query("DELETE FROM public.master_symbols");
    
    console.log(`[Master Symbols] ${symbols.length}개 심볼 삽입 중...`);
    
    const query = `
      INSERT INTO public.master_symbols (base_symbol, name_ko, name_en, exchanges)
      VALUES ($1, $2, $3, $4)
    `;
    
    let inserted = 0;
    for (const symbol of symbols) {
      await client.query(query, [
        symbol.base_symbol,
        symbol.name_ko,
        symbol.name_en,
        symbol.exchanges,
      ]);
      inserted++;
    }
    
    console.log(`[Master Symbols] ✅ ${inserted}개 심볼 저장됨`);
    return inserted;
  } finally {
    client.release();
  }
}

export async function updateMasterSymbols() {
  console.log("\n========== Master Symbols 재생성 시작 ==========\n");
  
  try {
    console.log("[Exchange Markets] 데이터 로드 중...");
    const markets = await fetchExchangeMarkets();
    console.log(`[Exchange Markets] ✅ ${markets.length}개 마켓 로드됨`);
    
    console.log("[Master Symbols] 데이터 구성 중...");
    const symbols = buildMasterSymbols(markets);
    console.log(`[Master Symbols] ✅ ${symbols.length}개 심볼 준비됨`);
    
    const totalInserted = await upsertMasterSymbols(symbols);
    
    console.log(`\n========== 완료: ${totalInserted}개 심볼 저장 ==========\n`);
    return totalInserted;
  } catch (err) {
    console.error("\n❌ Master Symbols 업데이트 실패:");
    console.error("Error:", err instanceof Error ? err.message : String(err));
    throw err;
  }
}

if (process.argv[1]?.includes("updateMasterSymbols.ts")) {
  updateMasterSymbols().catch(() => process.exit(1));
}
