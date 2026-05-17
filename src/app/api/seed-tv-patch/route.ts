import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const TMDB_BASE = "https://api.themoviedb.org/3";

// Corrected queries for the 19 shows that failed in seed-tv-whitelist
const PATCH: { q: string; y?: number }[] = [
  { q: "Friday the 13th", y: 1987 },
  { q: "From", y: 2022 },
  { q: "Marianne", y: 2019 },
  { q: "Oz", y: 1997 },
  { q: "Scream", y: 2015 },
  { q: "The Exorcist", y: 2016 },
  { q: "The Haunting", y: 2009 },
  { q: "The Hunger", y: 1997 },
  { q: "Les Revenants", y: 2012 },
  { q: "The Mist", y: 2017 },
  { q: "Ghosted", y: 2017 },
  { q: "The Watcher", y: 2022 },
  { q: "Them", y: 2021 },
  { q: "Being Human", y: 2008 },
  { q: "In the Flesh", y: 2013 },
  { q: "Utopia", y: 2013 },
  { q: "The Fades", y: 2011 },
  { q: "Misfits", y: 2009 },
  { q: "Bedlam", y: 2011 },
];

type TVResult = {
  id: number; name: string; overview: string;
  poster_path: string | null; backdrop_path: string | null;
  first_air_date: string; genre_ids: number[]; popularity: number;
};

function tmdbUrl(path: string, params: Record<string, string>) {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", process.env.TMDB_API_KEY!);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

async function searchTV(query: string, year?: number): Promise<TVResult | null> {
  const params: Record<string, string> = { query, language: "en-US", page: "1" };
  if (year) params.first_air_date_year = String(year);
  const res = await fetch(tmdbUrl("/search/tv", params), { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.results?.[0] ?? null;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const genreRes = await fetch(tmdbUrl("/genre/tv/list", { language: "en" }), { cache: "no-store" });
  const genreData = await genreRes.json();
  const genreMap: Record<number, string> = Object.fromEntries(
    (genreData.genres ?? []).map((g: { id: number; name: string }) => [g.id, g.name])
  );

  const found: { name: string; tmdb_id: number }[] = [];
  const notFound: string[] = [];
  const payload = [];

  for (const entry of PATCH) {
    await new Promise((r) => setTimeout(r, 60));
    const result = await searchTV(entry.q, entry.y);
    if (!result) { notFound.push(`${entry.q} (${entry.y})`); continue; }
    found.push({ name: result.name, tmdb_id: result.id });
    payload.push({
      tmdb_id: result.id,
      media_type: "tv" as const,
      title: result.name,
      overview: result.overview || null,
      poster_path: result.poster_path,
      backdrop_path: result.backdrop_path,
      release_year: result.first_air_date ? parseInt(result.first_air_date.split("-")[0], 10) : null,
      genres: result.genre_ids.map((id) => genreMap[id]).filter(Boolean),
    });
  }

  if (payload.length > 0) {
    await supabase.from("titles").upsert(payload, { onConflict: "tmdb_id,media_type" });
  }

  return NextResponse.json({ imported: found.map((s) => s.name), notFound });
}
