import { createServerClient } from "@supabase/ssr";

function fetchWithTimeout(url: RequestInfo | URL, init?: RequestInit) {
  return fetch(url, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(10_000),
  });
}

export function adminDb() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: { getAll: () => [], setAll: () => {} },
      global: { fetch: fetchWithTimeout },
    }
  );
}
