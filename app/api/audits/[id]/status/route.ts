import { NextRequest } from 'next/server';
import { getAuditById } from '@/db/audit';

type Params = { params: Promise<{ id: string }> };

// Cap at 25 attempts × 2s = 50s — safely under Vercel Pro's 60s limit.
// The browser's EventSource auto-reconnects when the stream closes, so
// audits longer than 50s continue seamlessly across reconnects.
const MAX_ATTEMPTS = 25;
const POLL_INTERVAL_MS = 2000;

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (raw: string) => {
        try { controller.enqueue(encoder.encode(raw)); } catch { /* stream closed */ }
      };

      const sendData = (payload: Record<string, unknown>) =>
        enqueue(`data: ${JSON.stringify(payload)}\n\n`);

      const sendPing = () => enqueue('event: ping\ndata: {}\n\n');

      // Tell the browser to reconnect in 2 s if the stream closes mid-audit
      enqueue('retry: 2000\n\n');

      let attempts = 0;

      while (attempts < MAX_ATTEMPTS) {
        const report = await getAuditById(id).catch(() => null);

        if (!report) {
          sendData({ error: 'Audit not found' });
          break;
        }

        sendData({
          id: report.id,
          status: report.status,
          errorMessage: (report as { errorMessage?: string }).errorMessage ?? null,
        });

        if (report.status === 'COMPLETED' || report.status === 'FAILED') break;

        attempts++;

        // Send a ping every 5 polls (~10 s) to prevent proxy/CDN idle timeouts
        if (attempts % 5 === 0) sendPing();

        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }

      try { controller.close(); } catch { /* already closed */ }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      Connection: 'keep-alive',
    },
  });
}
