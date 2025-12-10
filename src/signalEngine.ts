/**
 * 통합 시그널 엔진 (프로덕션 자동 시작용)
 * 
 * 프로덕션 Reserved VM에서:
 * - NODE_ENV === "production" && !DISABLE_SIGNAL_ENGINE일 때만 자동 시작
 * - 서버 부팅 후 setInterval로 24시간 연속 동작
 * 
 * 개발 환경:
 * - NODE_ENV !== "production" → 자동 실행 안 됨
 * - npm run bot:dev로 수동 테스트
 */

import { Telegraf } from 'telegraf';

const binanceEngine = require('./workers/binanceSignalEngine');
const { runAllFreeSignals } = require('./bot/schedulers/freeSignals');

let signalInterval: NodeJS.Timeout | null = null;
let isEngineRunning = false;

/**
 * 시그널 엔진 시작
 * - Binance WebSocket 구독
 * - 30초마다 김프/고래/변동성 신호 검사
 * - 24시간 연속 동작
 */
export async function startSignalEngine(): Promise<void> {
  try {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

    if (!BOT_TOKEN || !CHANNEL_ID) {
      console.warn('[SignalEngine] TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID not set. Skipping signal engine.');
      return;
    }

    if (isEngineRunning) {
      console.warn('[SignalEngine] Already running, ignoring duplicate start request.');
      return;
    }

    const bot = new Telegraf(BOT_TOKEN);

    console.log('[SignalEngine] Initializing Binance Signal Engine...');
    await binanceEngine.initialize();
    console.log('✅ [SignalEngine] Binance WebSocket connected');

    // Health check 시작
    binanceEngine.startHealthCheck();
    console.log('✅ [SignalEngine] Health check started (every 1 minute)');

    // 30초마다 신호 검사
    signalInterval = setInterval(async () => {
      try {
        await runAllFreeSignals(bot);
      } catch (err: any) {
        console.error('[SignalEngine] Signal check error:', err.message);
      }
    }, 30000);

    console.log('✅ [SignalEngine] FREE signal monitoring started (every 30s)');
    isEngineRunning = true;

    // 시작 알림
    await bot.telegram
      .sendMessage(
        CHANNEL_ID,
        '🟢 KimpAI Signal Engine Started\n' +
          `📅 ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}\n` +
          '🔧 Monitoring: Kimchi Premium (BTC/ETH) + Whale Activity (TOP 100)',
      )
      .catch((err: any) => console.warn('[SignalEngine] Start notification failed:', err.message));

    console.log('[SignalEngine] ✅ Ready for 24/7 operation');
  } catch (err: any) {
    console.error('[SignalEngine] Initialization failed:', err.message);
    console.error(err.stack);
    throw err;
  }
}

/**
 * 시그널 엔진 종료
 */
export function stopSignalEngine(): void {
  if (signalInterval) {
    clearInterval(signalInterval);
    signalInterval = null;
  }

  if (binanceEngine && typeof binanceEngine.stop === 'function') {
    binanceEngine.stop();
  }

  isEngineRunning = false;
  console.log('[SignalEngine] ✅ Stopped');
}

/**
 * 시그널 엔진 상태 조회
 */
export function getSignalEngineStatus(): {
  isRunning: boolean;
  interval: NodeJS.Timeout | null;
} {
  return {
    isRunning: isEngineRunning,
    interval: signalInterval,
  };
}
