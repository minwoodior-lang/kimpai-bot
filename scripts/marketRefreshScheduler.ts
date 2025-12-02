/**
 * scripts/marketRefreshScheduler.ts
 * 10분 간격으로 거래소 마켓 데이터를 동기화하는 스케줄러
 * 
 * Usage: npx tsx scripts/marketRefreshScheduler.ts
 * 또는 npm run market:scheduler
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const REFRESH_INTERVAL = 10 * 60 * 1000; // 10분

async function refreshMarkets() {
  const now = new Date().toISOString();
  console.log(`[${now}] 거래소 마켓 동기화 시작...`);

  try {
    const { stdout, stderr } = await execAsync(
      "npx tsx scripts/refreshExchangeMarkets.ts"
    );
    console.log(`[${new Date().toISOString()}] ✅ 마켓 동기화 완료`);
    if (stdout) console.log(stdout);
  } catch (err) {
    console.error(
      `[${new Date().toISOString()}] ❌ 마켓 동기화 실패:`,
      err instanceof Error ? err.message : String(err)
    );
  }
}

async function startScheduler() {
  console.log("[marketRefreshScheduler] 시작됨 (10분 간격)");

  // 시작 시 즉시 한 번 실행
  await refreshMarkets();

  // 10분마다 반복
  setInterval(refreshMarkets, REFRESH_INTERVAL);

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("[marketRefreshScheduler] SIGTERM 수신, 종료 중...");
    process.exit(0);
  });

  process.on("SIGINT", () => {
    console.log("[marketRefreshScheduler] SIGINT 수신, 종료 중...");
    process.exit(0);
  });
}

startScheduler();
