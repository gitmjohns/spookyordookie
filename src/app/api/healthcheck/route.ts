import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const envStatus = {
    supabaseUrlSet: !!url,
    supabaseUrlValue: url ? `${url.slice(0, 30)}...` : "MISSING",
    anonKeySet: !!anonKey,
    anonKeyLength: anonKey?.length ?? 0,
    anonKeyPrefix: anonKey ? anonKey.slice(0, 20) + "..." : "MISSING",
    serviceRoleKeySet: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0,
  };

  if (!url || !anonKey) {
    return NextResponse.json({ status: "env_missing", envStatus });
  }

  // Test direct REST call with the anon key
  let restStatus: number | null = null;
  let restBody: unknown = null;
  try {
    const res = await fetch(`${url}/rest/v1/titles?select=id&limit=1`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      signal: AbortSignal.timeout(8000),
    });
    restStatus = res.status;
    restBody = await res.json().catch(() => res.text());
  } catch (e) {
    restBody = String(e);
  }

  return NextResponse.json({
    status: restStatus === 200 ? "ok" : "db_error",
    envStatus,
    restStatus,
    restBody,
  });
}
