import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const TMDB_BASE = "https://api.themoviedb.org/3";

// Complete approved TV list from CONTENT_POLICY.md
const WHITELIST: { q: string; y?: number }[] = [
  { q: "American Horror Story" }, { q: "Angel", y: 1999 }, { q: "Bates Motel" },
  { q: "Black Mirror" }, { q: "Buffy the Vampire Slayer" }, { q: "Carnivale" },
  { q: "Channel Zero" }, { q: "Chucky" }, { q: "Dark" }, { q: "Dexter" },
  { q: "Fear the Walking Dead" }, { q: "Freddy's Nightmares" },
  { q: "Friday the 13th", y: 1987 }, { q: "From", y: 2022 }, { q: "Goosebumps" },
  { q: "Hannibal" }, { q: "Harper's Island" }, { q: "The Haunting of Bly Manor" },
  { q: "The Haunting of Hill House" }, { q: "Hemlock Grove" },
  { q: "Interview with the Vampire" }, { q: "Into the Dark" }, { q: "Kolchak The Night Stalker" },
  { q: "The Last of Us" }, { q: "Locke Key" }, { q: "Lovecraft Country" },
  { q: "Marianne", y: 2019 }, { q: "Masters of Horror" }, { q: "Midnight Mass" },
  { q: "Mindhunter" }, { q: "Dahmer Monster Jeffrey Dahmer Story" },
  { q: "Monster Bundy" }, { q: "Monster Gacy" },
  { q: "Night Gallery" }, { q: "Penny Dreadful" }, { q: "Ratched" },
  { q: "Scream Queens" }, { q: "Scream", y: 2015 }, { q: "Slasher" },
  { q: "Stranger Things" }, { q: "Tales from the Crypt" }, { q: "Tales from the Darkside" },
  { q: "The Exorcist", y: 2016 }, { q: "The Returned", y: 2012 }, { q: "The Terror" },
  { q: "The Walking Dead" }, { q: "True Blood" }, { q: "Twin Peaks" },
  { q: "What We Do in the Shadows" }, { q: "The X-Files" }, { q: "Yellowjackets" },
  { q: "Ash vs Evil Dead" }, { q: "Creepshow" }, { q: "Chapelwaite" },
  { q: "The Strain" }, { q: "Helix" }, { q: "The Mist", y: 2017 },
  { q: "Wayward Pines" }, { q: "Archive 81" }, { q: "The Watcher", y: 2022 },
  { q: "Brand New Cherry Flavor" }, { q: "Them", y: 2021 }, { q: "Servant" },
  { q: "Cabinet of Curiosities" }, { q: "The Midnight Club" },
  { q: "The Fall of the House of Usher" }, { q: "Chilling Adventures of Sabrina" },
  { q: "Supernatural" }, { q: "Grimm" }, { q: "Being Human", y: 2009 },
  { q: "The Originals" }, { q: "The Vampire Diaries" }, { q: "iZombie" },
  { q: "Z Nation" }, { q: "Dead Set" }, { q: "In the Flesh", y: 2013 },
  { q: "Utopia", y: 2013 }, { q: "The Fades", y: 2011 }, { q: "Misfits", y: 2009 },
  { q: "Bedlam", y: 2011 }, { q: "Inside No 9" }, { q: "Requiem", y: 2018 },
  { q: "Fortitude" }, { q: "Trapped", y: 2015 }, { q: "Jordskott" },
  { q: "Luther" }, { q: "The Alienist" }, { q: "NOS4A2" }, { q: "Castle Rock" },
  { q: "Evil", y: 2019 }, { q: "Manifest" }, { q: "Prodigal Son" }, { q: "Clarice" },
  { q: "American Gothic", y: 2016 }, { q: "Garth Marenghi's Darkplace" },
  { q: "Psychoville" }, { q: "The League of Gentlemen" }, { q: "Nighty Night" },
  { q: "Ghosts", y: 2019 }, { q: "Wellington Paranormal" },
  { q: "What We Do in the Shadows", y: 2019 }, { q: "Dracula", y: 2020 },
  { q: "Van Helsing", y: 2016 }, { q: "From Dusk Till Dawn", y: 2014 },
  { q: "Preacher" }, { q: "Swamp Thing", y: 2019 }, { q: "Constantine", y: 2014 },
  { q: "Penny Dreadful City of Angels" }, { q: "Nine Perfect Strangers" },
  { q: "The Act", y: 2019 }, { q: "Dirty John" }, { q: "Dr Death" },
  { q: "The Thing About Pam" }, { q: "Under the Banner of Heaven" },
  { q: "A Friend of the Family" }, { q: "Night Stalker", y: 2021 },
  { q: "Crime Scene The Vanishing at the Cecil Hotel" },
  { q: "Nightflyers" }, { q: "The Outer Limits", y: 1995 },
];

type TVResult = {
  id: number; name: string; overview: string;
  poster_path: string | null; backdrop_path: string | null;
  first_air_date: string; genre_ids: number[]; popularity: number;
};

function tmdbUrl(path: string, params: Record<string, string>) {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", process.env.TMDB_API_KEY!);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

async function searchTV(query: string, year?: number): Promise<TVResult | null> {
  const params: Record<string, string> = { query, language: "en-US", page: "1" };
  if (year) params.first_air_date_year = String(year);
  const res = await fetch(tmdbUrl("/search/tv", params), { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
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

  await supabase.from("titles").delete().eq("media_type", "tv");

  const genreRes = await fetch(tmdbUrl("/genre/tv/list", { language: "en" }), { cache: "no-store" });
  const genreData = await genreRes.json();
  const genreMap: Record<number, string> = Object.fromEntries(
    (genreData.genres ?? []).map((g: { id: number; name: string }) => [g.id, g.name])
  );

  const seen = new Set<number>();
  const payload: object[] = [];
  const notFound: string[] = [];

  for (const entry of WHITELIST) {
    await new Promise((r) => setTimeout(r, 60));
    const result = await searchTV(entry.q, entry.y);
    if (!result) { notFound.push(`${entry.q}${entry.y ? ` (${entry.y})` : ""}`); continue; }
    if (seen.has(result.id)) continue;
    seen.add(result.id);
    payload.push({
      tmdb_id: result.id, media_type: "tv", title: result.name,
      overview: result.overview || null, poster_path: result.poster_path,
      backdrop_path: result.backdrop_path,
      release_year: result.first_air_date ? parseInt(result.first_air_date.split("-")[0], 10) : null,
      genres: result.genre_ids.map((id) => genreMap[id]).filter(Boolean),
    });
  }

  for (let i = 0; i < payload.length; i += 50) {
    await supabase.from("titles").upsert(payload.slice(i, i + 50) as never[], { onConflict: "tmdb_id,media_type" });
  }

  return NextResponse.json({
    success: true, imported: payload.length,
    notFound: notFound.length, notFoundList: notFound,
    shows: (payload as { title: string }[]).map((s) => s.title),
  });
}
