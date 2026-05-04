import { Client } from "@upstash/qstash";

// baseUrl: in dev, set QSTASH_URL=http://localhost:8080 to route through the
// local emulator (npm run qstash:dev). In production this is unset and the SDK
// defaults to https://qstash.upstash.io (or reads QSTASH_URL from env).
export const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
  baseUrl: process.env.QSTASH_URL,
});

function getBaseUrl(): string {
  return (
    process.env.APP_URL ??
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  ).replace(/\/$/, '');
}

export function getWorkerUrl(): string {
  return `${getBaseUrl()}/api/worker/process-audit`;
}

export function getSiteWorkerUrl(): string {
  return `${getBaseUrl()}/api/worker/process-site-audit`;
}
