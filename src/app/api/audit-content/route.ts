import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const TMDB_BASE = "https://api.themoviedb.org/3";
const ASIAN_LANGUAGES = ["ja", "ko", "zh", "th", "id", "tl", "vi", "my", "ms"];

// STRICT approved Asian list — only these survive
const APPROVED_ASIAN_TITLES = [
  "ringu", "ring", "ring 0", "ring 2",
  "ju-on", "grudge",
  "audition",
  "battle royale",
  "the host",
  "a tale of two sisters",
  "oldboy",
  "train to busan", "peninsula",
  "the wailing",
  "parasite",
  "dark water",
  "one missed call",
  "pulse",
  "hausu", "house",   // Hausu (1977) — approved
  "i saw the devil",
  "suicide club",
  "sadako",           // Ring franchise
];

function isApprovedAsian(title: string): boolean {
  const t = title.toLowerCase().trim();
  return APPROVED_ASIAN_TITLES.some((a) => t === a || t.startsWith(a + " ") || t.startsWith(a + ":") || t.includes(": " + a));
}

// TV shows to remove: non-supernatural dystopian/crime/political/sci-fi
const NON_HORROR_TV_TITLES = [
  "handmaid's tale", "handmaids tale",
  "mindhunter",
  "dexter",
  "the following",
  "squid game",
  "westworld",
  "severance",
  "ozark",
  "fargo",
  "you ",
  "dmz",
  "station eleven",
  "the americans",
  "narcos",
  "prison break",
  "succession",
  "euphoria",
  "star trek",
  "star wars",
  "battlestar galactica",
  "the expanse",
  "altered carbon",
  "dark matter",
  "orphan black",
  "continuum",
  "person of interest",
  "mr. robot",
  "mr robot",
  "black list",
  "blacklist",
  "the blacklist",
  "homeland",
  "24 ",
  "alias",
  "bones",
  "castle",
  "ncis",
  "csi",
  "law & order",
  "criminal minds",
  "blue bloods",
  "chicago p.d",
  "nip/tuck",
  "grey's anatomy",
  "private practice",
  "scandal",
  "how to get away",
  "power ",
  "sons of anarchy",
  "bitten",   // werewolf but non-horror tone
  "big sky",
  "yellowjackets",  // survival thriller — debatable but no supernatural
  "the 100",
  "revolution",
  "jericho",
  "zoo ",
  "the strain",     // actually IS horror (vampires) — keep by not including
];

function isNonHorrorTV(title: string): boolean {
  const t = title.toLowerCase();
  return NON_HORROR_TV_TITLES.some((p) => t === p.trim() || t.includes(p.trim()));
}

function tmdbUrl(path: string, params: Record<string, string>) {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", process.env.TMDB_API_KEY!);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
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

  const removed: string[] = [];
  const idsToDelete = new Set<string>();

  // ── 1. Get all Asian horror TMDB IDs ──────────────────────────────────────
  const asianTmdbIds = new Set<number>();
  for (const lang of ASIAN_LANGUAGES) {
    for (let page = 1; page <= 10; page++) {
      try {
        const res = await fetch(tmdbUrl("/discover/movie", {
          with_original_language: lang,
          with_genres: "27",
          "vote_count.gte": "1",
          sort_by: "popularity.desc",
          page: String(page),
        }));
        if (!res.ok) break;
        const data = await res.json();
        if (!data.results?.length) break;
        data.results.forEach((m: { id: number }) => asianTmdbIds.add(m.id));
        if (page >= data.total_pages) break;
      } catch { break; }
    }
  }

  // ── 2. Find Asian titles in our DB and filter ─────────────────────────────
  const asianIdArray = Array.from(asianTmdbIds);
  for (let i = 0; i < asianIdArray.length; i += 500) {
    const batch = asianIdArray.slice(i, i + 500);
    const { data } = await supabase
      .from("titles")
      .select("id, tmdb_id, title")
      .in("tmdb_id", batch);

    for (const t of data ?? []) {
      if (!isApprovedAsian(t.title)) {
        idsToDelete.add(t.id);
        removed.push(`[ASIAN-MOVIE] ${t.title}`);
      }
    }
  }

  // ── 3. Asian TV shows ─────────────────────────────────────────────────────
  // Separately check TV — our TV imports are mostly English but some slip through
  const APPROVED_ASIAN_TV = ["kingdom", "all of us are dead", "sweet home"];
  for (let i = 0; i < asianIdArray.length; i += 500) {
    const batch = asianIdArray.slice(i, i + 500);
    const { data } = await supabase
      .from("titles")
      .select("id, tmdb_id, title")
      .eq("media_type", "tv")
      .in("tmdb_id", batch);

    for (const t of data ?? []) {
      const tl = t.title.toLowerCase();
      if (!APPROVED_ASIAN_TV.some((a) => tl.includes(a)) && !idsToDelete.has(t.id)) {
        idsToDelete.add(t.id);
        removed.push(`[ASIAN-TV] ${t.title}`);
      }
    }
  }

  // ── 4. Non-horror TV (no supernatural elements) ───────────────────────────
  const { data: allTV } = await supabase
    .from("titles")
    .select("id, title, genres")
    .eq("media_type", "tv");

  for (const show of allTV ?? []) {
    if (idsToDelete.has(show.id)) continue;

    // Explicit title blacklist
    if (isNonHorrorTV(show.title)) {
      idsToDelete.add(show.id);
      removed.push(`[NON-HORROR-TV] ${show.title}`);
      continue;
    }

    // Genre audit: shows with NO horror-adjacent genre at all
    const g = (show.genres ?? []).map((s: string) => s.toLowerCase());
    const hasHorrorGenre = g.some((genre: string) =>
      ["drama", "mystery", "horror", "sci-fi & fantasy", "science fiction"].includes(genre)
    );
    const isOnlyActionOrCrime = g.every((genre: string) =>
      ["action & adventure", "crime", "comedy", "news", "reality", "talk", "family", "kids", "documentary"].includes(genre)
    );

    if (!hasHorrorGenre && isOnlyActionOrCrime && g.length > 0) {
      idsToDelete.add(show.id);
      removed.push(`[GENRE-MISMATCH-TV] ${show.title} (${(show.genres ?? []).join(", ")})`);
    }
  }

  // ── 5. Delete ─────────────────────────────────────────────────────────────
  const allIds = Array.from(idsToDelete);
  let deletedCount = 0;
  for (let i = 0; i < allIds.length; i += 100) {
    const batch = allIds.slice(i, i + 100);
    const { count } = await supabase
      .from("titles")
      .delete({ count: "exact" })
      .in("id", batch);
    deletedCount += count ?? 0;
  }

  return NextResponse.json({ success: true, deleted: deletedCount, removed });
}
