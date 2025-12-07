import { createServer } from "http";
import { parse } from "url";
import { exec } from "child_process";
import next from "next";
import * as cron from "node-cron";
import { createChatServer } from "./src/server/chatServer";
import { startPriceWorker } from "./workers/priceWorker";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "5000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Create server immediately to handle health checks
const server = createServer(async (req, res) => {
  try {
    const parsedUrl = parse(req.url!, true);
    
    // Quick health check response for deployments
    if (parsedUrl.pathname === "/" && req.method === "GET") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/plain");
      res.end("OK");
      return;
    }
    
    await handle(req, res, parsedUrl);
  } catch (err) {
    console.error("Error handling request:", err);
    res.statusCode = 500;
    res.end("Internal server error");
  }
});

// Start listening immediately
server.listen(port, hostname, () => {
  console.log(`> Ready on http://${hostname}:${port}`);
  console.log(`> WebSocket server at /ws/chat`);
});

// WebSocket 서버 추가
createChatServer(server);

// Prepare Next.js app in background
app.prepare().then(() => {
  console.log(`> Next.js app prepared`);
  
  // 가격 수집 워커 시작
  startPriceWorker();
  
  // 자동 상장 수집 크론 (5분마다, 테스트 단계)
  // 운영 단계 시 "0,10,20,30,40,50 * * * *"로 변경 권장
  cron.schedule("*/5 * * * *", () => {
    const now = new Date().toISOString();
    console.log(`[MarketSync] Starting auto-sync (5min interval) at ${now}...`);
    exec("npm run sync:markets", (err, stdout, stderr) => {
      if (err) {
        console.error(`[MarketSync] Error: ${err.message}`);
        if (stderr) console.error(`[MarketSync] stderr: ${stderr}`);
        return;
      }
      if (stdout) console.log(stdout);
      console.log(`[MarketSync] Auto-sync completed at ${new Date().toISOString()}`);
    });
  });
  console.log(`> Market sync scheduled (every 5 minutes for auto-listing detection)`);
});
