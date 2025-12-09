const formatPrice = (price) => {
  if (!price && price !== 0) return "N/A";
  const num = typeof price === "number" ? price : parseFloat(price);
  if (isNaN(num)) return "N/A";
  if (num >= 1000) {
    return num.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
  } else if (num >= 1) {
    return num.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
  } else {
    return num.toLocaleString("ko-KR", { maximumFractionDigits: 4 });
  }
};

const formatUsdPrice = (price) => {
  if (!price && price !== 0) return "N/A";
  const num = typeof price === "number" ? price : parseFloat(price);
  if (isNaN(num)) return "N/A";
  if (num >= 1000) {
    return num.toLocaleString("en-US", { maximumFractionDigits: 0 });
  } else if (num >= 1) {
    return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
  } else {
    return num.toLocaleString("en-US", { maximumFractionDigits: 4 });
  }
};

const messageTemplates = {
  freeSpikeUp: (data) => `🚨 [KimpAI FREE] 단기 급등 감지 — ${data.symbol}

💰 현재가: ₩${formatPrice(data.current_price_krw)} / $${formatUsdPrice(data.current_price_usdt)}
📊 1h 거래량 변화: ${data.volume_change_1h}%
📈 1h 가격 변화: ${data.price_change_1h}%
🌏 국내–해외 스프레드: ${data.premium}%
📉 펀딩율: ${data.funding_rate}%

📡 시그널 요약
${data.signal_line}

🌐 KimpAI는 국내·해외 거래소 가격을 실시간으로 비교해
김프·변동성·거래량을 자동 분석하는 **실시간 김프 모니터링 서비스**입니다.

👉 48h 예측·목표가·손절가·시장 리스크 등의 **고급 AI 해석은**
KimpAI PRO DM에서 제공합니다.

➡️ https://kimpai.io`,

  freeSpikeDown: (data) => `🚨 [KimpAI FREE] 단기 급락 감지 — ${data.symbol}

💰 현재가: ₩${formatPrice(data.current_price_krw)} / $${formatUsdPrice(data.current_price_usdt)}
📊 1h 거래량 변화: ${data.volume_change_1h}%
📉 1h 가격 변화: ${data.price_change_1h}%
🌏 국내–해외 스프레드: ${data.premium}%
📉 펀딩율: ${data.funding_rate}%

📡 시그널 요약
${data.signal_line}

🌐 KimpAI는 국내·해외 거래소 가격을 실시간으로 비교해
김프·변동성·거래량을 자동 분석하는 **실시간 김프 모니터링 서비스**입니다.

👉 48h 예측·목표가·손절가·시장 리스크 등의 **고급 AI 해석은**
KimpAI PRO DM에서 제공합니다.

➡️ https://kimpai.io`,

  freeVolatility: (data) => `🚨 [KimpAI FREE] 변동성 확대 감지 — ${data.symbol}

💰 현재가: ₩${formatPrice(data.current_price_krw)} / $${formatUsdPrice(data.current_price_usdt)}
📊 1h 거래량 변화: ${data.volume_change_1h}%
📈 1h 가격 변화: ${data.price_change_1h}%
🌏 국내–해외 스프레드: ${data.premium}%
📉 펀딩율: ${data.funding_rate}%

📡 시그널 요약
${data.signal_line}

🌐 KimpAI는 국내·해외 거래소 가격을 실시간으로 비교해
김프·변동성·거래량을 자동 분석하는 **실시간 김프 모니터링 서비스**입니다.

👉 48h 예측·목표가·손절가·시장 리스크 등의 **고급 AI 해석은**
KimpAI PRO DM에서 제공합니다.

➡️ https://kimpai.io`,

  freeBtcSignal: (data) => `🚨 [KimpAI FREE] BTC 김프 변화 감지

💰 현재가: ₩${formatPrice(data.current_price_krw)} / $${formatUsdPrice(data.current_price_usdt)}
📊 김프 변동: ${data.prev}% → ${data.current}%
🌏 현재 김프: ${data.current}%
📈 24h 가격 변동: ${data.change_24h || "N/A"}%

📡 시그널 요약
${data.signal_line}

🌐 KimpAI는 국내·해외 거래소 가격을 실시간으로 비교해
김프·변동성·거래량을 자동 분석하는 **실시간 김프 모니터링 서비스**입니다.

👉 48h 예측·목표가·손절가·시장 리스크 등의 **고급 AI 해석은**
KimpAI PRO DM에서 제공합니다.

➡️ https://kimpai.io`,

  btcKimp: (data) => `📈 [KimpAI] BTC 김치 프리미엄 변화 감지

💰 현재가: ₩${formatPrice(data.current_price_krw)} / $${formatUsdPrice(data.current_price_usdt)}
📊 김프 변동: ${data.prev}% → ${data.current}%
🌏 현재 김프: ${data.current}%
📈 24h 가격 변동: ${data.change_24h || "N/A"}%

📡 시그널 요약
${data.signal_line}

🌐 KimpAI는 국내·해외 거래소 가격을 실시간으로 비교해
김프·변동성·거래량을 자동 분석하는 **실시간 김프 모니터링 서비스**입니다.

👉 48h 예측·목표가·손절가·시장 리스크 등의 **고급 AI 해석은**
KimpAI PRO DM에서 제공합니다.

➡️ https://kimpai.io`,

  ethVolatility: (data) => `⚠️ [KimpAI] ETH 변동성 증가 신호

💰 현재가: ₩${formatPrice(data.current_price_krw)} / $${formatUsdPrice(data.current_price_usdt)}
📊 OI 변화: ${data.oi}%
📉 펀딩율: ${data.fund}% (${data.bias})
📈 변동폭: ${data.vol_prev}% → ${data.vol_now}%

📡 시그널 요약
${data.signal_line}

🌐 KimpAI는 국내·해외 거래소 가격을 실시간으로 비교해
김프·변동성·거래량을 자동 분석하는 **실시간 김프 모니터링 서비스**입니다.

👉 48h 예측·목표가·손절가·시장 리스크 등의 **고급 AI 해석은**
KimpAI PRO DM에서 제공합니다.

➡️ https://kimpai.io`,

  altSignal: (data) => `🚀 [KimpAI] ${data.symbol} 변동성 감지

💰 현재가: ₩${formatPrice(data.current_price_krw)} / $${formatUsdPrice(data.current_price_usdt)}
📊 1h 거래량 변화: ${data.volume_change_1h}%
📈 1h 가격 변화: ${data.price_change_1h}%
🌏 국내–해외 스프레드: ${data.premium}%
📉 펀딩율: ${data.funding_rate}%

📡 시그널 요약
${data.signal_line}

🌐 KimpAI는 국내·해외 거래소 가격을 실시간으로 비교해
김프·변동성·거래량을 자동 분석하는 **실시간 김프 모니터링 서비스**입니다.

👉 48h 예측·목표가·손절가·시장 리스크 등의 **고급 AI 해석은**
KimpAI PRO DM에서 제공합니다.

➡️ https://kimpai.io`,

  proBtcForecast: (data) => `🔒 [KimpAI PRO] 48시간 BTC 예측 리포트

💰 현재 시세:
— 국내가: ₩${formatPrice(data.korean_price)}
— 해외가: $${formatUsdPrice(data.global_price)}
— 현재 김프: ${data.kimp}%

📊 분석:
— EA-Score: ${data.score}/10
— 롱·숏 비율: ${data.ls_ratio}

📈 예측:
상승 확률 ${data.up_prob}%
예상 변동: ${data.min}% ~ ${data.max}%

🧭 전략 (국내가 기준):
하방 지지: ₩${data.dp1} / ₩${data.dp2}
상방 저항: ₩${data.tp1} / ₩${data.tp2}${data.ai_line ? `

🧠 AI 분석:
${data.ai_line}` : ""}`,

  proWhaleSignal: (data) => `🔒 [KimpAI PRO] 고래 매집 포착 — ${data.symbol}

💰 현재 시세:
— 국내가: ₩${formatPrice(data.korean_price)}
— 해외가: $${formatUsdPrice(data.global_price)}
— 김프: ${data.premium}%

📊 고래 활동:
— 순입금: ${data.net_inflow} ${data.symbol}
— 평균 매수: $${data.avg_entry}
— 매집 지속: ${data.duration}

🧠 AI 분석:
${data.ai_line || "분석 중..."}

📌 확률:
상승 확률 ${data.prob}%
변동 예상 ${data.range}%`,

  proRiskWarning: (data) => `🔒 [KimpAI PRO] 과열 리스크 경고 — ${data.symbol}

💰 현재 시세:
— 국내가: ₩${formatPrice(data.korean_price)}
— 해외가: $${formatUsdPrice(data.global_price)}
— 김프: ${data.premium}%

📊 리스크 지표:
— 24h 변동: ${data.vol}%
— 펀딩율: ${data.fund}%
— 리스크 레벨: ${data.risk_level || "보통"}
— PL 분석: ${data.pl_desc}

🧠 AI 판정:
"${data.pattern_name}" 패턴
동일 조건에서 ${data.prob}% 확률로
${data.min}% ~ ${data.max}% 조정 발생.${data.ai_line ? `

💡 AI 해석:
${data.ai_line}` : ""}

🧭 전략:
· 신규 진입: ${data.entry}
· 기존 포지션: ${data.manage}`,

  proLocked: `🔒 PRO 전용 기능입니다.
자세히 보기: https://kimpai.io`,
};

module.exports = messageTemplates;
