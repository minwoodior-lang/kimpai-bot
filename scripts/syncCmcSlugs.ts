import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

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

async function syncCmcSlugs() {
  console.log('🔄 CMC slug 자동 수집 시작');

  const { data: rows, error } = await supabase
    .from('master_symbols')
    .select('id, base_symbol, name_en, cmc_slug')
    .is('cmc_slug', null) as any;

  if (error) {
    console.error('❌ master_symbols 조회 오류:', error);
    return;
  }

  if (!rows || rows.length === 0) {
    console.log('✅ 업데이트할 slug 없음');
    return;
  }

  console.log(`📌 slug 미등록 코인: ${rows.length}개`);

  for (const row of rows) {
    const { id, base_symbol, name_en } = row;
    const upper = base_symbol.toUpperCase();

    console.log(`\n==============================`);
    console.log(`심볼: ${base_symbol}, name_en: ${name_en}`);

    const overrideSlug = SYMBOL_SLUG_OVERRIDES[upper];
    const nameSlug = normalizeNameToSlug(name_en);
    const symbolSlug = base_symbol.toLowerCase();

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
      console.warn(`⚠️ ${base_symbol}: 유효한 slug를 찾지 못해 건너뜀`);
      continue;
    }

    console.log(`✅ 최종 slug=${finalSlug}, DB 업데이트 진행`);

    const { error: updateErr } = await supabase
      .from('master_symbols')
      .update({ cmc_slug: finalSlug })
      .eq('id', id);

    if (updateErr) {
      console.error(`❌ 업데이트 실패:`, updateErr);
    } else {
      console.log(`💾 저장 완료: ${base_symbol} → ${finalSlug}`);
    }

    await delay(800);
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
