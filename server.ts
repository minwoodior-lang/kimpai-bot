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

// Initialize Next.js - but don't wait for it yet
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Create minimal HTTP server
const server = createServer((req, res) => {
  const url = req.url || "/";
  const method = req.method || "GET";

  // Instant health check endpoint - returns immediately
  if ((url === "/" || url === "/health") && method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  // All other requests delegate to Next.js
  (async () => {
    try {
      await handle(req, res, parse(url, true));
    } catch (err) {
      console.error(`[ERROR] Request failed:`, err);
      if (!res.headersSent) {
        res.writeHead(500);
        res.end("Internal Server Error");
      }
    }
  })();
});

// CRITICAL: Start listening BEFORE any async operations
let serverListening = false;
server.listen(port, hostname, () => {
  serverListening = true;
  console.log(`[BOOT] ✓ Server listening on ${hostname}:${port}`);
});

// Handle server errors
server.on("error", (err) => {
  console.error("[ERROR] Server error:", err);
  process.exit(1);
});

// Initialize everything else asynchronously WITHOUT blocking startup
const initializeAsync = async () => {
  try {
    // Wait for server to be listening first
    let attempts = 0;
    while (!serverListening && attempts < 100) {
      await new Promise((r) => setTimeout(r, 10));
      attempts++;
    }

    if (!serverListening) {
      console.error("[ERROR] Server failed to start listening");
      process.exit(1);
    }

    console.log("[BOOT] Preparing Next.js app...");
    await app.prepare();
    console.log("[BOOT] ✓ Next.js app prepared");

    // Setup WebSocket
    createChatServer(server);
    console.log("[BOOT] ✓ WebSocket server ready");

    // Start price worker
    startPriceWorker();
    console.log("[BOOT] ✓ Price worker started");

    // Schedule market sync
    cron.schedule("*/5 * * * *", () => {
      const now = new Date().toISOString();
      console.log(`[SYNC] Starting market sync at ${now}`);
      exec("npm run sync:markets", (err, stdout, stderr) => {
        if (err) {
          console.error(`[SYNC] Error:`, err.message);
          return;
        }
        if (stdout) console.log(`[SYNC] Output:`, stdout);
        console.log(`[SYNC] Completed at ${new Date().toISOString()}`);
      });
    });
    console.log("[BOOT] ✓ Market sync scheduled (5-minute intervals)");
  } catch (err) {
    console.error("[FATAL] Initialization failed:", err);
    process.exit(1);
  }
};

// Start initialization without blocking server startup
initializeAsync();

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("[SHUTDOWN] SIGTERM received");
  server.close(() => {
    console.log("[SHUTDOWN] Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("[SHUTDOWN] SIGINT received");
  server.close(() => {
    console.log("[SHUTDOWN] Server closed");
    process.exit(0);
  });
});
