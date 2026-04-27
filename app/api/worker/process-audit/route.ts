import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { processAudit } from "@/services/audit.service";
import { sendAuditCompleteEmail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import type { AuditJobData } from "@/types";

// Allow up to 60 seconds (Vercel Pro). Audits typically finish in 15-45s.
export const maxDuration = 60;

async function handleJob(data: AuditJobData): Promise<void> {
  const { reportId, url, userId, isScheduled } = data;
  console.log(`[worker-api] Starting audit ${reportId} — ${url}`);

  await processAudit(reportId, url);
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

export async function POST(req: NextRequest) {
  try {
    let data: AuditJobData;

    if (
      process.env.QSTASH_CURRENT_SIGNING_KEY &&
      process.env.QSTASH_NEXT_SIGNING_KEY
    ) {
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
      // Development: no signature check needed
      data = (await req.json()) as AuditJobData;
    }

    await handleJob(data);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[worker-api] Unhandled error:", err);
    // Return 5xx so QStash retries the job automatically
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
