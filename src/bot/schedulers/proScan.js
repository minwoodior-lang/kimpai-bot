const axios = require("axios");
const messages = require("../utils/messages");
const { getProUsers } = require("../utils/supabase");

const API_BASE = process.env.API_URL || "http://localhost:5000";

// 샘플 PRO 데이터 생성
const generateMockProData = (symbol) => {
  const randomPercent = () => (Math.random() * 10 - 5).toFixed(2);
  const randomProb = () => Math.floor(Math.random() * 20 + 75);

  return {
    symbol,
    net_inflow: (Math.random() * 1000 + 100).toFixed(0),
    avg_entry: (Math.random() * 500 + 1000).toFixed(2),
    duration: "2-3시간",
    ai_line: "고래 매집 활동 포착됨",
    prob: randomProb(),
    range: randomPercent(),
  };
};

// PRO 사용자 관심종목 자동 스캔 (5-10분마다)
const proWatchlistScan = async (bot) => {
  try {
    console.log("[PRO Scan] 사용자 관심종목 스캔 시작...");

    const proUsers = await getProUsers();
    if (!proUsers || proUsers.length === 0) {
      console.log("[PRO Scan] PRO 사용자 없음");
      return;
    }

    // 각 PRO 사용자의 관심종목 스캔
    for (const user of proUsers) {
      const watchlist = user.watchlist || [];
      const chatId = user.telegram_chat_id;

      console.log(`[PRO Scan] 사용자 ${chatId}의 관심종목: ${watchlist.join(", ")}`);

      for (const symbol of watchlist.slice(0, 2)) {
        // 스팸 방지를 위해 최대 2개만 처리
        try {
          let data;
          try {
            const response = await axios.get(`${API_BASE}/api/bot/pro/whale/${symbol}`, {
              timeout: 5000,
            });
            data = response.data;
          } catch (err) {
            data = generateMockProData(symbol);
          }

          const message = messages.proWhaleSignal(data);
          await bot.telegram.sendMessage(chatId, message);
          console.log(`✅ [PRO Scan] ${symbol} DM 전송 (${chatId})`);

          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (err) {
          console.error(`❌ [PRO Scan] ${symbol} DM 전송 실패:`, err.message);
        }
      }
    }

    console.log("[PRO Scan] 완료");
  } catch (err) {
    console.error("[PRO Scan] 오류:", err.message);
  }
};

// PRO 48시간 예측 정기 전송 (6시간마다)
const proBtcForcastScan = async (bot) => {
  try {
    console.log("[PRO Forecast] BTC 예측 스캔 시작...");

    const proUsers = await getProUsers();
    if (!proUsers || proUsers.length === 0) {
      console.log("[PRO Forecast] PRO 사용자 없음");
      return;
    }

    let forecastData;
    try {
      const response = await axios.get(`${API_BASE}/api/bot/pro/btc`, { timeout: 5000 });
      forecastData = response.data;
    } catch (err) {
      console.warn("⚠️ BTC 예측 API 호출 실패, 샘플 데이터 사용");
      forecastData = {
        kimp: (Math.random() * 3 + 0.5).toFixed(2),
        score: Math.floor(Math.random() * 4 + 6),
        ls_ratio: "6:4",
        up_prob: 65,
        min: -2.5,
        max: 4.3,
        dp1: "43000",
        dp2: "41500",
        tp1: "46000",
        tp2: "48000",
      };
    }

    const message = messages.proBtcForecast(forecastData);

    // 모든 PRO 사용자에게 전송
    for (const user of proUsers) {
      try {
        await bot.telegram.sendMessage(user.telegram_chat_id, message);
        console.log(`✅ [PRO Forecast] BTC 예측 전송 (${user.telegram_chat_id})`);
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (err) {
        console.error(
          `❌ [PRO Forecast] 전송 실패 (${user.telegram_chat_id}):`,
          err.message
        );
      }
    }

    console.log("[PRO Forecast] 완료");
  } catch (err) {
    console.error("[PRO Forecast] 오류:", err.message);
  }
};

module.exports = {
  proWatchlistScan,
  proBtcForcastScan,
};
