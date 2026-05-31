import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(not set)";
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "(not set)";
  return NextResponse.json({
    supabase_url_prefix: url.slice(0, 30),
    service_role_key_prefix: svcKey.slice(0, 40),
  });
}
