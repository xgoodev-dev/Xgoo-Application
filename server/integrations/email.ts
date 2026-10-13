const DEFAULT_FROM = "XGoo <connect@xgoo.in>";

export type TransactionalEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

function emailFromAddress() {
  return (
    process.env.EMAIL_FROM?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    DEFAULT_FROM
  );
}

export function isEmailConfigured(): boolean {
  if (process.env.RESEND_API_KEY?.trim()) return true;
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim(),
  );
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

async function sendViaResend(message: TransactionalEmail): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFromAddress(),
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Resend rejected the email (${res.status}): ${detail.slice(0, 280)}`);
  }
  return true;
}

async function sendViaSmtp(message: TransactionalEmail): Promise<boolean> {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) return false;

  const nodemailer = await import("nodemailer");
  const createTransport = nodemailer.createTransport ?? nodemailer.default?.createTransport;
  const port = Number(process.env.SMTP_PORT || "587");
  const secure =
    process.env.SMTP_SECURE === "true" || process.env.SMTP_SECURE === "1" || port === 465;
  const transporter = createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
  await transporter.sendMail({
    from: emailFromAddress(),
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
  return true;
}

export async function sendTransactionalEmail(message: TransactionalEmail): Promise<boolean> {
  const to = message.to.trim();
  if (!isValidEmail(to)) return false;
  if (!isEmailConfigured()) return false;

  const payload = { ...message, to };
  if (process.env.RESEND_API_KEY?.trim()) {
    return sendViaResend(payload);
  }
  return sendViaSmtp(payload);
}

export function triggerTransactionalEmail(message: TransactionalEmail): void {
  if (!isEmailConfigured()) return;
  void sendTransactionalEmail(message).catch((error) => {
    const detail = error instanceof Error ? error.message : "unknown error";
    console.error("[email] Failed to send", detail);
  });
}
