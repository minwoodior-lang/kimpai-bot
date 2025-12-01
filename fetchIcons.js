/**
 * fetchIcons.js - Upbit KRW 마켓 코인 아이콘 자동 다운로드 스크립트
 * 
 * 실행 방법: node fetchIcons.js
 * 
 * 기능:
 * - Upbit API에서 KRW 마켓 심볼 리스트 가져오기
 * - CoinGecko API에서 각 심볼의 아이콘 검색 및 다운로드
 * - /public/coins/{SYMBOL}.png에 저장
 * - /data/symbolIcons.json에 매핑 정보 추가
 */

const fs = require('fs');
const path = require('path');

// Node 18+은 글로벌 fetch 지원, 그 이하는 node-fetch 필요
// npm install node-fetch@2 (필요시)
const fetch = globalThis.fetch || require('node-fetch');

// ============================================================================
// 설정
// ============================================================================

const UPBIT_API = 'https://api.upbit.com/v1/market/all';
const COINGECKO_SEARCH_API = 'https://api.coingecko.com/api/v3/search';
const RATE_LIMIT_MS = 1200; // CoinGecko rate limit 피하기 위해 1.2초
const PUBLIC_COINS_DIR = path.join(__dirname, 'public', 'coins');
const DATA_DIR = path.join(__dirname, 'data');
const SYMBOL_ICONS_PATH = path.join(DATA_DIR, 'symbolIcons.json');

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * Rate limit 처리: 지정된 시간 동안 대기
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Upbit에서 KRW 마켓 심볼 가져오기
 */
async function getUpbitSymbols() {
  try {
    console.log('📡 Upbit API에서 마켓 정보 조회 중...');
    const response = await fetch(UPBIT_API);
    if (!response.ok) {
      throw new Error(`Upbit API 오류: ${response.status}`);
    }
    
    const markets = await response.json();
    const krwSymbols = markets
      .filter(m => m.market.startsWith('KRW-'))
      .map(m => m.market.replace('KRW-', ''))
      .sort();
    
    console.log(`✅ Upbit KRW 마켓: ${krwSymbols.length}개 심볼 조회됨`);
    return krwSymbols;
  } catch (error) {
    console.error('❌ Upbit API 호출 실패:', error.message);
    throw error;
  }
}

/**
 * CoinGecko에서 심볼 검색
 */
async function searchCoinGecko(symbol) {
  try {
    const url = `${COINGECKO_SEARCH_API}?query=${encodeURIComponent(symbol)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 429) {
        console.warn(`⏳ Rate limit 감지, ${RATE_LIMIT_MS}ms 대기...`);
        await sleep(RATE_LIMIT_MS * 2);
        return searchCoinGecko(symbol); // 재시도
      }
      throw new Error(`CoinGecko API 오류: ${response.status}`);
    }
    
    const data = await response.json();
    return data.coins || [];
  } catch (error) {
    console.error(`❌ CoinGecko 검색 실패 (${symbol}):`, error.message);
    return [];
  }
}

/**
 * 코인 후보 중 가장 일치하는 것 선택
 */
function selectBestMatch(symbol, candidates) {
  if (candidates.length === 0) return null;
  
  // 심볼이 정확히 일치하는 후보 우선
  const exactMatch = candidates.find(
    c => c.symbol?.toUpperCase() === symbol.toUpperCase()
  );
  if (exactMatch && exactMatch.large) return exactMatch;
  
  // 이름이 심볼을 포함하는 후보
  const nameMatch = candidates.find(
    c => c.name?.toUpperCase()?.includes(symbol) ||
         c.symbol?.toUpperCase()?.includes(symbol)
  );
  if (nameMatch && nameMatch.large) return nameMatch;
  
  // 이미지가 있는 첫 번째 후보
  const imageMatch = candidates.find(c => c.large);
  return imageMatch || null;
}

/**
 * 이미지 다운로드 및 파일로 저장
 */
async function downloadIcon(imageUrl, outputPath) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`이미지 다운로드 실패: ${response.status}`);
    }
    
    const buffer = await response.buffer();
    fs.writeFileSync(outputPath, buffer);
    return true;
  } catch (error) {
    console.error(`❌ 이미지 다운로드 실패: ${error.message}`);
    return false;
  }
}

/**
 * 폴더 생성 (없으면)
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 폴더 생성: ${dirPath}`);
  }
}

