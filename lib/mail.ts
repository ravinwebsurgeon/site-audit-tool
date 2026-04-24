/**
 * Email utility for magic link auth.
 * Priority: Resend API → SMTP (nodemailer) → console (dev only)
 */

interface SendMagicLinkParams {
  to: string;
  url: string;
  siteName?: string;
}

async function sendViaResend(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? 'SiteAudit <noreply@siteaudit.app>',
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }
}

async function sendViaSMTP(to: string, subject: string, html: string): Promise<void> {
  const nodemailer = await import('nodemailer');
  const transport = nodemailer.default.createTransport(process.env.EMAIL_SERVER!);
  await transport.sendMail({
    from: process.env.EMAIL_FROM ?? 'SiteAudit <noreply@siteaudit.app>',
    to,
    subject,
    html,
  });
}

function magicLinkHtml(url: string, siteName: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:40px auto;padding:0 20px">
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:40px;text-align:center">
      <!-- Logo -->
      <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:linear-gradient(135deg,#2563eb,#4f46e5);border-radius:12px;margin-bottom:24px">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
      </div>
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a">${siteName}</h1>
      <p style="margin:0 0 32px;font-size:15px;color:#64748b;line-height:1.5">
        Click the button below to sign in. This link expires in <strong>24 hours</strong> and can only be used once.
      </p>
      <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#4f46e5);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:0.01em">
        Sign in to ${siteName}
      </a>
      <p style="margin:32px 0 0;font-size:13px;color:#94a3b8;line-height:1.5">
        If you didn't request this, you can safely ignore this email.<br>
        The link will expire automatically.
      </p>
      <hr style="margin:24px 0;border:none;border-top:1px solid #f1f5f9">
      <p style="margin:0;font-size:12px;color:#cbd5e1">
        Can't click the button? Copy this link:<br>
        <span style="color:#6366f1;word-break:break-all;font-size:11px">${url}</span>
      </p>
    </div>
  </div>
</body>
</html>`;
}

interface SendAuditCompleteParams {
  to: string;
  reportId: string;
  auditUrl: string;
  overallScore: number;
  criticalCount: number;
  warningCount: number;
  passedCount: number;
  siteName?: string;
  appUrl?: string;
}

function auditCompleteHtml(p: SendAuditCompleteParams): string {
  const { auditUrl, overallScore, criticalCount, warningCount, passedCount, siteName = 'SiteAudit', appUrl = 'https://siteaudit.app' } = p;
  const scoreColor = overallScore >= 80 ? '#16a34a' : overallScore >= 50 ? '#d97706' : '#dc2626';
  const scoreLabel = overallScore >= 80 ? 'Excellent' : overallScore >= 50 ? 'Needs Work' : 'Poor';
  const reportLink = `${appUrl}/audit/${p.reportId}`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:40px auto;padding:0 20px">
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:40px">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:linear-gradient(135deg,#2563eb,#4f46e5);border-radius:12px;margin-bottom:24px">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
      </div>
      <h1 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#0f172a">Audit complete!</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#64748b;word-break:break-all">${auditUrl}</p>

      <div style="text-align:center;padding:24px;background:#f8fafc;border-radius:12px;margin-bottom:24px">
        <div style="font-size:56px;font-weight:800;color:${scoreColor};line-height:1">${overallScore}</div>
        <div style="font-size:13px;color:#94a3b8;margin-top:4px">Overall Score · ${scoreLabel}</div>
      </div>

      <div style="display:flex;gap:12px;margin-bottom:28px">
        <div style="flex:1;padding:16px;background:#fef2f2;border-radius:8px;text-align:center">
          <div style="font-size:28px;font-weight:700;color:#dc2626">${criticalCount}</div>
          <div style="font-size:12px;color:#dc2626;margin-top:2px">Critical</div>
        </div>
        <div style="flex:1;padding:16px;background:#fffbeb;border-radius:8px;text-align:center">
          <div style="font-size:28px;font-weight:700;color:#d97706">${warningCount}</div>
          <div style="font-size:12px;color:#d97706;margin-top:2px">Warnings</div>
        </div>
        <div style="flex:1;padding:16px;background:#f0fdf4;border-radius:8px;text-align:center">
          <div style="font-size:28px;font-weight:700;color:#16a34a">${passedCount}</div>
          <div style="font-size:12px;color:#16a34a;margin-top:2px">Passed</div>
        </div>
      </div>

      <div style="text-align:center">
        <a href="${reportLink}" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#4f46e5);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600">
          View Full Report →
        </a>
      </div>

      <hr style="margin:28px 0;border:none;border-top:1px solid #f1f5f9">
      <p style="margin:0;font-size:12px;color:#cbd5e1;text-align:center">
        You received this because you enabled audit notifications in ${siteName}.<br>
        <a href="${appUrl}/settings" style="color:#6366f1">Manage notification preferences</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendAuditCompleteEmail(params: SendAuditCompleteParams): Promise<void> {
  const { to, siteName = 'SiteAudit' } = params;
  const subject = `Audit complete — score ${params.overallScore}/100`;
  const html = auditCompleteHtml(params);

  if (process.env.RESEND_API_KEY) {
    try { await sendViaResend(to, subject, html); return; } catch (err) {
      console.warn('[mail] Resend failed for audit email — trying SMTP fallback:', err instanceof Error ? err.message : err);
    }
  }
  if (process.env.EMAIL_SERVER) {
    await sendViaSMTP(to, subject, html);
    return;
  }
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[mail] Audit complete email to ${to} (score ${params.overallScore})`);
    return;
  }
  throw new Error(`No email provider configured for ${siteName}`);
}

export async function sendMagicLink({ to, url, siteName = 'SiteAudit' }: SendMagicLinkParams): Promise<void> {
  const subject = `Sign in to ${siteName}`;
  const html = magicLinkHtml(url, siteName);

  if (process.env.RESEND_API_KEY) {
    try {
      await sendViaResend(to, subject, html);
      return;
    } catch (err) {
      // Resend failed (common cause in production: onboarding@resend.dev can
      // only send to your Resend account email — verify a domain at
      // resend.com/domains and set EMAIL_FROM to an address on that domain).
      // Fall through to SMTP so magic links still work.
      console.warn('[mail] Resend failed — trying SMTP fallback');
      console.warn('[mail] Error:', err instanceof Error ? err.message : err);
    }
  }

  if (process.env.EMAIL_SERVER) {
    await sendViaSMTP(to, subject, html);
    return;
  }

  // Development fallback — log to console
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n─────────────────────────────────────────');
    console.log('MAGIC LINK (dev mode — no email sent)');
    console.log(`To: ${to}`);
    console.log(`URL: ${url}`);
    console.log('─────────────────────────────────────────\n');
    return;
  }

  throw new Error('No email provider configured. Set RESEND_API_KEY or EMAIL_SERVER in .env');
}
