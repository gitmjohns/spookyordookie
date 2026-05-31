import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminDb } from "@/lib/supabase/admin";
import { usernameHasBannedWord } from "@/lib/wordFilter";

export const dynamic = "force-dynamic";

export async function POST() {
  console.log("[api/profile] POST called");

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error("[api/profile] auth.getUser error:", authError.message);
    return NextResponse.json({ error: "Auth error: " + authError.message }, { status: 401 });
  }

  if (!user) {
    console.error("[api/profile] no user returned from auth.getUser");
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  console.log("[api/profile] user id:", user.id, "email:", user.email);

  const svc = adminDb();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(not set)";
  const svcKeyLen = process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0;
  console.log("[api/profile] supabase url prefix:", supabaseUrl.slice(0, 40));
  console.log("[api/profile] service role key set:", svcKeyLen > 0, "length:", svcKeyLen);

  const { data: profile, error: profileError } = await svc
    .from("profiles")
    .select("id, username_confirmed")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[api/profile] profile lookup error:", {
      message: profileError.message,
      code: (profileError as unknown as { code?: string }).code,
      details: (profileError as unknown as { details?: string }).details,
      hint: (profileError as unknown as { hint?: string }).hint,
    });
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  console.log("[api/profile] profile lookup result:", profile ?? "NO PROFILE FOUND");

  if (profile) {
    console.log("[api/profile] existing profile found, username_confirmed:", profile.username_confirmed);
    return NextResponse.json({ username_confirmed: profile.username_confirmed });
  }

  // No profile — trigger didn't fire; create it here
  console.log("[api/profile] no profile found — attempting fallback insert");
  const username = await makeUniqueUsername(svc, user);
  console.log("[api/profile] generated username:", username);

  const insertPayload = {
    id: user.id,
    username,
    username_confirmed: false,
    avatar_emoji: "💀",
    avatar_bg: "#0a0a0f",
    role: "user",
    banned: false,
    is_prime_admin: false,
  };
  console.log("[api/profile] insert payload:", JSON.stringify(insertPayload));

  const { error: insertError } = await svc.from("profiles").insert(insertPayload);

  if (insertError) {
    console.error("[api/profile] insert error:", {
      message: insertError.message,
      code: (insertError as unknown as { code?: string }).code,
      details: (insertError as unknown as { details?: string }).details,
      hint: (insertError as unknown as { hint?: string }).hint,
    });
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  console.log("[api/profile] fallback insert succeeded for user:", user.id);
  return NextResponse.json({ username_confirmed: false });
}

async function makeUniqueUsername(
  svc: ReturnType<typeof adminDb>,
  user: { user_metadata?: Record<string, string>; email?: string }
): Promise<string> {
  const raw = (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "ghost"
  ).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16) || "ghost";

  const base = usernameHasBannedWord(raw) ? "ghost" : (raw.length >= 3 ? raw : `${raw}user`);
  let candidate = base;

  for (let i = 0; i < 10; i++) {
    const { data } = await svc.from("profiles").select("id").eq("username", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base.slice(0, 14)}${Math.floor(1000 + Math.random() * 9000)}`;
  }

  return `user${Date.now().toString(36)}`;
}
