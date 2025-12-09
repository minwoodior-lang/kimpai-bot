import http from "http";
import next from "next";
import * as cron from "node-cron";
import { exec } from "child_process";
import { createChatServer } from "./src/server/chatServer";
import { startPriceWorker } from "./workers/priceWorker";

const startTelegramBot = async () => {
  try {
    const { startBot } = require("./src/bot/index.js");
    await startBot();
    console.log("✅ Telegram Bot integrated with server");
  } catch (err: any) {
    console.error("❌ Telegram Bot start failed:", err.message);
  }
};

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

async function bootstrap() {
  try {
    await app.prepare();

    const port = Number(process.env.PORT) || 5000;

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
      console.log(`Server listening on 0.0.0.0:${port}`);
    });

    // 워커는 서버 부팅 후 비동기로 실행
    setTimeout(async () => {
      try {
        console.log("Starting background workers...");
        createChatServer(server);
        startPriceWorker();
        cron.schedule("*/5 * * * *", () => {
          exec("npm run sync:markets", (err, stdout, stderr) => {
            if (err) console.error("[SYNC]", err.message);
            if (stdout) console.log(stdout);
          });
        });
        console.log("All background workers initialized");
        
        // Telegram Bot 시작 (워커 초기화 후)
        await startTelegramBot();
      } catch (err) {
        console.error("Worker start failed:", err);
      }
    }, 2000);

  } catch (err) {
    console.error("Fatal bootstrap error:", err);
    process.exit(1);
  }
}

bootstrap();
