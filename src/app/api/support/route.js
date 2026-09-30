import { Resend } from "resend";
import { NextResponse } from "next/server";
import { checkRedisRateLimit } from "@/lib/ratelimit";
import { getClientIp } from "@/lib/apiLog";

const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 5);

// In-memory store — reset on cold start (acceptable for serverless)
const rateLimitStore = new Map();

function nowIso() { return new Date().toISOString(); }

function logEvent(level, event, meta = {}) {
  const line = JSON.stringify({ timestamp: nowIso(), event, ...meta });
  if (level === "error") { console.error(line); return; }
  console.info(line);
}

const MAX_MESSAGE_LENGTH = 5000;
const MAX_NAME_LENGTH = 100;

export async function POST(req) {
  const ip = getClientIp(req);
  const retryAfter = await checkRedisRateLimit(ip, {
    prefix: "ne:support",
    max: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
    fallbackStore: rateLimitStore,
  });
  if (retryAfter !== null) {
    logEvent("warn", "rate_limit.exceeded", { ip, route: "support", retryAfter });
    return NextResponse.json(
      { error: "Too many requests. Please retry shortly.", code: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, email, subject, message } = body;

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  if (name.length > MAX_NAME_LENGTH || message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "Name or message is too long." }, { status: 400 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    logEvent("error", "support.email.unconfigured");
    return NextResponse.json(
      { error: "Support email is temporarily unavailable." },
      { status: 503 }
    );
  }

  try {
    const resend = new Resend(resendApiKey);
    await resend.emails.send({
      from: "NeutralEye Support <contact@tryneutraleye.com>",
      to: "contact@tryneutraleye.com",
      replyTo: email,
      subject: `[NeutralEye] ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
    });

    logEvent("info", "support.email.sent", { subject });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logEvent("error", "support.email.error", { error: err.message });
    return NextResponse.json({ error: "Failed to send message. Please try again." }, { status: 500 });
  }
}
