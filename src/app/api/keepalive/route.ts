import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (
    request.headers.get("authorization") !==
    `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { ok: false, error: "Supabase env vars not configured" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(
      `${url}/rest/v1/titles?select=id&limit=1`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        signal: AbortSignal.timeout(10_000),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json(
        { ok: false, status: res.status, error: body },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, dbStatus: res.status });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 504 }
    );
  }
}
