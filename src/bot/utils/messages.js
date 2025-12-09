// 메시지 템플릿 모음
const messageTemplates = {
  // FREE 템플릿들
  btcKimp: (data) => `📈 [KimpAI] BTC 김치 프리미엄 변화 감지

— 지난 10분 변동: ${data.prev}% → ${data.current}%
— 현재 김프: ${data.current}%
— 국내 가격이 해외보다 ${data.trend}

🧠 AI 해석:
${data.ai_line}

🔍 참고:
과거 동일 패턴 발생 시 ${data.prob}% 확률로 ${data.future_move}% 추가 변동이 발생했습니다.`,

  ethVolatility: (data) => `⚠️ [KimpAI] ETH 변동성 증가 신호

— OI 변화: ${data.oi}%
— Funding: ${data.fund}% (${data.bias})
— 변동폭: ${data.vol_prev}% → ${data.vol_now}%

🧠 AI 해석:
${data.ai_line}`,

  altSignal: (data) => `🚀 [KimpAI] ${data.symbol} 변동성 급등 감지

— 1h 거래량: ${data.vol_change}%
— 가격 변화: ${data.price_change}%
— 펀딩율: ${data.fund}%

🧠 AI 분석:
${data.ai_line}

🔍 통계:
동일 패턴 후 ${data.prob}% 확률로 ${data.range}% 움직임.`,

  // PRO 템플릿들
  proBtcForecast: (data) => `🔒 [KimpAI PRO] 48시간 BTC 예측 리포트

— 현재 김프: ${data.kimp}%
— EA-Score: ${data.score}/10
— 롱·숏 비율: ${data.ls_ratio}

📈 예측:
상승 확률 ${data.up_prob}%
예상 변동: ${data.min}% ~ ${data.max}%

🧭 전략:
저점: ${data.dp1} / ${data.dp2}
익절: ${data.tp1} / ${data.tp2}`,

  proWhaleSignal: (data) => `🔒 [KimpAI PRO] 고래 매집 포착 — ${data.symbol}

— 순입금: ${data.net_inflow} ${data.symbol}
— 평균 매수: $${data.avg_entry}
— 매집 지속: ${data.duration}

🧠 결론:
${data.ai_line}

📌 확률:
상승 확률 ${data.prob}%
변동 예상 ${data.range}%`,

  proRiskWarning: (data) => `🔒 [KimpAI PRO] 과열 리스크 경고 — ${data.symbol}

— 1h 거래량: ${data.vol}%
— 펀딩율: ${data.fund}
— PL 분석: ${data.pl_desc}

🧠 AI 판정:
"${data.pattern_name}" 패턴
동일 조건에서 ${data.prob}% 확률로
${data.min}% ~ ${data.max}% 조정 발생.

🧭 전략:
· 신규 진입: ${data.entry}
· 기존 포지션: ${data.manage}`,

  // PRO 잠금 메시지
  proLocked: `🔒 PRO 전용 기능입니다.
자세히 보기: https://kimpai.io`,
};

module.exports = messageTemplates;
