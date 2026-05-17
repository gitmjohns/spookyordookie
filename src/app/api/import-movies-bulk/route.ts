import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const TMDB_BASE = "https://api.themoviedb.org/3";
const HORROR_GENRE_ID = 27;

type TMDBMovie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  genre_ids: number[];
  popularity: number;
  vote_count: number;
  vote_average: number;
  original_language: string;
};

function tmdbUrl(path: string, params: Record<string, string>) {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", process.env.TMDB_API_KEY!);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

async function discoverMovies(params: Record<string, string>): Promise<{ results: TMDBMovie[]; total_pages: number }> {
  const res = await fetch(tmdbUrl("/discover/movie", params), { cache: "no-store" });
  if (!res.ok) return { results: [], total_pages: 0 };
  return res.json();
}

// Fetch up to maxPages of a given query, returning deduplicated movies
async function fetchPages(
  params: Record<string, string>,
  maxPages: number
): Promise<TMDBMovie[]> {
  const results: TMDBMovie[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const data = await discoverMovies({ ...params, page: String(page) });
    if (!data.results?.length) break;
    results.push(...data.results);
    if (page >= data.total_pages) break;
    // Small delay to respect TMDB rate limits
    await new Promise((r) => setTimeout(r, 50));
  }
  return results;
}

// Content policy: which languages are allowed and at what vote thresholds
const LANGUAGE_POLICY: Record<string, number> = {
  en: 15,   // English — low threshold, include cult films
  fr: 30,   // French — moderate threshold
  de: 30,   // German
  es: 30,   // Spanish
  it: 30,   // Italian
  pt: 40,   // Portuguese
  sv: 40,   // Swedish
  no: 40,   // Norwegian
  da: 40,   // Danish
  fi: 40,   // Finnish
  nl: 40,   // Dutch
  ja: 60,   // Japanese — higher threshold, well-known only
  ko: 60,   // Korean — higher threshold, well-known only
};

function passesContentPolicy(movie: TMDBMovie): boolean {
  const threshold = LANGUAGE_POLICY[movie.original_language];
  if (threshold === undefined) return false; // Block other languages
  return movie.vote_count >= threshold;
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

  // Fetch existing tmdb_ids to avoid redundant upserts
  const existingIds = new Set<number>();
  let fromIdx = 0;
  while (true) {
    const { data } = await supabase.from("titles").select("tmdb_id").eq("media_type", "movie").range(fromIdx, fromIdx + 999);
    if (!data?.length) break;
    data.forEach((r: { tmdb_id: number }) => existingIds.add(r.tmdb_id));
    if (data.length < 1000) break;
    fromIdx += 1000;
  }

  const seen = new Set<number>();
  const collected: TMDBMovie[] = [];

  const add = (movies: TMDBMovie[]) => {
    for (const m of movies) {
      if (!seen.has(m.id) && passesContentPolicy(m)) {
        seen.add(m.id);
        collected.push(m);
      }
    }
  };

  const BASE = {
    with_genres: String(HORROR_GENRE_ID),
    "vote_count.gte": "15",
  };

  // ── Strategy 1: English popularity sweep (all-time) ─────────────────────
  add(await fetchPages({ ...BASE, sort_by: "popularity.desc", with_original_language: "en" }, 30));

  // ── Strategy 2: English top-rated ───────────────────────────────────────
  add(await fetchPages({ ...BASE, sort_by: "vote_average.desc", with_original_language: "en", "vote_count.gte": "50" }, 20));

  // ── Strategy 3: By decade (English) — captures deep catalog ─────────────
  const decades = [
    { gte: "1960-01-01", lte: "1969-12-31" },
    { gte: "1970-01-01", lte: "1979-12-31" },
    { gte: "1980-01-01", lte: "1989-12-31" },
    { gte: "1990-01-01", lte: "1999-12-31" },
    { gte: "2000-01-01", lte: "2009-12-31" },
    { gte: "2010-01-01", lte: "2019-12-31" },
    { gte: "2020-01-01", lte: "2029-12-31" },
  ];
  for (const d of decades) {
    add(await fetchPages({
      ...BASE,
      sort_by: "vote_count.desc",
      with_original_language: "en",
      "primary_release_date.gte": d.gte,
      "primary_release_date.lte": d.lte,
    }, 8));
  }

  // ── Strategy 4: Western European horror ────────────────────────────────
  for (const lang of ["fr", "de", "es", "it", "pt", "sv", "no", "da", "nl", "fi"]) {
    add(await fetchPages({
      ...BASE,
      sort_by: "vote_count.desc",
      with_original_language: lang,
      "vote_count.gte": "30",
    }, 5));
  }

  // ── Strategy 5: Select Asian horror (Japanese + Korean) ─────────────────
  for (const lang of ["ja", "ko"]) {
    add(await fetchPages({
      ...BASE,
      sort_by: "vote_count.desc",
      with_original_language: lang,
      "vote_count.gte": "50",
    }, 5));
  }

  // Fetch genre map for labeling
  const genreRes = await fetch(tmdbUrl("/genre/movie/list", { language: "en-US" }), { cache: "no-store" });
  const genreData = await genreRes.json();
  const genreMap: Record<number, string> = Object.fromEntries(
    (genreData.genres ?? []).map((g: { id: number; name: string }) => [g.id, g.name])
  );

  // Build payload (only new titles)
  const payload = collected
    .filter((m) => !existingIds.has(m.id))
    .map((m) => ({
      tmdb_id: m.id,
      media_type: "movie" as const,
      title: m.title,
      overview: m.overview || null,
      poster_path: m.poster_path,
      backdrop_path: m.backdrop_path,
      release_year: m.release_date ? parseInt(m.release_date.split("-")[0], 10) : null,
      genres: m.genre_ids.map((id) => genreMap[id]).filter(Boolean),
    }));

  let imported = 0;
  for (let i = 0; i < payload.length; i += 100) {
    const batch = payload.slice(i, i + 100);
    const { count } = await supabase.from("titles").upsert(batch, {
      onConflict: "tmdb_id,media_type",
      count: "exact",
    });
    imported += count ?? batch.length;
  }

  return NextResponse.json({
    success: true,
    collected: collected.length,
    newTitles: payload.length,
    imported,
    alreadyInDb: existingIds.size,
  });
}
