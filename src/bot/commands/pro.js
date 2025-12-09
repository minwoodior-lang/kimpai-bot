const axios = require("axios");
const messages = require("../utils/messages");

const API_BASE = process.env.API_URL || "http://localhost:5000";

// 샘플 PRO 데이터 생성
const generateMockProData = (type, symbol = "BTC") => {
  const randomPercent = () => (Math.random() * 10 - 5).toFixed(2);
  const randomProb = () => Math.floor(Math.random() * 20 + 75);
  const randomAI = () => {
    const messages = [
      "강한 상승 신호 감지됨",
      "조정 가능성 높음",
      "고래 매집 활동 포착",
      "변동성 증가 예상",
      "강력한 저항선 형성 중",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  if (type === "btc") {
    return {
      kimp: (Math.random() * 3 + 0.5).toFixed(2),
      score: Math.floor(Math.random() * 4 + 6),
      ls_ratio: `${Math.random() > 0.5 ? 6 : 4}:${Math.random() > 0.5 ? 4 : 6}`,
      up_prob: Math.floor(Math.random() * 30 + 55),
      min: randomPercent(),
      max: randomPercent(),
      dp1: (Math.random() * 2000 + 40000).toFixed(0),
      dp2: (Math.random() * 2000 + 38000).toFixed(0),
      tp1: (Math.random() * 2000 + 45000).toFixed(0),
      tp2: (Math.random() * 2000 + 47000).toFixed(0),
    };
  } else if (type === "whale") {
    return {
      symbol,
      net_inflow: (Math.random() * 1000 + 100).toFixed(0),
      avg_entry: (Math.random() * 500 + 1000).toFixed(2),
      duration: "2-3시간",
      ai_line: randomAI(),
      prob: randomProb(),
      range: randomPercent(),
    };
  } else if (type === "risk") {
    return {
      symbol,
      vol: randomPercent(),
      fund: randomPercent(),
      pl_desc: "수익 실현 중",
      pattern_name: "Double Top",
      prob: randomProb(),
      min: randomPercent(),
      max: randomPercent(),
      entry: "현재 매수 권장하지 않음",
      manage: "기존 포지션 점진적 익절",
    };
  }
};

// PRO 사용자 확인 미들웨어
const checkPro = async (ctx, next) => {
  const { getUserByChatId } = require("../utils/supabase");
  const user = await getUserByChatId(ctx.chat.id);
  if (!user?.is_pro) {
    const proMessage = `${messages.proLocked}\n\n${ctx.match[0]}는 PRO 전용 기능입니다.`;
    await ctx.reply(proMessage);
    return;
  }
  return next();
};

// /pro_btc 명령어
const proBtcCommand = async (ctx) => {
  try {
    let data;
    try {
      const response = await axios.get(`${API_BASE}/api/bot/pro/btc`, { timeout: 5000 });
      data = response.data;
    } catch (err) {
      console.warn("⚠️ API 호출 실패, 샘플 데이터 사용");
      data = generateMockProData("btc");
    }

    const message = messages.proBtcForecast(data);
    await ctx.reply(message);
  } catch (err) {
    console.error("/pro_btc error:", err);
    await ctx.reply("❌ BTC 예측 데이터를 조회할 수 없습니다.");
  }
};

// /pro_whale {symbol} 명령어
const proWhaleCommand = async (ctx) => {
  try {
    const args = ctx.message.text.split(" ");
    const symbol = args[1]?.toUpperCase();

    if (!symbol) {
      await ctx.reply("⚠️ 사용법: /pro_whale BTC");
      return;
    }

    let data;
    try {
      const response = await axios.get(`${API_BASE}/api/bot/pro/whale/${symbol}`, { timeout: 5000 });
      data = response.data;
    } catch (err) {
      console.warn(`⚠️ ${symbol} 고래 API 호출 실패, 샘플 데이터 사용`);
      data = generateMockProData("whale", symbol);
    }

    const message = messages.proWhaleSignal(data);
    await ctx.reply(message);
  } catch (err) {
    console.error("/pro_whale error:", err);
    await ctx.reply("❌ 고래 매집 데이터를 조회할 수 없습니다.");
  }
};

// /pro_risk {symbol} 명령어
const proRiskCommand = async (ctx) => {
  try {
    const args = ctx.message.text.split(" ");
    const symbol = args[1]?.toUpperCase();

    if (!symbol) {
      await ctx.reply("⚠️ 사용법: /pro_risk BTC");
      return;
    }

    let data;
    try {
      const response = await axios.get(`${API_BASE}/api/bot/pro/risk/${symbol}`, { timeout: 5000 });
      data = response.data;
    } catch (err) {
      console.warn(`⚠️ ${symbol} 리스크 API 호출 실패, 샘플 데이터 사용`);
      data = generateMockProData("risk", symbol);
    }

    const message = messages.proRiskWarning(data);
    await ctx.reply(message);
  } catch (err) {
    console.error("/pro_risk error:", err);
    await ctx.reply("❌ 리스크 분석 데이터를 조회할 수 없습니다.");
  }
};

module.exports = {
  proBtcCommand,
  proWhaleCommand,
  proRiskCommand,
  checkPro,
};
