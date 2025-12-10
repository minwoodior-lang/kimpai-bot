const messages = require("../utils/messages");
const { generateAiLine } = require("../utils/aiInterpret");
const localData = require("../utils/localData");

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

const proBtcCommand = async (ctx) => {
  try {
    const data = localData.getProBtcData();
    if (!data || !data.korean_price) {
      await ctx.reply("❌ BTC 예측 데이터를 조회할 수 없습니다. 나중에 다시 시도해주세요.");
      return;
    }
    console.log(`✅ [PRO BTC] 로컬 데이터: 김프 ${data.kimp}%, 국내가 ${data.korean_price?.toLocaleString()}`);

    const payload = {
      current_kimp: data.kimp,
      korean_price: data.korean_price,
      global_price: data.global_price,
      change_24h: data.change_24h,
      up_prob: data.up_prob,
      score: data.score,
    };
    const aiLine = await generateAiLine("PRO_BTC", payload);
    data.ai_line = aiLine;

    const message = messages.proBtcForecast(data);
    await ctx.reply(message);
  } catch (err) {
    console.error("/pro_btc error:", err);
    await ctx.reply("❌ BTC 예측 데이터를 조회할 수 없습니다.");
  }
};

const proWhaleCommand = async (ctx) => {
  try {
    const args = ctx.message.text.split(" ");
    const symbol = args[1]?.toUpperCase();

    if (!symbol) {
      await ctx.reply("⚠️ 사용법: /pro_whale BTC");
      return;
    }

    const data = localData.getProWhaleData(symbol);
    if (!data) {
      await ctx.reply(`❌ ${symbol} 고래 매집 데이터를 조회할 수 없습니다.`);
      return;
    }
    console.log(`✅ [PRO Whale] ${symbol} 로컬 데이터: 순입금 ${data.net_inflow}, 추세 ${data.trend}`);

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
    await ctx.reply(message);
  } catch (err) {
    console.error("/pro_whale error:", err);
    await ctx.reply("❌ 고래 매집 데이터를 조회할 수 없습니다.");
  }
};

const proRiskCommand = async (ctx) => {
  try {
    const args = ctx.message.text.split(" ");
    const symbol = args[1]?.toUpperCase();

    if (!symbol) {
      await ctx.reply("⚠️ 사용법: /pro_risk BTC");
      return;
    }

    const data = localData.getProRiskData(symbol);
    if (!data) {
      await ctx.reply(`❌ ${symbol} 리스크 분석 데이터를 조회할 수 없습니다.`);
      return;
    }
    console.log(`✅ [PRO Risk] ${symbol} 로컬 데이터: 리스크 ${data.risk_level}`);

    const payload = {
      symbol: data.symbol,
      pattern_name: data.pattern_name,
      risk_level: data.risk_level,
      change_24h: data.change_24h,
      premium: data.premium,
      pl_desc: data.pl_desc,
    };
    const aiLine = await generateAiLine("PRO_RISK", payload);
    data.ai_line = aiLine;

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
