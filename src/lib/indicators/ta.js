function calcEMA(candles, period) {
  if (!candles || candles.length < period) return null;
  
  const closes = candles.map(c => parseFloat(c.close || c.c || 0));
  const multiplier = 2 / (period + 1);
  
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += closes[i];
  }
  let ema = sum / period;
  
  for (let i = period; i < closes.length; i++) {
    ema = (closes[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

function buildEmaSeries(candles, period) {
  if (!candles || candles.length < period) return [];
  
  const closes = candles.map(c => parseFloat(c.close || c.c || 0));
  const multiplier = 2 / (period + 1);
  const result = new Array(period - 1).fill(null);
  
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += closes[i];
  }
  let ema = sum / period;
  result.push(ema);
  
  for (let i = period; i < closes.length; i++) {
    ema = (closes[i] - ema) * multiplier + ema;
    result.push(ema);
  }
  
  return result;
}

function calcRSI(candles, period = 14) {
  if (!candles || candles.length < period + 1) return null;
  
  const closes = candles.map(c => parseFloat(c.close || c.c || 0));
  const changes = [];
  
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }
  
  let avgGain = 0;
  let avgLoss = 0;
  
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }
  
  avgGain /= period;
  avgLoss /= period;
  
  for (let i = period; i < changes.length; i++) {
    const gain = changes[i] > 0 ? changes[i] : 0;
    const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calcMACD(candles, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  if (!candles || candles.length < slowPeriod + signalPeriod) {
    return { macd: 0, signal: 0, histogram: 0 };
  }
  
  const closes = candles.map(c => parseFloat(c.close || c.c || 0));
  
  function emaCalc(data, period) {
    const multiplier = 2 / (period + 1);
    let sum = 0;
    for (let i = 0; i < period; i++) sum += data[i];
    let ema = sum / period;
    const result = [ema];
    for (let i = period; i < data.length; i++) {
      ema = (data[i] - ema) * multiplier + ema;
      result.push(ema);
    }
    return result;
  }
  
  const fastEma = emaCalc(closes, fastPeriod);
  const slowEma = emaCalc(closes, slowPeriod);
  
  const offset = slowPeriod - fastPeriod;
  const macdLine = [];
  for (let i = 0; i < slowEma.length; i++) {
    macdLine.push(fastEma[i + offset] - slowEma[i]);
  }
  
  const signalLine = emaCalc(macdLine, signalPeriod);
  
  const macd = macdLine[macdLine.length - 1];
  const signal = signalLine[signalLine.length - 1];
  const histogram = macd - signal;
  
  return { macd, signal, histogram };
}

function getHeikinAshiCandle(candle) {
  const o = parseFloat(candle.open || candle.o || 0);
  const h = parseFloat(candle.high || candle.h || 0);
  const l = parseFloat(candle.low || candle.l || 0);
  const c = parseFloat(candle.close || candle.c || 0);
  
  const haClose = (o + h + l + c) / 4;
  const haOpen = (o + c) / 2;
  
  return haClose >= haOpen ? "양봉🟢" : "음봉🔴";
}

// v2.5: EMA200 기반 추세 판단 + slope 계산 (극강화된 SIDEWAYS 필터 v3)
function getEMA200TrendV2(candles) {
  if (!candles || candles.length < 200) return { trend: "SIDEWAYS", slope: 0 };
  
  const ema200Series = buildEmaSeries(candles, 200);
  if (ema200Series.length < 20) return { trend: "SIDEWAYS", slope: 0 };
  
  const currentPrice = parseFloat(candles[candles.length - 1].close || candles[candles.length - 1].c || 0);
  const currentEMA = ema200Series[ema200Series.length - 1];
  
  // 최근 20개 EMA 기울기 계산
  const recentCount = 20;
  if (ema200Series.length < recentCount) return { trend: "SIDEWAYS", slope: 0 };
  
  const emaRecent = ema200Series.slice(-recentCount);
  
  let sumDiff = 0;
  for (let i = 1; i < emaRecent.length; i++) {
    sumDiff += (emaRecent[i] - emaRecent[i - 1]);
  }
  const slope = sumDiff / (recentCount - 1);
  
  // 극강화: 2개 조건 모두 만족해야만 추세 인정
  const priceDeviation = Math.abs((currentPrice - currentEMA) / currentEMA);
  const slopeThreshold = Math.abs(currentEMA) * 0.0002; // 더 큰 threshold (0.02%)
  const slopeMultiplier = slope / (currentEMA * 0.0001); // 기울기 강도 지수
  
  let trend = "SIDEWAYS";
  
  // UP: 가격 > EMA 1.5% 이상 AND 기울기 > 0.02% AND 20개 구간에서 대부분 상향
  if (currentPrice > currentEMA * 1.015 && slope > slopeThreshold) {
    // 추가 확인: 최근 10개가 대부분 상향?
    let upCount = 0;
    for (let i = 10; i < emaRecent.length; i++) {
      if (emaRecent[i] > emaRecent[i - 1]) upCount++;
    }
    if (upCount >= 8) trend = "UP"; // 10개 중 8개 이상 상향
  }
  // DOWN: 가격 < EMA 1.5% 이하 AND 기울기 < -0.02% AND 20개 구간에서 대부분 하향
  else if (currentPrice < currentEMA * 0.985 && slope < -slopeThreshold) {
    // 추가 확인: 최근 10개가 대부분 하향?
    let downCount = 0;
    for (let i = 10; i < emaRecent.length; i++) {
      if (emaRecent[i] < emaRecent[i - 1]) downCount++;
    }
    if (downCount >= 8) trend = "DOWN"; // 10개 중 8개 이상 하향
  }
  
  return { trend, slope };
}

// v2.5: MACD 크로스오버 상세 감지
function detectMACDCrossover(candles) {
  if (!candles || candles.length < 30) return { hasGolden: false, hasDead: false };
  
  // 최근 5개 캔들의 MACD 히스토그램 추이
  const lastCandles = candles.slice(-5);
  const histograms = [];
  
  for (const candle of lastCandles) {
    const { histogram } = calcMACD([...candles.slice(0, -5 + lastCandles.indexOf(candle)), candle]);
    histograms.push(histogram);
  }
  
  let hasGolden = false;
  let hasDead = false;
  
  for (let i = 1; i < histograms.length; i++) {
    // 음수 → 양수 = 골든크로스
    if (histograms[i - 1] < 0 && histograms[i] > 0) hasGolden = true;
    // 양수 → 음수 = 데드크로스
    if (histograms[i - 1] > 0 && histograms[i] < 0) hasDead = true;
  }
  
  const currentHistogram = calcMACD(candles).histogram;
  if (currentHistogram > 0) hasGolden = true;
  if (currentHistogram < 0) hasDead = true;
  
  return { hasGolden, hasDead };
}

// v2.5: HA 캔들이 양봉인지 음봉인지만 판단
function isHeikinAshiBull(candle) {
  const o = parseFloat(candle.open || candle.o || 0);
  const h = parseFloat(candle.high || candle.h || 0);
  const l = parseFloat(candle.low || candle.l || 0);
  const c = parseFloat(candle.close || candle.c || 0);
  
  const haClose = (o + h + l + c) / 4;
  const haOpen = (o + c) / 2;
  
  return haClose >= haOpen;
}

function getEMA200Trend(candles) {
  const ema = calcEMA(candles, 200);
  if (ema === null) return "데이터 부족⚪";
  
  const currentPrice = parseFloat(candles[candles.length - 1].close || candles[candles.length - 1].c || 0);
  const diff = ((currentPrice - ema) / ema) * 100;
  
  if (diff > 1) return "상승 추세🟢";
  if (diff < -1) return "하락 추세🔴";
  return "횡보⚪";
}

function getMACDSignal(candles) {
  const { macd, signal, histogram } = calcMACD(candles);
  
  if (Math.abs(histogram) < 0.0001) return "중립⚪";
  if (macd > signal && histogram > 0) return "골든크로스🟢";
  if (macd < signal && histogram < 0) return "데드크로스🔴";
  return "중립⚪";
}

module.exports = {
  calcEMA,
  buildEmaSeries,
  calcRSI,
  calcMACD,
  getHeikinAshiCandle,
  getEMA200Trend,
  getEMA200TrendV2,
  getMACDSignal,
  detectMACDCrossover,
  isHeikinAshiBull
};
