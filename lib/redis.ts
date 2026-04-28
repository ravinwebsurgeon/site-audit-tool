import IORedis from 'ioredis';

// null when REDIS_URL is not set (e.g. Vercel production using QStash instead of BullMQ).
// All consumers must null-check before use.
export const redisConnection = process.env.REDIS_URL
  ? new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    })
  : null;
