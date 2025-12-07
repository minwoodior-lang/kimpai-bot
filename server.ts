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

// Initialize Next.js app but don't wait for it yet
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Create minimal HTTP server that responds to health checks immediately
const server = createServer(async (req, res) => {
  try {
    const parsedUrl = parse(req.url!, true);
    
    // Instant health check response for deployment health checks
    if (req.url === "/" && req.method === "GET") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/plain");
      res.end("OK");
      return;
    }
    
    // All other requests go to Next.js handler
    await handle(req, res, parsedUrl);
  } catch (err) {
    console.error("Error handling request:", err);
    res.statusCode = 500;
    res.end("Internal server error");
  }
});

// Start server immediately - this is critical for deployment health checks
const serverInstance = server.listen(port, hostname, () => {
  console.log(`✓ Server ready on http://${hostname}:${port}`);
});

// Initialize Next.js and start background workers asynchronously
setImmediate(async () => {
  try {
    // Prepare Next.js app
    await app.prepare();
    console.log("✓ Next.js app prepared");
    
    // Attach WebSocket handler after Next.js is ready
    createChatServer(serverInstance);
    console.log("✓ WebSocket server ready at /ws/chat");
    
    // Start price worker
    startPriceWorker();
    console.log("✓ Price worker started");
    
    // Schedule market sync every 5 minutes
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
    console.log("✓ Market sync scheduled (every 5 minutes)");
  } catch (err) {
    console.error("Fatal error during initialization:", err);
    process.exit(1);
  }
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  serverInstance.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
