import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const TMDB_BASE = "https://api.themoviedb.org/3";
type Entry = { q: string; y: number; type: "movie" | "tv"; subgenres: string[]; score: number };

const LIST: Entry[] = [
  // ── Ti West ──────────────────────────────────────────────────────────────
  { q: "House of the Devil",              y: 2009, type: "movie", subgenres: ["Supernatural","Folk Horror"],            score: 82 },
  { q: "The Innkeepers",                  y: 2011, type: "movie", subgenres: ["Supernatural"],                          score: 80 },
  // ── Benson & Moorhead ────────────────────────────────────────────────────
  { q: "Synchronic",                      y: 2019, type: "movie", subgenres: ["Sci-Fi Horror"],                         score: 68 },
  // ── Blumhouse / A24 indie horror ─────────────────────────────────────────
  { q: "It Comes at Night",               y: 2017, type: "movie", subgenres: ["Supernatural","Sci-Fi Horror"],          score: 78 },
  { q: "Relic",                           y: 2020, type: "movie", subgenres: ["Supernatural"],                          score: 78 },
  { q: "The Night Eats the World",        y: 2018, type: "movie", subgenres: ["Zombie"],                                score: 72 },
  { q: "We're All Going to the World's Fair", y: 2021, type: "movie", subgenres: ["Supernatural","Sci-Fi Horror"],      score: 72 },
  { q: "Slash/Back",                      y: 2022, type: "movie", subgenres: ["Sci-Fi Horror","Creature Feature"],      score: 65 },
  { q: "Stopmotion",                      y: 2023, type: "movie", subgenres: ["Body Horror","Supernatural"],            score: 72 },
  // ── Shudder originals ────────────────────────────────────────────────────
  { q: "The Vigil",                       y: 2019, type: "movie", subgenres: ["Supernatural"],                          score: 78 },
  { q: "Scare Me",                        y: 2020, type: "movie", subgenres: ["Supernatural","Comedy Horror"],          score: 72 },
  { q: "The Boy Behind the Door",         y: 2020, type: "movie", subgenres: ["Slasher"],                               score: 72 },
  { q: "Glorious",                        y: 2022, type: "movie", subgenres: ["Supernatural","Creature Feature"],       score: 65 },
  { q: "The Offering",                    y: 2022, type: "movie", subgenres: ["Supernatural"],                          score: 55 },
  { q: "Attachment",                      y: 2022, type: "movie", subgenres: ["Supernatural"],                          score: 72 },
  // ── Well-regarded indie horror ───────────────────────────────────────────
  { q: "The Devil's Backbone",            y: 2001, type: "movie", subgenres: ["Supernatural"],                          score: 92 },
  { q: "Pan's Labyrinth",                 y: 2006, type: "movie", subgenres: ["Supernatural","Folk Horror"],            score: 88 },
  { q: "Cube",                            y: 1997, type: "movie", subgenres: ["Sci-Fi Horror"],                         score: 72 },
];

type DBTitle = { id: string; tmdb_id: number; title: string; release_year: number | null; media_type: string };

