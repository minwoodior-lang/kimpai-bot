#!/usr/bin/env node
/**
 * 독립 시그널 워커 (프로덕션용)
 * 
 * pm2로 실행: pm2 start src/workers/signalWorker.js --name signal-engine
 * 
 * 이 워커는 메인 서버와 독립적으로 실행되며,
 * 서버가 재시작되어도 시그널 엔진은 계속 작동합니다.
 */

require('dotenv').config();
const { Telegraf } = require('telegraf');

console.log('🚀 Signal Worker 시작...');
console.log('📅 시작 시간:', new Date().toISOString());
console.log('🔧 PID:', process.pid);

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
const { runAllFreeSignals } = require('../bot/schedulers/freeSignals');

let signalInterval = null;

async function start() {
  try {
    console.log('[SignalWorker] Binance Signal Engine 초기화 시작...');
    await binanceEngine.initialize();
    console.log('✅ Binance Signal Engine 초기화 완료');
    
    binanceEngine.startHealthCheck();
    console.log('✅ 엔진 헬스체크 시작됨 (1분마다)');
    
    signalInterval = setInterval(async () => {
      try {
        await runAllFreeSignals(bot);
      } catch (err) {
        console.error('[SignalWorker] 시그널 실행 오류:', err.message);
      }
    }, 30000);
    
    console.log('✅ FREE 실시간 시그널 등록 완료 (30초마다 검사)');
    console.log('🟢 Signal Worker 정상 작동 중...');
    
    await bot.telegram.sendMessage(
      CHANNEL_ID,
      '🟢 Signal Worker가 시작되었습니다.\n' +
      `📅 ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}\n` +
      `🔧 PID: ${process.pid}`
    ).catch(err => console.warn('채널 알림 실패:', err.message));
    
  } catch (err) {
    console.error('❌ Signal Worker 초기화 실패:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

function shutdown(signal) {
  console.log(`\n${signal} 수신, 종료 중...`);
  
  if (signalInterval) {
    clearInterval(signalInterval);
  }
  
  if (binanceEngine) {
    binanceEngine.stop();
  }
  
  bot.telegram.sendMessage(
    CHANNEL_ID,
    '🔴 Signal Worker가 종료되었습니다.\n' +
    `📅 ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}\n` +
    `🔧 Signal: ${signal}`
  ).catch(() => {}).finally(() => {
    process.exit(0);
  });
  
  setTimeout(() => process.exit(0), 3000);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
});

start();
