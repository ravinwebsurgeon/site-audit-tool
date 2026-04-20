import { NextRequest } from 'next/server';
import { getAuditById } from '@/db/audit';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      let done = false;
      let attempts = 0;
      const maxAttempts = 90; // 3 minutes at 2s intervals

      while (!done && attempts < maxAttempts) {
        const report = await getAuditById(id).catch(() => null);

        if (!report) {
          send({ error: 'Audit not found' });
          break;
        }

        send({
          id: report.id,
          status: report.status,
          overallScore: report.overallScore,
          errorMessage: (report as { errorMessage?: string }).errorMessage ?? null,
        });

        if (report.status === 'COMPLETED' || report.status === 'FAILED') {
          done = true;
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
        attempts++;
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
