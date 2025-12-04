import 'dotenv/config';
import fs from 'fs';
import path from 'path';

// Supabase는 선택사항 (환경변수 있을 때만 사용)
let supabase: any = null;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  const { createClient } = require('@supabase/supabase-js');
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });
  console.log('✅ Supabase 연결됨');
} else {
  console.log('⚠️ Supabase 환경변수 없음 (JSON 처리만 진행)');
}

// 심볼 → 코인마켓캡 slug 수동 매핑 (점점 추가)
const SYMBOL_SLUG_OVERRIDES: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  SOL: 'solana',
  TRX: 'tron',
  AVAX: 'avalanche',
  LINK: 'chainlink',
  LTC: 'litecoin',
  BCH: 'bitcoin-cash',
  BNB: 'binance-coin',
};

function normalizeNameToSlug(name?: string | null): string | null {
  if (!name) return null;

  return name
    .toLowerCase()
    .replace(/\s*token$/g, '')
    .replace(/\s*coin$/g, '')
    .replace(/\s*\(.*?\)/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function testCmcSlug(slug: string): Promise<boolean> {
  const url = `https://coinmarketcap.com/ko/currencies/${slug}/`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9'
      }
    } as any);

    const status = (res as any).status;
    console.log(`[CMC TEST] slug=${slug} status=${status}`);
    return status === 200;
  } catch (err) {
    console.error('[CMC TEST ERROR]', slug, err);
    return false;
  }
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loadMasterSymbols(): Promise<any[]> {
  try {
    const file = path.join(process.cwd(), 'data', 'master_symbols.json');
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return [];
  }
}

async function saveMasterSymbols(symbols: any[]): Promise<void> {
  const file = path.join(process.cwd(), 'data', 'master_symbols.json');
  fs.writeFileSync(file, JSON.stringify(symbols, null, 2), 'utf-8');
  console.log('💾 master_symbols.json 저장 완료');
}

async function syncCmcSlugs() {
  console.log('🔄 CMC slug 자동 수집 시작');

  // 1️⃣ master_symbols.json 로드
  const masterSymbols = await loadMasterSymbols();
  if (masterSymbols.length === 0) {
    console.warn('⚠️ master_symbols.json이 비어있습니다.');
    return;
  }

  console.log(`📌 총 심볼: ${masterSymbols.length}개`);

  // 2️⃣ slug가 없는 심볼 찾기
  const needsSlug = masterSymbols.filter((s: any) => !s.cmc_slug);
  console.log(`📌 slug 미등록 코인: ${needsSlug.length}개`);

  if (needsSlug.length === 0) {
    console.log('✅ 모든 코인의 slug가 이미 등록되어 있습니다.');
    return;
  }

  // 3️⃣ 각 코인의 slug 찾기
  let successCount = 0;
  for (const row of needsSlug) {
    const { symbol, name_en } = row;
    const upper = symbol.toUpperCase();

    console.log(`\n==============================`);
    console.log(`심볼: ${symbol}, name_en: ${name_en}`);

    const overrideSlug = SYMBOL_SLUG_OVERRIDES[upper];
    const nameSlug = normalizeNameToSlug(name_en);
    const symbolSlug = symbol.toLowerCase();

    const candidates = [overrideSlug, nameSlug, symbolSlug].filter(Boolean) as string[];

    let finalSlug: string | null = null;

    for (const candidate of candidates) {
      const ok = await testCmcSlug(candidate);
      await delay(800); // CMC에 부담 덜 주기

      if (ok) {
        finalSlug = candidate;
        break;
      }
    }

    if (!finalSlug) {
      console.warn(`⚠️ ${symbol}: 유효한 slug를 찾지 못해 건너뜀`);
      continue;
    }

    console.log(`✅ 최종 slug=${finalSlug}, master_symbols.json 업데이트`);

    // 4️⃣ master_symbols.json에서 해당 심볼 업데이트
    const symbolIndex = masterSymbols.findIndex((s: any) => s.symbol === symbol);
    if (symbolIndex !== -1) {
      masterSymbols[symbolIndex].cmc_slug = finalSlug;
      successCount++;
    }

    await delay(800);
  }

  // 5️⃣ master_symbols.json 저장
  await saveMasterSymbols(masterSymbols);

  console.log(`\n📊 JSON 업데이트 결과: ${successCount}개 코인 성공`);

  // 6️⃣ (선택) Supabase에도 저장 (DB 싱크)
  if (supabase) {
    console.log('\n🔄 Supabase DB 동기화 시작...');
    for (const row of needsSlug) {
      const { symbol } = row;
      const updated = masterSymbols.find((s: any) => s.symbol === symbol);
      
      if (updated?.cmc_slug) {
        try {
          const { error } = await supabase
            .from('master_symbols')
            .update({ cmc_slug: updated.cmc_slug })
            .eq('base_symbol', symbol);

          if (error) {
            console.warn(`⚠️ Supabase 업데이트 실패 (${symbol}):`, error);
          } else {
            console.log(`💾 Supabase 저장: ${symbol} → ${updated.cmc_slug}`);
          }
        } catch (err) {
          console.warn(`⚠️ Supabase 오류 (${symbol}):`, err);
        }
      }
    }
    console.log('✅ Supabase 동기화 완료');
  }

  console.log('\n🎉 CMC 슬러그 자동 수집 완료');
}

if (require.main === module) {
  syncCmcSlugs()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
