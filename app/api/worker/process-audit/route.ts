import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { processAudit } from "@/services/audit.service";
import { sendAuditCompleteEmail } from "@/lib/mail";
import { updateAuditStatus } from "@/db/audit";
import { incrementSiteAuditProgress } from "@/db/site-audit";
import { prisma } from "@/lib/prisma";
import type { AuditJobData } from "@/types";

// Allow up to 60 seconds (Vercel Pro). Audits typically finish in 15-45s.
export const maxDuration = 60;

async function handleJob(data: AuditJobData, isLastAttempt: boolean): Promise<void> {
  const { reportId, url, userId, isScheduled, siteAuditId } = data;
  console.log(`[worker-api] Starting audit ${reportId} — ${url}`);

  let succeeded = false;
  try {
    await processAudit(reportId, url);
    succeeded = true;
  } finally {
    if (siteAuditId && (succeeded || isLastAttempt)) {
      // On the last failed attempt, verify the page isn't already COMPLETED
      // from a previous retry before counting it as failed.
      let countAsSucceeded = succeeded;
      if (!succeeded) {
        const report = await prisma.auditReport.findUnique({
          where: { id: reportId },
          select: { status: true },
        });
        if (report?.status === 'COMPLETED') countAsSucceeded = true;
      }
      try {
        await incrementSiteAuditProgress(siteAuditId, countAsSucceeded);
      } catch (err) {
        console.error(`[worker-api] Failed to update site audit progress for ${siteAuditId}:`, err);
      }
    }
  }
  console.log(`[worker-api] Audit ${reportId} finished`);

  if (isScheduled && userId) {
    try {
      const [user, report] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, notifyOnComplete: true },
        }),
        prisma.auditReport.findUnique({
          where: { id: reportId },
          select: {
            overallScore: true,
            status: true,
            issues: { select: { severity: true } },
          },
        }),
      ]);

      if (user?.email && user.notifyOnComplete && report?.status === "COMPLETED") {
        const criticalCount = report.issues.filter((i) => i.severity === "CRITICAL").length;
        const warningCount = report.issues.filter((i) => i.severity === "WARNING").length;
        const passedCount = report.issues.filter((i) => i.severity === "PASSED").length;

        await sendAuditCompleteEmail({
          to: user.email,
          reportId,
          auditUrl: url,
          overallScore: report.overallScore ?? 0,
          criticalCount,
          warningCount,
          passedCount,
          appUrl: process.env.APP_URL ?? process.env.NEXTAUTH_URL,
        });
        console.log(`[worker-api] Sent completion email for report ${reportId}`);
      }
    } catch (err) {
      // Email failure must never fail the job — audit result is already saved
      console.error(`[worker-api] Email failed for report ${reportId}:`, err);
    }
  }
}

// 5 s before Vercel hard-kills the function — enough time to persist FAILED status.
const WORKER_DEADLINE_MS = 55_000;

export async function POST(req: NextRequest) {
  // Hoist so the catch block can always mark the report FAILED.
  let data: AuditJobData | undefined;

  try {
    const isProd = process.env.NODE_ENV === "production";
    const hasSigningKeys =
      !!process.env.QSTASH_CURRENT_SIGNING_KEY &&
      !!process.env.QSTASH_NEXT_SIGNING_KEY;

    if (isProd && hasSigningKeys) {
      // Production: verify QStash signature before processing
      const receiver = new Receiver({
        currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
        nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
      });

      const rawBody = await req.text();
      const signature = req.headers.get("upstash-signature") ?? "";

      const isValid = await receiver
        .verify({ signature, body: rawBody, url: req.url })
        .catch(() => false);

      if (!isValid) {
        console.error("[worker-api] Invalid QStash signature — rejected");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      data = JSON.parse(rawBody) as AuditJobData;
    } else {
      // Development (local QStash emulator): no signature verification needed.
      data = (await req.json()) as AuditJobData;
    }

    // Upstash-Retries-Remaining counts how many retries QStash will still make
    // if this invocation returns 5xx. When it reaches 0 this is the final
    // attempt. If the header is absent (dev / non-QStash path) treat it as the
    // final attempt so progress is always counted.
    const retriesRemainingHeader = req.headers.get('upstash-retries-remaining');
    const retriesRemaining = retriesRemainingHeader !== null ? parseInt(retriesRemainingHeader, 10) : null;
    const isLastAttempt = retriesRemaining === null || retriesRemaining === 0;

    // Race the audit against a hard deadline. If the deadline fires first we
    // still have ~5 s to write FAILED to the DB before Vercel terminates us.
    await Promise.race([
      handleJob(data, isLastAttempt),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Worker deadline exceeded (${WORKER_DEADLINE_MS}ms)`)),
          WORKER_DEADLINE_MS,
        )
      ),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed";
    console.error("[worker-api] Unhandled error:", message);

    // Always write FAILED so the frontend stops polling — even when Vercel
    // would have killed the function before processAudit's own catch ran.
    if (data?.reportId) {
      try {
        await updateAuditStatus(data.reportId, "FAILED", { errorMessage: message });
        console.log(`[worker-api] Marked report ${data.reportId} as FAILED`);
      } catch (dbErr) {
        console.error("[worker-api] Could not persist FAILED status:", dbErr);
      }
    }

    // Permanent errors (e.g. Anthropic credit exhaustion, invalid API key) return
    // 4xx. Retrying them wastes QStash retry budget and will never succeed, so
    // return 200 to acknowledge the job without triggering a retry.
    const isPermanentError =
      (err instanceof Error && /credit balance|invalid.*key|unauthorized/i.test(err.message)) ||
      (typeof (err as { status?: number }).status === 'number' &&
        (err as { status: number }).status >= 400 &&
        (err as { status: number }).status < 500);

    if (isPermanentError) {
      console.warn("[worker-api] Permanent error — not retrying:", message);
      return NextResponse.json({ error: "Permanent failure — not retrying" }, { status: 200 });
    }

    // Return 5xx so QStash retries on transient errors.
    // On a hard timeout the report is already FAILED; QStash retries will
    // re-run the audit and overwrite FAILED → COMPLETED if they succeed.
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
