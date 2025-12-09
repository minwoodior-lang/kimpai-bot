const formatPrice = (price) => {
  if (!price) return "N/A";
  return typeof price === "number" ? price.toLocaleString() : price;
};

const messageTemplates = {
  freeAltSignal: (data) => `🚨 [KimpAI FREE] 변동성 급등 감지 — ${data.symbol}

💰 현재가: ₩${formatPrice(data.korean_price)}
📊 1h 거래량 변화: ${data.vol_change}%
📈 1h 가격 변화: ${data.price_change}%
🌏 국내–해외 스프레드: ${data.premium}%
📉 펀딩율: ${data.fund}%

📡 시그널 요약
${data.signal_line}

🔍 통계 기반 예측
• 패턴 성공률: ${data.prob || 70}%
• 예상 변동폭: ±${data.range || "3.5"}%

🌐 KimpAI는 국내·해외 거래소 가격을 실시간으로 비교해
김프·변동성·거래량을 자동 분석하는 **실시간 김프 모니터링 서비스**입니다.

👉 **48h 예측 · 목표가 · 손절가 · 시장 리스크 등 고급 AI 해석은**
KimpAI PRO DM에서 제공합니다.

➡️ https://kimpai.io`,

  freeBtcSignal: (data) => `🚨 [KimpAI FREE] BTC 김프 변화 감지

💰 현재가: ₩${formatPrice(data.korean_price)}
📊 김프 변동: ${data.prev}% → ${data.current}%
🌏 현재 김프: ${data.current}%
📈 24h 가격 변동: ${data.change_24h || "N/A"}%

📡 시그널 요약
${data.signal_line}

🔍 통계 기반 예측
• 패턴 성공률: ${data.prob || 70}%
• 예상 변동폭: ±${data.future_move || "0.5"}%

🌐 KimpAI는 국내·해외 거래소 가격을 실시간으로 비교해
김프·변동성·거래량을 자동 분석하는 **실시간 김프 모니터링 서비스**입니다.

👉 **48h 예측 · 목표가 · 손절가 · 시장 리스크 등 고급 AI 해석은**
KimpAI PRO DM에서 제공합니다.

➡️ https://kimpai.io`,

  freeEthSignal: (data) => `🚨 [KimpAI FREE] ETH 변동성 증가 신호

💰 현재가: ₩${formatPrice(data.korean_price)}
📊 OI 변화: ${data.oi}%
📉 펀딩율: ${data.fund}% (${data.bias})
📈 변동폭: ${data.vol_prev}% → ${data.vol_now}%

📡 시그널 요약
${data.signal_line}

🔍 통계 기반 예측
• 패턴 성공률: ${data.prob || 65}%
• 예상 변동폭: ±${data.range || "2.5"}%

🌐 KimpAI는 국내·해외 거래소 가격을 실시간으로 비교해
김프·변동성·거래량을 자동 분석하는 **실시간 김프 모니터링 서비스**입니다.

👉 **48h 예측 · 목표가 · 손절가 · 시장 리스크 등 고급 AI 해석은**
KimpAI PRO DM에서 제공합니다.

➡️ https://kimpai.io`,

  btcKimp: (data) => `📈 [KimpAI] BTC 김치 프리미엄 변화 감지

— 지난 10분 변동: ${data.prev}% → ${data.current}%
— 현재 김프: ${data.current}%
— 국내 가격이 해외보다 ${data.trend}

📡 시그널 요약:
${data.signal_line}

🔍 참고:
과거 동일 패턴 발생 시 ${data.prob || 70}% 확률로 ${data.future_move || "0.5"}% 추가 변동이 발생했습니다.

➡️ PRO 분석: https://kimpai.io`,

  ethVolatility: (data) => `⚠️ [KimpAI] ETH 변동성 증가 신호

— OI 변화: ${data.oi}%
— Funding: ${data.fund}% (${data.bias})
— 변동폭: ${data.vol_prev}% → ${data.vol_now}%

📡 시그널 요약:
${data.signal_line}

➡️ PRO 분석: https://kimpai.io`,

  altSignal: (data) => `🚀 [KimpAI] ${data.symbol} 변동성 급등 감지

— 1h 거래량: ${data.vol_change}%
— 가격 변화: ${data.price_change}%
— 펀딩율: ${data.fund}%

📡 시그널 요약:
${data.signal_line}

🔍 통계:
동일 패턴 후 ${data.prob || 70}% 확률로 ${data.range || "3.5"}% 움직임.

➡️ PRO 분석: https://kimpai.io`,

  proBtcForecast: (data) => `🔒 [KimpAI PRO] 48시간 BTC 예측 리포트

💰 현재 시세:
— 국내가: ₩${formatPrice(data.korean_price)}
— 해외가: $${formatPrice(data.global_price)}
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
— 해외가: $${formatPrice(data.global_price)}
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
— 해외가: $${formatPrice(data.global_price)}
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
