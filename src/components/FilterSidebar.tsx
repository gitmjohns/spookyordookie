"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

const SORT_OPTIONS = [
  { key: "top-rated", label: "Top Rated" },
  { key: "low-rated", label: "Low Rated" },
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "alpha-asc", label: "A - Z" },
  { key: "alpha-desc", label: "Z - A" },
];

const DECADES = [
  { key: "", label: "All Decades" },
  { key: "1970", label: "1970s" },
  { key: "1980", label: "1980s" },
  { key: "1990", label: "1990s" },
  { key: "2000", label: "2000s" },
  { key: "2010", label: "2010s" },
  { key: "2020", label: "2020s" },
];

// Horror-specific genre categories (maps to subgenres column)
const HORROR_GENRES = [
  "Slasher",
  "Supernatural",
  "Found Footage",
  "Body Horror",
  "Comedy Horror",
  "Sci-Fi Horror",
  "Creature Feature",
  "Folk Horror",
  "Zombie",
  "Vampire",
  "Werewolf",
  "Ghost",
  "Action-Horror",
  "Occult",
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted mb-2 px-1 border-b border-shadow pb-2">
        {title}
      </h3>
      <div className="space-y-0.5 mt-2">{children}</div>
    </div>
  );
}

function Btn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`font-display w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
        active ? "bg-purple-mid text-ghost font-medium" : "text-specter hover:bg-shadow hover:text-ghost"
      }`}
    >
      {children}
    </button>
  );
}

interface FilterSidebarProps {
  mediaType: "movie" | "tv";
}

export function FilterSidebar({ mediaType }: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [userExpanded, setUserExpanded] = useState(false);

  // Read genre from either ?genre= (canonical) or legacy ?subgenre=
  const activeGenre = searchParams.get("genre") ?? searchParams.get("subgenre") ?? "";

  const current = {
    sort: searchParams.get("sort") ?? "top-rated",
    decade: searchParams.get("decade") ?? "",
    genre: activeGenre,
  };

  function update(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    // Always wipe the legacy subgenre param when genre changes so reset works cleanly
    if ("genre" in updates) params.delete("subgenre");
    for (const [k, v] of Object.entries(updates)) {
      if (v === "") params.delete(k);
      else params.set(k, v);
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  const sortOptions = SORT_OPTIONS;
  // Auto-expand the list when the active genre lives beyond the first 6 rows
  const activeGenreIdx = HORROR_GENRES.indexOf(activeGenre);
  const showAllGenres = userExpanded || activeGenreIdx >= 6;
  const visibleGenres = showAllGenres ? HORROR_GENRES : HORROR_GENRES.slice(0, 6);

  return (
    <aside className="hidden md:block w-48 shrink-0 space-y-6">
      <Section title="Sort By">
        {sortOptions.map((s) => (
          <Btn key={s.key} active={current.sort === s.key} onClick={() => update({ sort: s.key })}>
            {s.label}
          </Btn>
        ))}
      </Section>

      <Section title="Genre">
        <Btn active={current.genre === ""} onClick={() => update({ genre: "" })}>
          All Genres
        </Btn>
        {visibleGenres.map((g) => (
          <Btn
            key={g}
            active={current.genre === g}
            onClick={() => update({ genre: current.genre === g ? "" : g })}
          >
            {g}
          </Btn>
        ))}
        <button
          onClick={() => setUserExpanded((v) => !v)}
          className="w-full text-left px-3 py-1.5 text-xs font-bold text-muted hover:text-green-spooky transition-colors mt-0.5"
        >
          {showAllGenres ? "↑ Show Less" : `+ ${HORROR_GENRES.length - 6} More`}
        </button>
      </Section>

      <Section title="Decade">
        {DECADES.map((d) => (
          <Btn key={d.key} active={current.decade === d.key} onClick={() => update({ decade: d.key })}>
            {d.label}
          </Btn>
        ))}
      </Section>
    </aside>
  );
}
