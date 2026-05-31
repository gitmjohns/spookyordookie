"use server";

import { Resend } from "resend";
import { headers } from "next/headers";
import { contactLimiter } from "@/lib/rate-limit";

export async function submitContactForm(formData: FormData) {
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0].trim() ??
    headersList.get("x-real-ip") ??
    "unknown";

  try {
    await contactLimiter.consume(ip);
  } catch {
    return { error: "Too many messages sent from your connection. Please try again later." };
  }

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const message = (formData.get("message") as string | null)?.trim() ?? "";

  if (!name || !email || !message) {
    return { error: "All fields are required." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }
  if (message.length > 5000) {
    return { error: "Message is too long (5000 character limit)." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not configured");
    return { error: "Something went wrong. Please try again." };
  }

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: "TerrorMeter Contact <noreply@terrormeter.com>",
    to: "admin@terrormeter.com",
    replyTo: email,
    subject: `Contact form: ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
  });

  if (error) {
    console.error("Resend error:", error);
    return { error: "Something went wrong. Please try again." };
  }

  return { success: true };
}
