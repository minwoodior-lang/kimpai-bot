function generateSignalLine(signalType) {
  const SIGNAL_RULES = {
    up: "매수 압력이 빠르게 유입되는 구간입니다. 추격 진입보다는 눌림·조정 구간을 기다리는 편이 안전합니다.",
    down: "단기 매도 압력이 강하게 나타나는 구간입니다. 보유 포지션의 리스크 관리가 중요한 시점입니다.",
    volatility: "위·아래 변동 폭이 커진 상태입니다. 레버리지·포지션 사이즈를 평소보다 줄이는 것을 권장합니다.",
  };

  return SIGNAL_RULES[signalType] || SIGNAL_RULES.volatility;
}

module.exports = {
  generateSignalLine,
};
