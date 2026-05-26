import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { usernameHasBannedWord } from "@/lib/wordFilter";
import { usernameLookupLimiter } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
  try { await usernameLookupLimiter.consume(ip); }
  catch { return NextResponse.json({ error: "Too many requests" }, { status: 429 }); }

  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.trim().toLowerCase() ?? "";

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return NextResponse.json({ available: false });
  }

  if (usernameHasBannedWord(username)) {
    return NextResponse.json({ available: false });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ available: false }, { status: 401 });
  }

  // Available if no other profile holds this username
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .maybeSingle();

  return NextResponse.json({ available: !data });
}
