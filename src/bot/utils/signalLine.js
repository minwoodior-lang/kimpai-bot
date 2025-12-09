function generateSignalLine(signalType, data = {}) {
  const SIGNAL_RULES = {
    up: "매수 압력 증가 — 상승 추세 지속 여부 주시.",
    down: "매도 압력 우세 — 하락 변동성 확대.",
    volatility: "단기 변동성 증가 — 방향성 전환 가능성.",
  };

  return SIGNAL_RULES[signalType] || SIGNAL_RULES.volatility;
}

module.exports = {
  generateSignalLine,
  SIGNAL_LINES,
};
