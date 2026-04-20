import 'dotenv/config';
import { createAuditWorker } from './audit.worker';

console.log('[worker] Starting audit worker...');

const worker = createAuditWorker();

async function shutdown() {
  console.log('[worker] Shutting down...');
  await worker.close();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