function normalize(s: string) {
  return s.toLowerCase().trim().replace(/^(the |a |an )/, "").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ");
}
function titlesMatch(a: string, b: string) {
  const na = normalize(a), nb = normalize(b);
  return na === nb || na.includes(nb) || nb.includes(na);
}
function findInDb(all: DBTitle[], q: string, y: number, type: "movie" | "tv"): DBTitle | null {
  const candidates = all.filter(t => t.media_type === type && t.release_year === y);
  return candidates.find(t => titlesMatch(t.title, q)) ?? null;
}
function tmdbUrl(path: string, params: Record<string, string>) {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", process.env.TMDB_API_KEY!);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}
async function searchTMDB(q: string, y: number, type: "movie" | "tv", gm: Record<number, string>) {
  const path = type === "movie" ? "/search/movie" : "/search/tv";
  const yk   = type === "movie" ? "year" : "first_air_date_year";
  for (const tryY of [y, undefined] as Array<number | undefined>) {
    const params: Record<string, string> = { query: q, language: "en-US" };
    if (tryY !== undefined) params[yk] = String(tryY);
    const res = await fetch(tmdbUrl(path, params), { cache: "no-store" });
    if (!res.ok) continue;
    const r = (await res.json()).results?.[0];
    if (!r) continue;
    const isMovie = type === "movie";
    const dateStr = isMovie ? r.release_date : r.first_air_date;
    return {
      tmdb_id: r.id as number, title: (isMovie ? r.title : r.name) as string,
      overview: (r.overview as string) || null,
      poster_path: (r.poster_path as string | null) ?? null,
      backdrop_path: (r.backdrop_path as string | null) ?? null,
      release_year: dateStr ? parseInt((dateStr as string).split("-")[0], 10) : null,
      genres: ((r.genre_ids as number[]) ?? []).map(id => gm[id]).filter(Boolean) as string[],
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

  const { data: allDbRaw } = await supabase.from("titles").select("id,tmdb_id,title,release_year,media_type");
  const allDb = (allDbRaw ?? []) as DBTitle[];

  const mgRes = await fetch(tmdbUrl("/genre/movie/list", { language: "en-US" }), { cache: "no-store" });
  const movieGM: Record<number,string> = Object.fromEntries(((await mgRes.json()).genres ?? []).map((g: {id:number;name:string}) => [g.id,g.name]));

  const results: { title: string; status: "existed"|"imported"|"failed"; detail?: string }[] = [];

  for (let i = 0; i < LIST.length; i++) {
    const e = LIST[i];
    const label = `${e.q} (${e.y})`;
    let existing = findInDb(allDb, e.q, e.y, e.type);

    if (!existing) {
      const td = await searchTMDB(e.q, e.y, e.type, movieGM);
      if (td) {
        const byId = allDb.find(t => t.tmdb_id === td.tmdb_id && t.media_type === e.type);
        if (byId) {
          existing = byId;
        } else {
          const { error } = await supabase.from("titles").upsert({
            tmdb_id: td.tmdb_id, media_type: e.type, title: td.title,
            overview: td.overview, poster_path: td.poster_path, backdrop_path: td.backdrop_path,
            release_year: td.release_year, genres: td.genres,
            subgenres: e.subgenres, critic_score: e.score,
          }, { onConflict: "tmdb_id,media_type" });
          if (error) { results.push({ title: label, status: "failed", detail: error.message }); continue; }
          results.push({ title: label, status: "imported", detail: `→ "${td.title}" (${td.release_year})` });
          allDb.push({ id: "new", tmdb_id: td.tmdb_id, title: td.title, release_year: td.release_year, media_type: e.type });
          if (i % 8 === 7) await new Promise(r => setTimeout(r, 100));
          continue;
        }
      } else {
        results.push({ title: label, status: "failed", detail: "not found on TMDB" });
        continue;
      }
    }

    await supabase.from("titles").update({ subgenres: e.subgenres, critic_score: e.score }).eq("id", existing.id);
    results.push({ title: label, status: "existed", detail: `"${existing.title}" (${existing.release_year})` });
    if (i % 8 === 7) await new Promise(r => setTimeout(r, 100));
  }

  const imported = results.filter(r => r.status === "imported");
  const existed  = results.filter(r => r.status === "existed");
  const failed   = results.filter(r => r.status === "failed");
  return NextResponse.json({
    success: true, total: LIST.length,
    existed: existed.length, imported: imported.length, failed: failed.length,
    existedList:  existed.map(r => `${r.title} ${r.detail ?? ""}`),
    importedList: imported.map(r => `${r.title} ${r.detail ?? ""}`),
    failedList:   failed.map(r => `${r.title}: ${r.detail}`),
  });
}
