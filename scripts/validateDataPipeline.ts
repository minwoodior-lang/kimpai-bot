import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const LOGS_DIR = path.join(process.cwd(), 'logs', 'validation');

// ========================================
// CONFIG - 조정 가능한 상수들
// ========================================
const CONFIG = {
  MAX_PERCENT_THRESHOLD: 10000,
  MARKET_DROP_THRESHOLD: 0.20,
  KEY_MISMATCH_THRESHOLD: 0.05,
  NAME_KO_NULL_THRESHOLD: 0.05,
  MAX_INVALID_PRICES: 10,
  KRW_CONVERSION_DIFF_THRESHOLD: 0.50,
};

const CORE_MARKETS = [
  'UPBIT:BTC:KRW',
  'UPBIT:BTC:USDT',
  'UPBIT:ETH:KRW',
  'UPBIT:ETH:USDT',
  'BITHUMB:BTC:KRW',
  'BITHUMB:ETH:KRW',
  'COINONE:BTC:KRW',
  'COINONE:ETH:KRW',
];

interface PriceEntry {
  price: number;
  ts: number;
}

interface MarketInfo {
  id: string;
  exchange: string;
  market: string;
  base: string;
  quote: string;
  name_ko?: string;
  name_en?: string;
  isDomestic?: boolean;
}

interface PremiumRow {
  symbol: string;
  koreanPrice?: number | null;
  globalPrice?: number | null;
  premium?: number | null;
  usdKrw?: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  logs: {
    invalidPrices: { key: string; value: any; reason: string }[];
    invalidPercent: { symbol: string; premium: any; change24h: any }[];
    marketKeyMismatch: { onlyIn: string; marketKey: string }[];
    coinoneNameNull: { symbol: string; name_ko: string | null; name_en: string | null }[];
    coreMarketMissing: { exchange: string; market: string }[];
    invalidKrwConversion: { symbol: string; detail: string }[];
  };
  stats: {
    pricesCount: number;
    marketsCount: number;
    premiumRowsCount: number;
    previousPricesCount: number;
    dropRatio: number;
    coinoneNullNameRatio: number;
  };
}

function ensureLogsDir(): void {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
}

function loadJsonFile<T>(filename: string): T | null {
  try {
    const file = path.join(DATA_DIR, filename);
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return null;
  }
}

function loadHealthCheck(): { pricesCount: number; marketsCount: number; timestamp: number } | null {
  try {
    const file = path.join(DATA_DIR, 'healthCheck.json');
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return null;
  }
}

