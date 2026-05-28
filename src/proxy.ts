import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Use AbortController + setTimeout for Edge runtime compatibility
function fetchWithTimeout(url: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 8_000);
  return fetch(url, { ...init, signal: init?.signal ?? controller.signal })
    .finally(() => clearTimeout(id));
}

export async function proxy(request: NextRequest) {
  console.log("[proxy] origin:", request.headers.get("origin"), "| x-forwarded-host:", request.headers.get("x-forwarded-host"), "| host:", request.headers.get("host"));
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
      global: { fetch: fetchWithTimeout },
    }
  );

  // Refresh session — must come before any logic that reads the user.
  // Wrapped in try/catch so a Supabase outage or misconfigured env var
  // does not block every page load.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase unreachable — pass request through without auth context
    return supabaseResponse;
  }

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

    try {
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
    } catch {
      // Profile check failed — let the request through rather than blocking it
      return supabaseResponse;
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
