import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const TMDB_BASE = "https://api.themoviedb.org/3";

// All non-English European languages in our import
const EUROPEAN_LANGS = ["it", "fr", "de", "es", "sv", "no", "da", "fi", "nl", "pt", "pl", "cs", "hu", "ro"];

// ─── Approved titles — lowercase, exact or leading match ────────────────────

const APPROVED_EUROPEAN = new Set([
  // ── ITALIAN: Dario Argento ──────────────────────────────────────────────
  "suspiria",
  "inferno",
  "opera",
  "deep red",
  "profondo rosso",
  "tenebrae",
  "phenomena",
  "the bird with the crystal plumage",
  "l'uccello dalle piume di cristallo",
  "four flies on grey velvet",
  "cat o' nine tails",
  // ── ITALIAN: Lucio Fulci ────────────────────────────────────────────────
  "zombie",
  "zombi 2",
  "zombie flesh eaters",
  "the beyond",
  "l'aldilà",
  "city of the living dead",
  "paura nella città dei morti viventi",
  "don't torture a duckling",
  "non si sevizia un paperino",
  "house by the cemetery",
  "quella villa accanto al cimitero",
  "the new york ripper",
  "the black cat",
  // ── ITALIAN: Mario Bava ─────────────────────────────────────────────────
  "bay of blood",
  "twitch of the death nerve",
  "reazione a catena",
  "kill, baby... kill!",
  "operazione paura",
  "kill baby kill",
  "blood and black lace",
  "sei donne per l'assassino",
  "black sunday",
  "la maschera del demonio",
  "planet of the vampires",
  "the whip and the body",
  "a bay of blood",
  // ── ITALIAN: Lamberto Bava ──────────────────────────────────────────────
  "demons",
  "dèmoni",
  "demons 2",
  "dèmoni 2",
  // ── ITALIAN: Michele Soavi ──────────────────────────────────────────────
  "stagefright",
  "deliria",
  "the church",
  "la chiesa",
  "cemetery man",
  "dellamorte dellamore",
  // ── ITALIAN: Other essential ────────────────────────────────────────────
  "cannibal holocaust",
  "suspiria",          // 2018 remake
  "argento's dracula", // debatable but known
  // ── SCANDINAVIAN ────────────────────────────────────────────────────────
  "let the right one in",
  "låt den rätte komma in",
  "trollhunter",
  "trolljegeren",
  "lake bodom",
  "shelley",
  "dead snow",
  "død snø",
  "dead snow 2: red vs. dead",
  "dead snow 2",
  "rare exports",
  "rare exports: a christmas tale",
  "cold prey",
  "fritt vilt",
  // ── FRENCH ──────────────────────────────────────────────────────────────
  "inside",
  "à l'intérieur",
  "a l'interieur",
  "martyrs",
  "high tension",
  "haute tension",
  "switchblade romance",
  "raw",
  "eyes without a face",
  "les yeux sans visage",
  "them",
  "ils",
  "frontier(s)",
  "frontière(s)",
  "in my skin",
  "dans ma peau",
  "the ordeal",
  "calvaire",
  "climax",
  "titane",
  "hereditary",       // american but worth keeping for completeness
  "possession",       // 1981 franco-german
  "trouble every day",
  // ── SPANISH ─────────────────────────────────────────────────────────────
  "[rec]",
  "rec",
  "[rec] 2",
  "rec 2",
  "[rec]³ génesis",
  "the orphanage",
  "el orfanato",
  "pan's labyrinth",
  "el laberinto del fauno",
  "the others",
  "los otros",
  "sleep tight",
  "mientras duermes",
  "julia's eyes",
  "los ojos de julia",
  "cronos",
  "shiver",
  "eskalofría",
  "the skin i live in",
  "la piel que habito",
  "veronica",
  "veronika",
  "the platform",
  "el hoyo",
  // ── GERMAN / AUSTRIAN ───────────────────────────────────────────────────
  "funny games",
  "nosferatu",
  "nosferatu the vampyre",
  "the cabinet of dr. caligari",
  "das cabinet des dr. caligari",
  "m",
  "the wailing",   // korean — NOT european, keep in asian list
  // ── PORTUGUESE / BRAZILIAN ──────────────────────────────────────────────
  "bacurau",        // brazilian, well-known internationally
  // ── DUTCH / BELGIAN ─────────────────────────────────────────────────────
  "man bites dog",
  "c'est arrivé près de chez vous",
  "borgman",
  "the vanishing",
  "spoorloos",
  // ── OTHER EUROPEAN ──────────────────────────────────────────────────────
  "under the shadow",
  "the wicker man",    // british — already in english imports
  "don't look now",    // british/italian — may be in english imports
  "the innocents",     // british classic
  "repulsion",         // british/french
  "the tenant",        // french/polish
  "a field in england",
  "kill list",
  "apostle",
  "hereditary",
  "midsommar",
]);

function isApprovedEuropean(title: string): boolean {
  const t = title.toLowerCase().trim();
  // Exact match or starts-with (catches subtitles like "Demons 2: ...")
  for (const a of APPROVED_EUROPEAN) {
    if (t === a || t.startsWith(a + ":") || t.startsWith(a + " -") || t.startsWith(a + " 2") || t.startsWith(a + " 3")) {
      return true;
    }
  }
  return false;
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

  const europeanTmdbIds = new Set<number>();

  // Collect all European-language horror TMDB IDs
  for (const lang of EUROPEAN_LANGS) {
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
        data.results.forEach((m: { id: number }) => europeanTmdbIds.add(m.id));
        if (page >= data.total_pages) break;
      } catch { break; }
    }
  }

  // Find European titles in our DB and filter
  const idsToDelete: string[] = [];
  const kept: string[] = [];
  const removed: string[] = [];

  const idArray = Array.from(europeanTmdbIds);
  for (let i = 0; i < idArray.length; i += 500) {
    const batch = idArray.slice(i, i + 500);
    const { data } = await supabase
      .from("titles")
      .select("id, tmdb_id, title")
      .in("tmdb_id", batch);

    for (const t of data ?? []) {
      if (isApprovedEuropean(t.title)) {
        kept.push(t.title);
      } else {
        idsToDelete.push(t.id);
        removed.push(t.title);
      }
    }
  }

  // Delete unapproved
  let deletedCount = 0;
  for (let i = 0; i < idsToDelete.length; i += 100) {
    const batch = idsToDelete.slice(i, i + 100);
    const { count } = await supabase
      .from("titles")
      .delete({ count: "exact" })
      .in("id", batch);
    deletedCount += count ?? 0;
  }

  return NextResponse.json({
    success: true,
    europeanTitlesFound: kept.length + removed.length,
    kept: kept.length,
    deleted: deletedCount,
    keptTitles: kept.sort(),
    removedTitles: removed.sort(),
  });
}
