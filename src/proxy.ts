import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — must come before any logic that reads the user
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Enforce username setup for authenticated users on non-auth, non-API pages
  if (
    user &&
    !pathname.startsWith("/auth/") &&
    !pathname.startsWith("/api/")
  ) {
    // Cookie shortcut: confirmed users skip the DB query on every request
    if (request.cookies.get("username_confirmed")?.value === "1") {
      return supabaseResponse;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("username_confirmed")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.username_confirmed) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/username";
      return NextResponse.redirect(url);
    }

    // Cache confirmation so future requests skip the DB query
    supabaseResponse.cookies.set("username_confirmed", "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
