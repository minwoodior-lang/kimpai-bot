#!/usr/bin/env node
/**
 * 독립 시그널 워커 (Railway / 프로덕션용 경량 버전)
 *
 * ❗ 중요:
 *  - 여기서는 Binance WebSocket / HTTP 절대 직접 호출 안 함
 *  - 오직 ../bot/schedulers/freeSignals 에게만 맡긴다
 *  - freeSignals.js 가 나중에 Render API를 때리든, 로컬 데이터를 보든
 *    이 워커는 그냥 "30초마다 runAllFreeSignals 호출"만 담당
 *
 * pm2 예시:
 *  pm2 start src/workers/signalWorker.js --name signal-engine
 */

require('dotenv').config();
const { Telegraf } = require('telegraf');

console.log('🚀 Signal Worker 시작 (Railway 경량 버전)...');
console.log('📅 시작 시간:', new Date().toISOString());
console.log('🔧 PID:', process.pid);

// 개발 환경에서는 실행 안 함
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

// 여기서부터는 "텔레그램 + freeSignals"만 사용
const bot = new Telegraf(BOT_TOKEN);
const { runAllFreeSignals } = require('../bot/schedulers/freeSignals');

let signalInterval = null;

async function start() {
  try {
    console.log('[SignalWorker] BinanceSignalEngine 사용 안 함 (Railway 전용 경량 모드)');

    // 30초마다 freeSignals 실행
    signalInterval = setInterval(async () => {
      try {
        await runAllFreeSignals(bot);
      } catch (err) {
        console.error('[SignalWorker] 시그널 실행 오류:', err.message || err);
      }
    }, 30000);

    console.log('✅ FREE 실시간 시그널 등록 완료 (30초마다 검사)');
    console.log('🟢 Signal Worker 정상 작동 중 (Render/kimpai.io 등 외부 데이터 기반)...');

    // 시작 알림 전송 (옵션)
    await bot.telegram
      .sendMessage(
        CHANNEL_ID,
        '🟢 Signal Worker (Railway) 시작되었습니다.\n' +
          '📡 데이터 소스: 외부 시그널 엔진(API)\n' +
          `📅 ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}\n` +
          `🔧 PID: ${process.pid}`,
      )
      .catch((err) => console.warn('[SignalWorker] 시작 알림 실패:', err.message || err));
  } catch (err) {
    console.error('❌ Signal Worker 초기화 실패:', err.message || err);
    console.error(err.stack);
    process.exit(1);
  }
}

function shutdown(signal) {
  console.log(`\n${signal} 수신, 종료 중...`);

  if (signalInterval) {
    clearInterval(signalInterval);
    signalInterval = null;
  }

  bot.telegram
    .sendMessage(
      CHANNEL_ID,
      '🔴 Signal Worker (Railway)가 종료되었습니다.\n' +
        `📅 ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}\n` +
        `🔧 Signal: ${signal}`,
    )
    .catch(() => {})
    .finally(() => {
      process.exit(0);
    });

  // 혹시 텔레그램 전송이 막혀도 3초 후 강제 종료
  setTimeout(() => process.exit(0), 3000);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message || err);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
});

start();
