import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { contactLimiter } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  try {
    await contactLimiter.consume(ip);
  } catch {
    return NextResponse.json(
      { error: "Too many messages sent from your connection. Please try again later." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const { name, email, message } = body as { name: string; email: string; message: string };

  const trimmedName = name?.trim() ?? "";
  const trimmedEmail = email?.trim() ?? "";
  const trimmedMessage = message?.trim() ?? "";

  if (!trimmedName || !trimmedEmail || !trimmedMessage) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (trimmedMessage.length > 5000) {
    return NextResponse.json({ error: "Message is too long (5000 character limit)." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not configured");
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: "TerrorMeter Contact <noreply@terrormeter.com>",
    to: "admin@terrormeter.com",
    replyTo: trimmedEmail,
    subject: `Contact form: ${trimmedName}`,
    text: `Name: ${trimmedName}\nEmail: ${trimmedEmail}\n\n${trimmedMessage}`,
  });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
