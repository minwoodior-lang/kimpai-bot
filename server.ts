#!/usr/bin/env node

import { createServer } from "http";
import { parse } from "url";
import { exec } from "child_process";
import next from "next";
import * as cron from "node-cron";
import { createChatServer } from "./src/server/chatServer";
import { startPriceWorker } from "./workers/priceWorker";

const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "5000", 10);
const dev = process.env.NODE_ENV !== "production";

console.log(`[BOOT] Starting on ${hostname}:${port} (dev=${dev})`);

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Create server with instant health check
const server = createServer((req, res) => {
  const pathname = req.url?.split("?")[0] || "/";
  
  // INSTANT synchronous health check - no promises, no async
  if ((pathname === "/" || pathname === "/health") && req.method === "GET") {
    res.writeHead(200, {
      "Content-Type": "text/plain",
      "Content-Length": "2"
    });
    res.end("OK");
    return;
  }

  // Delegate to Next.js
  (async () => {
    try {
      await handle(req, res, parse(req.url!, true));
    } catch (err) {
      console.error(`[ERROR] ${req.method} ${req.url}:`, err);
      if (!res.headersSent) {
        res.writeHead(500);
        res.end("Error");
      }
    }
  })();
});

// Start listening immediately
server.listen(port, hostname, () => {
  console.log(`[BOOT] ✓ Listening on port ${port}`);
});

// Initialize in background (non-blocking)
(async () => {
  try {
    await app.prepare();
    console.log("[BOOT] ✓ Next.js ready");

    createChatServer(server);
    console.log("[BOOT] ✓ WebSocket ready");

    startPriceWorker();
    console.log("[BOOT] ✓ Workers started");

    cron.schedule("*/5 * * * *", () => {
      console.log(`[SYNC] Starting market sync...`);
      exec("npm run sync:markets", (err, stdout, stderr) => {
        if (err) console.error(`[SYNC]`, err.message);
        if (stdout) console.log(stdout);
      });
    });
    console.log("[BOOT] ✓ Market sync scheduled");
  } catch (err) {
    console.error("[FATAL]", err);
    process.exit(1);
  }
})();

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("[SHUTDOWN] Closing...");
  server.close(() => process.exit(0));
});
