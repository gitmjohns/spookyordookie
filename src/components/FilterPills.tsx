"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const SORT_OPTIONS = [
  { key: "top-rated", label: "Top Rated" },
  { key: "low-rated", label: "Low Rated" },
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "alpha-asc", label: "A - Z" },
  { key: "alpha-desc", label: "Z - A" },
];

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

interface FilterPillsProps {
  mediaType: "movie" | "tv";
}

export function FilterPills({ mediaType }: FilterPillsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const activeGenre = searchParams.get("genre") ?? searchParams.get("subgenre") ?? "";
  const current = {
    sort: searchParams.get("sort") ?? "top-rated",
    genre: activeGenre,
  };

  function update(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if ("genre" in updates) params.delete("subgenre");
    for (const [k, v] of Object.entries(updates)) {
      if (v === "") params.delete(k);
      else params.set(k, v);
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  const sortOptions = SORT_OPTIONS;

  const pillBase = "font-label flex-shrink-0 px-3 py-2 rounded-full text-sm font-medium transition-colors";
  const pillActive = "bg-purple-mid text-ghost";
  const pillInactive = "bg-shadow text-specter hover:text-ghost hover:bg-purple-deep";

  return (
    <div className="space-y-2 mb-5">
      {/* Sort By — dedicated row, always fully visible without scrolling */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex-shrink-0 text-xs text-muted uppercase tracking-wider">Sort:</span>
        {sortOptions.map((s) => (
          <button
            key={s.key}
            onClick={() => update({ sort: s.key })}
            className={`font-label flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              current.sort === s.key ? pillActive : pillInactive
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Genre pills row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => update({ genre: "" })}
          className={`${pillBase} ${current.genre === "" ? pillActive : pillInactive}`}
        >
          All
        </button>
        {HORROR_GENRES.map((g) => (
          <button
            key={g}
            onClick={() => update({ genre: current.genre === g ? "" : g })}
            className={`${pillBase} ${current.genre === g ? pillActive : pillInactive}`}
          >
            {g}
          </button>
        ))}
      </div>
    </div>
  );
}
