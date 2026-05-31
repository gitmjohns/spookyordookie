import { createServerClient } from "@supabase/ssr";
import { adminDb } from "@/lib/supabase/admin";
import { usernameHasBannedWord } from "@/lib/wordFilter";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // On Vercel, x-forwarded-host is the canonical public hostname
  const forwardedHost = request.headers.get("x-forwarded-host");
  const origin = forwardedHost
    ? `https://${forwardedHost}`
    : request.nextUrl.origin;

  if (error || !code) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
  }

  // Collect cookies that Supabase wants to set so we can attach them to the
  // redirect response (cookies() from next/headers doesn't flow into
  // NextResponse.redirect automatically).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cookieBuffer: { name: string; value: string; options: any }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => toSet.forEach((c) => cookieBuffer.push(c)),
      },
    }
  );

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
  }

  let destination = `${origin}/auth/username`;

  try {
    const svc = adminDb();
    const { data: profile } = await svc
      .from("profiles")
      .select("id, username_confirmed")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      destination = profile.username_confirmed
        ? `${origin}/`
        : `${origin}/auth/username`;
    } else {
      const username = await makeUniqueUsername(svc, user);
      await svc.from("profiles").insert({
        id: user.id,
        username,
        username_confirmed: false,
        avatar_emoji: "💀",
        avatar_bg: "#0a0a0f",
        role: "user",
        banned: false,
        is_prime_admin: false,
      });
    }
  } catch {
    // Profile operations failed; /auth/username will handle it
  }

  const response = NextResponse.redirect(destination);
  cookieBuffer.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  return response;
}

async function makeUniqueUsername(
  svc: ReturnType<typeof adminDb>,
  user: { user_metadata?: Record<string, string>; email?: string }
): Promise<string> {
  const raw =
    (
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "ghost"
    )
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 16) || "ghost";

  const base = usernameHasBannedWord(raw)
    ? "ghost"
    : raw.length >= 3
    ? raw
    : `${raw}user`;
  let candidate = base;

  for (let i = 0; i < 10; i++) {
    const { data } = await svc
      .from("profiles")
      .select("id")
      .eq("username", candidate)
      .maybeSingle();
    if (!data) return candidate;
    candidate = `${base.slice(0, 14)}${Math.floor(1000 + Math.random() * 9000)}`;
  }

  return `user${Date.now().toString(36)}`;
}
