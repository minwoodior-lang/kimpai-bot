/**
 * fetchIcons.js - 국내 거래소 코인 아이콘 자동 다운로드 스크립트
 *
 * 실행 방법: node fetchIcons.js  또는  npm run update:icons
 *
 * 대상 거래소:
 * - Upbit: KRW / BTC / USDT 마켓
 * - Bithumb: KRW / BTC / USDT 마켓
 * - Coinone: KRW (전체)
 *
 * 기능:
 * - 각 거래소에서 심볼 리스트 가져오기
 * - CoinGecko에서 심볼 검색 후 아이콘 다운로드
 * - /public/coins/{SYMBOL}.png 저장
 * - /data/symbolIcons.json 에 매핑 정보 저장
 */

const fs = require('fs');
const path = require('path');

// Node 18+은 글로벌 fetch 내장, 그 이하는 node-fetch 사용
const fetch = globalThis.fetch || require('node-fetch');

// ============================================================================
// 설정
// ============================================================================

// 거래소 API
const UPBIT_API = 'https://api.upbit.com/v1/market/all';
const BITHUMB_API_BASE = 'https://api.bithumb.com/public/ticker';
const COINONE_API = 'https://api.coinone.co.kr/ticker?currency=all';

// CoinGecko
const COINGECKO_SEARCH_API = 'https://api.coingecko.com/api/v3/search';

// Rate limit 관련
const RATE_LIMIT_MS = 5000;  // 심볼 간 기본 대기 5초
const MAX_RETRY = 3;         // CoinGecko 429 재시도 횟수

// 경로
const PUBLIC_COINS_DIR = path.join(__dirname, 'public', 'coins');
const DATA_DIR = path.join(__dirname, 'data');
const SYMBOL_ICONS_PATH = path.join(DATA_DIR, 'symbolIcons.json');

// ============================================================================
// 유틸 함수
// ============================================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 폴더 생성: ${dirPath}`);
  }
}

function loadSymbolIcons() {
  ensureDirectoryExists(DATA_DIR);

  if (fs.existsSync(SYMBOL_ICONS_PATH)) {
    try {
      const content = fs.readFileSync(SYMBOL_ICONS_PATH, 'utf-8');
      console.log('📖 기존 symbolIcons.json 로드됨');
      return JSON.parse(content);
    } catch (err) {
      console.warn('⚠️ symbolIcons.json 파싱 실패, 새로 생성합니다');
      return {};
    }
  }

  console.log('📝 새로운 symbolIcons.json 생성');
  return {};
}

function saveSymbolIcons(icons) {
  ensureDirectoryExists(DATA_DIR);

  const sorted = {};
  Object.keys(icons).sort().forEach(key => {
    sorted[key] = icons[key];
  });

  fs.writeFileSync(
    SYMBOL_ICONS_PATH,
    JSON.stringify(sorted, null, 2),
    'utf-8'
  );

  console.log(`💾 symbolIcons.json 저장됨 (${Object.keys(sorted).length}개 심볼)`);
}

// ============================================================================
// 거래소별 심볼 수집
// ============================================================================

/**
 * Upbit: KRW / BTC / USDT 전체 마켓에서 base 심볼 추출
 */
async function getUpbitSymbols() {
  try {
    console.log('📡 Upbit 심볼 수집 중...');
    const res = await fetch(UPBIT_API);
    if (!res.ok) throw new Error(`Upbit API 오류: ${res.status}`);

    const markets = await res.json();

    const symbols = markets
      .filter(m =>
        m.market.startsWith('KRW-') ||
        m.market.startsWith('BTC-') ||
        m.market.startsWith('USDT-')
      )
      .map(m => m.market.split('-')[1])
      .filter(Boolean)
      .map(s => s.toUpperCase());

    console.log(`✅ Upbit 심볼 ${symbols.length}개`);
    return symbols;
  } catch (err) {
    console.error('❌ Upbit 심볼 수집 실패:', err.message);
    return [];
  }
}

/**
 * Bithumb: ALL_{KRW|BTC|USDT}
 */
async function getBithumbSymbols(paymentCurrency) {
  try {
    console.log(`📡 Bithumb ${paymentCurrency} 마켓 심볼 수집 중...`);
    const url = `${BITHUMB_API_BASE}/ALL_${paymentCurrency}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Bithumb API 오류(${paymentCurrency}): ${res.status}`);

    const json = await res.json();
    const data = json.data || {};

    const symbols = Object.keys(data)
      .filter(k => k !== 'date')
      .map(k => k.toUpperCase());

    console.log(`✅ Bithumb ${paymentCurrency} 심볼 ${symbols.length}개`);
    return symbols;
  } catch (err) {
    console.error(`❌ Bithumb 심볼 수집 실패(${paymentCurrency}):`, err.message);
    return [];
  }
}

/**
 * Coinone: KRW 전체 (기존 ticker?currency=all 사용)
 */
async function getCoinoneSymbolsKRW() {
  try {
    console.log('📡 Coinone KRW 심볼 수집 중...');
    const res = await fetch(COINONE_API);
    if (!res.ok) throw new Error(`Coinone API 오류: ${res.status}`);

    const data = await res.json();

    const symbols = Object.keys(data || {})
      .filter(k => !['result', 'errorCode', 'timestamp'].includes(k))
      .map(k => k.toUpperCase());

    console.log(`✅ Coinone KRW 심볼 ${symbols.length}개`);
    return symbols;
  } catch (err) {
    console.error('❌ Coinone 심볼 수집 실패:', err.message);
    return [];
  }
}

/**
 * 국내 3거래소 전체 심볼 합치기 + 중복 제거
 */
