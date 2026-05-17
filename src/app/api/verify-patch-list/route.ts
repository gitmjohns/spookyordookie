import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const TMDB_BASE = "https://api.themoviedb.org/3";

type Entry = { q: string; y: number; yAlt?: number; type: "movie" | "tv"; subgenres: string[]; score: number };

const LIST: Entry[] = [
  { q: "Longlegs",                     y: 2024, type: "movie", subgenres: ["Psychological","Slasher","Supernatural"],                    score: 62 },
  { q: "The Substance",                y: 2024, type: "movie", subgenres: ["Body Horror","Psychological","Sci-Fi Horror"],               score: 72 },
  { q: "Immaculate",                   y: 2024, type: "movie", subgenres: ["Supernatural","Psychological"],                              score: 61 },
  { q: "Heretic",                      y: 2024, type: "movie", subgenres: ["Supernatural","Psychological"],                              score: 70 },
  { q: "Abigail",                      y: 2024, type: "movie", subgenres: ["Vampire","Creature Feature","Comedy Horror","Slasher"],      score: 65 },
  { q: "Alien Romulus",                y: 2024, type: "movie", subgenres: ["Sci-Fi Horror","Creature Feature"],                         score: 72 },
  { q: "MaXXXine",                     y: 2024, type: "movie", subgenres: ["Slasher"],                                                  score: 62 },
  { q: "Terrifier 3",                  y: 2024, type: "movie", subgenres: ["Slasher"],                                                  score: 60 },
  { q: "In a Violent Nature",          y: 2024, type: "movie", subgenres: ["Slasher"],                                                  score: 64 },
  { q: "Strange Darling",              y: 2024, type: "movie", subgenres: ["Slasher","Psychological"],                                  score: 66 },
  { q: "Smile 2",                      y: 2024, type: "movie", subgenres: ["Slasher","Supernatural","Psychological"],                   score: 62 },
  { q: "Companion",                    y: 2025, type: "movie", subgenres: ["Sci-Fi Horror","Psychological"],                            score: 65 },
  { q: "The Monkey",                   y: 2025, type: "movie", subgenres: ["Supernatural","Slasher"],                                   score: 68 },
  { q: "Bring Her Back",               y: 2025, type: "movie", subgenres: ["Supernatural","Psychological"],                             score: 65 },
  { q: "Sinners",                      y: 2025, type: "movie", subgenres: ["Vampire","Supernatural"],                                   score: 75 },
  { q: "Final Destination Bloodlines", y: 2025, type: "movie", subgenres: ["Supernatural","Slasher"],                                   score: 62 },
  { q: "Wolf Man",                     y: 2025, type: "movie", subgenres: ["Werewolf","Body Horror"],                                   score: 58 },
  { q: "Presence",                     y: 2025, type: "movie", subgenres: ["Supernatural","Psychological"],                             score: 68 },
  { q: "The Ugly Stepsister",          y: 2025, type: "movie", subgenres: ["Body Horror","Psychological"],                              score: 65 },
  { q: "Death of a Unicorn",           y: 2025, type: "movie", subgenres: ["Comedy Horror","Creature Feature"],                         score: 62 },
  { q: "Skinamarink",                  y: 2022, type: "movie", subgenres: ["Found Footage","Supernatural","Psychological"],             score: 62 },
  { q: "Smile",                        y: 2022, type: "movie", subgenres: ["Slasher","Supernatural","Psychological"],                   score: 75 },
  { q: "Barbarian",                    y: 2022, type: "movie", subgenres: ["Supernatural"],                                             score: 76 },
  { q: "Nope",                         y: 2022, type: "movie", subgenres: ["Creature Feature","Sci-Fi Horror"],                        score: 73 },
  { q: "X",                            y: 2022, type: "movie", subgenres: ["Slasher"],                                                  score: 75 },
  { q: "Pearl",                        y: 2022, type: "movie", subgenres: ["Slasher","Psychological"],                                  score: 76 },
  { q: "Scream",                       y: 2022, type: "movie", subgenres: ["Slasher"],                                                  score: 75 },
  { q: "Halloween Ends",               y: 2022, type: "movie", subgenres: ["Slasher"],                                                  score: 38 },
  { q: "M3GAN",                        y: 2022, yAlt: 2023,    type: "movie", subgenres: ["Sci-Fi Horror","Comedy Horror"],             score: 74 },
  { q: "Crimes of the Future",         y: 2022, type: "movie", subgenres: ["Body Horror","Sci-Fi Horror"],                             score: 68 },
  { q: "Talk to Me",                   y: 2023, yAlt: 2022,    type: "movie", subgenres: ["Supernatural"],                             score: 78 },
  { q: "Cocaine Bear",                 y: 2023, type: "movie", subgenres: ["Comedy Horror","Creature Feature"],                        score: 65 },
  { q: "Totally Killer",               y: 2023, type: "movie", subgenres: ["Comedy Horror","Slasher"],                                 score: 65 },
  { q: "Scream VI",                    y: 2023, type: "movie", subgenres: ["Slasher"],                                                  score: 76 },
  { q: "Five Nights at Freddy's",      y: 2023, type: "movie", subgenres: ["Creature Feature","Supernatural"],                         score: 52 },
  { q: "The Boogeyman",                y: 2023, type: "movie", subgenres: ["Supernatural","Slasher"],                                   score: 60 },
  { q: "Late Night with the Devil",    y: 2023, type: "movie", subgenres: ["Supernatural","Psychological","Found Footage"],             score: 70 },
  { q: "It Lives Inside",              y: 2023, type: "movie", subgenres: ["Supernatural"],                                             score: 60 },
  { q: "When Evil Lurks",              y: 2023, type: "movie", subgenres: ["Supernatural","Folk Horror"],                              score: 68 },
  { q: "The Black Phone",              y: 2021, type: "movie", subgenres: ["Slasher","Supernatural"],                                   score: 76 },
  { q: "Malignant",                    y: 2021, type: "movie", subgenres: ["Supernatural","Slasher","Body Horror"],                     score: 65 },
  { q: "Antlers",                      y: 2021, type: "movie", subgenres: ["Supernatural","Creature Feature","Folk Horror"],            score: 62 },
  { q: "A Quiet Place Part II",        y: 2021, type: "movie", subgenres: ["Creature Feature","Sci-Fi Horror"],                        score: 73 },
  { q: "Last Night in Soho",           y: 2021, type: "movie", subgenres: ["Psychological","Supernatural"],                            score: 68 },
  { q: "Halloween Kills",              y: 2021, type: "movie", subgenres: ["Slasher"],                                                  score: 42 },
  { q: "Titane",                       y: 2021, type: "movie", subgenres: ["Body Horror","Psychological","Sci-Fi Horror"],              score: 72 },
  { q: "The Night House",              y: 2020, type: "movie", subgenres: ["Supernatural","Psychological"],                             score: 68 },
  { q: "The Invisible Man",            y: 2020, type: "movie", subgenres: ["Psychological","Sci-Fi Horror"],                           score: 71 },
  { q: "His House",                    y: 2020, type: "movie", subgenres: ["Supernatural","Folk Horror","Psychological"],               score: 78 },
  { q: "Possessor",                    y: 2020, type: "movie", subgenres: ["Sci-Fi Horror","Body Horror","Psychological"],              score: 72 },
  { q: "A Quiet Place",                y: 2018, type: "movie", subgenres: ["Creature Feature","Sci-Fi Horror","Psychological"],         score: 82 },
  { q: "Hereditary",                   y: 2018, type: "movie", subgenres: ["Supernatural","Psychological","Folk Horror"],               score: 90 },
  { q: "Annihilation",                 y: 2018, type: "movie", subgenres: ["Sci-Fi Horror","Body Horror","Psychological"],             score: 86 },
  { q: "Doctor Sleep",                 y: 2019, type: "movie", subgenres: ["Supernatural","Psychological"],                            score: 75 },
  { q: "It Chapter Two",               y: 2019, type: "movie", subgenres: ["Supernatural","Creature Feature"],                        score: 72 },
  { q: "Midsommar",                    y: 2019, type: "movie", subgenres: ["Folk Horror","Psychological"],                             score: 87 },
  { q: "Us",                           y: 2019, type: "movie", subgenres: ["Supernatural","Psychological"],                            score: 82 },
  { q: "Parasite",                     y: 2019, type: "movie", subgenres: ["Psychological"],                                           score: 90 },
  { q: "Color Out of Space",           y: 2019, type: "movie", subgenres: ["Sci-Fi Horror","Body Horror","Psychological"],             score: 71 },
  { q: "The Wailing",                  y: 2016, type: "movie", subgenres: ["Supernatural","Folk Horror","Creature Feature"],           score: 80 },
  { q: "Train to Busan",               y: 2016, type: "movie", subgenres: ["Zombie","Creature Feature"],                              score: 85 },
  { q: "Get Out",                      y: 2017, type: "movie", subgenres: ["Psychological","Supernatural"],                            score: 90 },
  { q: "It Chapter One",               y: 2017, type: "movie", subgenres: ["Supernatural","Creature Feature"],                        score: 79 },
  { q: "A Ghost Story",                y: 2017, type: "movie", subgenres: ["Supernatural","Psychological"],                            score: 78 },
  { q: "It Follows",                   y: 2014, type: "movie", subgenres: ["Supernatural","Psychological"],                            score: 87 },
  { q: "The Witch",                    y: 2015, type: "movie", subgenres: ["Folk Horror","Psychological","Supernatural"],              score: 87 },
  { q: "The Cabin in the Woods",       y: 2012, type: "movie", subgenres: ["Comedy Horror","Slasher"],                                 score: 80 },
  { q: "Grotesquerie",                 y: 2024, type: "tv",    subgenres: ["Psychological","Slasher"],                                 score: 72 },
  { q: "Teacup",                       y: 2024, type: "tv",    subgenres: ["Sci-Fi Horror","Psychological"],                           score: 65 },
];

