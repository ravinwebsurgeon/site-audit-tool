import { prisma } from '@/lib/prisma';
import { discoverSiteUrls } from './sitemap.service';
import { addAuditJob } from '@/queue/audit.queue';
import { hashUrl, normalizeUrl } from '@/lib/utils';
import type { SiteAuditJobData } from '@/types';

export async function processSiteAudit(data: SiteAuditJobData): Promise<void> {
  const { siteAuditId, rootUrl, userId, pagesLimit } = data;

  await prisma.siteAuditReport.update({
    where: { id: siteAuditId },
    data: { status: 'PROCESSING' },
  });

  try {
    const discovery = await discoverSiteUrls(rootUrl, pagesLimit);
    console.log(
      `[site-audit] ${siteAuditId} — discovered ${discovery.totalFound} URLs via ${discovery.source}, capped at ${discovery.urls.length}`
    );

    if (discovery.urls.length === 0) {
      await prisma.siteAuditReport.update({
        where: { id: siteAuditId },
        data: { status: 'FAILED', errorMessage: 'No pages discovered' },
      });
      return;
    }

    // Create individual AuditReport records for each discovered page
    const pageReports = await Promise.all(
      discovery.urls.map((url) => {
        const normalized = normalizeUrl(url);
        const urlHash = hashUrl(normalized);
        return prisma.auditReport.create({
          data: {
            userId: userId ?? null,
            url: normalized,
            urlHash,
            status: 'PENDING',
            siteAuditId,
          },
        });
      })
    );

    // Set total page count before enqueuing so the completion check has a target
    await prisma.siteAuditReport.update({
      where: { id: siteAuditId },
      data: {
        totalPages: pageReports.length,
        sitemapUrl: discovery.sitemapUrl,
      },
    });

    // Enqueue page jobs with a 15-second stagger between each one.
    // Firing all jobs simultaneously causes the Claude API to receive burst
    // requests that exceed the 5 RPM rate limit. Staggering at 15 s keeps
    // throughput at ~4 RPM, safely below the limit. QStash delivers each job
    // after its delay elapses; BullMQ delays in-process.
    await Promise.all(
      pageReports.map((report, index) =>
        addAuditJob(
          {
            reportId: report.id,
            url: report.url,
            userId,
            isScheduled: false,
            siteAuditId,
          },
          { delaySeconds: index * 15 },
        )
      )
    );

    console.log(`[site-audit] ${siteAuditId} — enqueued ${pageReports.length} page jobs (staggered 15 s apart)`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Site audit orchestration failed';
    console.error(`[site-audit] ${siteAuditId} — orchestration error:`, message);
    await prisma.siteAuditReport.update({
      where: { id: siteAuditId },
      data: { status: 'FAILED', errorMessage: message },
    });
    throw error;
  }
}
