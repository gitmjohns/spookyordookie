import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// ─── Score map ────────────────────────────────────────────────────────────────
// Format: { t: lowercase title, y?: exact year, s: score 0-100 }
// Entries with year always take precedence. More specific (longer) titles checked first.
// Scores: 90-98 = GOAT, 85-89 = essential, 75-84 = great, 65-74 = solid, 50-64 = decent,
//         35-49 = weak, 15-34 = bad, 5-14 = terrible

const MAP: { t: string; y?: number; s: number }[] = [
  // ── TV SHOWS — scored explicitly ─────────────────────────────────────────
  { t: "the x-files", s: 90 },
  { t: "twin peaks", s: 92 },
  { t: "the haunting of hill house", s: 90 },
  { t: "haunting of hill house", s: 90 },
  { t: "midnight mass", s: 88 },
  { t: "american horror story", s: 80 },
  { t: "the walking dead", s: 86 },
  { t: "stranger things", s: 87 },
  { t: "true blood", s: 76 },
  { t: "penny dreadful", s: 84 },
  { t: "tales from the crypt", s: 82 },
  { t: "what we do in the shadows", s: 84 },
  { t: "channel zero", s: 80 },
  { t: "the terror", s: 83 },
  { t: "black mirror", s: 85 },
  { t: "castle rock", s: 74 },
  { t: "chucky", s: 72 },
  { t: "marianne", s: 78 },
  { t: "the strain", s: 70 },
  { t: "supernatural", s: 78 },
  { t: "the vampire diaries", s: 68 },
  { t: "haunting of bly manor", s: 80 },
  { t: "the haunting of bly manor", s: 80 },
  { t: "interview with the vampire", s: 78 },
  { t: "from", s: 76 },
  { t: "nos4a2", s: 72 },
  { t: "creepshow", s: 74 },
  { t: "are you afraid of the dark?", s: 76 },
  { t: "kingdom", s: 82 },
  { t: "all of us are dead", s: 76 },
  // ── 95-98: All-time genre-defining classics ──────────────────────────────
  { t: "the thing", y: 1982, s: 98 },
  { t: "halloween", y: 1978, s: 97 },
  { t: "alien", y: 1979, s: 97 },
  { t: "the shining", s: 96 },
  { t: "a nightmare on elm street", y: 1984, s: 96 },
  { t: "nightmare on elm street", y: 1984, s: 96 },
  { t: "the exorcist", y: 1973, s: 96 },
  { t: "the silence of the lambs", s: 95 },
  { t: "silence of the lambs", s: 95 },
  { t: "psycho", y: 1960, s: 95 },
  { t: "jaws", y: 1975, s: 95 },
  // ── 90-94: Essential classics ────────────────────────────────────────────
  { t: "the texas chain saw massacre", y: 1974, s: 94 },
  { t: "texas chain saw massacre", y: 1974, s: 94 },
  { t: "friday the 13th", y: 1980, s: 93 },
  { t: "hellraiser", y: 1987, s: 93 },
  { t: "evil dead ii", s: 93 },
  { t: "evil dead 2", s: 93 },
  { t: "the fly", y: 1986, s: 92 },
  { t: "dawn of the dead", y: 1978, s: 92 },
  { t: "suspiria", y: 1977, s: 92 },
  { t: "rosemary's baby", s: 92 },
  { t: "carrie", y: 1976, s: 91 },
  { t: "28 days later", s: 91 },
  { t: "the descent", s: 91 },
  { t: "aliens", y: 1986, s: 90 },
  { t: "get out", s: 90 },
  { t: "hereditary", s: 90 },
  { t: "an american werewolf in london", s: 90 },
  // ── 85-89: Essential horror ──────────────────────────────────────────────
  { t: "poltergeist", y: 1982, s: 89 },
  { t: "candyman", y: 1992, s: 89 },
  { t: "scream", y: 1996, s: 88 },
  { t: "se7en", s: 88 },
  { t: "seven", y: 1995, s: 88 },
  { t: "night of the living dead", y: 1968, s: 88 },
  { t: "don't look now", s: 88 },
  { t: "deep red", s: 88 },
  { t: "the wicker man", y: 1973, s: 87 },
  { t: "the babadook", s: 87 },
  { t: "it follows", s: 87 },
  { t: "midsommar", s: 87 },
  { t: "the witch", y: 2015, s: 87 },
  { t: "the howling", y: 1981, s: 86 },
  { t: "the conjuring", y: 2013, s: 86 },
  { t: "annihilation", s: 86 },
  { t: "predator", y: 1987, s: 86 },
  { t: "bride of frankenstein", s: 86 },
  { t: "the blair witch project", s: 85 },
  { t: "child's play", y: 1988, s: 85 },
  { t: "manhunter", s: 85 },
  { t: "videodrome", s: 85 },
  { t: "the beyond", s: 85 },
  { t: "tenebrae", s: 85 },
  // ── 80-84: Very good ─────────────────────────────────────────────────────
  { t: "the evil dead", y: 1981, s: 84 },
  { t: "evil dead", y: 1981, s: 84 },
  { t: "creepshow", y: 1982, s: 84 },
  { t: "friday the 13th: the final chapter", s: 83 },
  { t: "friday the 13th part iv", s: 83 },
  { t: "nightmare on elm street 3", s: 83 },
  { t: "dream warriors", s: 83 },
  { t: "a nightmare on elm street 3", s: 83 },
  { t: "the sixth sense", s: 83 },
  { t: "misery", s: 83 },
  { t: "cape fear", y: 1991, s: 83 },
  { t: "friday the 13th part 2", s: 82 },
  { t: "friday the 13th part ii", s: 82 },
  { t: "the ring", y: 2002, s: 82 },
  { t: "paranormal activity", y: 2007, s: 82 },
  { t: "opera", y: 1987, s: 82 },
  { t: "us", y: 2019, s: 82 },
  { t: "a quiet place", y: 2018, s: 82 },
  { t: "the lighthouse", y: 2019, s: 82 },
  { t: "friday the 13th part iii", s: 81 },
  { t: "friday the 13th part 3", s: 81 },
  { t: "jason lives", s: 81 },
  { t: "friday the 13th part vi", s: 81 },
  { t: "the autopsy of jane doe", s: 81 },
  { t: "the others", s: 81 },
  { t: "30 days of night", s: 81 },
  { t: "prey", y: 2022, s: 80 },
  { t: "the conjuring 2", s: 80 },
  { t: "bone tomahawk", s: 80 },
  { t: "the devil's backbone", s: 80 },
  { t: "let the right one in", s: 80 },
  { t: "zombie", y: 1979, s: 80 },
  { t: "demons", y: 1985, s: 80 },
  { t: "army of darkness", s: 80 },
  { t: "army of darkness", y: 1992, s: 80 },
  { t: "new nightmare", s: 80 },
  // ── 75-79: Solid ─────────────────────────────────────────────────────────
  { t: "saw", y: 2004, s: 79 },
  { t: "insidious", y: 2010, s: 79 },
  { t: "it", y: 2017, s: 79 },
  { t: "hush", y: 2016, s: 79 },
  { t: "hellraiser ii", s: 78 },
  { t: "hellbound", s: 78 },
  { t: "scream 2", s: 78 },
  { t: "the gate", s: 78 },
  { t: "cloverfield", s: 78 },
  { t: "ready or not", s: 78 },
  { t: "talk to me", y: 2022, s: 78 },
  { t: "the house of the devil", s: 77 },
  { t: "pontypool", s: 77 },
  { t: "friday the 13th part vii", s: 77 },
  { t: "the new blood", s: 77 },
  { t: "scream 4", s: 77 },
  { t: "scream vi", s: 76 },
  { t: "barbarian", y: 2022, s: 76 },
  { t: "pearl", y: 2022, s: 76 },
  { t: "the black phone", s: 76 },
  { t: "x", y: 2022, s: 75 },
  { t: "smile", y: 2022, s: 75 },
  { t: "evil dead rise", s: 75 },
  { t: "evil dead", y: 2013, s: 75 },
  { t: "sinister", y: 2012, s: 75 },
  { t: "scream", y: 2022, s: 75 },
  { t: "hannibal", y: 2001, s: 75 },
  { t: "red dragon", y: 2002, s: 75 },
  { t: "bride of chucky", s: 74 },
  { t: "child's play 2", s: 74 },
  { t: "let me in", y: 2010, s: 74 },
  { t: "candyman", y: 2021, s: 74 },
  { t: "m3gan", s: 74 },
  { t: "the black cat", s: 74 },
  { t: "nope", s: 73 },
  { t: "fresh", y: 2022, s: 73 },
  { t: "the menu", s: 73 },
  { t: "split", y: 2016, s: 73 },
  { t: "a quiet place part ii", s: 73 },
  { t: "28 weeks later", s: 73 },
  { t: "the mist", y: 2007, s: 73 },
  { t: "halloween", y: 2018, s: 72 },
  { t: "halloween h20", s: 72 },
  { t: "halloween: h20", s: 72 },
  { t: "halloween: twenty years later", s: 72 },
  { t: "the texas chainsaw massacre 2", s: 72 },
  { t: "it chapter two", s: 72 },
  { t: "the hunt", y: 2020, s: 72 },
  { t: "color out of space", s: 71 },
  { t: "infinity pool", s: 71 },
  { t: "the invisible man", y: 2020, s: 71 },
  { t: "saw ii", s: 70 },
  { t: "paranormal activity 3", s: 70 },
  { t: "halloween 4", s: 70 },
  { t: "halloween: the return of michael myers", s: 70 },
  // ── 65-69: Cult status ───────────────────────────────────────────────────
  { t: "freddy vs. jason", s: 68 },
  { t: "freddy vs jason", s: 68 },
  { t: "scream 3", s: 68 },
  { t: "halloween iii", s: 68 },
  { t: "halloween iii: season of the witch", s: 68 },
  { t: "halloween 5", s: 67 },
  { t: "halloween: the revenge of michael myers", s: 67 },
  { t: "alien 3", s: 67 },
  { t: "alien³", s: 67 },
  { t: "prometheus", y: 2012, s: 67 },
  { t: "alien: covenant", s: 67 },
  { t: "alien: romulus", s: 72 },
  { t: "annabelle: creation", s: 67 },
  { t: "seed of chucky", s: 65 },
  { t: "saw iii", s: 65 },
  { t: "paranormal activity 2", s: 65 },
  { t: "paranormal activity: the marked ones", s: 65 },
  { t: "insidious chapter 2", s: 65 },
  { t: "the texas chainsaw massacre", y: 2003, s: 65 },
  { t: "insidious: chapter 3", s: 65 },
  { t: "the purge", y: 2013, s: 65 },
  { t: "the purge: anarchy", s: 65 },
  // ── 50-64: Mediocre, sequels, remakes ───────────────────────────────────
  { t: "saw iv", s: 58 },
  { t: "saw v", s: 55 },
  { t: "saw vi", s: 55 },
  { t: "jigsaw", y: 2017, s: 55 },
  { t: "spiral", y: 2021, s: 55 },
  { t: "saw x", y: 2023, s: 60 },
  { t: "the nun", y: 2018, s: 50 },
  { t: "annabelle", y: 2014, s: 50 },
  { t: "the purge: election year", s: 55 },
  { t: "the first purge", s: 50 },
  { t: "glass", y: 2019, s: 58 },
  { t: "insidious: the red door", s: 52 },
  { t: "the conjuring: the devil made me do it", s: 58 },
  { t: "child's play 3", s: 58 },
  { t: "curse of chucky", s: 62 },
  { t: "cult of chucky", s: 60 },
  { t: "jason takes manhattan", s: 52 },
  { t: "friday the 13th part viii", s: 52 },
  { t: "jason x", s: 52 },
  { t: "alien resurrection", s: 55 },
  { t: "alien vs. predator", s: 48 },
  { t: "alien vs predator", s: 48 },
  { t: "predators", y: 2010, s: 65 },
  { t: "the predator", y: 2018, s: 40 },
  { t: "halloween: the curse of michael myers", s: 48 },
  { t: "halloween 6", s: 48 },
  { t: "nightmare on elm street 4", s: 62 },
  { t: "a nightmare on elm street 4", s: 62 },
  { t: "nightmare on elm street 2", s: 58 },
  { t: "a nightmare on elm street 2", s: 58 },
  { t: "nightmare on elm street 5", s: 52 },
  { t: "a nightmare on elm street 5", s: 52 },
  { t: "freddy's dead", s: 42 },
  // ── 30-49: Weak/bad ──────────────────────────────────────────────────────
  { t: "halloween kills", s: 42 },
  { t: "halloween ends", s: 38 },
  { t: "halloween", y: 2007, s: 38 },
  { t: "halloween ii", y: 2009, s: 30 },
  { t: "halloween: resurrection", s: 22 },
  { t: "a nightmare on elm street", y: 2010, s: 22 },
  { t: "friday the 13th", y: 2009, s: 28 },
  { t: "jason goes to hell", s: 42 },
  { t: "jason goes to hell: the final friday", s: 42 },
  { t: "saw 3d", s: 35 },
  { t: "saw: the final chapter", s: 35 },
  { t: "aliens vs. predator: requiem", s: 18 },
  { t: "avpr", s: 18 },
  { t: "psycho", y: 1998, s: 15 },
  { t: "texas chainsaw massacre: the next generation", s: 32 },
  { t: "leatherface: texas chainsaw massacre iii", s: 45 },
  { t: "texas chainsaw 3d", s: 35 },
  { t: "texas chainsaw massacre", y: 2022, s: 32 },
  { t: "annabelle comes home", s: 50 },
  { t: "the curse of la llorona", s: 38 },
  { t: "the nun ii", s: 48 },
  { t: "haunted mansion", y: 2023, s: 42 },
  { t: "five nights at freddy's", s: 52 },
  // New titles from CONTENT_POLICY.md update (scores not previously assigned)
  { t: "the substance", y: 2024, s: 72 },
  { t: "heretic", y: 2024, s: 70 },
  { t: "late night with the devil", y: 2023, s: 70 },
  { t: "when evil lurks", y: 2023, s: 68 },
  { t: "the night house", y: 2020, s: 68 },
  { t: "last night in soho", y: 2021, s: 68 },
  { t: "strange darling", y: 2024, s: 66 },
  { t: "malignant", y: 2021, s: 65 },
  { t: "abigail", y: 2024, s: 65 },
  { t: "in a violent nature", y: 2024, s: 64 },
  { t: "smile 2", y: 2024, s: 62 },
  { t: "antlers", y: 2021, s: 62 },
  { t: "longlegs", y: 2024, s: 62 },
  { t: "skinamarink", y: 2022, s: 62 },
  { t: "immaculate", y: 2024, s: 61 },
  { t: "the boogeyman", y: 2023, s: 60 },
  { t: "it lives inside", y: 2023, s: 60 },
];

