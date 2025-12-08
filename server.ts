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

// Prepare Next.js app (but don't wait)
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Create minimal HTTP server
const server = createServer((req, res) => {
  if (req.url === "/" || req.url === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
    return;
  }

  // Async handler for all other routes
  (async () => {
    try {
      await handle(req, res, parse(req.url!, true));
    } catch (err) {
      console.error("Request error:", err);
      if (!res.headersSent) {
        res.writeHead(500);
        res.end("Error");
      }
    }
  })();
});

// Start listening immediately
server.listen(port, hostname, () => {
  console.log(`Server listening on ${hostname}:${port}`);
});

// Initialize everything in background (non-blocking)
Promise.resolve()
  .then(() => app.prepare())
  .then(() => {
    createChatServer(server);
    startPriceWorker();
    cron.schedule("*/5 * * * *", () => {
      exec("npm run sync:markets", (err, stdout, stderr) => {
        if (err) console.error("[SYNC]", err.message);
        if (stdout) console.log(stdout);
      });
    });
    console.log("All services initialized");
  })
  .catch((err) => {
    console.error("Fatal initialization error:", err);
    process.exit(1);
  });

// Graceful shutdown
process.on("SIGTERM", () => {
  server.close(() => process.exit(0));
});
