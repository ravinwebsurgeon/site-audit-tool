import { NextRequest, NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { processSiteAudit } from '@/services/site-audit.service';
import { prisma } from '@/lib/prisma';
import type { SiteAuditJobData } from '@/types';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let data: SiteAuditJobData | undefined;

  try {
    const isProd = process.env.NODE_ENV === 'production';
    const hasSigningKeys =
      !!process.env.QSTASH_CURRENT_SIGNING_KEY && !!process.env.QSTASH_NEXT_SIGNING_KEY;

    if (isProd && hasSigningKeys) {
      const receiver = new Receiver({
        currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
        nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
      });

      const rawBody = await req.text();
      const signature = req.headers.get('upstash-signature') ?? '';

      const isValid = await receiver
        .verify({ signature, body: rawBody, url: req.url })
        .catch(() => false);

      if (!isValid) {
        console.error('[site-worker-api] Invalid QStash signature — rejected');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      data = JSON.parse(rawBody) as SiteAuditJobData;
    } else {
      data = (await req.json()) as SiteAuditJobData;
    }

    await processSiteAudit(data);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Processing failed';
    console.error('[site-worker-api] Unhandled error:', message);

    if (data?.siteAuditId) {
      try {
        await prisma.siteAuditReport.updateMany({
          where: { id: data.siteAuditId, status: { in: ['PENDING', 'PROCESSING'] } },
          data: { status: 'FAILED', errorMessage: message },
        });
      } catch (dbErr) {
        console.error('[site-worker-api] Could not persist FAILED status:', dbErr);
      }
    }

    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
