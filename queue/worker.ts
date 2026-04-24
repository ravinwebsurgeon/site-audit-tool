import 'dotenv/config';
import { createAuditWorker } from './audit.worker';
import { runDueSchedules } from './scheduler';

// ── Boot ─────────────────────────────────────────────────────────────────────

console.log('[worker] Starting…');
console.log(`[worker] NODE_ENV=${process.env.NODE_ENV ?? 'undefined'}`);
console.log(`[worker] REDIS_URL=${process.env.REDIS_URL ? '✓ set' : '✗ MISSING'}`);

// Catch startup errors that would otherwise exit silently
process.on('uncaughtException', (err) => {
  console.error('[worker] Uncaught exception — exiting:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[worker] Unhandled promise rejection — exiting:', reason);
  process.exit(1);
});

// ── Worker ───────────────────────────────────────────────────────────────────

const worker = createAuditWorker();

// ── Built-in scheduler ───────────────────────────────────────────────────────
// Vercel Cron (GET /api/cron/run-schedules) handles scheduling in production.
// When running outside Vercel (dev, Docker, Railway, etc.) this loop fills the
// same role: it checks for due schedules every 15 minutes and queues them.

const SCHEDULE_INTERVAL_MS = 10 * 60 * 1000;

async function tickScheduler() {
  console.log('[scheduler] Checking for due schedules…');
  try {
    const count = await runDueSchedules();
    console.log(`[scheduler] ${count > 0 ? `Queued ${count} schedule(s)` : 'No schedules due'}`);
  } catch (err) {
    console.error('[scheduler] Error during tick:', err);
  }
}

let schedulerTimer: NodeJS.Timeout | null = null;

if (!process.env.VERCEL) {
  // Run once immediately on startup to process any backlogged schedules,
  // then repeat every 15 minutes.
  tickScheduler();
  schedulerTimer = setInterval(tickScheduler, SCHEDULE_INTERVAL_MS);
  console.log('[scheduler] Built-in scheduler active — interval: 15 min');
} else {
  console.log('[scheduler] Vercel environment detected — using Vercel Cron instead');
}

// ── Graceful shutdown ────────────────────────────────────────────────────────

async function shutdown(signal: string) {
  console.log(`[worker] ${signal} received — shutting down gracefully…`);
  if (schedulerTimer) clearInterval(schedulerTimer);
  await worker.close();
  console.log('[worker] Shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
