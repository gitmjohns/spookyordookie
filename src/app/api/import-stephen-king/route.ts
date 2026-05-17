import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const TMDB_BASE = "https://api.themoviedb.org/3";

type Entry = { q: string; y: number; type: "movie" | "tv"; subgenres: string[]; score: number };

const LIST: Entry[] = [
  // ── New imports ───────────────────────────────────────────────────────────
  { q: "The Night Flier",      y: 1997, type: "movie", subgenres: ["Supernatural","Vampire"],              score: 62 },
  { q: "Graveyard Shift",      y: 1990, type: "movie", subgenres: ["Creature Feature"],                   score: 28 },
  { q: "The Mangler",          y: 1995, type: "movie", subgenres: ["Supernatural","Creature Feature"],    score: 22 },
  { q: "Sleepwalkers",         y: 1992, type: "movie", subgenres: ["Supernatural","Creature Feature"],    score: 30 },
  { q: "The Dark Half",        y: 1993, type: "movie", subgenres: ["Supernatural","Slasher"],             score: 55 },
  { q: "The Lawnmower Man",    y: 1992, type: "movie", subgenres: ["Sci-Fi Horror"],                      score: 42 },
  { q: "The Dark Tower",       y: 2017, type: "movie", subgenres: ["Supernatural","Sci-Fi Horror"],       score: 38 },
  { q: "1922",                 y: 2017, type: "movie", subgenres: ["Supernatural"],                       score: 72 },
  { q: "Firestarter",          y: 2022, type: "movie", subgenres: ["Supernatural","Sci-Fi Horror"],       score: 28 },
  { q: "Dolores Claiborne",    y: 1995, type: "movie", subgenres: ["Slasher"],                            score: 65 },

  // ── Verify / update existing ──────────────────────────────────────────────
  { q: "Needful Things",       y: 1993, type: "movie", subgenres: ["Supernatural"],                       score: 58 },
  { q: "Cujo",                 y: 1983, type: "movie", subgenres: ["Creature Feature"],                   score: 62 },
  { q: "Maximum Overdrive",    y: 1986, type: "movie", subgenres: ["Creature Feature","Sci-Fi Horror"],   score: 32 },
  { q: "Silver Bullet",        y: 1985, type: "movie", subgenres: ["Werewolf","Supernatural"],            score: 65 },
  { q: "Cat's Eye",            y: 1985, type: "movie", subgenres: ["Supernatural"],                       score: 68 },
  { q: "Creepshow",            y: 1982, type: "movie", subgenres: ["Supernatural","Comedy Horror"],       score: 84 },
  { q: "Creepshow 2",          y: 1987, type: "movie", subgenres: ["Supernatural"],                       score: 70 },
  { q: "Gerald's Game",        y: 2017, type: "movie", subgenres: ["Supernatural"],                       score: 75 },
  { q: "Firestarter",          y: 1984, type: "movie", subgenres: ["Supernatural","Sci-Fi Horror"],       score: 62 },
  { q: "Children of the Corn", y: 1984, type: "movie", subgenres: ["Supernatural","Folk Horror"],         score: 65 },
  { q: "Thinner",              y: 1996, type: "movie", subgenres: ["Supernatural"],                       score: 45 },
  { q: "Misery",               y: 1990, type: "movie", subgenres: ["Slasher"],                            score: 83 },
  { q: "The Dead Zone",        y: 1983, type: "movie", subgenres: ["Supernatural"],                       score: 72 },
  { q: "Christine",            y: 1983, type: "movie", subgenres: ["Supernatural"],                       score: 72 },
  { q: "Pet Sematary",         y: 1989, type: "movie", subgenres: ["Supernatural","Zombie"],              score: 75 },
  { q: "Pet Sematary",         y: 2019, type: "movie", subgenres: ["Supernatural","Zombie"],              score: 65 },
  { q: "Doctor Sleep",         y: 2019, type: "movie", subgenres: ["Supernatural"],                       score: 75 },
  { q: "It",                   y: 1990, type: "movie", subgenres: ["Supernatural","Creature Feature"],    score: 72 },
  { q: "It Chapter One",       y: 2017, type: "movie", subgenres: ["Supernatural","Creature Feature"],    score: 79 },
  { q: "It Chapter Two",       y: 2019, type: "movie", subgenres: ["Supernatural","Creature Feature"],    score: 72 },
  { q: "The Shining",          y: 1980, type: "movie", subgenres: ["Supernatural"],                       score: 96 },
  { q: "1408",                 y: 2007, type: "movie", subgenres: ["Supernatural"],                       score: 72 },
  { q: "The Mist",             y: 2007, type: "movie", subgenres: ["Creature Feature","Sci-Fi Horror"],   score: 73 },
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

  const [mgRes, tgRes] = await Promise.all([
    fetch(tmdbUrl("/genre/movie/list", { language: "en-US" }), { cache: "no-store" }),
    fetch(tmdbUrl("/genre/tv/list",    { language: "en-US" }), { cache: "no-store" }),
  ]);
  const movieGM: Record<number,string> = Object.fromEntries(((await mgRes.json()).genres ?? []).map((g: {id:number;name:string}) => [g.id,g.name]));
  const tvGM:    Record<number,string> = Object.fromEntries(((await tgRes.json()).genres ?? []).map((g: {id:number;name:string}) => [g.id,g.name]));

  const results: { title: string; status: "existed"|"imported"|"failed"; detail?: string }[] = [];

  for (let i = 0; i < LIST.length; i++) {
    const e = LIST[i];
    const label = `${e.q} (${e.y})`;
    let existing = findInDb(allDb, e.q, e.y, e.type);

    if (!existing) {
      const td = await searchTMDB(e.q, e.y, e.type, e.type === "movie" ? movieGM : tvGM);
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
    results.push({ title: label, status: "existed" });
    if (i % 8 === 7) await new Promise(r => setTimeout(r, 100));
  }

  const imported = results.filter(r => r.status === "imported");
  const existed  = results.filter(r => r.status === "existed");
  const failed   = results.filter(r => r.status === "failed");
  return NextResponse.json({
    success: true, total: LIST.length,
    existed: existed.length, imported: imported.length, failed: failed.length,
    importedList: imported.map(r => `${r.title} ${r.detail ?? ""}`),
    failedList:   failed.map(r => `${r.title}: ${r.detail}`),
  });
}
