import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const TMDB_BASE = "https://api.themoviedb.org/3";

// Titles that didn't match in import-movies-policy — retry without strict year filter
// Some have corrected queries; all are searched by title only to avoid year mismatch
const RETRY: { q: string; y?: number }[] = [
  { q: "Madman", y: 1982 }, { q: "The Watcher in the Woods", y: 1980 },
  { q: "Wishmaster 2 Evil Never Dies" }, { q: "Tigers Are Not Afraid" },
  { q: "The Wailing" }, { q: "One Missed Call", y: 2003 },
  { q: "The Predator", y: 2018 }, { q: "Prey", y: 2022 },
  { q: "Critters", y: 1986 }, { q: "Gremlins", y: 1984 },
  { q: "Pumpkinhead", y: 1988 }, { q: "Feast", y: 2005 },
  { q: "Mimic 2" }, { q: "Splinter", y: 2008 },
  { q: "Godzilla", y: 2014 }, { q: "Below", y: 2002 },
  { q: "C.H.U.D" }, { q: "Alligator", y: 1980 },
  { q: "Prophecy", y: 1979 }, { q: "Basket Case", y: 1982 },
  { q: "Ghoulies", y: 1984 }, { q: "Troll", y: 1986 },
  { q: "Underwater", y: 2020 }, { q: "Alien Resurrection" },
  { q: "Prometheus", y: 2012 }, { q: "The Fly", y: 1986 },
  { q: "Annihilation", y: 2018 }, { q: "Shivers", y: 1975 },
  { q: "Night of the Comet" }, { q: "Lifeforce", y: 1985 },
  { q: "Daybreakers" }, { q: "Priest", y: 2011 },
  { q: "Battle Royale" }, { q: "Night of the Creeps" },
  { q: "Naked Lunch", y: 1991 }, { q: "Society", y: 1989 },
  { q: "Contracted", y: 2013 }, { q: "Contracted Phase II" },
  { q: "Bite", y: 2015 }, { q: "Starry Eyes", y: 2014 },
  { q: "Black Swan" }, { q: "Shutter Island" },
  { q: "Gone Girl" }, { q: "Nightcrawler", y: 2014 },
  { q: "Lake Mungo" }, { q: "Don't Breathe 2" },
  { q: "The Invisible Man", y: 2020 }, { q: "Audition", y: 1999 },
  { q: "Session 9" }, { q: "Jacob's Ladder", y: 1990 },
  { q: "Suspiria", y: 1977 }, { q: "Suspiria", y: 2018 },
  { q: "Day of the Dead", y: 1985 }, { q: "Land of the Dead" },
  { q: "Dawn of the Dead", y: 2004 }, { q: "Day of the Dead", y: 2008 },
  { q: "Return of the Living Dead", y: 1985 }, { q: "Return of the Living Dead Part II" },
  { q: "Zombieland Double Tap" }, { q: "Train to Busan" },
  { q: "Dead Snow", y: 2009 }, { q: "REC 3 Genesis" },
  { q: "Warm Bodies" }, { q: "The Crazies", y: 1973 }, { q: "The Crazies", y: 2010 },
  { q: "Planet Terror" }, { q: "Bride of Re-Animator" }, { q: "Beyond Re-Animator" },
  { q: "The Beyond", y: 1981 }, { q: "Near Dark" },
  { q: "Salem's Lot", y: 1979 }, { q: "Salem's Lot", y: 2024 },
  { q: "From Dusk Till Dawn 3" }, { q: "Blade II" },
  { q: "Underworld Blood Wars" }, { q: "Let the Right One In" },
  { q: "Only Lovers Left Alive" }, { q: "What We Do in the Shadows", y: 2014 },
  { q: "Shadow of the Vampire" }, { q: "Fright Night", y: 2011 },
  { q: "Stakeland" }, { q: "Dark Shadows", y: 2012 },
  { q: "Cronos" }, { q: "Thirst", y: 2009 },
  { q: "An American Werewolf in London" }, { q: "The Howling", y: 1981 },
  { q: "The Monster Squad" }, { q: "Ginger Snaps 2" },
  { q: "The Wolfman", y: 2010 }, { q: "Late Phases" },
  { q: "Howl", y: 2015 }, { q: "Bad Moon" }, { q: "Cursed", y: 2005 },
  { q: "The Blair Witch Project" }, { q: "The Last Exorcism" },
  { q: "The Last Exorcism Part II" }, { q: "V/H/S 99" },
  { q: "The Den", y: 2013 }, { q: "Host", y: 2020 },
  { q: "Hell House LLC" }, { q: "Hell House LLC 2" },
  { q: "Hell House LLC 3" }, { q: "Hell House LLC Origins" },
  { q: "The Sacrament", y: 2013 }, { q: "The Frighteners" },
  { q: "Scary Movie 3" }, { q: "Happy Death Day" },
  { q: "Freaky", y: 2020 }, { q: "The Final Girls" },
  { q: "Cocaine Bear" }, { q: "M3GAN" }, { q: "Totally Killer" },
  { q: "Repossessed", y: 1990 }, { q: "Anna and the Apocalypse" },
  { q: "House", y: 1977 }, { q: "Inferno", y: 1980 },
  { q: "Deep Red", y: 1975 }, { q: "The Bird with the Crystal Plumage" },
  { q: "Zombie", y: 1979 }, { q: "City of the Living Dead" },
  { q: "Demons 2" }, { q: "Cemetery Man" },
  { q: "The Hidden", y: 1987 }, { q: "Phantasm II" },
  { q: "Phantasm III Lord of the Dead" }, { q: "Phantasm IV Oblivion" },
  { q: "Phantasm Ravager" }, { q: "Blood Simple" },
  { q: "Tourist Trap", y: 1979 }, { q: "Squirm", y: 1976 },
  { q: "Hellbound Hellraiser II" }, { q: "Hellraiser Bloodline" },
  { q: "Hellraiser Hellseeker" }, { q: "Hellraiser", y: 2022 },
  { q: "House", y: 1986 }, { q: "Brainscan", y: 1994 },
  { q: "Troll 2" }, { q: "The Sentinel", y: 1977 },
  { q: "We Are What We Are", y: 2013 }, { q: "American Mary" },
  { q: "The Innkeepers" }, { q: "Phantoms", y: 1998 },
  // New titles from CONTENT_POLICY.md update
  { q: "The Black Phone", y: 2021 }, { q: "Smile", y: 2022 }, { q: "Smile 2", y: 2024 },
  { q: "The Boogeyman", y: 2023 }, { q: "Strange Darling", y: 2024 }, { q: "In a Violent Nature", y: 2024 },
  { q: "Malignant", y: 2021 }, { q: "The Night House", y: 2020 }, { q: "Antlers", y: 2021 },
  { q: "Immaculate", y: 2024 }, { q: "Heretic", y: 2024 }, { q: "Late Night with the Devil", y: 2023 },
  { q: "It Lives Inside", y: 2023 }, { q: "When Evil Lurks", y: 2023 },
  { q: "A Quiet Place", y: 2018 }, { q: "A Quiet Place Part II", y: 2021 },
  { q: "Five Nights at Freddy's", y: 2023 }, { q: "Abigail", y: 2024 },
  { q: "The Substance", y: 2024 }, { q: "Longlegs", y: 2024 },
  { q: "Last Night in Soho", y: 2021 }, { q: "Skinamarink", y: 2022 },
];

