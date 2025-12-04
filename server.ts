import { createServer } from "http";
import { parse } from "url";
import { exec } from "child_process";
import next from "next";
import * as cron from "node-cron";
import { createChatServer } from "./src/server/chatServer";
import { startPriceWorker } from "./workers/priceWorker";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "5000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error handling request:", err);
      res.statusCode = 500;
      res.end("Internal server error");
    }
  });

  // WebSocket 서버 추가
  createChatServer(server);

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server at /ws/chat`);
    
    // 가격 수집 워커 시작
    startPriceWorker();
    
    // 마켓 목록 자동 갱신 (1시간마다)
    cron.schedule("0 * * * *", () => {
      console.log("[MarketSync] Starting hourly market update...");
      exec("npm run build:markets:all", (err, stdout, stderr) => {
        if (err) {
          console.error("[MarketSync] Error:", err.message);
          return;
        }
        console.log("[MarketSync] Complete");
        
        // 마켓 갱신 후 메타 동기화
        exec("npm run sync:meta", (metaErr, metaStdout) => {
          if (metaErr) {
            console.error("[MetaSync] Error:", metaErr.message);
            return;
          }
          console.log("[MetaSync] Complete");
          
          // 메타 동기화 후 데이터 검증
          exec("npm run validate", (validateErr, validateStdout, validateStderr) => {
            if (validateErr) {
              console.error("[Validate] FAILED - Data pipeline validation error");
              console.error(validateStdout || validateStderr);
              return;
            }
            console.log("[Validate] PASSED - Data pipeline healthy");
          });
        });
      });
    });
    console.log(`> Market sync scheduled (hourly at :00)`);
  });
});
