const axios = require("axios");
const messages = require("../utils/messages");
const { generateAiLine } = require("../utils/aiInterpret");

const API_BASE = process.env.API_URL || "http://localhost:5000";
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

const freeAltScan = async (bot) => {
  if (!CHANNEL_ID) {
    console.warn("⚠️ TELEGRAM_CHANNEL_ID 미설정, 자동 스캔 비활성화");
    return;
  }

  try {
    console.log("[FREE Scan] TOP50 알트 스캔 시작...");

    let alts = [];
    try {
      const response = await axios.get(`${API_BASE}/api/bot/alts?limit=50&sort=volatility`, { timeout: 10000 });
      alts = response.data;
      console.log(`✅ [FREE Scan] API에서 ${alts.length}개 알트 데이터 수신`);
    } catch (err) {
      console.error("❌ ALT API 호출 실패:", err.message);
      return;
    }

    if (!alts || alts.length === 0) {
      console.warn("⚠️ [FREE Scan] 알트 데이터 없음");
      return;
    }

    const topAlts = alts
      .filter((alt) => Math.abs(parseFloat(alt.price_change)) > 1 || Math.abs(parseFloat(alt.vol_change)) > 3)
      .slice(0, 3);

    if (topAlts.length === 0) {
      console.log("[FREE Scan] 조건 만족 알트 없음, 상위 3개 선택");
      topAlts.push(...alts.slice(0, 3));
    }

    console.log(`[FREE Scan] 선택된 알트: ${topAlts.map((a) => a.symbol).join(", ")}`);

    for (const alt of topAlts) {
      try {
        const payload = {
          symbol: alt.symbol,
          price_change: alt.price_change,
          vol_change: alt.vol_change,
          premium: alt.premium,
          fund: alt.fund,
        };

        const aiLine = await generateAiLine("FREE_ALT", payload);

        const messageData = {
          symbol: alt.symbol,
          vol_change: alt.vol_change,
          price_change: alt.price_change,
          fund: alt.fund,
          ai_line: aiLine,
          prob: alt.prob,
          range: alt.range,
        };

        const message = messages.altSignal(messageData);
        await bot.telegram.sendMessage(CHANNEL_ID, message);
        console.log(`✅ [FREE Scan] ${alt.symbol} 메시지 전송 완료`);

        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (err) {
        console.error(`❌ [FREE Scan] ${alt.symbol} 전송 실패:`, err.message);
      }
    }

    console.log("[FREE Scan] 완료");
  } catch (err) {
    console.error("[FREE Scan] 오류:", err.message);
  }
};

const freeBtcScan = async (bot) => {
  if (!CHANNEL_ID) {
    console.warn("⚠️ TELEGRAM_CHANNEL_ID 미설정, BTC 스캔 비활성화");
    return;
  }

  try {
    console.log("[FREE BTC Scan] BTC 김프 스캔 시작...");

    let data;
    try {
      const response = await axios.get(`${API_BASE}/api/bot/btc`, { timeout: 10000 });
      data = response.data;
      console.log(`✅ [FREE BTC Scan] API 응답: 김프 ${data.current}%`);
    } catch (err) {
      console.error("❌ BTC API 호출 실패:", err.message);
      return;
    }

    const payload = {
      current_kimp: data.current,
      prev_kimp: data.prev,
      trend: data.trend,
      change_24h: data.change_24h,
    };

    const aiLine = await generateAiLine("FREE_BTC", payload);

    const messageData = {
      prev: data.prev,
      current: data.current,
      trend: data.trend,
      ai_line: aiLine,
      prob: data.prob,
      future_move: data.future_move,
    };

    const message = messages.btcKimp(messageData);
    await bot.telegram.sendMessage(CHANNEL_ID, message);
    console.log("✅ [FREE BTC Scan] 메시지 전송 완료");
  } catch (err) {
    console.error("[FREE BTC Scan] 오류:", err.message);
  }
};

const freeEthScan = async (bot) => {
  if (!CHANNEL_ID) {
    console.warn("⚠️ TELEGRAM_CHANNEL_ID 미설정, ETH 스캔 비활성화");
    return;
  }

  try {
    console.log("[FREE ETH Scan] ETH 변동성 스캔 시작...");

    let data;
    try {
      const response = await axios.get(`${API_BASE}/api/bot/eth`, { timeout: 10000 });
      data = response.data;
      console.log(`✅ [FREE ETH Scan] API 응답: OI ${data.oi}%, Fund ${data.fund}%`);
    } catch (err) {
      console.error("❌ ETH API 호출 실패:", err.message);
      return;
    }

    const payload = {
      oi: data.oi,
      fund: data.fund,
      bias: data.bias,
      vol_prev: data.vol_prev,
      vol_now: data.vol_now,
    };

    const aiLine = await generateAiLine("FREE_ETH", payload);

    const messageData = {
      oi: data.oi,
      fund: data.fund,
      bias: data.bias,
      vol_prev: data.vol_prev,
      vol_now: data.vol_now,
      ai_line: aiLine,
    };

    const message = messages.ethVolatility(messageData);
    await bot.telegram.sendMessage(CHANNEL_ID, message);
    console.log("✅ [FREE ETH Scan] 메시지 전송 완료");
  } catch (err) {
    console.error("[FREE ETH Scan] 오류:", err.message);
  }
};

module.exports = {
  freeAltScan,
  freeBtcScan,
  freeEthScan,
};
