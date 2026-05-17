import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const TMDB_BASE = "https://api.themoviedb.org/3";

type Entry = { q: string; y: number; type: "movie" | "tv"; subgenres: string[]; score: number };

const LIST: Entry[] = [
  // ── STEPHEN KING TV ────────────────────────────────────────────────────────
  { q: "The Stand",                          y: 1994, type: "tv", subgenres: ["Supernatural","Zombie","Sci-Fi Horror"],     score: 78 },
  { q: "The Stand",                          y: 2020, type: "tv", subgenres: ["Supernatural","Zombie","Sci-Fi Horror"],     score: 58 },
  { q: "It",                                 y: 1990, type: "tv", subgenres: ["Supernatural","Creature Feature"],           score: 72 },
  { q: "The Shining",                        y: 1997, type: "tv", subgenres: ["Supernatural"],                              score: 62 },
  { q: "Salem's Lot",                        y: 1979, type: "tv", subgenres: ["Vampire","Supernatural"],                    score: 85 },
  { q: "Salem's Lot",                        y: 2004, type: "tv", subgenres: ["Vampire","Supernatural"],                    score: 62 },
  { q: "The Tommyknockers",                  y: 1993, type: "tv", subgenres: ["Sci-Fi Horror","Supernatural"],              score: 48 },
  { q: "Desperation",                        y: 2006, type: "tv", subgenres: ["Supernatural"],                              score: 45 },
  { q: "Rose Red",                           y: 2002, type: "tv", subgenres: ["Supernatural"],                              score: 52 },
  { q: "Storm of the Century",               y: 1999, type: "tv", subgenres: ["Supernatural"],                              score: 65 },
  { q: "Bag of Bones",                       y: 2011, type: "tv", subgenres: ["Supernatural"],                              score: 48 },
  { q: "The Langoliers",                     y: 1995, type: "tv", subgenres: ["Sci-Fi Horror","Creature Feature"],          score: 52 },
  { q: "Nightmares & Dreamscapes",           y: 2006, type: "tv", subgenres: ["Supernatural"],                              score: 58 },
  { q: "11.22.63",                           y: 2016, type: "tv", subgenres: ["Sci-Fi Horror"],                             score: 82 },
  { q: "The Outsider",                       y: 2020, type: "tv", subgenres: ["Supernatural","Creature Feature"],           score: 85 },
  { q: "Mr. Mercedes",                       y: 2017, type: "tv", subgenres: ["Slasher","Supernatural"],                    score: 72 },
  { q: "Lisey's Story",                      y: 2021, type: "tv", subgenres: ["Supernatural"],                              score: 62 },
  { q: "Haven",                              y: 2010, type: "tv", subgenres: ["Supernatural"],                              score: 65 },
  { q: "Castle Rock",                        y: 2018, type: "tv", subgenres: ["Supernatural"],                              score: 74 },
  { q: "NOS4A2",                             y: 2019, type: "tv", subgenres: ["Vampire","Supernatural"],                    score: 72 },
  { q: "Chapelwaite",                        y: 2021, type: "tv", subgenres: ["Vampire","Supernatural"],                    score: 68 },

  // ── SILENT HILL ───────────────────────────────────────────────────────────
  { q: "Silent Hill",                        y: 2006, type: "movie", subgenres: ["Supernatural","Creature Feature"],        score: 55 },
  { q: "Silent Hill: Revelation",            y: 2012, type: "movie", subgenres: ["Supernatural","Creature Feature"],        score: 22 },
  { q: "Silent Hill: Ascension",             y: 2023, type: "tv",    subgenres: ["Supernatural","Creature Feature"],        score: 35 },
  { q: "Return to Silent Hill",              y: 2024, type: "movie", subgenres: ["Supernatural","Creature Feature"],        score: 45 },

  // ── ITALIAN HORROR ────────────────────────────────────────────────────────
  { q: "Burial Ground",                      y: 1981, type: "movie", subgenres: ["Zombie"],                                 score: 45 },
  { q: "Zombi 3",                            y: 1988, type: "movie", subgenres: ["Zombie"],                                 score: 28 },
  { q: "Zombie Flesh Eaters 2",              y: 1988, type: "movie", subgenres: ["Zombie"],                                 score: 22 },
  { q: "After Death",                        y: 1989, type: "movie", subgenres: ["Zombie"],                                 score: 20 },

  // ── CULT CLASSICS ─────────────────────────────────────────────────────────
  { q: "Killer Klowns from Outer Space",     y: 1988, type: "movie", subgenres: ["Creature Feature","Comedy Horror","Sci-Fi Horror"], score: 72 },
  { q: "The Keep",                           y: 1983, type: "movie", subgenres: ["Supernatural","Creature Feature"],        score: 45 },
  { q: "Vamp",                               y: 1986, type: "movie", subgenres: ["Vampire","Comedy Horror"],                score: 55 },
  { q: "Intruder",                           y: 1989, type: "movie", subgenres: ["Slasher"],                                score: 62 },
  { q: "Deep Rising",                        y: 1998, type: "movie", subgenres: ["Creature Feature","Comedy Horror"],       score: 55 },
  { q: "Cat People",                         y: 1982, type: "movie", subgenres: ["Supernatural","Body Horror"],             score: 62 },
  { q: "Gothic",                             y: 1986, type: "movie", subgenres: ["Supernatural"],                           score: 55 },
  { q: "Cellar Dweller",                     y: 1988, type: "movie", subgenres: ["Creature Feature"],                       score: 35 },
  { q: "Waxwork",                            y: 1988, type: "movie", subgenres: ["Supernatural","Comedy Horror"],           score: 65 },
  { q: "Waxwork II: Lost in Time",           y: 1992, type: "movie", subgenres: ["Supernatural","Comedy Horror"],           score: 42 },
  { q: "976-Evil",                           y: 1988, type: "movie", subgenres: ["Supernatural"],                           score: 35 },
  { q: "Popcorn",                            y: 1991, type: "movie", subgenres: ["Slasher"],                                score: 52 },
  { q: "Subspecies",                         y: 1991, type: "movie", subgenres: ["Vampire"],                                score: 48 },
  { q: "Bloodstone: Subspecies II",          y: 1993, type: "movie", subgenres: ["Vampire"],                                score: 42 },
  { q: "The Entity",                         y: 1982, type: "movie", subgenres: ["Supernatural"],                           score: 58 },
  { q: "Razorback",                          y: 1984, type: "movie", subgenres: ["Creature Feature"],                       score: 62 },
  { q: "Deadly Friend",                      y: 1986, type: "movie", subgenres: ["Sci-Fi Horror"],                          score: 35 },
  { q: "The Serpent and the Rainbow",        y: 1988, type: "movie", subgenres: ["Supernatural","Folk Horror"],             score: 65 },
  { q: "Monkey Shines",                      y: 1988, type: "movie", subgenres: ["Creature Feature"],                       score: 55 },
  { q: "Fright Night Part 2",               y: 1988, type: "movie", subgenres: ["Vampire","Comedy Horror"],                score: 52 },
  { q: "Doctor Giggles",                     y: 1992, type: "movie", subgenres: ["Slasher"],                                score: 35 },
  { q: "The Dentist",                        y: 1996, type: "movie", subgenres: ["Slasher"],                                score: 42 },
  { q: "The Dentist 2",                      y: 1998, type: "movie", subgenres: ["Slasher"],                                score: 35 },
  { q: "The Pit",                            y: 1981, type: "movie", subgenres: ["Creature Feature"],                       score: 42 },
  { q: "Xtro",                               y: 1982, type: "movie", subgenres: ["Sci-Fi Horror","Body Horror"],            score: 45 },
  { q: "Elvira: Mistress of the Dark",       y: 1988, type: "movie", subgenres: ["Comedy Horror","Supernatural"],           score: 62 },
  { q: "Attack of the Killer Tomatoes",      y: 1978, type: "movie", subgenres: ["Comedy Horror","Sci-Fi Horror"],          score: 28 },
  { q: "Return of the Killer Tomatoes",      y: 1988, type: "movie", subgenres: ["Comedy Horror","Sci-Fi Horror"],          score: 32 },
  { q: "Transylvania 6-5000",               y: 1985, type: "movie", subgenres: ["Comedy Horror","Vampire","Werewolf"],      score: 28 },
  { q: "My Best Friend Is a Vampire",        y: 1987, type: "movie", subgenres: ["Comedy Horror","Vampire"],                score: 42 },
  { q: "Once Bitten",                        y: 1985, type: "movie", subgenres: ["Comedy Horror","Vampire"],                score: 38 },

  // ── COSMIC / SUPERNATURAL ─────────────────────────────────────────────────
  { q: "Event Horizon",                      y: 1997, type: "movie", subgenres: ["Supernatural","Sci-Fi Horror"],           score: 72 },
  { q: "The Void",                           y: 2016, type: "movie", subgenres: ["Supernatural","Body Horror","Creature Feature"], score: 72 },
  { q: "Banshee Chapter",                    y: 2013, type: "movie", subgenres: ["Supernatural","Found Footage"],           score: 62 },
  { q: "The Lighthouse",                     y: 2019, type: "movie", subgenres: ["Supernatural"],                           score: 88 },
  { q: "Mandy",                              y: 2018, type: "movie", subgenres: ["Supernatural"],                           score: 82 },
  { q: "Vivarium",                           y: 2019, type: "movie", subgenres: ["Sci-Fi Horror","Supernatural"],           score: 65 },
  { q: "The Burrowers",                      y: 2008, type: "movie", subgenres: ["Creature Feature"],                       score: 62 },
  { q: "Absentia",                           y: 2011, type: "movie", subgenres: ["Supernatural"],                           score: 65 },
  { q: "Coherence",                          y: 2013, type: "movie", subgenres: ["Sci-Fi Horror"],                          score: 78 },
  { q: "The Endless",                        y: 2017, type: "movie", subgenres: ["Sci-Fi Horror","Supernatural"],           score: 78 },
  { q: "Spring",                             y: 2014, type: "movie", subgenres: ["Body Horror","Supernatural"],             score: 75 },
  { q: "A Cure for Wellness",               y: 2016, type: "movie", subgenres: ["Supernatural","Body Horror"],             score: 62 },
  { q: "The Empty Man",                      y: 2020, type: "movie", subgenres: ["Supernatural"],                           score: 72 },
  { q: "Come True",                          y: 2020, type: "movie", subgenres: ["Sci-Fi Horror"],                          score: 65 },
  { q: "Saint Maud",                         y: 2019, type: "movie", subgenres: ["Supernatural"],                           score: 78 },
  { q: "Resolution",                         y: 2012, type: "movie", subgenres: ["Sci-Fi Horror","Found Footage"],          score: 62 },
  { q: "Dagon",                              y: 2001, type: "movie", subgenres: ["Creature Feature","Supernatural"],        score: 62 },
  { q: "The Resurrected",                    y: 1991, type: "movie", subgenres: ["Supernatural"],                           score: 62 },
  { q: "The Unnamable",                      y: 1988, type: "movie", subgenres: ["Creature Feature"],                       score: 38 },
  { q: "Shadowzone",                         y: 1990, type: "movie", subgenres: ["Sci-Fi Horror"],                          score: 42 },
  { q: "Harbinger Down",                     y: 2015, type: "movie", subgenres: ["Creature Feature"],                       score: 38 },
  { q: "The Dunwich Horror",                 y: 1970, type: "movie", subgenres: ["Supernatural"],                           score: 45 },
  { q: "Necronomicon: Book of Dead",         y: 1993, type: "movie", subgenres: ["Supernatural"],                           score: 48 },
  { q: "Cast a Deadly Spell",               y: 1991, type: "movie", subgenres: ["Supernatural","Comedy Horror"],           score: 68 },
  { q: "Beyond the Black Rainbow",           y: 2010, type: "movie", subgenres: ["Sci-Fi Horror"],                          score: 65 },

  // ── MISSING TV ────────────────────────────────────────────────────────────
  { q: "True Detective",                     y: 2014, type: "tv", subgenres: ["Supernatural"],                              score: 95 },
  { q: "True Detective: Night Country",      y: 2024, type: "tv", subgenres: ["Supernatural"],                              score: 82 },
  { q: "Alien: Earth",                       y: 2025, type: "tv", subgenres: ["Sci-Fi Horror","Creature Feature"],          score: 72 },
  { q: "The OA",                             y: 2016, type: "tv", subgenres: ["Sci-Fi Horror","Supernatural"],              score: 82 },
  { q: "Debris",                             y: 2021, type: "tv", subgenres: ["Sci-Fi Horror"],                             score: 62 },
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
    const label = `${e.q} (${e.y}) [${e.type}]`;
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
          if (i % 10 === 9) await new Promise(r => setTimeout(r, 120));
          continue;
        }
      } else {
        results.push({ title: label, status: "failed", detail: "not found on TMDB" });
        continue;
      }
    }

    await supabase.from("titles").update({ subgenres: e.subgenres, critic_score: e.score }).eq("id", existing.id);
    results.push({ title: label, status: "existed" });
    if (i % 10 === 9) await new Promise(r => setTimeout(r, 120));
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