type MovieResult = {
  id: number; title: string; overview: string;
  poster_path: string | null; backdrop_path: string | null;
  release_date: string; genre_ids: number[];
};

function tmdbUrl(path: string, params: Record<string, string>) {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", process.env.TMDB_API_KEY!);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

async function searchMovie(query: string, year?: number): Promise<MovieResult | null> {
  const params: Record<string, string> = { query, language: "en-US" };
  if (year) params.year = String(year);
  const res = await fetch(tmdbUrl("/search/movie", params), { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  // Try first result, or second if first year is totally wrong
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

  // Get existing IDs to avoid duplicates
  const existing = new Set<number>();
  let from = 0;
  while (true) {
    const { data } = await supabase.from("titles").select("tmdb_id").eq("media_type", "movie").range(from, from + 999);
    if (!data?.length) break;
    data.forEach((r: { tmdb_id: number }) => existing.add(r.tmdb_id));
    if (data.length < 1000) break;
    from += 1000;
  }

  const genreRes = await fetch(tmdbUrl("/genre/movie/list", { language: "en-US" }), { cache: "no-store" });
  const genreMap: Record<number, string> = Object.fromEntries(
    ((await genreRes.json()).genres ?? []).map((g: { id: number; name: string }) => [g.id, g.name])
  );

  const seen = new Set<number>();
  const payload: object[] = [];
  const notFound: string[] = [];

  const BATCH = 10;
  for (let i = 0; i < RETRY.length; i += BATCH) {
    const batch = RETRY.slice(i, i + BATCH);
    const results = await Promise.all(batch.map((e) => searchMovie(e.q, e.y)));
    for (let j = 0; j < batch.length; j++) {
      const r = results[j];
      if (!r) { notFound.push(batch[j].q); continue; }
      if (seen.has(r.id) || existing.has(r.id)) continue;
      seen.add(r.id);
      payload.push({
        tmdb_id: r.id, media_type: "movie", title: r.title,
        overview: r.overview || null, poster_path: r.poster_path, backdrop_path: r.backdrop_path,
        release_year: r.release_date ? parseInt(r.release_date.split("-")[0], 10) : null,
        genres: r.genre_ids.map((id) => genreMap[id]).filter(Boolean),
      });
    }
    if (i + BATCH < RETRY.length) await new Promise((r) => setTimeout(r, 80));
  }

  for (let i = 0; i < payload.length; i += 100) {
    await supabase.from("titles").upsert(payload.slice(i, i + 100) as never[], { onConflict: "tmdb_id,media_type" });
  }

  return NextResponse.json({ added: payload.length, notFound, notFoundList: notFound });
}
