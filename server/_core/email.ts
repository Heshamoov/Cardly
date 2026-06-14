/**
 * Lightweight email sender backed by Resend's REST API.
 *
 * We call the HTTPS endpoint directly (no SDK dependency) so this works on the
 * Node-only deploy runtime. When RESEND_API_KEY is not configured, sendEmail
 * returns { sent: false } and callers fall back to surfacing the reset link
 * another way (logging / returning it for manual testing).
 */
import { ENV } from "./env";

export type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendEmailResult = {
  sent: boolean;
  reason?: string;
  /** Raw error detail from Resend, useful for owner diagnostics. */
  detail?: string;
};

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  if (!ENV.resendApiKey) {
    console.warn("[Email] RESEND_API_KEY not set — skipping send for:", params.subject);
    return { sent: false, reason: "no_api_key" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${ENV.resendApiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: ENV.resendFromEmail,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`[Email] Resend send FAILED (${response.status} ${response.statusText}) to=${params.to}: ${detail}`);
      // 403 in Resend test mode = no verified domain; can only send to the account owner.
      const reason = response.status === 403 ? "test_mode_unverified_domain" : `http_${response.status}`;
      return { sent: false, reason, detail };
    }

    console.log(`[Email] Sent "${params.subject}" to ${params.to}`);
    return { sent: true };
  } catch (error) {
    console.warn("[Email] Error calling Resend:", error);
    return { sent: false, reason: "exception" };
  }
}

/** Build the branded HTML body for a password reset email. */
export function buildResetEmailHtml(resetUrl: string, name?: string | null): string {
  const greeting = name ? `Hi ${escapeHtml(name)},` : "Hi there,";
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0f1117;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;">
    <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
      <div style="background:#fffdf8;border-radius:16px;padding:40px 32px;border:1px solid #e8dcc0;">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="font-size:26px;letter-spacing:2px;color:#b8860b;font-weight:bold;">YALAINVITE</span>
        </div>
        <h1 style="font-size:22px;color:#1a1a1a;margin:0 0 16px;text-align:center;">Reset your password</h1>
        <p style="font-size:15px;line-height:1.6;color:#444;">${greeting}</p>
        <p style="font-size:15px;line-height:1.6;color:#444;">
          We received a request to reset the password for your YalaInvite account.
          Click the button below to choose a new password. This link expires in 1 hour.
        </p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${resetUrl}" style="background:#b8860b;color:#fffdf8;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:16px;display:inline-block;">
            Reset Password
          </a>
        </div>
        <p style="font-size:13px;line-height:1.6;color:#888;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color:#b8860b;word-break:break-all;">${resetUrl}</a>
        </p>
        <p style="font-size:13px;line-height:1.6;color:#888;margin-top:24px;">
          If you didn't request this, you can safely ignore this email — your password won't change.
        </p>
      </div>
      <p style="text-align:center;font-size:12px;color:#666;margin-top:20px;">
        YalaInvite — Digital Invitations
      </p>
    </div>
  </body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
