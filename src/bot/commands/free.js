const axios = require("axios");
const messages = require("../utils/messages");
const { generateSignalLine } = require("../utils/signalLine");

const API_BASE = process.env.API_BASE_URL || process.env.API_URL || "http://localhost:5000";

const btcCommand = async (ctx) => {
  try {
    let data;
    try {
      const response = await axios.get(`${API_BASE}/api/bot/btc`, { timeout: 5000 });
      data = response.data;
    } catch (err) {
      console.warn("⚠️ BTC API 호출 실패:", err.message);
      await ctx.reply("❌ BTC 데이터를 조회할 수 없습니다. 나중에 다시 시도해주세요.");
      return;
    }

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
      change_24h: data.change_24h,
      signal_line: signalLine,
    };

    const message = messages.btcKimp(messageData);
    await ctx.reply(message);
  } catch (err) {
    console.error("/btc error:", err);
    await ctx.reply("❌ BTC 데이터를 조회할 수 없습니다. 나중에 다시 시도해주세요.");
  }
};

const ethCommand = async (ctx) => {
  try {
    let data;
    try {
      const response = await axios.get(`${API_BASE}/api/bot/eth`, { timeout: 5000 });
      data = response.data;
    } catch (err) {
      console.warn("⚠️ ETH API 호출 실패:", err.message);
      await ctx.reply("❌ ETH 데이터를 조회할 수 없습니다. 나중에 다시 시도해주세요.");
      return;
    }

    const signalLine = generateSignalLine("volatility");
    
    const messageData = {
      current_price_krw: data.korean_price,
      current_price_usdt: data.global_price,
      oi: data.oi,
      fund: data.fund,
      bias: data.bias,
      vol_prev: data.vol_prev,
      vol_now: data.vol_now,
      signal_line: signalLine,
    };

    const message = messages.ethVolatility(messageData);
    await ctx.reply(message);
  } catch (err) {
    console.error("/eth error:", err);
    await ctx.reply("❌ ETH 데이터를 조회할 수 없습니다. 나중에 다시 시도해주세요.");
  }
};

const altCommand = async (ctx) => {
  try {
    const args = ctx.message.text.split(" ");
    const symbol = args[1]?.toUpperCase();

    if (!symbol) {
      await ctx.reply("⚠️ 사용법: /alt BTC\n또는 /alt SUI");
      return;
    }

    let data;
    try {
      const response = await axios.get(`${API_BASE}/api/bot/alts/${symbol}`, { timeout: 5000 });
      data = response.data;
    } catch (err) {
      console.warn(`⚠️ ${symbol} API 호출 실패:`, err.message);
      await ctx.reply(`❌ ${symbol} 데이터를 조회할 수 없습니다.`);
      return;
    }

    const priceChange = parseFloat(data.price_change_1h || data.price_change || 0);
    let signalType = "volatility";
    if (priceChange >= 3) {
      signalType = "up";
    } else if (priceChange <= -3) {
      signalType = "down";
    }

    const signalLine = generateSignalLine(signalType);
    
    const messageData = {
      symbol: data.symbol,
      current_price_krw: data.korean_price,
      current_price_usdt: data.usdt_price || data.global_price,
      volume_change_1h: data.volume_change_1h || data.vol_change || "0",
      price_change_1h: data.price_change_1h || data.price_change || "0",
      premium: data.premium || "0",
      funding_rate: data.funding_rate || data.fund || "0",
      signal_line: signalLine,
    };

    const message = messages.altSignal(messageData);
    await ctx.reply(message);
  } catch (err) {
    console.error("/alt error:", err);
    await ctx.reply("❌ ALT 데이터를 조회할 수 없습니다.");
  }
};

const watchlistCommand = async (ctx) => {
  const { getUserByChatId } = require("../utils/supabase");
  try {
    const user = await getUserByChatId(ctx.chat.id);
    const watchlist = user?.watchlist || [];
    const message =
      watchlist.length > 0
        ? `📌 내 관심종목:\n${watchlist.join(", ")}\n\n/add_watchlist {symbol} - 추가\n/remove_watchlist {symbol} - 제거`
        : `📌 관심종목이 없습니다.\n/add_watchlist {symbol} - 추가해주세요`;
    await ctx.reply(message);
  } catch (err) {
    console.error("/watchlist error:", err);
    await ctx.reply("❌ 관심종목을 조회할 수 없습니다.");
  }
};

const addWatchlistCommand = async (ctx) => {
  const { addWatchlist } = require("../utils/supabase");
  try {
    const args = ctx.message.text.split(" ");
    const symbol = args[1]?.toUpperCase();

    if (!symbol) {
      await ctx.reply("⚠️ 사용법: /add_watchlist BTC");
      return;
    }

    await addWatchlist(ctx.chat.id, symbol);
    await ctx.reply(`✅ ${symbol}을(를) 관심종목에 추가했습니다.`);
  } catch (err) {
    console.error("/add_watchlist error:", err);
    await ctx.reply("❌ 관심종목 추가에 실패했습니다.");
  }
};

const removeWatchlistCommand = async (ctx) => {
  const { removeWatchlist } = require("../utils/supabase");
  try {
    const args = ctx.message.text.split(" ");
    const symbol = args[1]?.toUpperCase();

    if (!symbol) {
      await ctx.reply("⚠️ 사용법: /remove_watchlist BTC");
      return;
    }

    await removeWatchlist(ctx.chat.id, symbol);
    await ctx.reply(`✅ ${symbol}을(를) 관심종목에서 제거했습니다.`);
  } catch (err) {
    console.error("/remove_watchlist error:", err);
    await ctx.reply("❌ 관심종목 제거에 실패했습니다.");
  }
};

const startCommand = async (ctx) => {
  const { upsertTelegramUserFromCtx } = require("../utils/supabase");
  
  const source = ctx.chat?.type === "private" ? "direct_dm" : "channel";
  await upsertTelegramUserFromCtx(ctx, source);

  const message = `🤖 KimpAI 텔레그램 봇에 오신 것을 환영합니다!

📊 실시간 김프 분석 및 시그널 알림을 제공합니다.

💡 무료(FREE) 명령어:
/btc - BTC 김프 변화 감지
/eth - ETH 변동성 증가 신호
/alt {symbol} - 알트코인 단기 분석 (예: /alt SUI)
/watchlist - 내 관심종목 확인
/add_watchlist {symbol} - 관심종목 추가
/remove_watchlist {symbol} - 관심종목 제거

⭐ PRO 명령어 (가입 후 사용):
/pro_btc - BTC 48시간 예측
/pro_whale {symbol} - 고래 매집 포착
/pro_risk {symbol} - 과열·폭락 리스크

자세히: https://kimpai.io`;

  await ctx.reply(message);
};

module.exports = {
  btcCommand,
  ethCommand,
  altCommand,
  watchlistCommand,
  addWatchlistCommand,
  removeWatchlistCommand,
  startCommand,
};
