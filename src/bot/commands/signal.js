const binanceEngine = require("../../workers/binanceSignalEngine");

const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

function formatTimeAgo(seconds) {
  if (seconds < 60) return `${seconds}초 전`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
  return `${Math.floor(seconds / 3600)}시간 전`;
}

const signalStatusCommand = async (ctx) => {
  try {
    const status = binanceEngine.getStatus();
    
    const wsStatus = status.wsConnected ? "🟢 연결됨" : "🔴 끊김";
    const klineWsStatus = status.klineWsConnected ? "🟢 연결됨" : "🔴 끊김";
    const engineStatus = status.running ? "🟢 실행 중" : "🔴 중지됨";
    
    let healthStatus = "🟢 정상";
    if (status.lastUpdateAgo > 300) {
      healthStatus = "🔴 Critical (5분 이상 업데이트 없음)";
    } else if (status.lastUpdateAgo > 180) {
      healthStatus = "🟡 Warning (3분 이상 업데이트 없음)";
    }
    
    const message = `📊 **고래 시그널 엔진 상태**

🔧 **엔진 상태**: ${engineStatus}
🌐 **AggTrade WS**: ${wsStatus}
📈 **Kline WS**: ${klineWsStatus}
⏱ **마지막 업데이트**: ${formatTimeAgo(status.lastUpdateAgo)}
📝 **최근 1분 거래**: ${status.recentTrades.toLocaleString()}건
🎯 **감시 심볼 수**: ${status.symbolCount}개

📦 **데이터 상태**:
• Trade Buckets: ${status.tradeBucketCount}개
• Baseline Volumes: ${status.baselineCount}개
• 24h Ticker: ${status.ticker24hCount}개

🏥 **헬스 체크**: ${healthStatus}
${status.lastError ? `\n⚠️ **마지막 에러**: ${status.lastError}` : ""}

────────────────
📡 KimpAI v2.3b 고래 시그널 엔진`;

    await ctx.reply(message, { parse_mode: "Markdown" });
  } catch (err) {
    console.error("/signal_status error:", err);
    await ctx.reply("❌ 엔진 상태를 조회할 수 없습니다.");
  }
};

const signalTestCommand = async (ctx) => {
  try {
    if (!CHANNEL_ID) {
      await ctx.reply("⚠️ TELEGRAM_CHANNEL_ID가 설정되지 않았습니다.");
      return;
    }
    
    const testMessage = `🚨 [TEST] 고래 매도 활동 감지!

⏱ 최근 1분
💵 체결 규모: $50,000 (TEST)
📊 거래량: 평균 대비 12배

⚠️ 이는 테스트 메시지이며 실제 시장 시그널이 아닙니다.

────────────────
📡 KimpAI – 시그널 테스트 발송`;

    await ctx.telegram.sendMessage(CHANNEL_ID, testMessage);
    await ctx.reply("✅ 테스트 시그널이 채널로 발송되었습니다.");
  } catch (err) {
    console.error("/signal_test error:", err);
    await ctx.reply(`❌ 테스트 발송 실패: ${err.message}`);
  }
};

const signalRestartCommand = async (ctx) => {
  try {
    await ctx.reply("🔄 시그널 엔진 재시작 중...");
    
    await binanceEngine.restart();
    
    await ctx.reply("✅ 시그널 엔진이 재시작되었습니다.");
  } catch (err) {
    console.error("/signal_restart error:", err);
    await ctx.reply(`❌ 엔진 재시작 실패: ${err.message}`);
  }
};

module.exports = {
  signalStatusCommand,
  signalTestCommand,
  signalRestartCommand
};
