const messages = require("../utils/messages");
const { getProUsers } = require("../utils/supabase");
const { generateAiLine } = require("../utils/aiInterpret");
const localData = require("../utils/localData");

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
          const data = localData.getProWhaleData(symbol);
          if (!data) {
            console.error(`❌ [PRO Scan] ${symbol} 로컬 데이터 없음`);
            continue;
          }
          console.log(`✅ [PRO Scan] ${symbol} 로컬 데이터 로드: ${data.trend}`);

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

    const forecastData = localData.getProBtcData();
    if (!forecastData || !forecastData.korean_price) {
      console.error("❌ BTC 로컬 데이터 없음");
      return;
    }
    console.log(`✅ [PRO Forecast] 로컬 데이터: 김프 ${forecastData.kimp}%, 국내가 ${forecastData.korean_price?.toLocaleString()}`);

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
