import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(not set)";
  return NextResponse.json({ supabase_url_prefix: url.slice(0, 30) });
}
