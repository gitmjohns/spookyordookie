import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { adminDb } from "@/lib/supabase/admin";
import { usernameHasBannedWord } from "@/lib/wordFilter";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  console.log("[cb] hit", { origin, hasCode: !!code, codeLen: code?.length ?? 0 });

  if (code) {
    try {
      const cookieStore = await cookies();
      const cookieNames = cookieStore.getAll().map((c) => c.name);
      console.log("[cb] cookies", cookieNames);

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

      console.log("[cb] calling exchange");
      const { data: exchangeData, error } = await supabase.auth.exchangeCodeForSession(code);
      console.log("[cb] exchange done", {
        error: error ? { message: error.message, status: (error as { status?: number }).status, name: error.name } : null,
        hasUser: !!exchangeData?.user,
        userId: exchangeData?.user?.id ?? null,
      });

      if (!error) {
        const user = exchangeData.user;
        let redirectTo = `${origin}/`;

        if (user) {
          const svc = adminDb();
          const { data: profile, error: profileError } = await svc
            .from("profiles")
            .select("id, username_confirmed")
            .eq("id", user.id)
            .maybeSingle();

          console.log("[cb] profile", { found: !!profile, confirmed: profile?.username_confirmed ?? null, err: profileError?.message ?? null });

          if (!profile) {
            const username = await makeUniqueUsername(svc, user);
            const { error: insertError } = await svc.from("profiles").insert({
              id: user.id,
              username,
              username_confirmed: false,
              avatar_emoji: "💀",
              avatar_bg: "#0a0a0f",
              role: "user",
              banned: false,
              is_prime_admin: false,
            });
            console.log("[cb] fallback insert", {
              username,
              err: insertError ? {
                message: insertError.message,
                code: (insertError as unknown as { code?: string }).code,
                details: (insertError as unknown as { details?: string }).details,
                hint: (insertError as unknown as { hint?: string }).hint,
              } : null,
            });
            redirectTo = `${origin}/auth/username`;
          } else if (!profile.username_confirmed) {
            redirectTo = `${origin}/auth/username`;
          }
        }

        console.log("[cb] redirecting to", redirectTo);
        const response = NextResponse.redirect(redirectTo);
        pendingCookies.forEach(({ name, value, options }) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          response.cookies.set(name, value, options as any);
        });
        return response;
      }
    } catch (err) {
      console.error("[cb] exception", err instanceof Error ? { message: err.message, stack: err.stack } : err);
    }
  }

  console.log("[cb] falling through to auth_failed");
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
