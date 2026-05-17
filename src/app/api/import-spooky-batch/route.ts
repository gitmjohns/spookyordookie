import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const TMDB_BASE = "https://api.themoviedb.org/3";

type Entry = { q: string; y: number; type: "movie" | "tv"; subgenres: string[]; score: number };

const BATCH: Entry[] = [
  { q: "Beetlejuice Beetlejuice",          y: 2024, type: "movie", subgenres: ["Comedy Horror","Supernatural"],           score: 68 },
  { q: "Sleepy Hollow",                    y: 1999, type: "movie", subgenres: ["Supernatural","Slasher"],                 score: 78 },
  { q: "Edward Scissorhands",              y: 1990, type: "movie", subgenres: ["Comedy Horror","Psychological"],           score: 82 },
  { q: "The Addams Family",                y: 1991, type: "movie", subgenres: ["Comedy Horror","Supernatural"],            score: 75 },
  { q: "Addams Family Values",             y: 1993, type: "movie", subgenres: ["Comedy Horror","Supernatural"],            score: 72 },
  { q: "Casper",                           y: 1995, type: "movie", subgenres: ["Comedy Horror","Supernatural"],            score: 65 },
  { q: "Hocus Pocus",                      y: 1993, type: "movie", subgenres: ["Comedy Horror","Supernatural"],            score: 70 },
  { q: "Hocus Pocus 2",                    y: 2022, type: "movie", subgenres: ["Comedy Horror","Supernatural"],            score: 55 },
  { q: "Scary Stories to Tell in the Dark",y: 2019, type: "movie", subgenres: ["Supernatural","Creature Feature"],        score: 68 },
  { q: "Wednesday",                        y: 2022, type: "tv",    subgenres: ["Comedy Horror","Supernatural"],            score: 78 },
];

type DBTitle = { id: string; tmdb_id: number; title: string; release_year: number | null; media_type: string };

function normalize(s: string) {
  return s.toLowerCase().trim().replace(/^(the |a |an )/, "").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ");
}

function titlesMatch(dbTitle: string, q: string): boolean {
  const a = normalize(dbTitle);
  const b = normalize(q);
  return a === b || a.includes(b) || b.includes(a);
}

function findInDb(all: DBTitle[], q: string, y: number, type: "movie" | "tv"): DBTitle | null {
  const candidates = all.filter((t) => t.media_type === type && t.release_year === y);
  return candidates.find((t) => titlesMatch(t.title, q)) ?? null;
}

function tmdbUrl(path: string, params: Record<string, string>): string {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", process.env.TMDB_API_KEY!);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

async function searchTMDB(q: string, y: number, type: "movie" | "tv", gm: Record<number, string>) {
  const path = type === "movie" ? "/search/movie" : "/search/tv";
  const yk = type === "movie" ? "year" : "first_air_date_year";
  for (const tryY of [y, undefined]) {
    const params: Record<string, string> = { query: q, language: "en-US" };
    if (tryY !== undefined) params[yk] = String(tryY);
    const res = await fetch(tmdbUrl(path, params), { cache: "no-store" });
    if (!res.ok) continue;
    const data = await res.json();
    const r = data.results?.[0];
    if (!r) continue;
    const isMovie = type === "movie";
    const title = isMovie ? r.title : r.name;
    const dateStr = isMovie ? r.release_date : r.first_air_date;
    return {
      tmdb_id: r.id as number, title,
      overview: (r.overview as string) || null,
      poster_path: (r.poster_path as string | null) ?? null,
      backdrop_path: (r.backdrop_path as string | null) ?? null,
      release_year: dateStr ? parseInt((dateStr as string).split("-")[0], 10) : null,
      genres: ((r.genre_ids as number[]) ?? []).map((id) => gm[id]).filter(Boolean),
    };
  }
  return null;
}

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  // Load existing titles
  const { data: allDbRaw } = await supabase.from("titles").select("id,tmdb_id,title,release_year,media_type");
  const allDb = (allDbRaw ?? []) as DBTitle[];

  // Fetch genre maps
  const [mgRes, tgRes] = await Promise.all([
    fetch(tmdbUrl("/genre/movie/list", { language: "en-US" }), { cache: "no-store" }),
    fetch(tmdbUrl("/genre/tv/list",    { language: "en-US" }), { cache: "no-store" }),
  ]);
  const movieGM: Record<number, string> = Object.fromEntries(((await mgRes.json()).genres ?? []).map((g: {id:number;name:string}) => [g.id, g.name]));
  const tvGM:    Record<number, string> = Object.fromEntries(((await tgRes.json()).genres ?? []).map((g: {id:number;name:string}) => [g.id, g.name]));

  const results: { title: string; status: "existed" | "imported" | "failed"; detail?: string }[] = [];

  for (const e of BATCH) {
    const label = `${e.q} (${e.y})`;
    let existing = findInDb(allDb, e.q, e.y, e.type);

    if (!existing) {
      const tmdbData = await searchTMDB(e.q, e.y, e.type, e.type === "movie" ? movieGM : tvGM);
      if (tmdbData) {
        const byId = allDb.find((t) => t.tmdb_id === tmdbData.tmdb_id && t.media_type === e.type);
        if (byId) {
          existing = byId;
        } else {
          const { error } = await supabase.from("titles").upsert({
            tmdb_id: tmdbData.tmdb_id, media_type: e.type,
            title: tmdbData.title, overview: tmdbData.overview,
            poster_path: tmdbData.poster_path, backdrop_path: tmdbData.backdrop_path,
            release_year: tmdbData.release_year, genres: tmdbData.genres,
            subgenres: e.subgenres, critic_score: e.score,
          }, { onConflict: "tmdb_id,media_type" });
          if (error) {
            results.push({ title: label, status: "failed", detail: error.message });
            continue;
          }
          results.push({ title: label, status: "imported", detail: `→ "${tmdbData.title}" (${tmdbData.release_year})` });
          allDb.push({ id: "new", tmdb_id: tmdbData.tmdb_id, title: tmdbData.title, release_year: tmdbData.release_year, media_type: e.type });
          await new Promise((r) => setTimeout(r, 80));
          continue;
        }
      } else {
        results.push({ title: label, status: "failed", detail: "not found on TMDB" });
        continue;
      }
    }

    await supabase.from("titles").update({ subgenres: e.subgenres, critic_score: e.score }).eq("id", existing.id);
    results.push({ title: label, status: "existed", detail: `updated tags+score` });
  }

  return NextResponse.json({
    success: true,
    imported: results.filter((r) => r.status === "imported").length,
    existed:  results.filter((r) => r.status === "existed").length,
    failed:   results.filter((r) => r.status === "failed").length,
    detail:   results.map((r) => `${r.status.toUpperCase()}: ${r.title} ${r.detail ?? ""}`),
  });
}
