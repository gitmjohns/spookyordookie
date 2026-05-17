import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const TMDB_BASE = "https://api.themoviedb.org/3";
const HORROR_TV_KEYWORD = 315058;
const VAMPIRE_TV_KEYWORD = 4565;
const SUPERNATURAL_TV_KEYWORD = 10219;
const GHOST_TV_KEYWORD = 15096;
const ZOMBIE_TV_KEYWORD = 12377;

// TMDB TV genre IDs
const DRAMA = 18;
const MYSTERY = 9648;
const SCIFI = 10765;
const ANIMATION = 16;
const KIDS = 10762;
const ACTION_ADV = 10759;

// Explicitly curated shows — always included regardless of genre tags
const CURATED_TITLES = [
  "The X-Files", "True Blood", "Twin Peaks", "Bates Motel", "Hannibal",
  "Penny Dreadful", "Dark", "The Terror", "Channel Zero", "Marianne",
  "Slasher", "Scream Queens", "Ash vs Evil Dead", "Interview with the Vampire",
  "Carnivàle", "Masters of Horror", "Night Gallery", "Kolchak: The Night Stalker",
  "Goosebumps", "Are You Afraid of the Dark", "Freddy's Nightmares",
  "Friday the 13th", "The Last of Us", "Tales from the Crypt", "Chucky",
  "Dexter", "The Strain", "Salem", "The Vampire Diaries", "Grimm",
  "iZombie", "Teen Wolf", "Six Feet Under", "Creepshow", "NOS4A2",
  "Locke & Key", "The Outsider", "Castle Rock", "Ratched", "Hemlock Grove",
  "The Following", "Mindhunter", "Haunting of Bly Manor", "Brand New Cherry Flavor",
  "From", "The Haunting of Hill House", "Midnight Mass", "American Horror Story",
  "Stranger Things", "The Walking Dead", "Black Mirror", "What We Do in the Shadows",
  "Supernatural", "Scream", "Scream Queens", "Reaper", "Buffy the Vampire Slayer",
  "Angel", "The Vampire Chronicles", "Interview with the Vampire",
];

const CURATED_SET = new Set(CURATED_TITLES.map((t) => t.toLowerCase()));

type TVShow = {
  id: number; name: string; overview: string;
  poster_path: string | null; backdrop_path: string | null;
  first_air_date: string; genre_ids: number[]; popularity: number;
};

function isHorrorEnough(show: TVShow): boolean {
  const g = show.genre_ids;
  const titleLower = show.name.toLowerCase();

  // Always include explicitly curated titles
  if (CURATED_SET.has(titleLower)) return true;

  // Exclude pure animation — this catches Batman Beyond, cartoons, anime, etc.
  if (g.includes(ANIMATION)) return false;

  // Exclude pure kids shows
  if (g.includes(KIDS)) return false;

  // Everything else that came through horror/vampire/supernatural/zombie
  // keyword discovery is likely legitimate horror TV — accept it
  return true;
}

function tmdbUrl(path: string, params: Record<string, string>) {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", process.env.TMDB_API_KEY!);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

async function discoverTV(keyword: number, page: number, englishOnly = false): Promise<TVShow[]> {
  const params: Record<string, string> = {
    with_keywords: String(keyword),
    "vote_count.gte": "5",
    sort_by: "popularity.desc",
    page: String(page),
  };
  if (englishOnly) params.with_original_language = "en";
  const res = await fetch(tmdbUrl("/discover/tv", params));
  if (!res.ok) return [];
  return (await res.json()).results ?? [];
}

async function searchTV(query: string): Promise<TVShow | null> {
  const res = await fetch(tmdbUrl("/search/tv", { query, language: "en-US", page: "1" }));
  if (!res.ok) return null;
  return (await res.json()).results?.[0] ?? null;
}

function buildPayload(s: TVShow, genreMap: Record<number, string>) {
  return {
    tmdb_id: s.id, media_type: "tv" as const, title: s.name,
    overview: s.overview || null, poster_path: s.poster_path, backdrop_path: s.backdrop_path,
    release_year: s.first_air_date ? parseInt(s.first_air_date.split("-")[0], 10) : null,
    genres: s.genre_ids.map((id) => genreMap[id]).filter(Boolean),
  };
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

  await supabase.from("titles").delete().eq("media_type", "tv");

  const genreRes = await fetch(tmdbUrl("/genre/tv/list", { language: "en" }));
  const genreMap: Record<number, string> = Object.fromEntries(
    ((await genreRes.json()).genres ?? []).map((g: { id: number; name: string }) => [g.id, g.name])
  );

  const seen = new Set<number>();
  const payload: ReturnType<typeof buildPayload>[] = [];

  const addShow = (s: TVShow) => {
    if (!seen.has(s.id) && isHorrorEnough(s)) {
      seen.add(s.id);
      payload.push(buildPayload(s, genreMap));
    }
  };

  // Horror keyword (pages 1-35 to maximize catalog)
  for (let page = 1; page <= 35; page++) {
    const results = await discoverTV(HORROR_TV_KEYWORD, page);
    if (!results.length) break;
    results.forEach(addShow);
  }

  // Vampire keyword (pages 1-10)
  for (let page = 1; page <= 10; page++) {
    const results = await discoverTV(VAMPIRE_TV_KEYWORD, page);
    if (!results.length) break;
    results.forEach(addShow);
  }

  // Supernatural keyword (pages 1-10)
  for (let page = 1; page <= 10; page++) {
    const results = await discoverTV(SUPERNATURAL_TV_KEYWORD, page);
    if (!results.length) break;
    results.forEach(addShow);
  }

  // Ghost keyword (pages 1-8)
  for (let page = 1; page <= 8; page++) {
    const results = await discoverTV(GHOST_TV_KEYWORD, page);
    if (!results.length) break;
    results.forEach(addShow);
  }

  // Zombie keyword (pages 1-8)
  for (let page = 1; page <= 8; page++) {
    const results = await discoverTV(ZOMBIE_TV_KEYWORD, page);
    if (!results.length) break;
    results.forEach(addShow);
  }

  // Curated title search
  for (const name of CURATED_TITLES) {
    const result = await searchTV(name);
    if (result && !seen.has(result.id)) {
      seen.add(result.id);
      payload.push(buildPayload(result, genreMap));
    }
  }

  let imported = 0;
  for (let i = 0; i < payload.length; i += 100) {
    const batch = payload.slice(i, i + 100);
    const { count } = await supabase.from("titles").upsert(batch, {
      onConflict: "tmdb_id,media_type",
      count: "exact",
    });
    imported += count ?? batch.length;
  }

  return NextResponse.json({ success: true, imported, total: payload.length });
}
