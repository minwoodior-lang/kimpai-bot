#!/usr/bin/env node
/**
 * 독립 시그널 워커 (프로덕션용)
 * 
 * pm2로 실행:
 *   pm2 start src/workers/signalWorker.js --name signal-engine
 * 
 * 이 워커는 메인 서버와 독립적으로 실행되며,
 * 서버가 재시작되어도 시그널 엔진은 계속 작동합니다.
 */

require('dotenv').config();
const { Telegraf } = require('telegraf');

console.log('🚀 Signal Worker 시작...');
console.log('📅 시작 시간:', new Date().toISOString());
console.log('🔧 PID:', process.pid);

// 개발 환경에서는 실행 안 함 (Railway/PM2 실제 운영에서만)
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
if (!IS_PRODUCTION) {
  console.log('[SignalWorker] Disabled (development environment)');
  process.exit(0);
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN이 설정되지 않았습니다.');
  process.exit(1);
}

if (!CHANNEL_ID) {
  console.error('❌ TELEGRAM_CHANNEL_ID가 설정되지 않았습니다.');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

const binanceEngine = require('./binanceSignalEngine');
const {
  runAllFreeSignals,
  initializeSymbolUpdater,
} = require('../bot/schedulers/freeSignals');

let signalInterval = null;

async function start() {
  try {
    console.log('[SignalWorker] Binance Signal Engine 초기화 시작...');
    await binanceEngine.initialize();
    console.log('✅ Binance Signal Engine 초기화 완료');

    // 헬스체크 루프 시작 (30초마다 상태점검 + 자동 재시작)
    binanceEngine.startHealthCheck();
    console.log('✅ 엔진 헬스체크 시작됨 (30초마다)');

    // 심볼 자동 갱신 (Binance TOP 심볼)
    try {
      initializeSymbolUpdater();
      console.log('✅ 심볼 자동 갱신(initializeSymbolUpdater) 시작됨');
    } catch (symErr) {
      console.warn(
        '[SignalWorker] 심볼 자동 갱신 시작 실패:',
        symErr.message || symErr,
      );
    }

    // FREE 시그널 루프 (30초마다 고래 + 김프 스캔)
    signalInterval = setInterval(async () => {
      try {
        await runAllFreeSignals(bot);
      } catch (err) {
        console.error(
          '[SignalWorker] 시그널 실행 오류:',
          err.message || err,
        );
      }
    }, 30000);

    console.log('✅ FREE 실시간 시그널 등록 완료 (30초마다 검사)');
    console.log('🟢 Signal Worker 정상 작동 중...');

    // 시작 알림 (실패해도 워커는 계속 돈다)
    bot.telegram
      .sendMessage(
        CHANNEL_ID,
        '🟢 Signal Worker가 시작되었습니다.\n' +
          `📅 ${new Date().toLocaleString('ko-KR', {
            timeZone: 'Asia/Seoul',
          })}\n` +
          `🔧 PID: ${process.pid}`,
      )
      .catch((err) =>
        console.warn('[SignalWorker] 시작 알림 실패:', err.message || err),
      );
  } catch (err) {
    console.error('❌ Signal Worker 초기화 실패:', err.message || err);
    console.error(err.stack);
    // pm2 / 프로세스 관리자에서 재시작하도록 종료
    process.exit(1);
  }
}

function shutdown(signal) {
  console.log(`\n${signal} 수신, 종료 중...`);

  if (signalInterval) {
    clearInterval(signalInterval);
    signalInterval = null;
  }

  if (binanceEngine && typeof binanceEngine.stop === 'function') {
    try {
      binanceEngine.stop();
    } catch (e) {
      console.error(
        '[SignalWorker] binanceEngine.stop() 중 오류:',
        e.message || e,
      );
    }
  }

  // 종료 알림은 실패해도 그냥 종료
  bot.telegram
    .sendMessage(
      CHANNEL_ID,
      '🔴 Signal Worker가 종료되었습니다.\n' +
        `📅 ${new Date().toLocaleString('ko-KR', {
          timeZone: 'Asia/Seoul',
        })}\n` +
        `🔧 Signal: ${signal}`,
    )
    .catch(() => {})
    .finally(() => {
      process.exit(0);
    });

  // 혹시 위가 hanging 되면 3초 후 강제 종료
  setTimeout(() => process.exit(0), 3000);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message || err);
  console.error(err.stack);
  // 여기서 바로 process.exit 안 하고, pm2가 죽인 뒤 재시작하도록 놔둘 수도 있지만
  // 지금은 로그만 찍고 워커 계속 돌리기
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  // 마찬가지로 프로세스는 살려둠
});

start();
