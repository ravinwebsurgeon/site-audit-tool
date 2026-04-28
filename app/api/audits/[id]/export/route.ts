import { NextRequest, NextResponse } from 'next/server';
import { getAuditById } from '@/db/audit';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const report = await getAuditById(id);

    if (!report) {
      return NextResponse.json({ success: false, message: 'Audit not found' }, { status: 404 });
    }

    if (report.status !== 'COMPLETED') {
      return NextResponse.json({ success: false, message: 'Audit not yet completed' }, { status: 400 });
    }

    const sections = report.sections ?? [];
    const issues = report.issues ?? [];

    const scoreColor = (s: number) =>
      s >= 80 ? '#16a34a' : s >= 50 ? '#d97706' : '#dc2626';

    const sectionHtml = sections
      .map((section) => {
        const color = scoreColor(section.score);
        return `
        <div class="section">
          <div class="section-header">
            <span class="section-title">${section.category}</span>
            <span class="section-score" style="color:${color}">${section.score}/100</span>
          </div>
        </div>`;
      })
      .join('');

    const severityOrder = { CRITICAL: 0, WARNING: 1, PASSED: 2 } as const;
    const sortedIssues = [...issues].sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    );

    const issuesHtml = sortedIssues
      .map((issue) => {
        const color =
          issue.severity === 'CRITICAL'
            ? '#dc2626'
            : issue.severity === 'WARNING'
            ? '#d97706'
            : '#16a34a';
        const bg =
          issue.severity === 'CRITICAL'
            ? '#fef2f2'
            : issue.severity === 'WARNING'
            ? '#fffbeb'
            : '#f0fdf4';
        return `
        <div class="issue" style="border-left-color:${color};background:${bg}">
          <div class="issue-header">
            <span class="badge" style="background:${color}">${issue.severity}</span>
            <span class="issue-category">${issue.category}</span>
          </div>
          <h3>${issue.title}</h3>
          <p>${issue.description}</p>
          <div class="recommendation"><strong>Fix:</strong> ${issue.recommendation}</div>
        </div>`;
      })
      .join('');

    const criticalCount = issues.filter((i) => i.severity === 'CRITICAL').length;
    const warningCount = issues.filter((i) => i.severity === 'WARNING').length;
    const passedCount = issues.filter((i) => i.severity === 'PASSED').length;
    const scoreClr = scoreColor(report.overallScore ?? 0);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Site Audit Report — ${report.url}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a;background:#f8fafc;padding:32px}
    .container{max-width:900px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,.1)}
    .header{display:flex;align-items:center;justify-content:space-between;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #e2e8f0}
    .logo{font-size:22px;font-weight:700;color:#1e40af}
    .url{font-size:14px;color:#64748b;margin-top:4px;word-break:break-all}
    .score-ring{text-align:center}
    .score-number{font-size:48px;font-weight:800;color:${scoreClr}}
    .score-label{font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em}
    .summary{display:flex;gap:16px;margin-bottom:32px}
    .pill{flex:1;padding:16px;border-radius:8px;text-align:center}
    .pill-critical{background:#fef2f2;color:#dc2626}
    .pill-warning{background:#fffbeb;color:#d97706}
    .pill-passed{background:#f0fdf4;color:#16a34a}
    .pill-count{font-size:28px;font-weight:700}
    .pill-label{font-size:12px;margin-top:4px}
    h2{font-size:18px;font-weight:600;color:#1e293b;margin:24px 0 12px}
    .sections{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:32px}
    .section{padding:16px;border:1px solid #e2e8f0;border-radius:8px}
    .section-header{display:flex;justify-content:space-between;align-items:center}
    .section-title{font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#64748b}
    .section-score{font-size:22px;font-weight:700}
    .issue{padding:16px;border-left:4px solid;border-radius:0 8px 8px 0;margin-bottom:12px}
    .issue-header{display:flex;align-items:center;gap:8px;margin-bottom:8px}
    .badge{padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;color:#fff;text-transform:uppercase}
    .issue-category{font-size:12px;color:#64748b;font-weight:500}
    .issue h3{font-size:15px;font-weight:600;color:#1e293b;margin-bottom:6px}
    .issue p{font-size:13px;color:#475569;margin-bottom:8px;line-height:1.5}
    .recommendation{font-size:13px;color:#1e40af;background:#eff6ff;padding:8px 12px;border-radius:6px}
    .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;display:flex;flex-wrap:wrap;gap:8px;justify-content:space-between}
    .print-btn{display:block;margin:0 auto 24px;padding:10px 24px;background:#6366f1;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer}
    @media(max-width:600px){
      body{padding:16px}
      .container{padding:20px}
      .header{flex-direction:column;align-items:flex-start;gap:16px}
      .score-ring{align-self:flex-start}
      .score-number{font-size:36px}
      .summary{flex-wrap:wrap}
      .pill{flex:1 1 calc(50% - 8px);min-width:120px}
      .sections{grid-template-columns:repeat(2,1fr)}
      .section-title{font-size:11px}
      .section-score{font-size:18px}
      h2{font-size:16px}
    }
    @media(max-width:380px){
      .sections{grid-template-columns:1fr}
      .pill{flex:1 1 100%}
    }
    @media print{body{padding:0;background:#fff}.container{box-shadow:none;border-radius:0}.print-btn{display:none}}
  </style>
</head>
<body>
<div class="container">
  <button class="print-btn" onclick="window.print()">Save as PDF</button>
  <div class="header">
    <div>
      <div class="logo">SiteAudit</div>
      <div class="url">${report.url}</div>
      <div class="url">Audited: ${new Date(report.completedAt ?? report.createdAt).toLocaleString()}</div>
    </div>
    <div class="score-ring">
      <div class="score-number">${report.overallScore ?? '--'}</div>
      <div class="score-label">Overall Score</div>
    </div>
  </div>

  <div class="summary">
    <div class="pill pill-critical">
      <div class="pill-count">${criticalCount}</div>
      <div class="pill-label">Critical Issues</div>
    </div>
    <div class="pill pill-warning">
      <div class="pill-count">${warningCount}</div>
      <div class="pill-label">Warnings</div>
    </div>
    <div class="pill pill-passed">
      <div class="pill-count">${passedCount}</div>
      <div class="pill-label">Passed</div>
    </div>
  </div>

  <h2>Category Scores</h2>
  <div class="sections">${sectionHtml}</div>

  <h2>Issues &amp; Recommendations</h2>
  ${issuesHtml || '<p style="color:#64748b;font-size:14px">No issues found.</p>'}

  <div class="footer">
    <span>Generated by SiteAudit — thefabcode.org</span>
    <span>Report ID: ${report.id}</span>
  </div>
</div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('GET /api/audits/[id]/export:', error);
    return NextResponse.json({ success: false, message: 'Failed to export audit' }, { status: 500 });
  }
}
