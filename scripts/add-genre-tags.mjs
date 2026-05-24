// scripts/add-genre-tags.mjs
// Adds Ghost, Occult, and Action-Horror subgenre tags to specific titles.
// ONLY adds the new tag — never removes or replaces existing subgenres.
// Skips titles not found in the database (no TMDB imports).
//
// Usage: node scripts/add-genre-tags.mjs

const SUPABASE_URL = "https://chgfadgkkcwbnmligais.supabase.co";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoZ2ZhZGdra2N3Ym5tbGlnYWlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODMwMDkyMCwiZXhwIjoyMDkzODc2OTIwfQ.WiWzj-MELB-kMoj0afwo_kvxRWekCsKOpFBz497iqVs";

// ── Title Lists ────────────────────────────────────────────────────────────────
// Titles use canonical TMDB names (with colons, subtitles, accents).
// Year is used to disambiguate same-named titles.

const GHOST_TITLES = [
  // Conjuring Universe
  { title: "The Conjuring", year: 2013 },
  { title: "The Conjuring 2", year: 2016 },
  { title: "The Conjuring: The Devil Made Me Do It", year: 2021 },
  { title: "Annabelle", year: 2014 },
  { title: "Annabelle: Creation", year: 2017 },
  { title: "Annabelle Comes Home", year: 2019 },
  { title: "The Nun", year: 2018 },
  { title: "The Nun II", year: 2023 },
  // Insidious franchise
  { title: "Insidious", year: 2010 },
  { title: "Insidious: Chapter 2", year: 2013 },
  { title: "Insidious: Chapter 3", year: 2015 },
  { title: "Insidious: The Last Key", year: 2018 },
  { title: "Insidious: The Red Door", year: 2023 },
  // Poltergeist franchise
  { title: "Poltergeist", year: 1982 },
  { title: "Poltergeist II: The Other Side", year: 1986 },
  { title: "Poltergeist III", year: 1988 },
  { title: "Poltergeist", year: 2015 },
  // Amityville / haunted house classics
  { title: "The Haunting", year: 1999 },
  { title: "Sinister", year: 2012 },
  { title: "Sinister 2", year: 2015 },
  { title: "The Changeling", year: 1980 },
  { title: "The Amityville Horror", year: 1979 },
  { title: "Amityville II: The Possession", year: 1982 },
  { title: "The Amityville Horror", year: 2005 },
  { title: "The Others", year: 2001 },
  { title: "The Orphanage", year: 2007 },
  { title: "Mama", year: 2013 },
  { title: "Oculus", year: 2013 },
  { title: "Lights Out", year: 2016 },
  { title: "Audrey Rose", year: 1977 },
  { title: "The Sentinel", year: 1977 },
  { title: "A Ghost Story", year: 2017 },
  { title: "Burnt Offerings", year: 1976 },
  { title: "The Entity", year: 1982 },
  { title: "House", year: 1986 },
  { title: "The Innkeepers", year: 2011 },
  { title: "I Am the Pretty Thing That Lives in the House", year: 2016 },
  // J-Horror
  { title: "Ringu", year: 1998 },
  { title: "Ju-on: The Grudge", year: 2002 },
  { title: "Dark Water", year: 2002 },
  { title: "One Missed Call", year: 2003 },
  // Modern / international ghost
  { title: "The Vigil", year: 2019 },
  { title: "His House", year: 2020 },
  { title: "The Power", year: 2021 },
  { title: "Attachment", year: 2022 },
  { title: "The Deeper You Dig", year: 2019 },
  { title: "I Trapped the Devil", year: 2019 },
  { title: "Verónica", year: 2017 },
  // Found-footage ghost
  { title: "Grave Encounters", year: 2011 },
  { title: "Grave Encounters 2", year: 2012 },
  { title: "Hell House LLC", year: 2015 },
  { title: "Hell House LLC II: The Abaddon Hotel", year: 2018 },
  { title: "Hell House LLC III: Lake of Fire", year: 2019 },
  { title: "Hell House LLC Origins: The Carmichael Manor", year: 2023 },
  // Paranormal Activity franchise
  { title: "Paranormal Activity", year: 2007 },
  { title: "Paranormal Activity 2", year: 2010 },
  { title: "Paranormal Activity 3", year: 2011 },
  { title: "Paranormal Activity 4", year: 2012 },
  { title: "Paranormal Activity: The Marked Ones", year: 2014 },
  { title: "Paranormal Activity: The Ghost Dimension", year: 2015 },
  // Blair Witch franchise
  { title: "The Blair Witch Project", year: 1999 },
  { title: "Book of Shadows: Blair Witch 2", year: 2000 },
  { title: "Blair Witch", year: 2016 },
  // Additional
  { title: "Absentia", year: 2011 },
  { title: "The Autopsy of Jane Doe", year: 2016 },
  { title: "Before I Wake", year: 2016 },
  { title: "Ouija", year: 2014 },
  { title: "Ouija: Origin of Evil", year: 2016 },
  { title: "The Boy", year: 2016 },
  { title: "Brahms: The Boy II", year: 2020 },
  { title: "Drag Me to Hell", year: 2009 },
  { title: "Smile", year: 2022 },
  { title: "Smile 2", year: 2024 },
  { title: "The Taking of Deborah Logan", year: 2014 },
  { title: "Bag of Bones", year: 2011 },
  { title: "Rose Red", year: 2002 },
  { title: "The Watcher in the Woods", year: 1980 },
];