type DBTitle = { id: string; tmdb_id: number; title: string; release_year: number | null; media_type: string };
type TMDBResult = { tmdb_id: number; title: string; overview: string | null; poster_path: string | null; backdrop_path: string | null; release_year: number | null; genres: string[] };

function normalize(s: string) {
  return s.toLowerCase().trim().replace(/^(the |a |an )/, "").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ");
}

function titlesMatch(dbTitle: string, q: string): boolean {
  const a = normalize(dbTitle);
  const b = normalize(q);
  return a === b || a.includes(b) || b.includes(a);
}

function findInDb(all: DBTitle[], q: string, y: number, type: "movie" | "tv", yAlt?: number): DBTitle | null {
  for (const yr of yAlt !== undefined ? [y, yAlt] : [y]) {
    const candidates = all.filter((t) => t.media_type === type && t.release_year === yr);
    const match = candidates.find((t) => titlesMatch(t.title, q));
    if (match) return match;
  }
  return null;
}

function tmdbUrl(path: string, params: Record<string, string>): string {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", process.env.TMDB_API_KEY!);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

async function searchTMDB(
  q: string, y: number, type: "movie" | "tv", yAlt: number | undefined,
  movieGM: Record<number, string>, tvGM: Record<number, string>
): Promise<TMDBResult | null> {
  const gm = type === "movie" ? movieGM : tvGM;
  const path = type === "movie" ? "/search/movie" : "/search/tv";
  const yk = type === "movie" ? "year" : "first_air_date_year";
  const years: Array<number | undefined> = yAlt !== undefined ? [y, yAlt, undefined] : [y, undefined];

  for (const tryY of years) {
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
      tmdb_id: r.id, title,
      overview: r.overview || null,
      poster_path: r.poster_path ?? null,
      backdrop_path: r.backdrop_path ?? null,
      release_year: dateStr ? parseInt(dateStr.split("-")[0], 10) : null,
      genres: (r.genre_ids ?? []).map((id: number) => gm[id]).filter(Boolean),
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

  // Load all DB titles
  const allDb: DBTitle[] = [];
  let from = 0;
  while (true) {
    const { data } = await supabase.from("titles").select("id,tmdb_id,title,release_year,media_type").range(from, from + 999);
    if (!data?.length) break;
    allDb.push(...(data as DBTitle[]));
    if (data.length < 1000) break;
    from += 1000;
  }

  // Fetch TMDB genre maps once
  const [mgRes, tgRes] = await Promise.all([
    fetch(tmdbUrl("/genre/movie/list", { language: "en-US" }), { cache: "no-store" }),
    fetch(tmdbUrl("/genre/tv/list",    { language: "en-US" }), { cache: "no-store" }),
  ]);
  const movieGM: Record<number, string> = Object.fromEntries(((await mgRes.json()).genres ?? []).map((g: {id:number;name:string}) => [g.id, g.name]));
  const tvGM:    Record<number, string> = Object.fromEntries(((await tgRes.json()).genres ?? []).map((g: {id:number;name:string}) => [g.id, g.name]));

  const results: { title: string; status: "existed" | "imported" | "failed"; detail?: string }[] = [];

  for (let i = 0; i < LIST.length; i++) {
    const e = LIST[i];
    const label = `${e.q} (${e.y})`;

    // Check DB
    let existing = findInDb(allDb, e.q, e.y, e.type, e.yAlt);

    // If not found by title+year, maybe it's in DB by tmdb_id — detect after TMDB search below
    if (!existing) {
      const tmdbData = await searchTMDB(e.q, e.y, e.type, e.yAlt, movieGM, tvGM);
      if (tmdbData) {
        // Check by tmdb_id in case title/year stored differently
        const byId = allDb.find((t) => t.tmdb_id === tmdbData.tmdb_id && t.media_type === e.type);
        if (byId) {
          existing = byId;
        } else {
          // Import
          const { error } = await supabase.from("titles").upsert({
            tmdb_id: tmdbData.tmdb_id,
            media_type: e.type,
            title: tmdbData.title,
            overview: tmdbData.overview,
            poster_path: tmdbData.poster_path,
            backdrop_path: tmdbData.backdrop_path,
            release_year: tmdbData.release_year,
            genres: tmdbData.genres,
            subgenres: e.subgenres,
            critic_score: e.score,
          }, { onConflict: "tmdb_id,media_type" });

          if (error) {
            results.push({ title: label, status: "failed", detail: error.message });
          } else {
            results.push({ title: label, status: "imported", detail: `→ "${tmdbData.title}" (${tmdbData.release_year})` });
            allDb.push({ id: "new", tmdb_id: tmdbData.tmdb_id, title: tmdbData.title, release_year: tmdbData.release_year, media_type: e.type });
          }

          if (i % 8 === 7) await new Promise((r) => setTimeout(r, 120));
          continue;
        }
      } else {
        results.push({ title: label, status: "failed", detail: "not found on TMDB" });
        continue;
      }
    }

    // Title exists — ensure subgenres + score are correct
    await supabase.from("titles").update({ subgenres: e.subgenres, critic_score: e.score }).eq("id", existing.id);
    results.push({ title: label, status: "existed", detail: `id=${existing.id}` });

    if (i % 8 === 7) await new Promise((r) => setTimeout(r, 120));
  }

  const imported = results.filter((r) => r.status === "imported");
  const existed  = results.filter((r) => r.status === "existed");
  const failed   = results.filter((r) => r.status === "failed");

  return NextResponse.json({
    success: true,
    total: LIST.length,
    existed: existed.length,
    imported: imported.length,
    failed: failed.length,
    importedList: imported.map((r) => `${r.title} ${r.detail}`),
    failedList: failed.map((r) => `${r.title}: ${r.detail}`),
  });
}
