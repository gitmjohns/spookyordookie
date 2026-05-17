import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const TMDB_BASE = "https://api.themoviedb.org/3";
type Entry = { q: string; y: number; type: "movie" | "tv"; subgenres: string[]; score: number };

const LIST: Entry[] = [
  // ── 2023 ─────────────────────────────────────────────────────────────────
  { q: "Evil Dead Rise",                y: 2023, type: "movie", subgenres: ["Supernatural","Body Horror"],              score: 75 },
  { q: "Scream VI",                     y: 2023, type: "movie", subgenres: ["Slasher"],                                 score: 76 },
  { q: "Saw X",                         y: 2023, type: "movie", subgenres: ["Slasher"],                                 score: 60 },
  { q: "The Boogeyman",                 y: 2023, type: "movie", subgenres: ["Supernatural","Slasher"],                  score: 60 },
  { q: "Talk to Me",                    y: 2023, type: "movie", subgenres: ["Supernatural"],                            score: 78 },
  { q: "M3GAN",                         y: 2022, type: "movie", subgenres: ["Sci-Fi Horror","Comedy Horror"],           score: 74 },
  { q: "Cocaine Bear",                  y: 2023, type: "movie", subgenres: ["Comedy Horror","Creature Feature"],        score: 65 },
  { q: "Totally Killer",                y: 2023, type: "movie", subgenres: ["Comedy Horror","Slasher"],                 score: 65 },
  { q: "Five Nights at Freddy's",       y: 2023, type: "movie", subgenres: ["Creature Feature","Supernatural"],        score: 52 },
  { q: "The Nun II",                    y: 2023, type: "movie", subgenres: ["Supernatural"],                            score: 48 },
  { q: "Insidious: The Red Door",       y: 2023, type: "movie", subgenres: ["Supernatural"],                            score: 52 },
  { q: "It Lives Inside",               y: 2023, type: "movie", subgenres: ["Supernatural"],                            score: 60 },
  { q: "When Evil Lurks",               y: 2023, type: "movie", subgenres: ["Supernatural","Folk Horror"],              score: 68 },
  { q: "Late Night with the Devil",     y: 2023, type: "movie", subgenres: ["Supernatural","Found Footage"],            score: 70 },
  { q: "Knock at the Cabin",            y: 2023, type: "movie", subgenres: ["Supernatural","Creature Feature"],         score: 72 },
  { q: "Infinity Pool",                 y: 2023, type: "movie", subgenres: ["Supernatural","Body Horror"],              score: 72 },
  { q: "The Pope's Exorcist",           y: 2023, type: "movie", subgenres: ["Supernatural"],                            score: 52 },
  { q: "Consecration",                  y: 2023, type: "movie", subgenres: ["Supernatural","Folk Horror"],              score: 55 },
  { q: "Suitable Flesh",               y: 2023, type: "movie", subgenres: ["Body Horror","Supernatural"],              score: 62 },
  { q: "Skinamarink",                   y: 2022, type: "movie", subgenres: ["Found Footage","Supernatural"],            score: 62 },
  { q: "The Last Voyage of the Demeter",y: 2023, type: "movie", subgenres: ["Vampire","Creature Feature"],             score: 48 },
  { q: "Renfield",                      y: 2023, type: "movie", subgenres: ["Vampire","Comedy Horror"],                 score: 58 },

  // ── 2024 ─────────────────────────────────────────────────────────────────
  { q: "Longlegs",                      y: 2024, type: "movie", subgenres: ["Slasher","Supernatural"],                  score: 62 },
  { q: "The Substance",                 y: 2024, type: "movie", subgenres: ["Body Horror","Sci-Fi Horror"],             score: 72 },
  { q: "Immaculate",                    y: 2024, type: "movie", subgenres: ["Supernatural"],                            score: 61 },
  { q: "Heretic",                       y: 2024, type: "movie", subgenres: ["Supernatural"],                            score: 70 },
  { q: "Abigail",                       y: 2024, type: "movie", subgenres: ["Vampire","Creature Feature","Comedy Horror","Slasher"], score: 65 },
  { q: "Alien: Romulus",               y: 2024, type: "movie", subgenres: ["Sci-Fi Horror","Creature Feature"],        score: 72 },
  { q: "MaXXXine",                     y: 2024, type: "movie", subgenres: ["Slasher"],                                 score: 62 },
  { q: "Terrifier 3",                   y: 2024, type: "movie", subgenres: ["Slasher"],                                 score: 60 },
  { q: "In a Violent Nature",           y: 2024, type: "movie", subgenres: ["Slasher"],                                 score: 64 },
  { q: "Strange Darling",               y: 2024, type: "movie", subgenres: ["Slasher"],                                 score: 66 },
  { q: "Beetlejuice Beetlejuice",       y: 2024, type: "movie", subgenres: ["Comedy Horror","Supernatural"],            score: 68 },
  { q: "Salem's Lot",                   y: 2024, type: "movie", subgenres: ["Vampire","Supernatural"],                  score: 55 },
  { q: "Speak No Evil",                y: 2024, type: "movie", subgenres: ["Slasher","Supernatural"],                  score: 72 },
  { q: "The First Omen",               y: 2024, type: "movie", subgenres: ["Supernatural"],                            score: 68 },
  { q: "Azrael",                        y: 2024, type: "movie", subgenres: ["Supernatural","Creature Feature"],         score: 62 },
  { q: "Caddo Lake",                    y: 2024, type: "movie", subgenres: ["Supernatural","Folk Horror"],              score: 65 },
  { q: "Smile 2",                       y: 2024, type: "movie", subgenres: ["Supernatural","Slasher"],                  score: 68 },
  { q: "It's What's Inside",           y: 2024, type: "movie", subgenres: ["Supernatural","Sci-Fi Horror"],            score: 72 },
  { q: "Oddity",                        y: 2024, type: "movie", subgenres: ["Supernatural"],                            score: 78 },
  { q: "Trap",                          y: 2024, type: "movie", subgenres: ["Slasher"],                                 score: 52 },
  { q: "Blink Twice",                   y: 2024, type: "movie", subgenres: ["Slasher","Supernatural"],                  score: 62 },
  { q: "Baghead",                       y: 2024, type: "movie", subgenres: ["Supernatural"],                            score: 45 },
  { q: "Night Swim",                    y: 2024, type: "movie", subgenres: ["Supernatural"],                            score: 35 },
  { q: "Imaginary",                     y: 2024, type: "movie", subgenres: ["Supernatural"],                            score: 25 },
  { q: "The Watchers",                  y: 2024, type: "movie", subgenres: ["Supernatural","Creature Feature"],         score: 38 },

  // ── 2025 ─────────────────────────────────────────────────────────────────
  { q: "Sinners",                       y: 2025, type: "movie", subgenres: ["Vampire","Supernatural"],                  score: 92 },
  { q: "The Monkey",                    y: 2025, type: "movie", subgenres: ["Supernatural","Slasher"],                  score: 68 },
  { q: "Bring Her Back",               y: 2025, type: "movie", subgenres: ["Supernatural"],                            score: 65 },
  { q: "Final Destination Bloodlines", y: 2025, type: "movie", subgenres: ["Supernatural","Slasher"],                  score: 68 },
  { q: "Wolf Man",                      y: 2025, type: "movie", subgenres: ["Werewolf","Body Horror"],                  score: 58 },
  { q: "Presence",                      y: 2025, type: "movie", subgenres: ["Supernatural"],                            score: 68 },
  { q: "The Ugly Stepsister",           y: 2025, type: "movie", subgenres: ["Body Horror"],                             score: 65 },
  { q: "Death of a Unicorn",            y: 2025, type: "movie", subgenres: ["Comedy Horror","Creature Feature"],        score: 62 },
  { q: "Companion",                     y: 2025, type: "movie", subgenres: ["Sci-Fi Horror"],                           score: 65 },
  { q: "Weapons",                       y: 2025, type: "movie", subgenres: ["Supernatural","Slasher"],                  score: 82 },
  { q: "28 Years Later",               y: 2025, type: "movie", subgenres: ["Zombie","Sci-Fi Horror"],                  score: 88 },
  { q: "Clown in a Cornfield",          y: 2025, type: "movie", subgenres: ["Slasher","Folk Horror"],                   score: 68 },
  { q: "Keeper",                        y: 2025, type: "movie", subgenres: ["Supernatural"],                            score: 62 },
  { q: "Dead Mail",                     y: 2025, type: "movie", subgenres: ["Supernatural"],                            score: 72 },
  { q: "Frankenstein",                  y: 2025, type: "movie", subgenres: ["Creature Feature","Body Horror"],          score: 75 },
  { q: "Eerie",                         y: 2025, type: "movie", subgenres: ["Supernatural","Found Footage"],            score: 58 },
  { q: "Fear Street: Prom Queen",       y: 2025, type: "movie", subgenres: ["Slasher","Supernatural"],                  score: 55 },
  { q: "Novocaine",                     y: 2025, type: "movie", subgenres: ["Slasher"],                                 score: 58 },

  // ── 2026 (add if in TMDB) ────────────────────────────────────────────────
  { q: "Scream 7",                      y: 2026, type: "movie", subgenres: ["Slasher"],                                 score: 45 },
  { q: "Hokum",                         y: 2026, type: "movie", subgenres: ["Supernatural","Folk Horror"],              score: 85 },
  { q: "We Bury the Dead",             y: 2026, type: "movie", subgenres: ["Zombie"],                                  score: 72 },
  { q: "Whistle",                       y: 2026, type: "movie", subgenres: ["Supernatural","Slasher"],                  score: 65 },
  { q: "Primate",                       y: 2026, type: "movie", subgenres: ["Creature Feature"],                        score: 62 },
  { q: "Faces of Death",               y: 2026, type: "movie", subgenres: ["Slasher","Found Footage"],                 score: 80 },
  { q: "Undertone",                     y: 2026, type: "movie", subgenres: ["Supernatural","Found Footage"],            score: 72 },
  { q: "They Will Kill You",           y: 2026, type: "movie", subgenres: ["Supernatural","Comedy Horror"],            score: 62 },
  { q: "Exit 8",                        y: 2026, type: "movie", subgenres: ["Supernatural","Sci-Fi Horror"],            score: 75 },
  { q: "Cold Storage",                  y: 2026, type: "movie", subgenres: ["Creature Feature","Sci-Fi Horror"],        score: 68 },
  { q: "Thrash",                        y: 2026, type: "movie", subgenres: ["Creature Feature"],                        score: 65 },
  { q: "The Mummy",                     y: 2026, type: "movie", subgenres: ["Supernatural","Creature Feature"],         score: 55 },
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

  const [mgRes] = await Promise.all([
    fetch(tmdbUrl("/genre/movie/list", { language: "en-US" }), { cache: "no-store" }),
  ]);
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
