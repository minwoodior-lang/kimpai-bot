const { Telegraf } = require("telegraf");
const cron = require("node-cron");
require("dotenv").config();

// 개발환경에서는 반드시 봇 비활성화 (중복 실행 방지)
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const BOT_ENABLED = IS_PRODUCTION && process.env.BOT_ENABLED !== 'false';

if (!BOT_ENABLED) {
  const reason = !IS_PRODUCTION ? "(development environment)" : "(BOT_ENABLED=false)";
  console.log(`🔴 봇이 비활성화되었습니다 ${reason}`);
  if (!IS_PRODUCTION) {
    console.log("💡 프로덕션 배포 시에만 봇이 자동으로 실행됩니다");
  }
  module.exports = { bot: null, startBot: () => Promise.resolve() };
  return;
}

console.log("🤖 KimpAI Bot starting...", {
  pid: process.pid,
  env: process.env.NODE_ENV || "development",
  timestamp: new Date().toISOString(),
});

const freeCommands = require("./commands/free");
const proCommands = require("./commands/pro");
const signalCommands = require("./commands/signal");

const { runAllFreeSignals } = require("./schedulers/freeSignals");
const { proWatchlistScan, proBtcForcastScan } = require("./schedulers/proScan");

// 시그널 엔진 비활성화 옵션 (개발환경에서 끄기)
const DISABLE_SIGNAL_ENGINE = process.env.DISABLE_SIGNAL_ENGINE === 'true';

let binanceEngine = null;

if (DISABLE_SIGNAL_ENGINE) {
  console.log("🔴 Signal Engine 비활성화됨 (DISABLE_SIGNAL_ENGINE=true)");
  console.log("💡 프로덕션에서는 pm2로 signalWorker.js를 별도 실행하세요");
} else {
  try {
    // ✅ Railway에서 require가 100% 정상 로드되도록 .js 확장자 포함
    // 그리고 정확한 파일명: src/workers/binanceSignalEngine.js
    binanceEngine = require("../workers/binanceSignalEngine.js");

    console.log("✅ Binance Signal Engine 로드 완료");
  } catch (err) {
    console.warn("⚠️ Binance Signal Engine 로드 실패:", err.message);
  }
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN이 설정되지 않았습니다.");
  module.exports = { bot: null, startBot: () => Promise.resolve() };
  return;
}

const bot = new Telegraf(BOT_TOKEN);

// =========================
// Commands
// =========================
bot.command("start", freeCommands.startCommand);
bot.command("btc", freeCommands.btcCommand);
bot.command("eth", freeCommands.ethCommand);
bot.command("alt", freeCommands.altCommand);
bot.command("watchlist", freeCommands.watchlistCommand);
bot.command("add_watchlist", freeCommands.addWatchlistCommand);
bot.command("remove_watchlist", freeCommands.removeWatchlistCommand);

bot.command("pro_btc", proCommands.proBtcCommand);
bot.command("pro_whale", proCommands.proWhaleCommand);
bot.command("pro_risk", proCommands.proRiskCommand);

bot.command("signal_status", signalCommands.signalStatusCommand);
bot.command("signal_test", signalCommands.signalTestCommand);
bot.command("signal_restart", signalCommands.signalRestartCommand);

console.log("📅 스케줄러 등록 중...");

// =========================
// FREE Signals Interval
// =========================
let freeSignalInterval = null;

async function initializeFreeSignals() {
  if (!binanceEngine) {
    console.warn("⚠️ Binance Signal Engine을 로드할 수 없습니다. 실시간 시그널이 작동하지 않습니다.");
    return;
  }

  try {
    console.log("[INIT] Binance Signal Engine 초기화 시작...");
    await binanceEngine.initialize();

    console.log("✅ Binance Signal Engine 초기화 완료");

    binanceEngine.startHealthCheck();
    console.log("✅ 엔진 헬스체크 시작됨 (30초마다)");

    freeSignalInterval = setInterval(async () => {
      try {
        await runAllFreeSignals(bot);
      } catch (err) {
        console.error("[FREE Signals] 실행 오류:", err.message);
      }
    }, 30000);

    console.log("✅ FREE 실시간 시그널 등록 완료 (30초마다 검사)");

  } catch (err) {
    console.error("❌ Binance Signal Engine 초기화 실패:", err.message);
    console.error("[ERROR] 에러 스택:", err.stack);
  }
}

// =========================
// PRO Schedulers
// =========================
cron.schedule("*/5 * * * *", () => {
  console.log("⏰ PRO 관심종목 스캔 트리거 (5분마다)");
  proWatchlistScan(bot).catch(err => console.error("PRO Watchlist 스캔 오류:", err.message));
});
console.log("✅ PRO 관심종목 스캔 등록 완료 (5분마다)");

cron.schedule("0 */6 * * *", () => {
  console.log("⏰ PRO BTC 예측 스캔 트리거 (6시간마다)");
  proBtcForcastScan(bot).catch(err => console.error("PRO BTC Forecast 스캔 오류:", err.message));
});
console.log("✅ PRO BTC 예측 스캔 등록 완료 (6시간마다)");


// =========================
// Start Bot
// =========================
const startBot = async () => {
  try {
    await initializeFreeSignals();

    await bot.launch();
    console.log("✅ Telegram Bot 시작됨");
    console.log(`📌 BOT_TOKEN: ${BOT_TOKEN.substring(0, 10)}...`);
    console.log(`📌 CHANNEL_ID: ${process.env.TELEGRAM_CHANNEL_ID || "미설정"}`);
    console.log(`📌 API_BASE_URL: ${process.env.API_BASE_URL || process.env.API_URL || "http://localhost:5000"}`);

    process.once("SIGINT", () => {
      if (freeSignalInterval) clearInterval(freeSignalInterval);
      if (binanceEngine) binanceEngine.stop();
      bot.stop("SIGINT");
    });

    process.once("SIGTERM", () => {
      if (freeSignalInterval) clearInterval(freeSignalInterval);
      if (binanceEngine) binanceEngine.stop();
      bot.stop("SIGTERM");
    });

  } catch (err) {
    if (err.response?.error_code === 409) {
      console.warn("⚠️ 다른 봇 인스턴스가 이미 실행 중입니다. 스케줄러는 계속 작동합니다.");
      console.warn("⚠️ 프로덕션 환경에서는 하나의 인스턴스만 실행해야 합니다.");
    } else {
      console.error("❌ 봇 시작 오류:", err.message);
    }
  }
};

if (require.main === module) {
  startBot();
}

module.exports = { bot, startBot };
