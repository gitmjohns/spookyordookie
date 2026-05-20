"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const SORT_OPTIONS_MOVIE = [
  { key: "critic", label: "Critic Score" },
  { key: "rating", label: "Fan Rating" },
  { key: "newest", label: "Newest" },
  { key: "alpha-asc", label: "A → Z" },
  { key: "alpha-desc", label: "Z → A" },
];

const SORT_OPTIONS_TV = [
  { key: "critic", label: "Critic Score" },
  { key: "rating", label: "Fan Rating" },
  { key: "newest", label: "Newest" },
  { key: "alpha-asc", label: "A → Z" },
  { key: "alpha-desc", label: "Z → A" },
];

const DECADES = [
  { key: "", label: "All" },
  { key: "1970", label: "70s" },
  { key: "1980", label: "80s" },
  { key: "1990", label: "90s" },
  { key: "2000", label: "00s" },
  { key: "2010", label: "10s" },
  { key: "2020", label: "20s" },
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
    sort: searchParams.get("sort") ?? "critic",
    decade: searchParams.get("decade") ?? "",
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

  const sortOptions = mediaType === "movie" ? SORT_OPTIONS_MOVIE : SORT_OPTIONS_TV;

  const pillBase = "flex-shrink-0 px-3 py-2 rounded-full text-sm font-medium transition-colors";
  const pillActive = "bg-purple-mid text-ghost";
  const pillInactive = "bg-shadow text-specter hover:text-ghost hover:bg-purple-deep";

  return (
    <div className="space-y-2 mb-5">
      {/* Genre pills + sort dropdown */}
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

        {/* Sort — pinned at the end of the scroll row */}
        <div className="flex-shrink-0 ml-1">
          <select
            value={current.sort}
            onChange={(e) => update({ sort: e.target.value })}
            className="px-3 py-2 rounded-full text-sm font-medium bg-shadow text-specter border border-shadow/60 hover:border-purple-mid focus:outline-none focus:border-green-spooky cursor-pointer"
          >
            {sortOptions.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Decade pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="flex-shrink-0 text-xs text-muted uppercase tracking-wider">Decade:</span>
        {DECADES.map((d) => (
          <button
            key={d.key}
            onClick={() => update({ decade: d.key })}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              current.decade === d.key ? pillActive : pillInactive
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}