function saveLogFile(filename: string, data: any): void {
  ensureLogsDir();
  const file = path.join(LOGS_DIR, filename);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function isValidNumber(value: any): boolean {
  return typeof value === 'number' && !isNaN(value) && isFinite(value) && value > 0;
}

export function validateDataPipeline(): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    logs: {
      invalidPrices: [],
      invalidPercent: [],
      marketKeyMismatch: [],
      coinoneNameNull: [],
      coreMarketMissing: [],
      invalidKrwConversion: [],
    },
    stats: {
      pricesCount: 0,
      marketsCount: 0,
      premiumRowsCount: 0,
      previousPricesCount: 0,
      dropRatio: 0,
      coinoneNullNameRatio: 0,
    }
  };

  const prices = loadJsonFile<Record<string, PriceEntry>>('prices.json');
  const markets = loadJsonFile<MarketInfo[]>('exchange_markets.json');
  const premiumTable = loadJsonFile<PremiumRow[]>('premiumTable.json');
  const healthCheck = loadHealthCheck();

  if (!prices || !markets || !premiumTable) {
    result.isValid = false;
    result.errors.push('[CRITICAL] 필수 데이터 파일 로드 실패');
    return result;
  }

  result.stats.pricesCount = Object.keys(prices).length;
  result.stats.marketsCount = markets.length;
  result.stats.premiumRowsCount = premiumTable.length;
  result.stats.previousPricesCount = healthCheck?.pricesCount || result.stats.pricesCount;

  // ========================================
  // 1. 핵심 마켓 필수 수집 검증
  // ========================================
  for (const coreMarket of CORE_MARKETS) {
    if (!prices[coreMarket] || !isValidNumber(prices[coreMarket].price)) {
      const [exchange, base, quote] = coreMarket.split(':');
      result.logs.coreMarketMissing.push({ exchange, market: `${base}:${quote}` });
      console.error(`[CORE_MARKET_MISSING] exchange=${exchange}, market=${base}:${quote}`);
    }
  }

  if (result.logs.coreMarketMissing.length > 0) {
    result.isValid = false;
    result.errors.push(`[ERROR] 핵심 마켓 누락 ${result.logs.coreMarketMissing.length}개`);
  }

  // ========================================
  // 2. 국내 마켓 가격 검증 (0/null/NaN/Infinity)
  // ========================================
  const domesticExchanges = [
    { exchange: 'UPBIT', quotes: ['KRW', 'BTC', 'USDT'] },
    { exchange: 'BITHUMB', quotes: ['KRW', 'BTC'] },
    { exchange: 'COINONE', quotes: ['KRW'] },
  ];

  for (const { exchange, quotes } of domesticExchanges) {
    for (const quote of quotes) {
      const exchangeMarkets = markets.filter(m => m.exchange === exchange && m.quote === quote);
      
      for (const market of exchangeMarkets) {
        const key = `${exchange}:${market.base}:${quote}`;
        const priceEntry = prices[key];
        
        if (!priceEntry) {
          result.logs.marketKeyMismatch.push({ onlyIn: 'exchange_markets', marketKey: key });
          continue;
        }
        
        if (!isValidNumber(priceEntry.price)) {
          result.logs.invalidPrices.push({
            key,
            value: priceEntry.price,
            reason: priceEntry.price === 0 ? 'price_is_zero' : 'price_is_null_or_nan'
          });
          console.warn(`[INVALID_PRICE_ROW] symbol=${market.base}, reason=${priceEntry.price === 0 ? 'price_is_zero' : 'price_is_null_or_nan'}`);
        }
      }
    }
  }

  // prices에만 있고 exchange_markets에 없는 것 검사
  const marketKeys = new Set(markets.map(m => `${m.exchange}:${m.base}:${m.quote}`));
  for (const priceKey of Object.keys(prices)) {
    const [exchange] = priceKey.split(':');
    if (['UPBIT', 'BITHUMB', 'COINONE'].includes(exchange) && !marketKeys.has(priceKey)) {
      result.logs.marketKeyMismatch.push({ onlyIn: 'prices', marketKey: priceKey });
    }
  }

  if (result.logs.invalidPrices.length > CONFIG.MAX_INVALID_PRICES) {
    result.isValid = false;
    result.errors.push(`[ERROR] 무효 가격 ${result.logs.invalidPrices.length}개 (${CONFIG.MAX_INVALID_PRICES}개 초과)`);
  } else if (result.logs.invalidPrices.length > 0) {
    result.warnings.push(`[WARN] 무효 가격 ${result.logs.invalidPrices.length}개`);
  }

  // ========================================
  // 3. 마켓 키 불일치 검사
  // ========================================
  const totalDomesticMarkets = markets.filter(m => 
    domesticExchanges.some(d => d.exchange === m.exchange && d.quotes.includes(m.quote))
  ).length;

  if (result.logs.marketKeyMismatch.length > 0) {
    result.logs.marketKeyMismatch.forEach(m => {
      console.warn(`[MARKET_KEY_MISMATCH] onlyIn="${m.onlyIn}", marketKey="${m.marketKey}"`);
    });
  }

  if (result.logs.marketKeyMismatch.length > totalDomesticMarkets * CONFIG.KEY_MISMATCH_THRESHOLD) {
    result.isValid = false;
    result.errors.push(`[ERROR] 마켓 키 불일치 ${result.logs.marketKeyMismatch.length}개 (${CONFIG.KEY_MISMATCH_THRESHOLD * 100}% 초과)`);
  } else if (result.logs.marketKeyMismatch.length > 0) {
    result.warnings.push(`[WARN] 마켓 키 불일치 ${result.logs.marketKeyMismatch.length}개`);
  }

  // ========================================
  // 4. 비정상 퍼센트/프리미엄 감지
  // ========================================
  const fxRate = premiumTable[0]?.usdKrw || 1380;

  for (const row of premiumTable) {
    const premium = row.premium;
    
    if (premium !== null && premium !== undefined) {
      if (!isFinite(premium) || isNaN(premium) || Math.abs(premium) > CONFIG.MAX_PERCENT_THRESHOLD) {
        result.logs.invalidPercent.push({
          symbol: row.symbol,
          premium,
          change24h: null
        });
        console.warn(`[INVALID_PERCENT] symbol=${row.symbol}, premium=${premium}`);
      }
    }

    // KRW 변환 검증
    if (row.koreanPrice && row.globalPrice) {
      const globalKrw = row.globalPrice * fxRate;
      const diff = Math.abs(row.koreanPrice - globalKrw) / globalKrw;
      
      if (diff > CONFIG.KRW_CONVERSION_DIFF_THRESHOLD && Math.abs(row.premium || 0) < 10) {
        result.logs.invalidKrwConversion.push({
          symbol: row.symbol,
          detail: `koreanPrice=${row.koreanPrice}, globalKrw=${globalKrw}, diff=${(diff * 100).toFixed(1)}%`
        });
        console.warn(`[INVALID_KRW_CONVERSION] symbol=${row.symbol}, diff=${(diff * 100).toFixed(1)}%`);
      }
    }
  }

  if (result.logs.invalidPercent.length > 0) {
    result.warnings.push(`[WARN] 비정상 퍼센트 ${result.logs.invalidPercent.length}개`);
  }

  // ========================================
  // 5. 코인원 name_ko 파싱 실패 감지
  // ========================================
  const coinoneMarkets = markets.filter(m => m.exchange === 'COINONE');
  const coinoneNullNames = coinoneMarkets.filter(m => !m.name_ko || m.name_ko.trim() === '');
  
  result.stats.coinoneNullNameRatio = coinoneMarkets.length > 0 
    ? coinoneNullNames.length / coinoneMarkets.length 
    : 0;

  for (const m of coinoneNullNames) {
    result.logs.coinoneNameNull.push({
      symbol: m.base,
      name_ko: m.name_ko || null,
      name_en: m.name_en || null
    });
  }

  if (result.stats.coinoneNullNameRatio > CONFIG.NAME_KO_NULL_THRESHOLD) {
    result.isValid = false;
    result.errors.push(`[ERROR] 코인원 name_ko null 비율 ${(result.stats.coinoneNullNameRatio * 100).toFixed(1)}% (${CONFIG.NAME_KO_NULL_THRESHOLD * 100}% 초과)`);
    console.error(`[COINONE_NAME_KO_HIGH_NULL_RATE] total=${coinoneMarkets.length}, nullCount=${coinoneNullNames.length}, ratio=${(result.stats.coinoneNullNameRatio * 100).toFixed(1)}%`);
  } else if (coinoneNullNames.length > 0) {
    result.warnings.push(`[WARN] 코인원 name_ko null ${coinoneNullNames.length}개`);
  }

  // ========================================
  // 6. 크론 실행 후 마켓 수 급감 감지
  // ========================================
  if (result.stats.previousPricesCount > 0) {
    result.stats.dropRatio = (result.stats.previousPricesCount - result.stats.pricesCount) / result.stats.previousPricesCount;
    
    if (result.stats.dropRatio > CONFIG.MARKET_DROP_THRESHOLD) {
      result.isValid = false;
      result.errors.push(`[ERROR] 마켓 수 급감 ${(result.stats.dropRatio * 100).toFixed(1)}% (${CONFIG.MARKET_DROP_THRESHOLD * 100}% 초과)`);
      console.error(`[MARKET_COUNT_DROP] previous=${result.stats.previousPricesCount}, current=${result.stats.pricesCount}, dropRatio=${(result.stats.dropRatio * 100).toFixed(1)}%`);
    }
  }

  // ========================================
  // 7. 로그 파일 저장
  // ========================================
  if (result.logs.invalidPrices.length > 0) {
    saveLogFile('invalidPrices.json', result.logs.invalidPrices);
  }
  if (result.logs.invalidPercent.length > 0) {
    saveLogFile('invalidPercent.json', result.logs.invalidPercent);
  }
  if (result.logs.marketKeyMismatch.length > 0) {
    saveLogFile('marketKeyMismatch.json', result.logs.marketKeyMismatch);
  }
  if (result.logs.coinoneNameNull.length > 0) {
    saveLogFile('coinoneNameNull.json', result.logs.coinoneNameNull);
  }
  if (result.logs.coreMarketMissing.length > 0) {
    saveLogFile('coreMarketMissing.json', result.logs.coreMarketMissing);
  }
  if (result.logs.invalidKrwConversion.length > 0) {
    saveLogFile('invalidKrwConversion.json', result.logs.invalidKrwConversion);
  }

  // 전체 결과 저장
  saveLogFile('lastValidation.json', {
    timestamp: new Date().toISOString(),
    isValid: result.isValid,
    stats: result.stats,
    errorCount: result.errors.length,
    warningCount: result.warnings.length,
  });

  return result;
}