/**
 * symbolIcons.json 읽기
 */
function loadSymbolIcons() {
  ensureDirectoryExists(DATA_DIR);
  
  if (fs.existsSync(SYMBOL_ICONS_PATH)) {
    try {
      const content = fs.readFileSync(SYMBOL_ICONS_PATH, 'utf-8');
      console.log(`📖 기존 symbolIcons.json 로드됨`);
      return JSON.parse(content);
    } catch (error) {
      console.warn(`⚠️ symbolIcons.json 파싱 실패, 새로 생성합니다`);
      return {};
    }
  }
  
  console.log(`📝 새로운 symbolIcons.json 생성`);
  return {};
}

/**
 * symbolIcons.json 저장
 */
function saveSymbolIcons(icons) {
  ensureDirectoryExists(DATA_DIR);
  
  // 키 정렬
  const sortedIcons = {};
  Object.keys(icons)
    .sort()
    .forEach(key => {
      sortedIcons[key] = icons[key];
    });
  
  fs.writeFileSync(
    SYMBOL_ICONS_PATH,
    JSON.stringify(sortedIcons, null, 2),
    'utf-8'
  );
  
  console.log(`💾 symbolIcons.json 저장됨 (${Object.keys(sortedIcons).length}개 심볼)`);
}

// ============================================================================
// 메인 실행
// ============================================================================

async function main() {
  console.log('\n🚀 Upbit 코인 아이콘 자동 다운로드 시작\n');
  
  try {
    // 1. Upbit에서 심볼 가져오기
    const symbols = await getUpbitSymbols();
    
    // 2. 필요한 디렉토리 생성
    ensureDirectoryExists(PUBLIC_COINS_DIR);
    
    // 3. 기존 매핑 로드
    let symbolIcons = loadSymbolIcons();
    
    // 4. 심볼별 아이콘 다운로드
    let successCount = 0;
    let skipCount = 0;
    let failedSymbols = [];
    
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      const iconPath = path.join(PUBLIC_COINS_DIR, `${symbol}.png`);
      const iconUrl = `/coins/${symbol}.png`;
      
      process.stdout.write(`\r⏳ 처리 중... [${i + 1}/${symbols.length}] ${symbol.padEnd(10)}`);
      
      // 파일이 이미 존재하는지 확인
      if (fs.existsSync(iconPath)) {
        if (!symbolIcons[symbol]) {
          symbolIcons[symbol] = iconUrl;
          successCount++;
        } else {
          skipCount++;
        }
        await sleep(RATE_LIMIT_MS / 2);
        continue;
      }
      
      try {
        // CoinGecko에서 검색
        const candidates = await searchCoinGecko(symbol);
        const bestMatch = selectBestMatch(symbol, candidates);
        
        if (!bestMatch || !bestMatch.large) {
          failedSymbols.push({ symbol, reason: 'CoinGecko에서 아이콘 URL 없음' });
          continue;
        }
        
        // 이미지 다운로드
        const downloaded = await downloadIcon(bestMatch.large, iconPath);
        
        if (downloaded) {
          symbolIcons[symbol] = iconUrl;
          successCount++;
        } else {
          failedSymbols.push({ symbol, reason: '이미지 다운로드 실패' });
        }
      } catch (error) {
        failedSymbols.push({ symbol, reason: error.message });
      }
      
      // Rate limit 처리
      await sleep(RATE_LIMIT_MS);
    }
    
    // 5. symbolIcons.json 저장
    console.log('\n');
    saveSymbolIcons(symbolIcons);
    
    // 6. 최종 요약
    console.log('\n' + '='.repeat(60));
    console.log('📊 작업 완료 요약');
    console.log('='.repeat(60));
    console.log(`✅ 총 심볼: ${symbols.length}개`);
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`⏭️  스킵: ${skipCount}개`);
    console.log(`❌ 실패: ${failedSymbols.length}개`);
    
    if (failedSymbols.length > 0) {
      console.log('\n🔴 실패한 심볼:');
      failedSymbols.forEach(({ symbol, reason }) => {
        console.log(`  - ${symbol}: ${reason}`);
      });
    }
    
    console.log('='.repeat(60));
    console.log(`\n✨ 모든 아이콘이 /public/coins 에 저장되었습니다!\n`);
    
  } catch (error) {
    console.error('\n❌ 스크립트 실행 중 오류 발생:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