const OCCULT_TITLES = [
  // Ari Aster / folk-occult
  { title: "Hereditary", year: 2018 },
  { title: "Midsommar", year: 2019 },
  { title: "The Witch", year: 2015 },
  { title: "Apostle", year: 2018 },
  // Satanic / demonic classics
  { title: "Rosemary's Baby", year: 1968 },
  { title: "The Omen", year: 1976 },
  { title: "Damien: Omen II", year: 1978 },
  { title: "The Final Conflict", year: 1981 },
  { title: "The Omen", year: 2006 },
  // Wicker Man franchise
  { title: "The Wicker Man", year: 1973 },
  { title: "The Wicker Man", year: 2006 },
  { title: "The Wicker Tree", year: 2011 },
  // Children of the Corn franchise
  { title: "Children of the Corn", year: 1984 },
  { title: "Children of the Corn II: The Final Sacrifice", year: 1992 },
  { title: "Children of the Corn III: Urban Harvest", year: 1995 },
  { title: "Children of the Corn", year: 2009 },
  { title: "Children of the Corn", year: 2020 },
  // British folk-occult
  { title: "Kill List", year: 2011 },
  { title: "Blood on Satan's Claw", year: 1971 },
  { title: "Witchfinder General", year: 1968 },
  // Italian occult-horror
  { title: "Suspiria", year: 1977 },
  { title: "Suspiria", year: 2018 },
  { title: "Inferno", year: 1980 },
  { title: "Phenomena", year: 1985 },
  // International occult
  { title: "Errementari: The Blacksmith and the Devil", year: 2017 },
  { title: "The Hallow", year: 2015 },
  { title: "Tigers Are Not Afraid", year: 2017 },
  { title: "Under the Shadow", year: 2016 },
  { title: "A Dark Song", year: 2016 },
  // Modern occult
  { title: "Haunt", year: 2019 },
  { title: "Consecration", year: 2023 },
  { title: "Men", year: 2022 },
  { title: "The Invitation", year: 2022 },
  { title: "Lamb", year: 2021 },
  { title: "The Green Knight", year: 2021 },
  { title: "Starry Eyes", year: 2014 },
  { title: "Baskin", year: 2015 },
  { title: "The Borderlands", year: 2013 },
  // Lovecraftian / ritual magic
  { title: "Dagon", year: 2001 },
  { title: "Necronomicon: Book of the Dead", year: 1993 },
  { title: "Cast a Deadly Spell", year: 1991 },
  // Warlock / Wishmaster
  { title: "Warlock", year: 1989 },
  { title: "Warlock: The Armageddon", year: 1993 },
  { title: "Wishmaster", year: 1997 },
  { title: "Wishmaster 2: Evil Never Dies", year: 1999 },
  // Creature-occult
  { title: "Pumpkinhead", year: 1988 },
  { title: "Trick 'r Treat", year: 2007 },
  // Carpenter occult
  { title: "Prince of Darkness", year: 1987 },
  { title: "In the Mouth of Madness", year: 1994 },
  // Exorcist franchise
  { title: "The Exorcist", year: 1973 },
  { title: "Exorcist II: The Heretic", year: 1977 },
  { title: "The Exorcist III", year: 1990 },
  { title: "The Exorcist: Believer", year: 2023 },
  // Demonic / possession
  { title: "Night of the Demons", year: 1988 },
  { title: "Demon Knight", year: 1995 },
  { title: "Shocker", year: 1989 },
  { title: "The First Power", year: 1990 },
  // Italian demonic
  { title: "Demons", year: 1985 },
  { title: "Demons 2", year: 1986 },
  { title: "The Church", year: 1989 },
  { title: "City of the Living Dead", year: 1980 },
  { title: "The House by the Cemetery", year: 1981 },
];

