import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

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
    lastUpdate: number | null;
    lastUpdateAgo: number;
    wsConnected: boolean;
    klineWsConnected: boolean;
    recentTrades: number;
    symbolCount: number;
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    let signalEngineStatus = {
      running: false,
      lastUpdate: null as number | null,
      lastUpdateAgo: 0,
      wsConnected: false,
      klineWsConnected: false,
      recentTrades: 0,
      symbolCount: 0,
      status: "critical" as "ok" | "warning" | "critical",
      statusMessage: "엔진 상태 조회 불가"
    };
    
    try {
      const binanceEngine = require("../../../workers/binanceSignalEngine");
      const engineStatus = binanceEngine.getStatus();
      
      let status: "ok" | "warning" | "critical" = "ok";
      let statusMessage = "정상 작동 중";
      
      if (engineStatus.lastUpdateAgo > 300) {
        status = "critical";
        statusMessage = "5분 이상 업데이트 없음";
      } else if (engineStatus.lastUpdateAgo > 180) {
        status = "warning";
        statusMessage = "3분 이상 업데이트 없음";
      } else if (!engineStatus.wsConnected || !engineStatus.klineWsConnected) {
        status = "warning";
        statusMessage = "WebSocket 연결 문제";
      }
      
      signalEngineStatus = {
        running: engineStatus.running,
        lastUpdate: engineStatus.lastUpdate,
        lastUpdateAgo: engineStatus.lastUpdateAgo,
        wsConnected: engineStatus.wsConnected,
        klineWsConnected: engineStatus.klineWsConnected,
        recentTrades: engineStatus.recentTrades,
        symbolCount: engineStatus.symbolCount,
        status,
        statusMessage
      };
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
      const binanceEngine = require("../../../workers/binanceSignalEngine");
      const engineStatus = binanceEngine.getStatus();
      if (engineStatus.errors) {
        errors.push(...engineStatus.errors);
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
