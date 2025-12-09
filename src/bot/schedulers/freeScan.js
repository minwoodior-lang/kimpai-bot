const axios = require("axios");
const messages = require("../utils/messages");
const { generateSignalLine } = require("../utils/signalLine");
const { floorToMinutesBucket } = require("../utils/timeBuckets");
const { setLock, hasLock } = require("../state/freeScanLock");

const API_BASE = process.env.API_BASE_URL || process.env.API_URL || "http://localhost:5000";
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

const recentAlerts = new Map();
const COOLDOWN_COUNT = 3;

const ALT_SCAN_INTERVAL_MIN = 10;
const BTC_SCAN_INTERVAL_MIN = 30;
const ALT_LOCK_TTL_MS = ALT_SCAN_INTERVAL_MIN * 60 * 1000;
const BTC_LOCK_TTL_MS = BTC_SCAN_INTERVAL_MIN * 60 * 1000;

function shouldSkipCoin(symbol) {
  const count = recentAlerts.get(symbol) || 0;
  return count >= COOLDOWN_COUNT;
}

function recordAlert(symbol) {
  const count = recentAlerts.get(symbol) || 0;
  recentAlerts.set(symbol, count + 1);
}

function resetCooldowns() {
  recentAlerts.clear();
}

setInterval(resetCooldowns, 60 * 60 * 1000);

const freeAltScan = async (bot) => {
  if (!CHANNEL_ID) {
    console.warn("⚠️ TELEGRAM_CHANNEL_ID 미설정, 자동 스캔 비활성화");
    return;
  }

  const now = new Date();
  const bucket = floorToMinutesBucket(now, ALT_SCAN_INTERVAL_MIN);
  const lockKey = `FREE_ALT_${bucket}`;

  if (hasLock(lockKey)) {
    console.log(`[FREE ALT Scan] 이미 이 시간대(${bucket})에 발송됨. 중복 방지로 스킵`);
    return;
  }

  try {
    console.log("[FREE Scan] TOP50 알트 스캔 시작...", { bucket, pid: process.pid });

    let alts = [];
    try {
      const response = await axios.get(`${API_BASE}/api/bot/alts?limit=50`, { timeout: 10000 });
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

    const spikeUpList = [];
    const spikeDownList = [];
    const highVolList = [];

    for (const alt of alts) {
      if (shouldSkipCoin(alt.symbol)) continue;

      const priceChange = parseFloat(alt.price_change_1h || alt.price_change || 0);
      const volChange = parseFloat(alt.volume_change_1h || alt.vol_change || 0);
      const absPriceChange = Math.abs(priceChange);

      if (priceChange >= 5 && volChange >= 100) {
        spikeUpList.push({ ...alt, priceChange, volChange, absPriceChange });
      } else if (priceChange <= -5 && volChange >= 50) {
        spikeDownList.push({ ...alt, priceChange, volChange, absPriceChange });
      } else if (absPriceChange >= 3 && volChange >= 50) {
        const alreadyInSpike = 
          spikeUpList.some(a => a.symbol === alt.symbol) ||
          spikeDownList.some(a => a.symbol === alt.symbol);
        if (!alreadyInSpike) {
          highVolList.push({ ...alt, priceChange, volChange, absPriceChange });
        }
      }
    }

    spikeUpList.sort((a, b) => b.priceChange - a.priceChange);
    spikeDownList.sort((a, b) => a.priceChange - b.priceChange);
    highVolList.sort((a, b) => b.absPriceChange - a.absPriceChange);

    const toSend = [];

    if (spikeUpList.length > 0) {
      const coin = spikeUpList[0];
      toSend.push({ type: "up", coin });
    }

    if (spikeDownList.length > 0) {
      const coin = spikeDownList[0];
      toSend.push({ type: "down", coin });
    }

    if (highVolList.length > 0) {
      const coin = highVolList[0];
      toSend.push({ type: "volatility", coin });
    }

    if (toSend.length === 0) {
      console.log("[FREE Scan] No coins matched thresholds");
      setLock(lockKey, ALT_LOCK_TTL_MS);
      return;
    }

    setLock(lockKey, ALT_LOCK_TTL_MS);
    console.log(`[FREE Scan] 발송 대상: ${toSend.map(t => `${t.type}:${t.coin.symbol}`).join(", ")} (락 설정됨)`);

    for (const { type, coin } of toSend) {
      try {
        const signalLine = generateSignalLine(type);

        const messageData = {
          symbol: coin.symbol,
          current_price_krw: coin.korean_price || coin.current_price_krw || coin.price,
          current_price_usdt: coin.usdt_price || coin.global_price || coin.current_price_usdt,
          volume_change_1h: (coin.volume_change_1h || coin.vol_change || 0).toFixed(1),
          price_change_1h: (coin.price_change_1h || coin.price_change || 0).toFixed(2),
          premium: (coin.premium || 0).toFixed(2),
          funding_rate: (coin.funding_rate || coin.fund || 0).toFixed(4),
          signal_line: signalLine,
        };

        let message;
        if (type === "up") {
          message = messages.freeSpikeUp(messageData);
        } else if (type === "down") {
          message = messages.freeSpikeDown(messageData);
        } else {
          message = messages.freeVolatility(messageData);
        }

        await bot.telegram.sendMessage(CHANNEL_ID, message);
        recordAlert(coin.symbol);
        console.log(`✅ [FREE Scan] ${type}:${coin.symbol} 메시지 전송 완료`);

        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (err) {
        console.error(`❌ [FREE Scan] ${coin.symbol} 전송 실패:`, err.message);
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

  const now = new Date();
  const bucket = floorToMinutesBucket(now, BTC_SCAN_INTERVAL_MIN);
  const lockKey = `FREE_BTC_${bucket}`;

  if (hasLock(lockKey)) {
    console.log(`[FREE BTC Scan] 이미 이 시간대(${bucket})에 발송됨. 중복 방지로 스킵`);
    return;
  }

  try {
    console.log("[FREE BTC Scan] BTC 김프 스캔 시작...", { bucket, pid: process.pid });

    let data;
    try {
      const response = await axios.get(`${API_BASE}/api/bot/btc`, { timeout: 10000 });
      data = response.data;
      console.log(`✅ [FREE BTC Scan] API 응답: 김프 ${data.current}%`);
    } catch (err) {
      console.error("❌ BTC API 호출 실패:", err.message);
      return;
    }

    const kimpChange = Math.abs(parseFloat(data.current) - parseFloat(data.prev));
    let signalType = "volatility";
    if (parseFloat(data.current) > parseFloat(data.prev) + 0.3) {
      signalType = "up";
    } else if (parseFloat(data.current) < parseFloat(data.prev) - 0.3) {
      signalType = "down";
    }

    const signalLine = generateSignalLine(signalType);

    const messageData = {
      current_price_krw: data.korean_price,
      current_price_usdt: data.global_price,
      prev: data.prev,
      current: data.current,
      trend: data.trend,
      change_24h: data.change_24h,
      signal_line: signalLine,
    };

    const message = messages.freeBtcSignal(messageData);
    await bot.telegram.sendMessage(CHANNEL_ID, message);
    setLock(lockKey, BTC_LOCK_TTL_MS);
    console.log("✅ [FREE BTC Scan] 메시지 전송 완료 (락 설정됨)");
  } catch (err) {
    console.error("[FREE BTC Scan] 오류:", err.message);
  }
};

module.exports = {
  freeAltScan,
  freeBtcScan,
};
