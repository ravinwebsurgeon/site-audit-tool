import { Client } from "@upstash/qstash";

export const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
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
