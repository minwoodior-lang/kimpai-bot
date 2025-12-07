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

console.log(`Starting server on ${hostname}:${port} (dev=${dev})`);

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Create HTTP server with fast health check
const server = createServer((req, res) => {
  try {
    // INSTANT health check - no async, no parsing
    if (req.url === "/" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("OK");
      return;
    }

    // For all other requests, use async handler
    (async () => {
      try {
        const parsedUrl = parse(req.url!, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error("Request error:", err);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Internal server error");
        }
      }
    })();
  } catch (err) {
    console.error("Server error:", err);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal server error");
    }
  }
});

// Start listening immediately
const serverInstance = server.listen(port, hostname, () => {
  console.log(`✓ HTTP Server listening on http://${hostname}:${port}`);
});

// Initialize everything else asynchronously in background
(async () => {
  try {
    // Prepare Next.js
    await app.prepare();
    console.log("✓ Next.js app prepared");

    // Setup WebSocket
    createChatServer(serverInstance);
    console.log("✓ WebSocket server ready");

    // Start price worker
    startPriceWorker();
    console.log("✓ Price worker started");

    // Schedule market sync
    cron.schedule("*/5 * * * *", () => {
      const now = new Date().toISOString();
      console.log(`[MarketSync] Starting auto-sync at ${now}...`);
      exec("npm run sync:markets", (err, stdout, stderr) => {
        if (err) {
          console.error(`[MarketSync] Error:`, err.message);
          return;
        }
        if (stdout) console.log(stdout);
        console.log(`[MarketSync] Completed at ${new Date().toISOString()}`);
      });
    });
    console.log("✓ Market sync scheduled (5-minute intervals)");
  } catch (err) {
    console.error("Fatal initialization error:", err);
    process.exit(1);
  }
})();

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Shutting down...");
  serverInstance.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
