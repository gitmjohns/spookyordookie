import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const TMDB_BASE = "https://api.themoviedb.org/3";

type Entry = { q: string; y: number; type: "movie" | "tv"; subgenres: string[]; score: number };

const BATCH: Entry[] = [
  // ── PUPPET MASTER ────────────────────────────────────────────────────────────
  { q: "Puppet Master",                            y: 1989, type: "movie", subgenres: ["Supernatural","Creature Feature"],              score: 62 },
  { q: "Puppet Master II",                         y: 1990, type: "movie", subgenres: ["Supernatural","Creature Feature"],              score: 45 },
  { q: "Puppet Master III: Toulon's Revenge",      y: 1991, type: "movie", subgenres: ["Supernatural","Creature Feature"],              score: 55 },
  { q: "Puppet Master 4",                          y: 1993, type: "movie", subgenres: ["Supernatural","Creature Feature"],              score: 42 },
  { q: "Puppet Master 5: The Final Chapter",       y: 1994, type: "movie", subgenres: ["Supernatural","Creature Feature"],              score: 38 },
  { q: "Curse of the Puppet Master",               y: 1998, type: "movie", subgenres: ["Supernatural","Creature Feature"],              score: 30 },
  { q: "Puppet Master vs Demonic Toys",            y: 2004, type: "movie", subgenres: ["Supernatural","Comedy Horror"],                 score: 25 },
  { q: "Puppet Master: Axis of Evil",              y: 2010, type: "movie", subgenres: ["Supernatural","Creature Feature"],              score: 28 },
  { q: "Puppet Master: The Littlest Reich",        y: 2018, type: "movie", subgenres: ["Supernatural","Comedy Horror"],                 score: 58 },

  // ── TEXAS CHAINSAW MASSACRE ───────────────────────────────────────────────────
  { q: "The Texas Chain Saw Massacre",             y: 1974, type: "movie", subgenres: ["Slasher"],                                     score: 92 },
  { q: "The Texas Chainsaw Massacre 2",            y: 1986, type: "movie", subgenres: ["Slasher","Comedy Horror"],                     score: 60 },
  { q: "Leatherface: The Texas Chainsaw Massacre III", y: 1990, type: "movie", subgenres: ["Slasher"],                                score: 35 },
  { q: "Texas Chainsaw Massacre: The Next Generation", y: 1994, type: "movie", subgenres: ["Slasher"],                               score: 22 },
  { q: "The Texas Chainsaw Massacre",              y: 2003, type: "movie", subgenres: ["Slasher"],                                     score: 55 },
  { q: "The Texas Chainsaw Massacre: The Beginning", y: 2006, type: "movie", subgenres: ["Slasher"],                                 score: 30 },
  { q: "Texas Chainsaw 3D",                        y: 2013, type: "movie", subgenres: ["Slasher"],                                     score: 25 },
  { q: "Leatherface",                              y: 2017, type: "movie", subgenres: ["Slasher"],                                     score: 38 },
  { q: "Texas Chainsaw Massacre",                  y: 2022, type: "movie", subgenres: ["Slasher"],                                     score: 28 },

  // ── FINAL DESTINATION ─────────────────────────────────────────────────────────
  { q: "Final Destination",                        y: 2000, type: "movie", subgenres: ["Supernatural","Slasher"],                      score: 72 },
  { q: "Final Destination 2",                      y: 2003, type: "movie", subgenres: ["Supernatural","Slasher"],                      score: 62 },
  { q: "Final Destination 3",                      y: 2006, type: "movie", subgenres: ["Supernatural","Slasher"],                      score: 58 },
  { q: "The Final Destination",                    y: 2009, type: "movie", subgenres: ["Supernatural","Slasher"],                      score: 28 },
  { q: "Final Destination 5",                      y: 2011, type: "movie", subgenres: ["Supernatural","Slasher"],                      score: 62 },
  { q: "Final Destination Bloodlines",             y: 2025, type: "movie", subgenres: ["Supernatural","Slasher"],                      score: 68 },

  // ── AMITYVILLE ───────────────────────────────────────────────────────────────
  { q: "The Amityville Horror",                    y: 1979, type: "movie", subgenres: ["Supernatural"],                                score: 72 },
  { q: "Amityville II: The Possession",            y: 1982, type: "movie", subgenres: ["Supernatural"],                                score: 55 },
  { q: "Amityville 3-D",                           y: 1983, type: "movie", subgenres: ["Supernatural"],                                score: 22 },
  { q: "The Amityville Horror",                    y: 2005, type: "movie", subgenres: ["Supernatural"],                                score: 45 },
  { q: "Amityville: The Awakening",                y: 2017, type: "movie", subgenres: ["Supernatural"],                                score: 22 },

  // ── TIM BURTON / GOTHIC COMEDY HORROR ────────────────────────────────────────
  { q: "Beetlejuice",                              y: 1988, type: "movie", subgenres: ["Comedy Horror","Supernatural"],                 score: 88 },
  { q: "Beetlejuice Beetlejuice",                  y: 2024, type: "movie", subgenres: ["Comedy Horror","Supernatural"],                 score: 68 },
  { q: "Sleepy Hollow",                            y: 1999, type: "movie", subgenres: ["Supernatural","Slasher"],                      score: 78 },
  { q: "Edward Scissorhands",                      y: 1990, type: "movie", subgenres: ["Comedy Horror","Psychological"],                score: 82 },
  { q: "The Addams Family",                        y: 1991, type: "movie", subgenres: ["Comedy Horror","Supernatural"],                 score: 75 },
  { q: "Addams Family Values",                     y: 1993, type: "movie", subgenres: ["Comedy Horror","Supernatural"],                 score: 72 },
  { q: "Casper",                                   y: 1995, type: "movie", subgenres: ["Comedy Horror","Supernatural"],                 score: 65 },
  { q: "Hocus Pocus",                              y: 1993, type: "movie", subgenres: ["Comedy Horror","Supernatural"],                 score: 70 },
  { q: "Hocus Pocus 2",                            y: 2022, type: "movie", subgenres: ["Comedy Horror","Supernatural"],                 score: 55 },
  { q: "Scary Stories to Tell in the Dark",        y: 2019, type: "movie", subgenres: ["Supernatural","Creature Feature"],             score: 68 },

  // ── PHANTASM ─────────────────────────────────────────────────────────────────
  { q: "Phantasm",                                 y: 1979, type: "movie", subgenres: ["Supernatural","Creature Feature"],             score: 72 },
  { q: "Phantasm II",                              y: 1988, type: "movie", subgenres: ["Supernatural","Creature Feature"],             score: 65 },
  { q: "Phantasm III: Lord of the Dead",           y: 1994, type: "movie", subgenres: ["Supernatural","Creature Feature"],             score: 48 },
  { q: "Phantasm IV: Oblivion",                    y: 1998, type: "movie", subgenres: ["Supernatural"],                                score: 52 },
  { q: "Phantasm: Ravager",                        y: 2016, type: "movie", subgenres: ["Supernatural"],                                score: 48 },

  // ── ALIEN VS PREDATOR ────────────────────────────────────────────────────────
  { q: "Alien vs. Predator",                       y: 2004, type: "movie", subgenres: ["Sci-Fi Horror","Creature Feature"],            score: 38 },
  { q: "Aliens vs. Predator: Requiem",             y: 2007, type: "movie", subgenres: ["Sci-Fi Horror","Creature Feature"],            score: 12 },

  // ── LEPRECHAUN ───────────────────────────────────────────────────────────────
  { q: "Leprechaun",                               y: 1993, type: "movie", subgenres: ["Comedy Horror","Creature Feature"],            score: 52 },
  { q: "Leprechaun 2",                             y: 1994, type: "movie", subgenres: ["Comedy Horror","Creature Feature"],            score: 22 },
  { q: "Leprechaun 3",                             y: 1995, type: "movie", subgenres: ["Comedy Horror","Creature Feature"],            score: 28 },
  { q: "Leprechaun 4: In Space",                   y: 1997, type: "movie", subgenres: ["Comedy Horror","Creature Feature","Sci-Fi Horror"], score: 15 },
  { q: "Leprechaun in the Hood",                   y: 2000, type: "movie", subgenres: ["Comedy Horror","Creature Feature"],            score: 18 },
  { q: "Leprechaun: Back 2 tha Hood",              y: 2003, type: "movie", subgenres: ["Comedy Horror","Creature Feature"],            score: 15 },
  { q: "Leprechaun: Origins",                      y: 2014, type: "movie", subgenres: ["Creature Feature"],                           score: 12 },
  { q: "Leprechaun Returns",                       y: 2018, type: "movie", subgenres: ["Comedy Horror","Creature Feature"],            score: 45 },

  // ── CHILDREN OF THE CORN ─────────────────────────────────────────────────────
  { q: "Children of the Corn",                     y: 1984, type: "movie", subgenres: ["Supernatural","Folk Horror"],                  score: 65 },
  { q: "Children of the Corn II: The Final Sacrifice", y: 1992, type: "movie", subgenres: ["Supernatural","Folk Horror"],             score: 22 },
  { q: "Children of the Corn III: Urban Harvest",  y: 1995, type: "movie", subgenres: ["Supernatural","Folk Horror"],                  score: 18 },
  { q: "Children of the Corn IV: The Gathering",   y: 1996, type: "movie", subgenres: ["Supernatural","Folk Horror"],                  score: 15 },
  { q: "Children of the Corn V: Fields of Terror", y: 1998, type: "movie", subgenres: ["Supernatural","Folk Horror"],                  score: 12 },
  { q: "Children of the Corn 666: Isaac's Return", y: 1999, type: "movie", subgenres: ["Supernatural","Folk Horror"],                  score: 10 },
  { q: "Children of the Corn: Revelation",         y: 2001, type: "movie", subgenres: ["Supernatural","Folk Horror"],                  score: 12 },
  { q: "Children of the Corn",                     y: 2009, type: "movie", subgenres: ["Supernatural","Folk Horror"],                  score: 18 },
  { q: "Children of the Corn: Runaway",            y: 2018, type: "movie", subgenres: ["Supernatural","Folk Horror"],                  score: 15 },
  { q: "Children of the Corn",                     y: 2020, type: "movie", subgenres: ["Supernatural","Folk Horror"],                  score: 18 },

  // ── WISHMASTER ───────────────────────────────────────────────────────────────
  { q: "Wishmaster",                               y: 1997, type: "movie", subgenres: ["Supernatural"],                                score: 62 },
  { q: "Wishmaster 2: Evil Never Dies",            y: 1999, type: "movie", subgenres: ["Supernatural"],                                score: 38 },
  { q: "Wishmaster 3: Beyond the Gates of Hell",   y: 2001, type: "movie", subgenres: ["Supernatural"],                                score: 18 },
  { q: "Wishmaster 4: The Prophecy Fulfilled",     y: 2002, type: "movie", subgenres: ["Supernatural"],                                score: 15 },

  // ── POLTERGEIST ──────────────────────────────────────────────────────────────
  { q: "Poltergeist",                              y: 1982, type: "movie", subgenres: ["Supernatural"],                                score: 89 },
  { q: "Poltergeist II: The Other Side",           y: 1986, type: "movie", subgenres: ["Supernatural"],                                score: 55 },
  { q: "Poltergeist III",                          y: 1988, type: "movie", subgenres: ["Supernatural"],                                score: 32 },
  { q: "Poltergeist",                              y: 2015, type: "movie", subgenres: ["Supernatural"],                                score: 35 },

  // ── SILENT NIGHT DEADLY NIGHT ────────────────────────────────────────────────
  { q: "Silent Night, Deadly Night",               y: 1984, type: "movie", subgenres: ["Slasher"],                                     score: 48 },
  { q: "Silent Night, Deadly Night Part 2",        y: 1987, type: "movie", subgenres: ["Slasher","Comedy Horror"],                     score: 22 },
  { q: "Silent Night, Deadly Night 3: Better Watch Out!", y: 1989, type: "movie", subgenres: ["Slasher"],                            score: 15 },
  { q: "Silent Night, Deadly Night 4: Initiation", y: 1990, type: "movie", subgenres: ["Supernatural","Slasher"],                     score: 18 },
  { q: "Silent Night, Deadly Night 5: The Toy Maker", y: 1991, type: "movie", subgenres: ["Slasher","Creature Feature"],             score: 18 },
  { q: "Silent Night",                             y: 2012, type: "movie", subgenres: ["Slasher"],                                     score: 42 },

  // ── WRONG TURN ───────────────────────────────────────────────────────────────
  { q: "Wrong Turn",                               y: 2003, type: "movie", subgenres: ["Slasher","Creature Feature"],                  score: 55 },
  { q: "Wrong Turn 2: Dead End",                   y: 2007, type: "movie", subgenres: ["Slasher","Creature Feature"],                  score: 45 },
  { q: "Wrong Turn 3: Left for Dead",              y: 2009, type: "movie", subgenres: ["Slasher","Creature Feature"],                  score: 22 },
  { q: "Wrong Turn 4: Bloody Beginnings",          y: 2011, type: "movie", subgenres: ["Slasher","Creature Feature"],                  score: 18 },
  { q: "Wrong Turn 5: Bloodlines",                 y: 2012, type: "movie", subgenres: ["Slasher","Creature Feature"],                  score: 15 },
  { q: "Wrong Turn 6: Last Resort",                y: 2014, type: "movie", subgenres: ["Slasher","Creature Feature"],                  score: 15 },
  { q: "Wrong Turn",                               y: 2021, type: "movie", subgenres: ["Slasher","Folk Horror"],                       score: 52 },

  // ── JEEPERS CREEPERS ─────────────────────────────────────────────────────────
  { q: "Jeepers Creepers",                         y: 2001, type: "movie", subgenres: ["Slasher","Supernatural"],                      score: 62 },
  { q: "Jeepers Creepers 2",                       y: 2003, type: "movie", subgenres: ["Slasher","Supernatural"],                      score: 50 },
  { q: "Jeepers Creepers 3",                       y: 2017, type: "movie", subgenres: ["Creature Feature","Supernatural"],             score: 22 },
  { q: "Jeepers Creepers: Reborn",                 y: 2022, type: "movie", subgenres: ["Creature Feature","Supernatural"],             score: 15 },

  // ── PET SEMATARY ─────────────────────────────────────────────────────────────
  { q: "Pet Sematary",                             y: 1989, type: "movie", subgenres: ["Supernatural","Zombie"],                       score: 75 },
  { q: "Pet Sematary Two",                         y: 1992, type: "movie", subgenres: ["Supernatural"],                                score: 32 },
  { q: "Pet Sematary",                             y: 2019, type: "movie", subgenres: ["Supernatural","Zombie"],                       score: 65 },
  { q: "Pet Sematary: Bloodlines",                 y: 2023, type: "movie", subgenres: ["Supernatural"],                                score: 28 },

  // ── CANDYMAN ─────────────────────────────────────────────────────────────────
  { q: "Candyman",                                 y: 1992, type: "movie", subgenres: ["Supernatural","Slasher"],                      score: 89 },
  { q: "Candyman: Farewell to the Flesh",          y: 1995, type: "movie", subgenres: ["Supernatural","Slasher"],                      score: 30 },
  { q: "Candyman: Day of the Dead",                y: 1999, type: "movie", subgenres: ["Supernatural","Slasher"],                      score: 18 },
  { q: "Candyman",                                 y: 2021, type: "movie", subgenres: ["Supernatural","Slasher"],                      score: 74 },

  // ── THE GRUDGE ───────────────────────────────────────────────────────────────
  { q: "The Grudge",                               y: 2004, type: "movie", subgenres: ["Supernatural","Psychological"],                score: 65 },
  { q: "The Grudge 2",                             y: 2006, type: "movie", subgenres: ["Supernatural"],                                score: 35 },
  { q: "The Grudge 3",                             y: 2009, type: "movie", subgenres: ["Supernatural"],                                score: 18 },
  { q: "The Grudge",                               y: 2020, type: "movie", subgenres: ["Supernatural"],                                score: 22 },

  // ── THE RING ─────────────────────────────────────────────────────────────────
  { q: "The Ring",                                 y: 2002, type: "movie", subgenres: ["Supernatural","Psychological"],                score: 82 },
  { q: "The Ring Two",                             y: 2005, type: "movie", subgenres: ["Supernatural"],                                score: 38 },
  { q: "Rings",                                    y: 2017, type: "movie", subgenres: ["Supernatural"],                                score: 22 },

  // ── PARANORMAL ACTIVITY ───────────────────────────────────────────────────────
  { q: "Paranormal Activity",                      y: 2007, type: "movie", subgenres: ["Found Footage","Supernatural"],                score: 82 },
  { q: "Paranormal Activity 2",                    y: 2010, type: "movie", subgenres: ["Found Footage","Supernatural"],                score: 65 },
  { q: "Paranormal Activity 3",                    y: 2011, type: "movie", subgenres: ["Found Footage","Supernatural"],                score: 70 },
  { q: "Paranormal Activity 4",                    y: 2012, type: "movie", subgenres: ["Found Footage","Supernatural"],                score: 42 },
  { q: "Paranormal Activity: The Marked Ones",     y: 2014, type: "movie", subgenres: ["Found Footage","Supernatural"],                score: 48 },
  { q: "Paranormal Activity: The Ghost Dimension", y: 2015, type: "movie", subgenres: ["Found Footage","Supernatural"],                score: 35 },

  // ── WEDNESDAY (TV) ───────────────────────────────────────────────────────────
  { q: "Wednesday",                                y: 2022, type: "tv",    subgenres: ["Comedy Horror","Supernatural"],                 score: 78 },
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
  const url = new URL(`https://api.themoviedb.org/3${path}`);
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
      tmdb_id: r.id as number,
      title: (isMovie ? r.title : r.name) as string,
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

  for (let i = 0; i < BATCH.length; i++) {
    const e = BATCH[i];
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
          if (i % 10 === 9) await new Promise(r => setTimeout(r, 100));
          continue;
        }
      } else {
        results.push({ title: label, status: "failed", detail: "not found on TMDB" });
        continue;
      }
    }

    await supabase.from("titles").update({ subgenres: e.subgenres, critic_score: e.score }).eq("id", existing.id);
    results.push({ title: label, status: "existed" });
    if (i % 10 === 9) await new Promise(r => setTimeout(r, 100));
  }

  const imported = results.filter(r => r.status === "imported");
  const existed  = results.filter(r => r.status === "existed");
  const failed   = results.filter(r => r.status === "failed");
  return NextResponse.json({
    success: true, total: BATCH.length,
    imported: imported.length, existed: existed.length, failed: failed.length,
    importedList: imported.map(r => `${r.title} ${r.detail ?? ""}`),
    failedList:   failed.map(r => `${r.title}: ${r.detail}`),
  });
}
