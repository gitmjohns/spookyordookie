import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Titles that had ONLY Psychological — reassigned to best remaining genre.
// Flagged titles are left with an empty subgenres array and reported back.
const REASSIGN: Record<string, string[]> = {
  "Carnivàle":                   ["Supernatural"],
  "Castle Rock":                 ["Supernatural"],
  "Creepshow":                   ["Supernatural"],          // 2019 TV series
  "Freddy's Nightmares":         ["Supernatural"],
  "Gerald's Game":               ["Supernatural"],
  "Jordskott":                   ["Supernatural"],
  "Locke & Key":                 ["Supernatural"],
  "Masters of Horror":           ["Supernatural"],
  "Penny Dreadful: City of Angels": ["Supernatural"],
  "Servant":                     ["Supernatural"],
  "The Returned":                ["Supernatural"],
  "The Tenant":                  ["Supernatural"],
  "The Terror":                  ["Supernatural"],
  "The X-Files":                 ["Supernatural"],
  "Them":                        ["Supernatural"],          // 2021 TV anthology
  "Yellowjackets":               ["Supernatural"],
  "Black Mirror":                ["Sci-Fi Horror"],
  "Dark":                        ["Sci-Fi Horror"],
  "Wayward Pines":               ["Sci-Fi Horror"],
  "Black Swan":                  ["Body Horror"],
  "Misery":                      ["Slasher"],
  // "Them" 2006 film (Ils) — handled below by year
};

// Titles with ambiguous year (same name, different entry): handled by media_type + year
const REASSIGN_EXACT: { title: string; year: number; type: string; subgenres: string[] }[] = [
  { title: "Them", year: 2006, type: "movie", subgenres: ["Slasher"] },   // French film Ils
  { title: "Them", year: 2021, type: "tv",    subgenres: ["Supernatural"] },
];

// These 4 titles are flagged — no clear horror genre fit
const FLAGGED = ["Ratched", "Shutter Island", "The Watcher", "Manifest"];

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  // 1. Fetch ALL titles that have Psychological in their subgenres
  const allPsych: { id: string; title: string; release_year: number | null; media_type: string; subgenres: string[] }[] = [];
  let from = 0;
  while (true) {
    const { data } = await supabase
      .from("titles")
      .select("id,title,release_year,media_type,subgenres")
      .contains("subgenres", ["Psychological"])
      .range(from, from + 499);
    if (!data?.length) break;
    allPsych.push(...data);
    if (data.length < 500) break;
    from += 500;
  }

  // 2. Apply exact-match reassignments first (same-title disambiguation)
  const exactHandled = new Set<string>();
  const exactUpdates: { id: string; subgenres: string[] }[] = [];

  for (const rule of REASSIGN_EXACT) {
    const match = allPsych.find(
      (t) => t.title === rule.title && t.release_year === rule.year && t.media_type === rule.type
    );
    if (match) {
      exactHandled.add(match.id);
      exactUpdates.push({ id: match.id, subgenres: rule.subgenres });
    }
  }

  // 3. Process remaining titles
  const reassigned: string[] = [];
  const flagged: string[] = [];
  const stripped: { id: string; subgenres: string[] }[] = [...exactUpdates];

  for (const t of allPsych) {
    if (exactHandled.has(t.id)) continue;

    const withoutPsych = t.subgenres.filter((s) => s !== "Psychological");

    if (withoutPsych.length > 0) {
      // Has other genres — just strip Psychological
      stripped.push({ id: t.id, subgenres: withoutPsych });
    } else if (FLAGGED.includes(t.title)) {
      // Flagged: reassign to a safe minimum so it doesn't become tagless
      flagged.push(`${t.title} (${t.release_year}) [${t.media_type}]`);
      // Keep Supernatural as a placeholder so it's still discoverable
      stripped.push({ id: t.id, subgenres: ["Supernatural"] });
    } else {
      const newTags = REASSIGN[t.title];
      if (newTags) {
        stripped.push({ id: t.id, subgenres: newTags });
        reassigned.push(`${t.title} (${t.release_year}) → ${newTags.join(", ")}`);
      } else {
        // Unknown Psychological-only title — keep as Supernatural to avoid empty tag
        stripped.push({ id: t.id, subgenres: ["Supernatural"] });
        flagged.push(`${t.title} (${t.release_year}) [unknown — defaulted to Supernatural]`);
      }
    }
  }

  // Add exact reassignments to reported list
  for (const u of exactUpdates) {
    const t = allPsych.find((x) => x.id === u.id);
    if (t) reassigned.push(`${t.title} (${t.release_year}) [${t.media_type}] → ${u.subgenres.join(", ")}`);
  }

  // 4. Batch upsert all updates (groups of 200)
  let updated = 0;
  const CHUNK = 200;
  for (let i = 0; i < stripped.length; i += CHUNK) {
    const chunk = stripped.slice(i, i + CHUNK).map(({ id, subgenres }) => ({
      id,
      subgenres,
      // include required upsert conflict fields — using id as PK
    }));
    const { count } = await supabase
      .from("titles")
      .upsert(chunk, { onConflict: "id", count: "exact" });
    updated += count ?? chunk.length;
    if (i + CHUNK < stripped.length) await new Promise((r) => setTimeout(r, 80));
  }

  return NextResponse.json({
    success: true,
    totalAffected: allPsych.length,
    updated,
    reassignedFromOnly: [...reassigned],
    flagged,
  });
}
