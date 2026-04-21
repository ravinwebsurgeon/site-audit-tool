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

export async function sendMagicLink({ to, url, siteName = 'SiteAudit' }: SendMagicLinkParams): Promise<void> {
  const subject = `Sign in to ${siteName}`;
  const html = magicLinkHtml(url, siteName);

  if (process.env.RESEND_API_KEY) {
    try {
      await sendViaResend(to, subject, html);
      return;
    } catch (err) {
      // In dev, fall back to console when Resend rejects the send.
      // Common cause: onboarding@resend.dev can only send to your Resend
      // account email. Fix: verify your domain at resend.com/domains and
      // set EMAIL_FROM=YourApp <you@yourdomain.com> in .env
      if (process.env.NODE_ENV === 'production') throw err;
      console.warn('\n[mail] Resend failed — falling back to console (dev only)');
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