export function validateAndLog(): boolean {
  const result = validateDataPipeline();
  
  console.log('\n========================================');
  console.log('[Data Pipeline Validation Report]');
  console.log('========================================');
  console.log(`Prices: ${result.stats.pricesCount} | Markets: ${result.stats.marketsCount} | Premium: ${result.stats.premiumRowsCount}`);
  
  if (result.stats.previousPricesCount > 0 && result.stats.previousPricesCount !== result.stats.pricesCount) {
    const change = result.stats.pricesCount - result.stats.previousPricesCount;
    console.log(`Price Count Change: ${change > 0 ? '+' : ''}${change} (${(result.stats.dropRatio * -100).toFixed(1)}%)`);
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.warnings.forEach(w => console.log('  ', w));
  }

  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach(e => console.log('  ', e));
    
    if (result.logs.coreMarketMissing.length > 0) {
      console.log('\n  Core Markets Missing:', result.logs.coreMarketMissing.map(m => `${m.exchange}:${m.market}`).join(', '));
    }
    if (result.logs.invalidPrices.length > 0 && result.logs.invalidPrices.length <= 10) {
      console.log('\n  Invalid Prices:', result.logs.invalidPrices.map(p => p.key).join(', '));
    }
    if (result.logs.marketKeyMismatch.length > 0 && result.logs.marketKeyMismatch.length <= 10) {
      console.log('\n  Key Mismatches:', result.logs.marketKeyMismatch.slice(0, 10).map(m => m.marketKey).join(', '));
    }
  }

  console.log('\n========================================');
  console.log(result.isValid ? '✅ Validation PASSED' : '❌ Validation FAILED');
  console.log('========================================\n');

  console.log('Log files saved to: logs/validation/');

  return result.isValid;
}

// CLI 실행
if (require.main === module) {
  const isValid = validateAndLog();
  process.exit(isValid ? 0 : 1);
}
