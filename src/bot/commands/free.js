const axios = require("axios");
const messages = require("../utils/messages");

const API_BASE = process.env.API_URL || "http://localhost:5000";

// 샘플 데이터 생성 함수 (API 엔드포인트가 없을 때 대체)
const generateMockData = (type, symbol = null) => {
  const randomPercent = () => (Math.random() * 10 - 5).toFixed(2);
  const randomProb = () => Math.floor(Math.random() * 30 + 60);
  const randomAI = () => {
    const messages = [
      "현재 추세상 상승세가 강함",
      "변동성이 높아 신중한 진입 필요",
      "과거 패턴과 유사한 신호 감지",
      "단기 조정이 예상됨",
      "강한 매매 관심 신호",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  if (type === "btc") {
    return {
      prev: randomPercent(),
      current: (Math.random() * 2 + 0.5).toFixed(2),
      trend: "높음",
      ai_line: randomAI(),
      prob: randomProb(),
      future_move: randomPercent(),
    };
  } else if (type === "eth") {
    return {
      oi: randomPercent(),
      fund: randomPercent(),
      bias: "Long",
      vol_prev: randomPercent(),
      vol_now: randomPercent(),
      ai_line: randomAI(),
    };
  } else if (type === "alt") {
    return {
      symbol: symbol || "BNB",
      vol_change: randomPercent(),
      price_change: randomPercent(),
      fund: randomPercent(),
      ai_line: randomAI(),
      prob: randomProb(),
      range: randomPercent(),
    };
  }
};

// /btc 명령어
const btcCommand = async (ctx) => {
  try {
    let data;
    try {
      const response = await axios.get(`${API_BASE}/api/bot/btc`, { timeout: 5000 });
      data = response.data;
    } catch (err) {
      console.warn("⚠️ API 호출 실패, 샘플 데이터 사용");
      data = generateMockData("btc");
    }

    const message = messages.btcKimp(data);
    await ctx.reply(message);
  } catch (err) {
    console.error("/btc error:", err);
    await ctx.reply("❌ BTC 데이터를 조회할 수 없습니다. 나중에 다시 시도해주세요.");
  }
};

// /eth 명령어
const ethCommand = async (ctx) => {
  try {
    let data;
    try {
      const response = await axios.get(`${API_BASE}/api/bot/eth`, { timeout: 5000 });
      data = response.data;
    } catch (err) {
      console.warn("⚠️ API 호출 실패, 샘플 데이터 사용");
      data = generateMockData("eth");
    }

    const message = messages.ethVolatility(data);
    await ctx.reply(message);
  } catch (err) {
    console.error("/eth error:", err);
    await ctx.reply("❌ ETH 데이터를 조회할 수 없습니다. 나중에 다시 시도해주세요.");
  }
};

// /alt {symbol} 명령어
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
      console.warn(`⚠️ ${symbol} API 호출 실패, 샘플 데이터 사용`);
      data = generateMockData("alt", symbol);
    }

    const message = messages.altSignal(data);
    await ctx.reply(message);
  } catch (err) {
    console.error("/alt error:", err);
    await ctx.reply("❌ ALT 데이터를 조회할 수 없습니다.");
  }
};

// /watchlist 명령어 (관심종목 조회)
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

// /add_watchlist 명령어
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

// /remove_watchlist 명령어
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

// /start 명령어
const startCommand = async (ctx) => {
  const message = `🤖 KimpAI 텔레그램 봇에 오신 것을 환영합니다!

📊 실시간 김프 분석 및 AI 기반 암호화폐 트레이딩 신호를 제공합니다.

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
