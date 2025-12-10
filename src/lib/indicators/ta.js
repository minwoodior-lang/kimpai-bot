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
  getMACDSignal
};
