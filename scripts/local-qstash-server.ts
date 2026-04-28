#!/usr/bin/env tsx
/**
 * Local QStash emulator for development.
 *
 * Mimics the QStash v2 publish API so the @upstash/qstash Client works on
 * localhost without needing ngrok or a public URL. When your app calls
 * qstash.publishJSON(...), this server receives the request and immediately
 * forwards the payload to the destination URL (your local Next.js worker).
 *
 * Also includes a built-in scheduler that mirrors Vercel Cron: every 60 s it
 * calls GET /api/cron/run-schedules so due scheduled audits are picked up
 * automatically — no separate `npm run worker` needed in local dev.
 *
 * Retries: 5xx responses from the destination are retried up to 3 times
 * with exponential backoff (1s → 3s → 9s), matching QStash behaviour.
 */

import 'dotenv/config';
import http from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";

const PORT = Number(process.env.LOCAL_QSTASH_PORT ?? 8080);
const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [1_000, 3_000, 9_000];

let seq = 0;
const nextId = () => `local_${Date.now()}_${++seq}`;

// ── helpers ──────────────────────────────────────────────────────────────────

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function deliver(
  destination: string,
  body: Buffer,
  messageId: string,
  attempt: number
): Promise<void> {
  const label = `[local-qstash] ${messageId}`;
  try {
    const res = await fetch(destination, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "upstash-message-id": messageId,
        "upstash-delivery-count": String(attempt),
        "upstash-retried": attempt > 0 ? "true" : "false",
      },
      body: new Uint8Array(body),
    });

    if (res.ok) {
      console.log(`${label} ✓  delivered (attempt ${attempt + 1})`);
      return;
    }

    if (res.status >= 500 && attempt < MAX_ATTEMPTS - 1) {
      scheduleRetry(destination, body, messageId, attempt, `HTTP ${res.status}`);
    } else {
      console.error(`${label} ✗  failed — HTTP ${res.status}, no more retries`);
    }
  } catch (err) {
    if (attempt < MAX_ATTEMPTS - 1) {
      scheduleRetry(destination, body, messageId, attempt, String(err));
    } else {
      console.error(`${label} ✗  failed — network error, no more retries:`, err);
    }
  }
}

function scheduleRetry(
  destination: string,
  body: Buffer,
  messageId: string,
  attempt: number,
  reason: string
): void {
  const delay = RETRY_DELAYS_MS[attempt];
  console.log(
    `[local-qstash] ${messageId} ↻  retry ${attempt + 1}/${MAX_ATTEMPTS - 1} in ${delay}ms (${reason})`
  );
  setTimeout(() => deliver(destination, body, messageId, attempt + 1), delay);
}

// ── request handler ───────────────────────────────────────────────────────────

async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  // health-check
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok", server: "local-qstash" }));
    return;
  }

  if (req.method !== "POST") {
    res.writeHead(405, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "Method Not Allowed" }));
    return;
  }

  // QStash v2 publish: POST /v2/publish/<destination_url>
  const match = req.url?.match(/^\/v2\/publish\/(.+)/);
  if (!match) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found — expected POST /v2/publish/{url}" }));
    return;
  }

  const destination = decodeURIComponent(match[1]);

  try {
    const body = await readBody(req);
    const messageId = nextId();

    console.log(`[local-qstash] ⬆  ${messageId} → ${destination}`);

    // Respond to the publisher immediately, then deliver asynchronously
    setImmediate(() => deliver(destination, body, messageId, 0));

    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ messageId, url: destination }));
  } catch (err) {
    console.error("[local-qstash] handler error:", err);
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "Internal Server Error" }));
  }
}

// ── server lifecycle ──────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  handler(req, res).catch((err) => {
    console.error("[local-qstash] unhandled error:", err);
    if (!res.headersSent) {
      res.writeHead(500);
      res.end();
    }
  });
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║           Local QStash Server  (dev only)          ║
╠════════════════════════════════════════════════════╣
║  Listening : http://localhost:${PORT}                  ║
║  Simulates : QStash v2 publish API + retries       ║
╚════════════════════════════════════════════════════╝
`);
});

process.on("SIGINT", () => {
  console.log("\n[local-qstash] shutting down...");
  server.close(() => process.exit(0));
});
process.on("SIGTERM", () => server.close(() => process.exit(0)));

// ── Local scheduler (mirrors Vercel Cron) ────────────────────────────────────
// Calls GET /api/cron/run-schedules every 60 s so due scheduled audits are
// picked up automatically while in dev — identical to what Vercel Cron does in
// production. The first tick is delayed 12 s to give Next.js time to boot.

const NEXT_BASE = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
const SCHEDULER_INTERVAL_MS = 60_000; // 1 minute (vs 15 min in production)

async function tickLocalScheduler() {
  const url = `${NEXT_BASE}/api/cron/run-schedules`;
  try {
    const headers: Record<string, string> = {};
    if (process.env.CRON_SECRET) {
      headers["authorization"] = `Bearer ${process.env.CRON_SECRET}`;
    }
    const res = await fetch(url, { method: "GET", headers });
    if (res.ok) {
      const json = (await res.json()) as { queued?: number };
      if (json.queued && json.queued > 0) {
        console.log(`[local-qstash] ⏱  scheduler: queued ${json.queued} scheduled audit(s)`);
      }
    } else {
      console.warn(`[local-qstash] ⏱  scheduler: cron route returned HTTP ${res.status}`);
    }
  } catch {
    // Next.js may not be ready on the very first tick — silently skip
  }
}

// Start after a short delay so Next.js is listening before the first tick
setTimeout(() => {
  tickLocalScheduler();
  setInterval(tickLocalScheduler, SCHEDULER_INTERVAL_MS);
  console.log("[local-qstash] Built-in scheduler active — polls /api/cron/run-schedules every 60 s");
}, 12_000);
