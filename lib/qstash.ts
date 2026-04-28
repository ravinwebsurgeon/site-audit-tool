import { Client } from "@upstash/qstash";

// baseUrl: in dev, set QSTASH_URL=http://localhost:8080 to route through the
// local emulator (npm run qstash:dev). In production this is unset and the SDK
// defaults to https://qstash.upstash.io (or reads QSTASH_URL from env).
export const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
  baseUrl: process.env.QSTASH_URL,
});

export function getWorkerUrl(): string {
  // VERCEL_URL is set automatically by Vercel (no protocol prefix).
  // Prefer explicit APP_URL / NEXTAUTH_URL so preview-deploy URLs work too.
  const base =
    process.env.APP_URL ??
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return `${base}/api/worker/process-audit`;
}