// ─── Era fallback ─────────────────────────────────────────────────────────────
function eraScore(year: number | null, tmdbId: number, titleLen: number): number {
  const y = year ?? 2000;
  let base = y < 1960 ? 68 : y < 1970 ? 70 : y < 1980 ? 72 : y < 1990 ? 72 : y < 2000 ? 68 : y < 2005 ? 64 : y < 2010 ? 60 : y < 2015 ? 58 : y < 2020 ? 56 : 54;
  const variance = Math.abs((tmdbId * 31 + titleLen * 17) % 25) - 8;
  return Math.max(5, Math.min(82, base + variance));
}

// ─── Main scoring function ────────────────────────────────────────────────────
function computeCriticScore(title: string, year: number | null, tmdbId: number): number {
  const t = title.toLowerCase().trim();

  // Pass 1: entries WITH year — exact title + exact year
  if (year !== null) {
    for (const e of MAP) {
      if (e.y === year && (t === e.t || t === `the ${e.t}` || `the ${t}` === e.t)) {
        return e.s;
      }
    }
  }

  // Pass 2: entries WITHOUT year — exact title match
  for (const e of MAP) {
    if (e.y === undefined && (t === e.t || t === `the ${e.t}` || `the ${t}` === e.t)) {
      return e.s;
    }
  }

  // Fallback
  return eraScore(year, tmdbId, t.length);
}

// ─── Route ────────────────────────────────────────────────────────────────────
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

  // Fetch all titles
  const allTitles: { id: string; tmdb_id: number; title: string; release_year: number | null; media_type: string }[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("titles")
      .select("id,tmdb_id,title,release_year,media_type")
      .range(from, from + 499);
    if (error || !data?.length) break;
    allTitles.push(...data);
    if (data.length < 500) break;
    from += 500;
  }

  // Compute scores and batch upsert
  let updated = 0;
  const batchSize = 200;

  for (let i = 0; i < allTitles.length; i += batchSize) {
    const batch = allTitles.slice(i, i + batchSize).map((t) => ({
      tmdb_id: t.tmdb_id,
      media_type: t.media_type,
      title: t.title,
      critic_score: computeCriticScore(t.title, t.release_year, t.tmdb_id),
    }));

    const { count } = await supabase.from("titles").upsert(batch, {
      onConflict: "tmdb_id,media_type",
      count: "exact",
    });
    updated += count ?? batch.length;
  }

  return NextResponse.json({ success: true, updated, total: allTitles.length });
}
