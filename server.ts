import http from "http";
import next from "next";
import * as cron from "node-cron";
import { exec } from "child_process";
import { createChatServer } from "./src/server/chatServer";
import { startPriceWorker } from "./workers/priceWorker";
import { startSignalEngine } from "./src/signalEngine";
import { initProductionAdmin } from "./src/lib/adminInit";

const startTelegramBot = async () => {
  const isProduction = process.env.NODE_ENV === "production";
  
  // 프로덕션에서만 봇 시작 (개발환경에서 중복 실행 방지)
  if (!isProduction) {
    console.log("⏭️ 봇은 프로덕션 환경에서만 실행됩니다 (개발환경 스킵)");
    return;
  }
  
  try {
    const { startBot } = require("./src/bot/index.js");
    await startBot();
    console.log("✅ Telegram Bot integrated with server");
  } catch (err: any) {
    console.error("❌ Telegram Bot start failed:", err.message);
  }
};

console.log("🚀 server.ts starting...");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

async function bootstrap() {
  try {
    console.log("[INIT] Next.js app.prepare() starting...");
    
    // timeout 보호: 30초 이상 걸리면 에러 로깅하고 강제 진행
    const preparePromise = app.prepare();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("app.prepare() timeout after 30s")), 30000)
    );
    
    await Promise.race([preparePromise, timeoutPromise]).catch((err) => {
      console.warn("[INIT] app.prepare() slow or timeout:", err.message);
    });
    
    console.log("[INIT] Next.js app.prepare() done");

    const port = Number(process.env.PORT) || 5000;
    const isProduction = process.env.NODE_ENV === "production";

    console.log(`[INIT] Environment: ${isProduction ? "PRODUCTION" : "DEVELOPMENT"}, PORT: ${port}`);

    const server = http.createServer((req, res) => {
      handle(req, res).catch((err) => {
        console.error("Request error:", err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end("Internal Server Error");
        }
      });
    });

    // 배포 환경 호환: 무조건 0.0.0.0 바인딩
    server.listen(port, "0.0.0.0", () => {
      console.log(`✅ Server listening on 0.0.0.0:${port}`);
    });

    // 워커는 서버 부팅 후 즉시 비동기로 실행 (타임아웃 방지)
    setImmediate(async () => {
      try {
        console.log("[WORKERS] Initializing background workers...");
        
        // 프로덕션 환경: admin 계정 자동 초기화
        await initProductionAdmin();
        
        createChatServer(server);
        console.log("[WORKERS] Chat server initialized");
        
        startPriceWorker();
        console.log("[WORKERS] Price worker started");
        
        cron.schedule("*/5 * * * *", () => {
          exec("npm run sync:markets", (err, stdout, stderr) => {
            if (err) console.error("[SYNC]", err.message);
            if (stdout) console.log(stdout);
          });
        });
        console.log("[WORKERS] Cron scheduler initialized");
        
        console.log("[WORKERS] All background workers initialized ✅");
        
        // Telegram Bot은 background에서 즉시 비동기 시작
        startTelegramBot().catch(err => {
          console.error("❌ Telegram Bot background start error:", err.message);
        });

        // 시그널 엔진 자동 시작 (프로덕션만)
        const isProd = isProduction;
        const signalDisabled = process.env.DISABLE_SIGNAL_ENGINE === "true";
        
        if (isProd && !signalDisabled) {
          console.log("[WORKERS] Starting Signal Engine in production mode...");
          startSignalEngine()
            .then(() => console.log("[SignalEngine] ✅ started in production"))
            .catch((err) => console.error("[SignalEngine] ❌ failed to start:", err.message));
        } else {
          const reason = !isProd ? "development environment" : "DISABLE_SIGNAL_ENGINE=true";
          console.log(`[SignalEngine] Disabled (${reason})`);
        }
      } catch (err) {
        console.error("[ERROR] Worker start failed:", err);
      }
    });

  } catch (err) {
    console.error("[FATAL] Bootstrap error:", err);
    process.exit(1);
  }
}

console.log("[INIT] Calling bootstrap()...");
bootstrap();
