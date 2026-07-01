// Transactional email via the Resend REST API. We call the HTTP endpoint
// directly (no SDK dependency), mirroring lib/paddle-api.ts. Inert until
// RESEND_API_KEY is set, so unconfigured dev/deploys are safe no-ops.
//
// Set RESEND_API_KEY and EMAIL_FROM (a verified sending address, e.g.
// "Prepa <hello@yourdomain.com>"). Until then sends are skipped with a warning.

const RESEND_ENDPOINT = "https://api.resend.com/emails"

export function emailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
}

function fromAddress(): string {
  return process.env.EMAIL_FROM ?? "Prepa <onboarding@resend.dev>"
}

/**
 * Sends via Resend. Returns true when the email was actually handed off, false
 * when skipped because email isn't configured. Throws on a real API error so
 * callers can tell "not sent" apart from "sent" and avoid persisting a
 * dedupe/sent marker for a message that never went out.
 */
async function sendEmail(opts: {
  to: string
  subject: string
  html: string
  text: string
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set — skipping:", opts.subject)
    return false
  }

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    throw new Error(`Resend ${res.status}: ${detail || "send failed"}`)
  }
  return true
}

/** Welcome email sent once when a user's Pro subscription first activates. */
export async function sendProWelcomeEmail(
  to: string,
  name: string | null,
  appUrl: string,
): Promise<boolean> {
  const firstName = name?.trim().split(/\s+/)[0] || "there"
  const dashboardUrl = `${appUrl.replace(/\/$/, "")}/dashboard`

  const text = [
    `Hi ${firstName},`,
    "",
    "Your Prepa Pro subscription is live — thank you for upgrading! 🎉",
    "",
    "You now have unlimited daily questions, full mock exams, and priority AI generation.",
    "",
    `Jump back in: ${dashboardUrl}`,
    "",
    "You can view or cancel your subscription anytime from Profile → Billing & plan.",
    "",
    "— The Prepa team",
  ].join("\n")

  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a;">
    <h1 style="font-size:20px;margin:0 0 16px;">Welcome to Prepa Pro 🎉</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Hi ${firstName},</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
      Your Prepa Pro subscription is live — thank you for upgrading! You now have
      <strong>unlimited daily questions</strong>, <strong>full mock exams</strong>,
      and <strong>priority AI generation</strong>.
    </p>
    <p style="margin:24px 0;">
      <a href="${dashboardUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 20px;border-radius:8px;">
        Start practising
      </a>
    </p>
    <p style="font-size:13px;line-height:1.6;color:#64748b;margin:0;">
      You can view or cancel your subscription anytime from Profile → Billing &amp; plan.
    </p>
    <p style="font-size:13px;line-height:1.6;color:#64748b;margin:16px 0 0;">— The Prepa team</p>
  </div>`

  return sendEmail({
    to,
    subject: "Welcome to Prepa Pro 🎉",
    html,
    text,
  })
}
