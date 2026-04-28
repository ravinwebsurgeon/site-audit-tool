import { NextResponse } from 'next/server';

// TEMPORARY debug endpoint — remove before final production launch.
// Call from Chrome DevTools console:
//   fetch('/api/debug/env-check').then(r=>r.json()).then(console.log)

const mask = (v?: string) =>
  v ? `SET ✓  (starts: "${v.slice(0, 6)}…", length: ${v.length})` : 'NOT SET ✗';

const present = (v?: string) => (v ? `SET ✓` : 'NOT SET ✗');

export async function GET() {
  return NextResponse.json({
    qstash: {
      QSTASH_URL:                 process.env.QSTASH_URL ?? 'NOT SET ✗',
      QSTASH_TOKEN:               mask(process.env.QSTASH_TOKEN),
      QSTASH_CURRENT_SIGNING_KEY: mask(process.env.QSTASH_CURRENT_SIGNING_KEY),
      QSTASH_NEXT_SIGNING_KEY:    mask(process.env.QSTASH_NEXT_SIGNING_KEY),
    },
    database: {
      DATABASE_URL: present(process.env.DATABASE_URL),
    },
    auth: {
      NEXTAUTH_URL:    process.env.NEXTAUTH_URL ?? 'NOT SET ✗',
      NEXTAUTH_SECRET: present(process.env.NEXTAUTH_SECRET),
    },
    ai: {
      ANTHROPIC_API_KEY: present(process.env.ANTHROPIC_API_KEY),
    },
  });
}
