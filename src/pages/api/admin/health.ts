import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { withAdminAuth } from "@/lib/adminAuth";

let botStartTime: number | null = null;
let lastMessageSent: number | null = null;

export function setBotStartTime(time: number) {
  botStartTime = time;
}

export function setLastMessageSent(time: number) {
  lastMessageSent = time;
}

interface HealthStatus {
  signalEngine: {
    running: boolean;
    healthy: boolean;
    lastUpdate: number | null;
    lastUpdateAgo: number;
    lastTradeTime: number | null;
    lastTradeAgo: number;
    tradeStale: boolean;
    wsConnected: boolean;
    klineWsConnected: boolean;
    recentTrades: number;
    symbolCount: number;
    tradeBucketCount: number;
    baselineCount: number;
    restartCount: number;
    status: "ok" | "warning" | "critical";
    statusMessage: string;
  };
  bot: {
    uptime: number;
    uptimeFormatted: string;
    lastMessageSent: number | null;
    lastMessageAgo: number | null;
    status: "ok" | "warning" | "critical";
    statusMessage: string;
  };
  workers: {
    priceWorker: { ok: boolean; lastRun: number | null; status: string };
    statsWorker: { ok: boolean; lastRun: number | null; status: string };
    premiumWorker: { ok: boolean; lastRun: number | null; status: string };
  };
  errors: Array<{ time: number; message: string }>;
  timestamp: string;
}

function checkFileAge(filePath: string): { ok: boolean; lastRun: number | null; status: string } {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      return { ok: false, lastRun: null, status: "파일 없음" };
    }
    const stats = fs.statSync(fullPath);
    const lastRun = stats.mtimeMs;
    const ageSeconds = (Date.now() - lastRun) / 1000;
    
    if (ageSeconds > 60) {
      return { ok: false, lastRun, status: `${Math.floor(ageSeconds)}초 지연` };
    }
    return { ok: true, lastRun, status: "정상" };
  } catch {
    return { ok: false, lastRun: null, status: "에러" };
  }
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    let signalEngineStatus = {
      running: false,
      healthy: false,
      lastUpdate: null as number | null,
      lastUpdateAgo: 0,
      lastTradeTime: null as number | null,
      lastTradeAgo: -1,
      tradeStale: true,
      wsConnected: false,
      klineWsConnected: false,
      recentTrades: 0,
      symbolCount: 0,
      tradeBucketCount: 0,
      baselineCount: 0,
      restartCount: 0,
      status: "critical" as "ok" | "warning" | "critical",
      statusMessage: "엔진 상태 조회 불가"
    };
    
    try {
      // 전역 상태에서 직접 읽기 (모듈 캐시 문제 우회)
      const GLOBAL_STATE_KEY = '__binanceSignalState__';
      const globalState = (global as any)[GLOBAL_STATE_KEY];
      
      if (globalState && globalState.isRunning) {
        const now = Date.now();
        const lastTradeAgo = globalState.lastTradeTime > 0 
          ? Math.floor((now - globalState.lastTradeTime) / 1000) 
          : -1;
        const lastUpdateAgo = Math.floor((now - globalState.lastUpdateTime) / 1000);
        const tradeStale = globalState.lastTradeTime > 0 && (now - globalState.lastTradeTime) > 90000;
        
        let status: "ok" | "warning" | "critical" = "ok";
        let statusMessage = "정상 작동 중";
        
        // 상태 판단 로직 개선 (트레이드 기준)
        if (tradeStale) {
          status = "critical";
          statusMessage = `트레이드 ${lastTradeAgo}초 동안 수신 없음`;
        } else if (globalState.tradeBucketCount === 0 || globalState.baselineCount === 0) {
          status = "critical";
          statusMessage = "버킷/베이스라인 데이터 없음";
        } else if (!globalState.wsConnected || !globalState.klineWsConnected) {
          status = "warning";
          statusMessage = "WebSocket 연결 문제";
        } else if (lastTradeAgo > 60) {
          status = "warning";
          statusMessage = `트레이드 ${lastTradeAgo}초 지연`;
        }
        
        signalEngineStatus = {
          running: globalState.isRunning,
          healthy: globalState.wsConnected && globalState.klineWsConnected && 
                   globalState.tradeBucketCount > 0 && globalState.baselineCount > 50 && !tradeStale,
          lastUpdate: globalState.lastUpdateTime,
          lastUpdateAgo: lastUpdateAgo,
          lastTradeTime: globalState.lastTradeTime,
          lastTradeAgo: lastTradeAgo,
          tradeStale: tradeStale,
          wsConnected: globalState.wsConnected,
          klineWsConnected: globalState.klineWsConnected,
          recentTrades: globalState.recentTradeCount,
          symbolCount: 60,
          tradeBucketCount: globalState.tradeBucketCount || 0,
          baselineCount: globalState.baselineCount || 0,
          restartCount: globalState.restartCount,
          status,
          statusMessage
        };
      } else {
        // 엔진이 시작되지 않은 경우
        signalEngineStatus.statusMessage = "엔진 미시작";
      }
    } catch (err) {
      console.warn("[Health] Signal engine status check failed:", err);
    }
    
    const now = Date.now();
    const uptime = botStartTime ? Math.floor((now - botStartTime) / 1000) : 0;
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeMinutes = Math.floor((uptime % 3600) / 60);
    
    let botStatus: "ok" | "warning" | "critical" = "ok";
    let botStatusMessage = "정상 작동 중";
    const lastMessageAgo = lastMessageSent ? Math.floor((now - lastMessageSent) / 1000) : null;
    
    if (lastMessageAgo && lastMessageAgo > 3600) {
      botStatus = "warning";
      botStatusMessage = "1시간 이상 메시지 발송 없음";
    }
    
    const priceWorker = checkFileAge("data/prices.json");
    const statsWorker = checkFileAge("data/marketStats.json");
    const premiumWorker = checkFileAge("data/premiumTable.json");
    
    const errors: Array<{ time: number; message: string }> = [];
    try {
      const GLOBAL_STATE_KEY = '__binanceSignalState__';
      const globalState = (global as any)[GLOBAL_STATE_KEY];
      if (globalState && globalState.engineErrors) {
        errors.push(...globalState.engineErrors);
      }
    } catch {}
    
    const health: HealthStatus = {
      signalEngine: signalEngineStatus,
      bot: {
        uptime,
        uptimeFormatted: `${uptimeHours}시간 ${uptimeMinutes}분`,
        lastMessageSent,
        lastMessageAgo,
        status: botStatus,
        statusMessage: botStatusMessage
      },
      workers: {
        priceWorker,
        statsWorker,
        premiumWorker
      },
      errors: errors.slice(-20),
      timestamp: new Date().toISOString()
    };
    
    res.setHeader("Cache-Control", "no-cache, no-store");
    return res.status(200).json({ success: true, data: health });
  } catch (err) {
    console.error("[API] /admin/health error:", err);
    return res.status(500).json({ success: false, error: "Health check failed" });
  }
}

export default withAdminAuth(handler);
