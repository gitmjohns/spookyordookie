import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Cult Classics from CONTENT_POLICY.md — internal tag only, NOT a user-facing genre filter
const CULT_CLASSIC_TITLES = [
  "the people under the stairs", "near dark", "jacob's ladder", "in the mouth of madness",
  "session 9", "demon knight", "night of the comet", "night of the demons", "from beyond",
  "may", "the hidden", "c.h.u.d.", "phantasm", "phantasm ii", "phantasm iii: lord of the dead",
  "phantasm iv: oblivion", "phantasm: ravager", "pumpkinhead", "the fog", "prince of darkness",
  "maniac", "night of the creeps", "the changeling", "burnt offerings", "pontypool",
  "blood simple", "basket case", "tourist trap", "squirm", "madman", "sleepaway camp",
  "the funhouse", "happy birthday to me", "the burning", "sorority house massacre",
  "slumber party massacre", "hell night", "graduation day", "final exam",
  "he knows you're alone", "the dorm that dripped blood", "curtains", "the stuff",
  "q the winged serpent", "wolfen", "alligator", "prophecy", "the sentinel",
  "audrey rose", "the watcher in the woods", "something wicked this way comes",
  "cat's eye", "maximum overdrive", "shocker", "warlock", "warlock: the armageddon",
  "wishmaster", "wishmaster 2: evil never dies", "leprechaun", "critters", "critters 2",
  "ghoulies", "troll", "troll 2", "rawhead rex", "hellbound: hellraiser ii",
  "hellraiser iii: hell on earth", "hellraiser: bloodline", "hellraiser: inferno",
  "hellraiser: hellseeker", "hellraiser: deader", "hellraiser: hellworld",
  "waxwork", "house", "house ii: the second story", "pulse", "flatliners", "brainscan",
  "possessor", "raw", "martyrs", "inside", "high tension", "ils",
  "eden lake", "severance", "the loved ones", "wolf creek", "wolf creek 2",
  "wyrmwood", "terrified", "baskin", "under the shadow", "a dark song",
  "tigers are not afraid", "audition", "ringu", "ju-on: the grudge", "dark water",
  "one missed call", "battle royale", "oldboy", "i saw the devil", "parasite",
  "the host", "a tale of two sisters", "the wailing", "lake mungo", "noroi: the curse",
  "kill list", "a field in england", "the borderlands", "dog soldiers", "the ritual",
  "haunt", "it follows", "the guest", "starry eyes",
  "we are what we are", "american mary", "the innkeepers",
  "tucker and dale vs evil", "trick 'r treat", "trick r treat",
  "behind the mask: the rise of leslie vernon", "frailty", "bubba ho-tep",
  "may", "ginger snaps", "ravenous", "the faculty", "phantoms",
  "the frighteners", "demon knight", "army of darkness", "the people under the stairs",
  "night of the demons", "from beyond", "re-animator", "night of the comet",
  "the fog", "tourist trap", "phantasm", "martin", "burnt offerings", "squirm",
  "near dark", "suspiria", "deep red", "tenebrae", "inferno", "phenomena",
  "the beyond", "city of the living dead", "zombie", "zombi 2", "demons",
  "cemetery man", "dellamorte dellamore",
];

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

  // Fetch all movies
  const allTitles: { id: string; tmdb_id: number; title: string; media_type: string; subgenres: string[] | null }[] = [];
  let from = 0;
  while (true) {
    const { data } = await supabase.from("titles").select("id,tmdb_id,title,media_type,subgenres")
      .eq("media_type", "movie").range(from, from + 499);
    if (!data?.length) break;
    allTitles.push(...data);
    if (data.length < 500) break;
    from += 500;
  }

  let tagged = 0;
  const toUpdate: { tmdb_id: number; media_type: string; title: string; subgenres: string[] }[] = [];

  for (const title of allTitles) {
    const t = title.title.toLowerCase().trim();
    const isCult = CULT_CLASSIC_TITLES.some((c) =>
      t === c || t.startsWith(c + ":") || t === `the ${c}` || `the ${t}` === c
    );

    if (isCult) {
      const current = title.subgenres ?? [];
      if (!current.includes("Cult Classic")) {
        toUpdate.push({
          tmdb_id: title.tmdb_id,
          media_type: title.media_type,
          title: title.title,
          subgenres: [...current, "Cult Classic"],
        });
        tagged++;
      }
    }
  }

  // Upsert in batches
  for (let i = 0; i < toUpdate.length; i += 100) {
    await supabase.from("titles").upsert(toUpdate.slice(i, i + 100), {
      onConflict: "tmdb_id,media_type",
    });
  }

  return NextResponse.json({ success: true, tagged, total: allTitles.length });
}
