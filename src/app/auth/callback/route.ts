import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { adminDb } from "@/lib/supabase/admin";
import { usernameHasBannedWord } from "@/lib/wordFilter";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: exchangeData, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const user = exchangeData.user;
      if (user) {
        const svc = adminDb();
        const { data: profile } = await svc
          .from("profiles")
          .select("id, username_confirmed")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile) {
          // Trigger didn't fire — create profile manually as fallback
          const username = await makeUniqueUsername(svc, user);
          await svc.from("profiles").insert({
            id: user.id,
            username,
            username_confirmed: false,
          });
          return NextResponse.redirect(`${origin}/auth/username`);
        }

        // New user who hasn't confirmed their username yet
        if (!profile.username_confirmed) {
          return NextResponse.redirect(`${origin}/auth/username`);
        }
      }
      const html = `<!DOCTYPE html><html><head></head><body><script>
(function(){var r=localStorage.getItem('returnTo');localStorage.removeItem('returnTo');window.location.replace(r&&r.startsWith('/')&&!r.startsWith('//')?r:'/');})()</script></body></html>`;
      return new NextResponse(html, { status: 200, headers: { "Content-Type": "text/html" } });
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
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
