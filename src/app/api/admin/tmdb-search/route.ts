import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminDb } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await adminDb().from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const q = request.nextUrl.searchParams.get("q")?.trim();
  const type = request.nextUrl.searchParams.get("type") === "tv" ? "tv" : "movie";
  if (!q) return NextResponse.json({ results: [] });

  const path = type === "movie" ? "/search/movie" : "/search/tv";
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  url.searchParams.set("api_key", process.env.TMDB_API_KEY!);
  url.searchParams.set("query", q);
  url.searchParams.set("language", "en-US");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return NextResponse.json({ results: [] });
  const json = await res.json();

  const results = (json.results ?? []).slice(0, 8).map((r: Record<string, unknown>) => ({
    tmdb_id: r.id,
    title: type === "movie" ? r.title : r.name,
    release_year: (() => {
      const d = (type === "movie" ? r.release_date : r.first_air_date) as string | null;
      return d ? parseInt(d.split("-")[0], 10) : null;
    })(),
    poster_path: r.poster_path ?? null,
    overview: r.overview ?? null,
  }));

  return NextResponse.json({ results });
}
