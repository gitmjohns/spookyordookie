import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { adminDb } from "@/lib/supabase/admin";
import { usernameHasBannedWord } from "@/lib/wordFilter";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const cookieStore = await cookies();

    // Capture cookies set during the exchange so we can apply them
    // directly to the redirect response — Next.js does not reliably
    // forward cookies() mutations onto a manually-returned NextResponse.
    const pendingCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              pendingCookies.push({ name, value, options: options as Record<string, unknown> });
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: exchangeData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const user = exchangeData.user;
      let redirectTo = `${origin}/`;

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
          redirectTo = `${origin}/auth/username`;
        } else if (!profile.username_confirmed) {
          redirectTo = `${origin}/auth/username`;
        }
      }

      const response = NextResponse.redirect(redirectTo);
      pendingCookies.forEach(({ name, value, options }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        response.cookies.set(name, value, options as any);
      });
      return response;
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
