const { Telegraf } = require("telegraf");
const cron = require("node-cron");
require("dotenv").config();

console.log("🤖 KimpAI Bot starting...", {
  pid: process.pid,
  env: process.env.NODE_ENV || "development",
  timestamp: new Date().toISOString(),
});

// 명령어들
const freeCommands = require("./commands/free");
const proCommands = require("./commands/pro");

// 스케줄러들
const { freeAltScan, freeBtcScan } = require("./schedulers/freeScan");
const { proWatchlistScan, proBtcForcastScan } = require("./schedulers/proScan");

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN이 설정되지 않았습니다.");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// === 무료(FREE) 명령어 등록 ===
bot.command("start", freeCommands.startCommand);
bot.command("btc", freeCommands.btcCommand);
bot.command("eth", freeCommands.ethCommand);
bot.command("alt", freeCommands.altCommand);
bot.command("watchlist", freeCommands.watchlistCommand);
bot.command("add_watchlist", freeCommands.addWatchlistCommand);
bot.command("remove_watchlist", freeCommands.removeWatchlistCommand);

// === PRO 명령어 등록 ===
// 현재는 PRO 체크 없이 기본 동작 (추후 checkPro 미들웨어 추가 가능)
bot.command("pro_btc", proCommands.proBtcCommand);
bot.command("pro_whale", proCommands.proWhaleCommand);
bot.command("pro_risk", proCommands.proRiskCommand);

// === 스케줄러 등록 ===
console.log("📅 스케줄러 등록 중...");

// FREE 스캔: 10분마다 TOP50 ALT 스캔
cron.schedule("*/10 * * * *", () => {
  console.log("⏰ FREE ALT 스캔 트리거 (10분마다)");
  freeAltScan(bot).catch((err) => console.error("FREE ALT 스캔 오류:", err.message));
});
console.log("✅ FREE ALT 스캔 등록 완료 (10분마다)");

// FREE 스캔: 30분마다 BTC 김프 감시
cron.schedule("*/30 * * * *", () => {
  console.log("⏰ FREE BTC 스캔 트리거 (30분마다)");
  freeBtcScan(bot).catch((err) => console.error("FREE BTC 스캔 오류:", err.message));
});
console.log("✅ FREE BTC 스캔 등록 완료 (30분마다)");

// PRO 스캔: 5분마다 사용자 관심종목 스캔
cron.schedule("*/5 * * * *", () => {
  console.log("⏰ PRO 관심종목 스캔 트리거 (5분마다)");
  proWatchlistScan(bot).catch((err) => console.error("PRO Watchlist 스캔 오류:", err.message));
});
console.log("✅ PRO 관심종목 스캔 등록 완료 (5분마다)");

// PRO 스캔: 6시간마다 BTC 48시간 예측 전송
cron.schedule("0 */6 * * *", () => {
  console.log("⏰ PRO BTC 예측 스캔 트리거 (6시간마다)");
  proBtcForcastScan(bot).catch((err) => console.error("PRO BTC Forecast 스캔 오류:", err.message));
});
console.log("✅ PRO BTC 예측 스캔 등록 완료 (6시간마다)");

// === 봇 시작 ===
const startBot = async () => {
  try {
    await bot.launch();
    console.log("✅ Telegram Bot 시작됨");
    console.log(`📌 BOT_TOKEN: ${BOT_TOKEN.substring(0, 10)}...`);
    console.log(`📌 CHANNEL_ID: ${process.env.TELEGRAM_CHANNEL_ID || "미설정"}`);
    console.log(`📌 API_BASE_URL: ${process.env.API_BASE_URL || process.env.API_URL || "http://localhost:5000"}`);

    // Graceful shutdown
    process.once("SIGINT", () => bot.stop("SIGINT"));
    process.once("SIGTERM", () => bot.stop("SIGTERM"));
  } catch (err) {
    if (err.response?.error_code === 409) {
      console.warn("⚠️ 다른 봇 인스턴스가 이미 실행 중입니다. 스케줄러는 계속 작동합니다.");
      console.warn("⚠️ 프로덕션 환경에서는 하나의 인스턴스만 실행해야 합니다.");
    } else {
      console.error("❌ 봇 시작 오류:", err.message);
    }
  }
};

// 이 파일이 직접 실행되는 경우
if (require.main === module) {
  startBot();
}

module.exports = { bot, startBot };