async function getAllSymbols() {
  const [
    upbit,
    bithumbKrw,
    bithumbBtc,
    bithumbUsdt,
    coinoneKrw,
  ] = await Promise.all([
    getUpbitSymbols(),
    getBithumbSymbols('KRW'),
    getBithumbSymbols('BTC'),
    getBithumbSymbols('USDT'),
    getCoinoneSymbolsKRW(),
  ]);

  const set = new Set();

  [...upbit, ...bithumbKrw, ...bithumbBtc, ...bithumbUsdt, ...coinoneKrw]
    .forEach(s => {
      if (!s) return;
      set.add(s.toUpperCase());
    });

  const all = Array.from(set).sort();
  console.log(`\n🎯 통합 심볼 수: ${all.length}개\n`);
  return all;
}

// ============================================================================
// CoinGecko 검색 + 아이콘 다운로드
// ============================================================================

async function searchCoinGecko(symbol, attempt = 1) {
  try {
    const url = `${COINGECKO_SEARCH_API}?query=${encodeURIComponent(symbol)}`;
    const res = await fetch(url);

    if (!res.ok) {
      if (res.status === 429) {
        if (attempt > MAX_RETRY) {
          console.warn(`⛔ (${symbol}) Rate limit로 ${MAX_RETRY}회 시도 후 포기`);
          return [];
        }
        const wait = RATE_LIMIT_MS * attempt;
        console.warn(
          `⏳ (${symbol}) Rate limit 감지, ${wait}ms 대기 후 재시도 (${attempt}/${MAX_RETRY})`
        );
        await sleep(wait);
        return searchCoinGecko(symbol, attempt + 1);
      }
      throw new Error(`CoinGecko API 오류: ${res.status}`);
    }

    const data = await res.json();
    return data.coins || [];
  } catch (err) {
    console.error(`❌ CoinGecko 검색 실패 (${symbol}):`, err.message);
    return [];
  }
}

function selectBestMatch(symbol, candidates) {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;

  const upper = symbol.toUpperCase();

  const exact = candidates.find(
    c => c.symbol && c.symbol.toUpperCase() === upper && c.large
  );
  if (exact) return exact;

  const nameMatch = candidates.find(
    c =>
      ((c.name && c.name.toUpperCase().includes(upper)) ||
        (c.symbol && c.symbol.toUpperCase().includes(upper))) &&
      c.large
  );
  if (nameMatch) return nameMatch;

  const withImage = candidates.find(c => c.large);
  return withImage || null;
}

async function downloadIcon(imageUrl, outputPath) {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) {
      throw new Error(`이미지 다운로드 실패: ${res.status}`);
    }

    let buffer;
    if (typeof res.buffer === 'function') {
      buffer = await res.buffer();            // node-fetch
    } else {
      const arr = await res.arrayBuffer();    // Node 18 내장 fetch
      buffer = Buffer.from(arr);
    }

    fs.writeFileSync(outputPath, buffer);
    return true;
  } catch (err) {
    console.error(`❌ 이미지 다운로드 실패: ${err.message}`);
    return false;
  }
}

// ============================================================================
// 메인 실행
// ============================================================================

async function main() {
  console.log('\n🚀 국내 거래소 코인 아이콘 자동 다운로드 시작\n');

  try {
    ensureDirectoryExists(PUBLIC_COINS_DIR);
    let symbolIcons = loadSymbolIcons();

    const symbols = await getAllSymbols();

    let successCount = 0;
    let skipCount = 0;
    const failedSymbols = [];

    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      const iconPath = path.join(PUBLIC_COINS_DIR, `${symbol}.png`);
      const iconUrl = `/coins/${symbol}.png`;

      process.stdout.write(
        `\r⏳ 처리 중... [${i + 1}/${symbols.length}] ${symbol.padEnd(10)}`
      );

      // 이미 파일 있으면 스킵 + 매핑만 보정
      if (fs.existsSync(iconPath)) {
        if (!symbolIcons[symbol]) {
          symbolIcons[symbol] = iconUrl;
        }
        skipCount++;
        continue;
      }

      try {
        const candidates = await searchCoinGecko(symbol);
        const best = selectBestMatch(symbol, candidates);

        if (!best || !best.large) {
          failedSymbols.push({ symbol, reason: 'CoinGecko에서 아이콘 URL 없음' });
          continue;
        }

        const downloaded = await downloadIcon(best.large, iconPath);
        if (downloaded) {
          symbolIcons[symbol] = iconUrl;
          successCount++;
        } else {
          failedSymbols.push({ symbol, reason: '이미지 다운로드 실패' });
        }
      } catch (err) {
        failedSymbols.push({ symbol, reason: err.message });
      }

      await sleep(RATE_LIMIT_MS);
    }

    console.log('\n');
    saveSymbolIcons(symbolIcons);

    console.log('\n' + '='.repeat(60));
    console.log('📊 작업 완료 요약');
    console.log('='.repeat(60));
    console.log(`✅ 총 심볼: ${symbols.length}개`);
    console.log(`✅ 신규 다운로드: ${successCount}개`);
    console.log(`⏭️  기존 파일 스킵: ${skipCount}개`);
    console.log(`❌ 실패: ${failedSymbols.length}개`);

    if (failedSymbols.length > 0) {
      console.log('\n🔴 실패한 심볼 (나중에 수동 보정 후보):');
      failedSymbols.forEach(({ symbol, reason }) => {
        console.log(`  - ${symbol}: ${reason}`);
      });
    }

    console.log('='.repeat(60));
    console.log('\n✨ 모든 아이콘이 /public/coins 에 정리되었습니다!\n');
  } catch (err) {
    console.error('\n❌ 스크립트 실행 중 오류 발생:', err.message);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