const ACTION_HORROR_TITLES = [
  // Alien franchise (excl. original Alien which is more pure Sci-Fi Horror)
  { title: "Aliens", year: 1986 },
  { title: "Alien 3", year: 1992 },
  { title: "Alien Resurrection", year: 1997 },
  { title: "Alien: Covenant", year: 2017 },
  { title: "Alien: Romulus", year: 2024 },
  // Predator franchise
  { title: "Predator", year: 1987 },
  { title: "Predator 2", year: 1990 },
  { title: "Predators", year: 2010 },
  { title: "The Predator", year: 2018 },
  { title: "Prey", year: 2022 },
  // Blade franchise
  { title: "Blade", year: 1998 },
  { title: "Blade II", year: 2002 },
  { title: "Blade: Trinity", year: 2004 },
  // From Dusk Till Dawn franchise
  { title: "From Dusk Till Dawn", year: 1996 },
  { title: "From Dusk Till Dawn 2: Texas Blood Money", year: 1999 },
  { title: "From Dusk Till Dawn 3: The Hangman's Daughter", year: 1999 },
  // Monster hunters / supernatural action
  { title: "Constantine", year: 2005 },
  { title: "Van Helsing", year: 2004 },
  // Underworld franchise
  { title: "Underworld", year: 2003 },
  { title: "Underworld: Evolution", year: 2006 },
  { title: "Underworld: Rise of the Lycans", year: 2009 },
  { title: "Underworld: Awakening", year: 2012 },
  { title: "Underworld: Blood Wars", year: 2016 },
  // Action-horror hybrids
  { title: "The Monster Squad", year: 1987 },
  { title: "Pitch Black", year: 2000 },
  { title: "Mayhem", year: 2017 },
  { title: "They Will Kill You", year: 2026 },
  { title: "Dog Soldiers", year: 2002 },
  { title: "Overlord", year: 2018 },
  { title: "Planet Terror", year: 2007 },
  { title: "Army of Darkness", year: 1992 },
  { title: "Evil Dead Rise", year: 2023 },
  // Home-invasion / hunt
  { title: "Ready or Not", year: 2019 },
  { title: "You're Next", year: 2011 },
  // Purge franchise
  { title: "The Purge: Anarchy", year: 2014 },
  { title: "The First Purge", year: 2018 },
  { title: "The Forever Purge", year: 2021 },
  // Survival action-horror
  { title: "Bone Tomahawk", year: 2015 },
  { title: "Abigail", year: 2024 },
  // MonsterVerse
  { title: "Kong: Skull Island", year: 2017 },
  { title: "Godzilla", year: 2014 },
  { title: "Godzilla: King of the Monsters", year: 2019 },
  // Post-apocalyptic action-horror
  { title: "Priest", year: 2011 },
  { title: "Stakeland", year: 2010 },
  { title: "30 Days of Night", year: 2007 },
  { title: "Wyrmwood: Road of the Dead", year: 2014 },
  { title: "Dead Snow", year: 2009 },
  { title: "Dead Snow 2: Red vs. Dead", year: 2014 },
];

// ── DB Helpers ─────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function dbGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}: ${await res.text()}`);
  return res.json();
}

async function dbPatch(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method: "PATCH",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} → ${res.status}: ${await res.text()}`);
}

// Search by exact case-insensitive title + year, trying movie then TV.
async function findTitle(title, year) {
  for (const mediaType of ["movie", "tv"]) {
    const rows = await dbGet(
      `/titles?title=ilike.${encodeURIComponent(title)}&release_year=eq.${year}&media_type=eq.${mediaType}&select=id,title,release_year,subgenres,media_type`
    );
    if (rows?.[0]) return rows[0];
  }
  return null;
}

// ── Main ───────────────────────────────────────────────────────────────────────

const BATCHES = [
  { tag: "Ghost", titles: GHOST_TITLES },
  { tag: "Occult", titles: OCCULT_TITLES },
  { tag: "Action-Horror", titles: ACTION_HORROR_TITLES },
];

const results = { added: [], already_tagged: [], not_found: [], errors: [] };

for (const { tag, titles } of BATCHES) {
  console.log(`\n── Adding "${tag}" tag (${titles.length} titles) ${"─".repeat(40)}`);

  for (const { title, year } of titles) {
    process.stdout.write(`  ${title} (${year})... `);
    await sleep(50);

    try {
      const row = await findTitle(title, year);

      if (!row) {
        console.log("NOT FOUND — skipped");
        results.not_found.push(`[${tag}] ${title} (${year})`);
        continue;
      }

      const current = row.subgenres ?? [];

      if (current.includes(tag)) {
        console.log(`already tagged — skipped`);
        results.already_tagged.push(`[${tag}] ${row.title} (${year})`);
        continue;
      }

      const updated = [...current, tag];
      await dbPatch(`/titles?id=eq.${row.id}`, { subgenres: updated });
      console.log(`ADDED → [${updated.join(", ")}]`);
      results.added.push(`[${tag}] ${row.title} (${year})`);

    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      results.errors.push(`[${tag}] ${title} (${year}): ${err.message}`);
    }
  }
}

// ── Summary ────────────────────────────────────────────────────────────────────

console.log("\n\n── SUMMARY ──────────────────────────────────────────────────────────────");

console.log(`\nTag added (${results.added.length}):`);
results.added.forEach((t) => console.log(`  ✓ ${t}`));

console.log(`\nAlready tagged (${results.already_tagged.length}):`);
results.already_tagged.forEach((t) => console.log(`  · ${t}`));

console.log(`\nNot found — skipped (${results.not_found.length}):`);
results.not_found.forEach((t) => console.log(`  ✗ ${t}`));

if (results.errors.length) {
  console.log(`\nErrors (${results.errors.length}):`);
  results.errors.forEach((t) => console.log(`  ! ${t}`));
}

const total = results.added.length + results.already_tagged.length + results.not_found.length + results.errors.length;
console.log(`\nProcessed: ${total} | Added: ${results.added.length} | Skipped: ${results.already_tagged.length} | Not found: ${results.not_found.length}`);
