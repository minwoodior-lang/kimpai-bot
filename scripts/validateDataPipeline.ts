import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    pricesCount: number;
    marketsCount: number;
    premiumRowsCount: number;
    invalidPrices: string[];
    invalidPercentages: string[];
    keyMismatches: string[];
    nullNameRatio: number;
  };
}

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
  foreignPriceKrw?: number | null;
  premiumRate?: number | null;
  changeRate?: number | null;
  fromHighRate?: number | null;
  fromLowRate?: number | null;
}

function loadJsonFile<T>(filename: string): T | null {
  try {
    const file = path.join(DATA_DIR, filename);
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return null;
  }
}

function makeMarketKey(exchange: string, base: string, quote: string): string {
  return `${exchange}:${base}:${quote}`;
}

export function validateDataPipeline(): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    stats: {
      pricesCount: 0,
      marketsCount: 0,
      premiumRowsCount: 0,
      invalidPrices: [],
      invalidPercentages: [],
      keyMismatches: [],
      nullNameRatio: 0,
    }
  };

  const prices = loadJsonFile<Record<string, PriceEntry>>('prices.json');
  const markets = loadJsonFile<MarketInfo[]>('exchange_markets.json');
  const premiumTable = loadJsonFile<PremiumRow[]>('premiumTable.json');

  if (!prices || !markets || !premiumTable) {
    result.isValid = false;
    result.errors.push('[CRITICAL] 필수 데이터 파일 로드 실패');
    return result;
  }

  result.stats.pricesCount = Object.keys(prices).length;
  result.stats.marketsCount = markets.length;
  result.stats.premiumRowsCount = premiumTable.length;

  // A. 국내 마켓 인벤트 검증
  const domesticExchanges = [
    { exchange: 'UPBIT', quotes: ['KRW', 'BTC', 'USDT'] },
    { exchange: 'BITHUMB', quotes: ['KRW', 'BTC'] },
    { exchange: 'COINONE', quotes: ['KRW'] },
  ];

  for (const { exchange, quotes } of domesticExchanges) {
    for (const quote of quotes) {
      const exchangeMarkets = markets.filter(m => m.exchange === exchange && m.quote === quote);
      
      for (const market of exchangeMarkets) {
        const key = makeMarketKey(exchange, market.base, quote);
        const priceEntry = prices[key];
        
        // 1) prices.json에 해당 마켓이 존재해야 함
        if (!priceEntry) {
          result.stats.keyMismatches.push(key);
          continue;
        }
        
        // 2) 가격이 0, null, NaN이면 오류
        if (!priceEntry.price || priceEntry.price <= 0 || isNaN(priceEntry.price)) {
          result.stats.invalidPrices.push(`${key}: ${priceEntry.price}`);
        }
      }
    }
  }

  // 키 불일치가 전체의 5% 이상이면 오류
  const totalDomesticMarkets = markets.filter(m => 
    domesticExchanges.some(d => d.exchange === m.exchange && d.quotes.includes(m.quote))
  ).length;
  
  if (result.stats.keyMismatches.length > totalDomesticMarkets * 0.05) {
    result.isValid = false;
    result.errors.push(`[ERROR] 마켓 키 불일치 ${result.stats.keyMismatches.length}개 (5% 초과)`);
  } else if (result.stats.keyMismatches.length > 0) {
    result.warnings.push(`[WARN] 마켓 키 불일치 ${result.stats.keyMismatches.length}개`);
  }

  // 가격 무효가 10개 이상이면 오류
  if (result.stats.invalidPrices.length > 10) {
    result.isValid = false;
    result.errors.push(`[ERROR] 무효 가격 ${result.stats.invalidPrices.length}개 (10개 초과)`);
  } else if (result.stats.invalidPrices.length > 0) {
    result.warnings.push(`[WARN] 무효 가격 ${result.stats.invalidPrices.length}개`);
  }

  // B. 퍼센트 이상치 자동 감지
  const MAX_PERCENT = 10000; // 10,000%
  
  for (const row of premiumTable) {
    const percentFields = [
      { name: 'premiumRate', value: row.premiumRate },
      { name: 'changeRate', value: row.changeRate },
      { name: 'fromHighRate', value: row.fromHighRate },
      { name: 'fromLowRate', value: row.fromLowRate },
    ];

    for (const { name, value } of percentFields) {
      if (value !== null && value !== undefined) {
        if (isNaN(value) || !isFinite(value) || Math.abs(value) > MAX_PERCENT) {
          result.stats.invalidPercentages.push(`${row.symbol}.${name}: ${value}`);
        }
      }
    }

    // 국내 가격이 0 또는 null인데 마켓은 존재하는 경우
    if (row.koreanPrice !== null && row.koreanPrice !== undefined && row.koreanPrice <= 0) {
      result.stats.invalidPrices.push(`premiumTable:${row.symbol}.koreanPrice: ${row.koreanPrice}`);
    }
  }

  if (result.stats.invalidPercentages.length > 0) {
    result.isValid = false;
    result.errors.push(`[ERROR] 비정상 퍼센트 ${result.stats.invalidPercentages.length}개`);
  }

  // C. 코인원 name_ko null 비율 검사
  const coinoneMarkets = markets.filter(m => m.exchange === 'COINONE');
  const coinoneNullNames = coinoneMarkets.filter(m => !m.name_ko || !m.name_en);
  result.stats.nullNameRatio = coinoneMarkets.length > 0 
    ? (coinoneNullNames.length / coinoneMarkets.length) * 100 
    : 0;

  if (result.stats.nullNameRatio > 5) {
    result.isValid = false;
    result.errors.push(`[ERROR] 코인원 name_ko null 비율 ${result.stats.nullNameRatio.toFixed(1)}% (5% 초과 - HTML 파싱 실패 의심)`);
  }

  return result;
}

export function validateAndLog(): boolean {
  const result = validateDataPipeline();
  
  console.log('\n========================================');
  console.log('[Data Pipeline Validation Report]');
  console.log('========================================');
  console.log(`Prices: ${result.stats.pricesCount} | Markets: ${result.stats.marketsCount} | Premium: ${result.stats.premiumRowsCount}`);
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.warnings.forEach(w => console.log('  ', w));
  }

  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach(e => console.log('  ', e));
    
    if (result.stats.invalidPrices.length > 0 && result.stats.invalidPrices.length <= 20) {
      console.log('\n  Invalid Prices:', result.stats.invalidPrices.slice(0, 20).join(', '));
    }
    if (result.stats.invalidPercentages.length > 0 && result.stats.invalidPercentages.length <= 20) {
      console.log('\n  Invalid Percentages:', result.stats.invalidPercentages.slice(0, 20).join(', '));
    }
    if (result.stats.keyMismatches.length > 0 && result.stats.keyMismatches.length <= 20) {
      console.log('\n  Key Mismatches:', result.stats.keyMismatches.slice(0, 20).join(', '));
    }
  }

  console.log('\n========================================');
  console.log(result.isValid ? '✅ Validation PASSED' : '❌ Validation FAILED');
  console.log('========================================\n');

  return result.isValid;
}

// CLI 실행
if (require.main === module) {
  const isValid = validateAndLog();
  process.exit(isValid ? 0 : 1);
}
