const axios = require("axios");
const messages = require("../utils/messages");
const { getProUsers } = require("../utils/supabase");
const { generateAiLine } = require("../utils/aiInterpret");

const API_BASE = process.env.API_BASE_URL || process.env.API_URL || "http://localhost:5000";

const proWatchlistScan = async (bot) => {
  try {
    console.log("[PRO Scan] 사용자 관심종목 스캔 시작...");

    const proUsers = await getProUsers();
    if (!proUsers || proUsers.length === 0) {
      console.log("[PRO Scan] PRO 사용자 없음");
      return;
    }

    for (const user of proUsers) {
      const watchlist = user.watchlist || [];
      const chatId = user.telegram_chat_id || user.user_id;

      console.log(`[PRO Scan] 사용자 ${chatId}의 관심종목: ${watchlist.join(", ")}`);

      for (const symbol of watchlist.slice(0, 2)) {
        try {
          let data;
          try {
            const response = await axios.get(`${API_BASE}/api/bot/pro/whale/${symbol}`, {
              timeout: 10000,
            });
            data = response.data;
            console.log(`✅ [PRO Scan] ${symbol} API 응답 수신: ${data.trend}`);
          } catch (err) {
            console.error(`❌ [PRO Scan] ${symbol} API 호출 실패:`, err.message);
            continue;
          }

          const payload = {
            symbol: data.symbol,
            trend: data.trend,
            change_24h: data.change_24h,
            premium: data.premium,
            net_inflow: data.net_inflow,
          };
          const aiLine = await generateAiLine("PRO_WHALE", payload);
          if (aiLine) {
            data.ai_line = aiLine;
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
      const response = await axios.get(`${API_BASE}/api/bot/pro/btc`, { timeout: 10000 });
      forecastData = response.data;
      console.log(`✅ [PRO Forecast] BTC API 응답: 김프 ${forecastData.kimp}%, 국내가 ${forecastData.korean_price?.toLocaleString()}`);
    } catch (err) {
      console.error("❌ BTC 예측 API 호출 실패:", err.message);
      return;
    }

    const payload = {
      current_kimp: forecastData.kimp,
      korean_price: forecastData.korean_price,
      global_price: forecastData.global_price,
      change_24h: forecastData.change_24h,
      up_prob: forecastData.up_prob,
      score: forecastData.score,
    };
    const aiLine = await generateAiLine("PRO_BTC", payload);
    forecastData.ai_line = aiLine;

    const message = messages.proBtcForecast(forecastData);

    for (const user of proUsers) {
      const chatId = user.telegram_chat_id || user.user_id;
      try {
        await bot.telegram.sendMessage(chatId, message);
        console.log(`✅ [PRO Forecast] BTC 예측 전송 (${chatId})`);
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`❌ [PRO Forecast] 전송 실패 (${chatId}):`, err.message);
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
