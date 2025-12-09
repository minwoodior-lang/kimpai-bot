const SIGNAL_LINES = {
  volatility_up: [
    "단기 변동성 증가가 감지되었습니다. 접근 시 유의가 필요합니다.",
    "변동성이 높아지고 있습니다. 신중한 접근을 권장합니다.",
    "급격한 가격 변동 가능성이 감지되었습니다.",
  ],
  volume_surge: [
    "거래량이 증가하며 가격 변동 가능성이 커지고 있습니다.",
    "거래량 급증 — 단기 방향성 결정 임박.",
    "대량 거래 발생 중 — 추세 전환 가능성 모니터링 필요.",
  ],
  strong_buy: [
    "강한 매수세 감지 — 단기 변동성 확대 가능성이 있습니다.",
    "매수 압력 증가 — 상승 추세 지속 여부 주시.",
    "적극적인 매수세 포착 — 추가 상승 가능성 존재.",
  ],
  strong_sell: [
    "매도 압력 증가 — 하락 추세 전환 가능성 주시.",
    "대량 매도세 감지 — 신중한 접근 필요.",
    "하락 압력 확대 — 지지선 이탈 가능성 확인 필요.",
  ],
  kimp_up: [
    "김프 상승 감지 — 국내 프리미엄 확대 중.",
    "국내 가격이 해외 대비 상승 — 차익 실현 기회 모니터링.",
    "김치 프리미엄 확대 — 글로벌 대비 과열 신호.",
  ],
  kimp_down: [
    "김프 하락 감지 — 국내외 가격 수렴 중.",
    "국내 프리미엄 축소 — 해외 대비 저평가 구간.",
    "역프리미엄 가능성 — 매수 기회 탐색 권장.",
  ],
  neutral: [
    "현재 뚜렷한 방향성 없음 — 관망 권장.",
    "시장 안정 구간 — 추세 형성 대기 중.",
    "횡보 구간 진입 — 돌파 방향 확인 필요.",
  ],
  eth_volatility: [
    "ETH 변동성 증가 신호 — 포지션 리스크 관리 권장.",
    "이더리움 가격 변동 확대 — 단기 조정 가능성.",
    "ETH 시장 불안정 — 레버리지 포지션 주의.",
  ],
};

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSignalLine(type, data = {}) {
  const priceChange = parseFloat(data.price_change || data.change_24h || 0);
  const volChange = parseFloat(data.vol_change || 0);
  const premium = parseFloat(data.premium || data.current_kimp || data.current || 0);
  const prevPremium = parseFloat(data.prev_kimp || data.prev || 0);

  if (type === "FREE_BTC" || type === "btc") {
    if (premium > prevPremium + 0.5) {
      return getRandomItem(SIGNAL_LINES.kimp_up);
    } else if (premium < prevPremium - 0.5) {
      return getRandomItem(SIGNAL_LINES.kimp_down);
    }
    return getRandomItem(SIGNAL_LINES.neutral);
  }

  if (type === "FREE_ETH" || type === "eth") {
    return getRandomItem(SIGNAL_LINES.eth_volatility);
  }

  if (type === "FREE_ALT" || type === "alt") {
    if (priceChange > 3) {
      return getRandomItem(SIGNAL_LINES.strong_buy);
    } else if (priceChange < -3) {
      return getRandomItem(SIGNAL_LINES.strong_sell);
    } else if (volChange > 5) {
      return getRandomItem(SIGNAL_LINES.volume_surge);
    } else if (Math.abs(priceChange) > 1 || Math.abs(volChange) > 3) {
      return getRandomItem(SIGNAL_LINES.volatility_up);
    }
    return getRandomItem(SIGNAL_LINES.neutral);
  }

  return getRandomItem(SIGNAL_LINES.neutral);
}

module.exports = {
  generateSignalLine,
  SIGNAL_LINES,
};
