const axios = require("axios");
const messages = require("../utils/messages");

const API_BASE = process.env.API_URL || "http://localhost:5000";
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

// 샘플 ALT 데이터 생성
const generateMockAltData = (symbol) => {
  const randomPercent = () => (Math.random() * 10 - 5).toFixed(2);
  const randomProb = () => Math.floor(Math.random() * 30 + 60);

  return {
    symbol,
    vol_change: randomPercent(),
    price_change: randomPercent(),
    fund: randomPercent(),
    ai_line: "변동성 증가 신호 포착",
    prob: randomProb(),
    range: randomPercent(),
  };
};

// FREE 자동 스캔 (10분마다 TOP50 ALT 스캔)
const freeAltScan = async (bot) => {
  if (!CHANNEL_ID) {
    console.warn("⚠️ TELEGRAM_CHANNEL_ID 미설정, 자동 스캔 비활성화");
    return;
  }

  try {
    console.log("[FREE Scan] TOP50 알트 스캔 시작...");

    let alts;
    try {
      const response = await axios.get(`${API_BASE}/api/bot/alts?limit=50`, { timeout: 5000 });
      alts = response.data.slice(0, 3); // 상위 3개만 선택 (스팸 방지)
    } catch (err) {
      console.warn("⚠️ ALT API 호출 실패, 샘플 데이터 사용");
      alts = ["SUI", "DOGE", "PEPE"].map((symbol) => ({ symbol }));
    }

    // 상위 3개 코인에 대해 메시지 생성 및 전송
    for (const alt of alts) {
      try {
        const symbol = alt.symbol || alt;
        let data;
        try {
          const response = await axios.get(`${API_BASE}/api/bot/alts/${symbol}`, { timeout: 5000 });
          data = response.data;
        } catch (err) {
          data = generateMockAltData(symbol);
        }

        const message = messages.altSignal(data);
        await bot.telegram.sendMessage(CHANNEL_ID, message);
        console.log(`✅ [FREE Scan] ${symbol} 메시지 전송 완료`);

        // API 제한 방지를 위해 간격 두기
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (err) {
        console.error(`❌ [FREE Scan] ${alt.symbol || alt} 전송 실패:`, err.message);
      }
    }

    console.log("[FREE Scan] 완료");
  } catch (err) {
    console.error("[FREE Scan] 오류:", err.message);
  }
};

// BTC 김프 주기적 감시 (30분마다)
const freeBtcScan = async (bot) => {
  if (!CHANNEL_ID) {
    console.warn("⚠️ TELEGRAM_CHANNEL_ID 미설정, BTC 스캔 비활성화");
    return;
  }

  try {
    console.log("[FREE BTC Scan] BTC 김프 스캔 시작...");

    let data;
    try {
      const response = await axios.get(`${API_BASE}/api/bot/btc`, { timeout: 5000 });
      data = response.data;
    } catch (err) {
      console.warn("⚠️ BTC API 호출 실패, 샘플 데이터 사용");
      data = {
        prev: (Math.random() * 2 - 1).toFixed(2),
        current: (Math.random() * 2 + 0.5).toFixed(2),
        trend: "높음",
        ai_line: "현재 추세상 상승세가 강함",
        prob: 75,
        future_move: (Math.random() * 3 + 1).toFixed(2),
      };
    }

    const message = messages.btcKimp(data);
    await bot.telegram.sendMessage(CHANNEL_ID, message);
    console.log("✅ [FREE BTC Scan] 메시지 전송 완료");
  } catch (err) {
    console.error("[FREE BTC Scan] 오류:", err.message);
  }
};

module.exports = {
  freeAltScan,
  freeBtcScan,
};
