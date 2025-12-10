/**
 * 통합 시그널 엔진 (프로덕션 자동 시작용)
 *
 * 프로덕션 Reserved VM에서:
 * - NODE_ENV === "production" && !DISABLE_SIGNAL_ENGINE 일 때만 자동 시작
 * - 서버 부팅 후 setInterval로 연속 동작
 *
 * 개발 환경:
 * - NODE_ENV !== "production" → 자동 실행 안 됨
 * - npm run bot:dev 로 수동 테스트
 */

import { Telegraf } from 'telegraf';

const binanceEngine = require('./workers/binanceSignalEngine');
const {
  runAllFreeSignals,
  initializeSymbolUpdater,
} = require('./bot/schedulers/freeSignals');

let signalInterval: NodeJS.Timeout | null = null;
let isEngineRunning = false;

/**
 * 시그널 엔진 시작
 * - Binance WebSocket 구독
 * - 30초마다 김프/고래 신호 검사
 */
export async function startSignalEngine(): Promise<void> {
  try {
    const IS_PRODUCTION = process.env.NODE_ENV === 'production';
    const DISABLE_SIGNAL_ENGINE =
      process.env.DISABLE_SIGNAL_ENGINE === 'true' ||
      process.env.DISABLE_SIGNAL_ENGINE === '1';

    // 개발 환경 / 강제 비활성화 시 실행 안 함
    if (!IS_PRODUCTION) {
      console.log('[SignalEngine] Disabled (development environment)');
      return;
    }

    if (DISABLE_SIGNAL_ENGINE) {
      console.log(
        '[SignalEngine] Disabled by DISABLE_SIGNAL_ENGINE env. (use PM2 worker instead)',
      );
      return;
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;

    if (!BOT_TOKEN || !CHANNEL_ID) {
      console.warn(
        '[SignalEngine] TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID not set. Skipping signal engine.',
      );
      return;
    }

    if (isEngineRunning) {
      console.warn(
        '[SignalEngine] Already running, ignoring duplicate start request.',
      );
      return;
    }

    const bot = new Telegraf(BOT_TOKEN);

    console.log('[SignalEngine] Initializing Binance Signal Engine...');
    await binanceEngine.initialize();
    console.log('✅ [SignalEngine] Binance WebSocket connected');

    // Health check 시작 (30초마다 상태 점검 + 자동 재시작)
    binanceEngine.startHealthCheck();
    console.log('✅ [SignalEngine] Health check started (every 30 seconds)');

    // Binance TOP 심볼 자동 갱신 (freeSignals util)
    try {
      initializeSymbolUpdater();
      console.log(
        '✅ [SignalEngine] Symbol auto-updater started (initializeSymbolUpdater)',
      );
    } catch (symErr: any) {
      console.warn(
        '[SignalEngine] Failed to start symbol auto-updater:',
        symErr?.message || symErr,
      );
    }

    // 30초마다 FREE 시그널 검사 (김프 + 고래)
    signalInterval = setInterval(async () => {
      try {
        await runAllFreeSignals(bot);
      } catch (err: any) {
        console.error(
          '[SignalEngine] Signal check error:',
          err?.message || err,
        );
      }
    }, 30000);

    console.log(
      '✅ [SignalEngine] FREE signal monitoring started (every 30s)',
    );
    isEngineRunning = true;

    // 시작 알림 (실패해도 엔진은 계속 돈다)
    await bot.telegram
      .sendMessage(
        CHANNEL_ID,
        '🟢 KimpAI Signal Engine Started\n' +
          `📅 ${new Date().toLocaleString('ko-KR', {
            timeZone: 'Asia/Seoul',
          })}\n` +
          '🔧 Monitoring: Kimchi Premium (BTC/ETH) + Whale Activity (TOP symbols)',
      )
      .catch((err: any) =>
        console.warn(
          '[SignalEngine] Start notification failed:',
          err?.message || err,
        ),
      );

    console.log('[SignalEngine] ✅ Ready for 24/7 operation');
  } catch (err: any) {
    console.error('[SignalEngine] Initialization failed:', err?.message || err);
    console.error(err?.stack);
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
    try {
      binanceEngine.stop();
    } catch (e: any) {
      console.error(
        '[SignalEngine] binanceEngine.stop() error:',
        e?.message || e,
      );
    }
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
