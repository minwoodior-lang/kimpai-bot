function formatNumber(num) {
  if (num === null || num === undefined) return "0";
  if (typeof num === 'string') num = parseFloat(num);
  if (num >= 1000000000) return (num / 1000000000).toFixed(2) + "B";
  if (num >= 1000000) return (num / 1000000).toFixed(2) + "M";
  if (num >= 1000) return num.toLocaleString("en-US");
  return num.toFixed(2);
}

function formatPrice(price) {
  if (price === null || price === undefined) return "0";
  if (typeof price === 'string') price = parseFloat(price);
  if (price >= 1000) return price.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (price >= 1) return price.toFixed(2);
  return price.toPrecision(4);
}

function kimpSignal(data) {
  const {
    symbol,
    price_krw,
    price_usd,
    premium_now,
    premium_prev,
    premium_diff
  } = data;

  const diffSign = parseFloat(premium_diff) >= 0 ? '+' : '';
  const emoji = parseFloat(premium_diff) >= 0 ? '📈' : '📉';

  return `⚡ ${symbol} 김프 급변 감지

🇰🇷 국내가: ₩${formatNumber(price_krw)}
🌍 해외가: $${formatPrice(price_usd)}
${emoji} 김프: ${premium_now}%

⏱ 5분 변화: ${diffSign}${premium_diff}%p

────────────────
김프 급격 변동 구간 자동 추적 시스템.
실시간 시그널: kimpai.io`;
}

function whaleSignal(data) {
  const {
    symbol,
    side,
    side_emoji,
    volume_usdt,
    volume_token,
    base,
    baseline_window,
    volume_ratio,
    price_usdt,
    change_24h,
    volume_24h_usdt,
    ema200_trend,
    rsi_value,
    macd_signal,
    ha_candle,
    last_alert_ago
  } = data;

  const ema200_emoji = ema200_trend === '상승' ? '🟢' : '🔴';
  const macd_emoji = macd_signal === 'golden' || macd_signal === '상승' ? '🟢' : '🔴';
  const candle_emoji = ha_candle === '양봉' ? '🟢' : '🔴';

  return `🐋 ${symbol} 고래 ${side} 활동 감지 [BINANCE] ${side_emoji}

⏱ 감지 구간: 최근 1분
💵 체결 규모: $${formatNumber(volume_usdt)} (${formatNumber(volume_token)} ${base})
📊 거래량: 최근 ${baseline_window}분 평균 대비 ${volume_ratio.toFixed(1)}배

💰 현재가: $${formatPrice(price_usdt)}
📊 24h 변동: ${change_24h}% / 거래액: ${formatNumber(volume_24h_usdt)} USDT

📉 보조지표 (1시간 차트)
- 200EMA: ${ema200_trend} ${ema200_emoji}
- RSI: ${rsi_value ? rsi_value.toFixed(1) : 'N/A'}
- MACD: ${macd_signal} ${macd_emoji}
- 캔들: ${ha_candle} ${candle_emoji}

────────────────
📡 KimpAI는 Binance 실시간 체결 데이터를 기반으로
고래 매수·매도 및 거래량 폭발 구간만 자동 분석합니다.
실시간 시그널 & 차트: kimpai.io`;
}

function spikeUpSignal(data) {
  const {
    symbol,
    price_usdt,
    price_change_1m,
    change_24h,
    baseline_window,
    volume_ratio,
    ema200_trend,
    rsi_value,
    macd_signal,
    ha_candle
  } = data;

  return `⚡ ${symbol} 단기 스파이크 급등 감지

⏱ 감지 구간: 최근 1분
💰 현재가: $${formatPrice(price_usdt)}
📈 가격 변화: +${Math.abs(price_change_1m).toFixed(2)}% (1분) / ${change_24h}% (24h)
📊 거래량: 최근 ${baseline_window}분 평균 대비 ${volume_ratio.toFixed(1)}배

📉 보조 지표 (1시간 차트)
- 200EMA: ${ema200_trend}
- RSI: ${rsi_value ? rsi_value.toFixed(1) : 'N/A'}
- MACD: ${macd_signal}
- 캔들: ${ha_candle}

────────────
📡 KimpAI는 Binance 1분봉 데이터를 기반으로
단기 급등·급락 및 거래량 폭발 구간만 자동 포착합니다.

👉 실시간 차트와 시그널: kimpai.io`;
}

function spikeDownSignal(data) {
  const {
    symbol,
    price_usdt,
    price_change_1m,
    change_24h,
    baseline_window,
    volume_ratio,
    ema200_trend,
    rsi_value,
    macd_signal,
    ha_candle
  } = data;

  return `🔻 ${symbol} 단기 스파이크 급락 감지

⏱ 감지 구간: 최근 1분
💰 현재가: $${formatPrice(price_usdt)}
📉 가격 변화: ${price_change_1m.toFixed(2)}% (1분) / ${change_24h}% (24h)
📊 거래량: 최근 ${baseline_window}분 평균 대비 ${volume_ratio.toFixed(1)}배

📉 보조 지표 (1시간 차트)
- 200EMA: ${ema200_trend}
- RSI: ${rsi_value ? rsi_value.toFixed(1) : 'N/A'}
- MACD: ${macd_signal}
- 캔들: ${ha_candle}

────────────
📡 KimpAI는 Binance 1분봉 데이터를 기반으로
단기 급등·급락 및 거래량 폭발 구간만 자동 포착합니다.

👉 실시간 차트와 시그널: kimpai.io`;
}

module.exports = {
  kimpSignal,
  whaleSignal,
  spikeUpSignal,
  spikeDownSignal,
  formatNumber,
  formatPrice
};
