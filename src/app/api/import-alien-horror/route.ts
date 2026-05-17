import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const TMDB_BASE = "https://api.themoviedb.org/3";
type Entry = { q: string; y: number; type: "movie" | "tv"; subgenres: string[]; score: number };

const LIST: Entry[] = [
  { q: "Signs",                          y: 2002, type: "movie", subgenres: ["Sci-Fi Horror","Creature Feature"],                    score: 82 },
  { q: "Fire in the Sky",                y: 1993, type: "movie", subgenres: ["Sci-Fi Horror"],                                       score: 68 },
  { q: "The Arrival",                    y: 1996, type: "movie", subgenres: ["Sci-Fi Horror"],                                       score: 65 },
  { q: "Invasion of the Body Snatchers", y: 1978, type: "movie", subgenres: ["Sci-Fi Horror","Creature Feature"],                    score: 92 },
  { q: "The Faculty",                    y: 1998, type: "movie", subgenres: ["Sci-Fi Horror","Body Horror"],                         score: 72 },
  { q: "Species",                        y: 1995, type: "movie", subgenres: ["Sci-Fi Horror","Creature Feature","Body Horror"],      score: 52 },
  { q: "Species II",                     y: 1998, type: "movie", subgenres: ["Sci-Fi Horror","Creature Feature"],                    score: 18 },
  { q: "Dark Skies",                     y: 2013, type: "movie", subgenres: ["Sci-Fi Horror","Supernatural"],                        score: 62 },
  { q: "No One Will Save You",           y: 2023, type: "movie", subgenres: ["Sci-Fi Horror","Creature Feature"],                    score: 82 },
  { q: "Pitch Black",                    y: 2000, type: "movie", subgenres: ["Sci-Fi Horror","Creature Feature"],                    score: 72 },
  { q: "They Live",                      y: 1988, type: "movie", subgenres: ["Sci-Fi Horror","Cult Classic"],                        score: 78 },
  { q: "Honeymoon",                      y: 2014, type: "movie", subgenres: ["Sci-Fi Horror","Body Horror"],                         score: 68 },
  { q: "Under the Skin",                 y: 2013, type: "movie", subgenres: ["Sci-Fi Horror","Body Horror"],                         score: 82 },
  { q: "Sputnik",                        y: 2020, type: "movie", subgenres: ["Sci-Fi Horror","Body Horror","Creature Feature"],      score: 75 },
  { q: "Life",                           y: 2017, type: "movie", subgenres: ["Sci-Fi Horror","Creature Feature"],                    score: 68 },
  { q: "The Puppet Masters",             y: 1994, type: "movie", subgenres: ["Sci-Fi Horror","Creature Feature"],                    score: 45 },
  { q: "Village of the Damned",          y: 1995, type: "movie", subgenres: ["Sci-Fi Horror","Supernatural"],                        score: 38 },
  { q: "War of the Worlds",              y: 2005, type: "movie", subgenres: ["Sci-Fi Horror","Creature Feature"],                    score: 72 },
  { q: "Bad Taste",                      y: 1987, type: "movie", subgenres: ["Sci-Fi Horror","Comedy Horror","Cult Classic"],        score: 68 },
  { q: "The Fourth Kind",                y: 2009, type: "movie", subgenres: ["Sci-Fi Horror","Found Footage"],                       score: 18 },
  { q: "Extraterrestrial",               y: 2014, type: "movie", subgenres: ["Sci-Fi Horror","Found Footage"],                       score: 32 },
  { q: "Alien Abduction",               y: 2014, type: "movie", subgenres: ["Sci-Fi Horror","Found Footage"],                       score: 42 },
  { q: "Dreamcatcher",                   y: 2003, type: "movie", subgenres: ["Sci-Fi Horror","Creature Feature"],                    score: 38 },
  { q: "The Hidden",                     y: 1987, type: "movie", subgenres: ["Sci-Fi Horror","Creature Feature"],                    score: 78 },
  { q: "Night of the Creeps",            y: 1986, type: "movie", subgenres: ["Sci-Fi Horror","Zombie","Comedy Horror"],              score: 78 },
  { q: "Slither",                        y: 2006, type: "movie", subgenres: ["Sci-Fi Horror","Creature Feature","Comedy Horror"],    score: 85 },
  { q: "Lifeforce",                      y: 1985, type: "movie", subgenres: ["Sci-Fi Horror","Creature Feature","Body Horror"],      score: 72 },
  { q: "Body Snatchers",                 y: 1993, type: "movie", subgenres: ["Sci-Fi Horror","Creature Feature"],                    score: 58 },
  { q: "The Invasion",                   y: 2007, type: "movie", subgenres: ["Sci-Fi Horror","Creature Feature"],                    score: 22 },
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
