"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminImportTitle } from "@/app/actions/admin";

const ALL_SUBGENRES = [
  "Slasher", "Supernatural", "Found Footage", "Body Horror",
  "Comedy Horror", "Sci-Fi Horror", "Creature Feature", "Folk Horror",
  "Zombie", "Vampire", "Werewolf", "Cult Classic",
];

interface TMDBResult {
  tmdb_id: number;
  title: string;
  release_year: number | null;
  poster_path: string | null;
  overview: string | null;
}

export function TMDBSearchForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");
  const [results, setResults] = useState<TMDBResult[]>([]);
  const [selected, setSelected] = useState<TMDBResult | null>(null);
  const [subgenres, setSubgenres] = useState<string[]>([]);
  const [score, setScore] = useState("70");
  const [searching, setSearching] = useState(false);
  const [importing, startImport] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    setSelected(null);
    const res = await fetch(`/api/admin/tmdb-search?q=${encodeURIComponent(query)}&type=${mediaType}`);
    const json = await res.json();
    setResults(json.results ?? []);
    setSearching(false);
  }

  function toggleSubgenre(sg: string) {
    setSubgenres(prev => prev.includes(sg) ? prev.filter(s => s !== sg) : [...prev, sg]);
  }

  function handleImport() {
    if (!selected) return;
    setError(null);
    startImport(async () => {
      const res = await adminImportTitle(selected.tmdb_id, mediaType, subgenres, parseInt(score, 10));
      if (res?.error) setError(res.error);
      else router.push("/admin/titles");
    });
  }

  return (
    <div className="space-y-5">
      {/* Search */}
      <div>
        <label className="block text-xs text-muted uppercase tracking-wider mb-1.5">Media Type</label>
        <div className="flex gap-4 mb-3">
          {(["movie", "tv"] as const).map(mt => (
            <label key={mt} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value={mt} checked={mediaType === mt} onChange={() => { setMediaType(mt); setResults([]); setSelected(null); }} className="accent-green-spooky" />
              <span className="text-sm text-specter">{mt === "tv" ? "TV" : "Movie"}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Search TMDB..."
            className="flex-1 px-3 py-2 bg-crypt border border-shadow rounded-lg text-ghost text-sm focus:outline-none focus:border-green-spooky placeholder-muted"
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-4 py-2 bg-purple-deep text-ghost text-sm font-medium rounded-lg hover:bg-purple-mid transition-colors disabled:opacity-50"
          >
            {searching ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && !selected && (
        <div className="space-y-2">
          <p className="text-xs text-muted uppercase tracking-wider">Select a result</p>
          {results.map(r => (
            <button
              key={r.tmdb_id}
              onClick={() => setSelected(r)}
              className="w-full flex items-center gap-3 p-3 bg-tomb border border-shadow rounded-lg hover:border-green-spooky transition-colors text-left"
            >
              {r.poster_path ? (
                <img src={`https://image.tmdb.org/t/p/w92${r.poster_path}`} alt="" className="w-10 h-15 object-cover rounded flex-shrink-0" />
              ) : (
                <div className="w-10 h-14 bg-shadow rounded flex items-center justify-center text-muted text-xs flex-shrink-0">?</div>
              )}
              <div className="min-w-0">
                <p className="text-ghost font-medium text-sm">{r.title}</p>
                <p className="text-muted text-xs">{r.release_year ?? "Unknown year"}</p>
                {r.overview && <p className="text-specter text-xs mt-0.5 line-clamp-2">{r.overview}</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected title — configure and import */}
      {selected && (
        <div className="space-y-5">
          <div className="flex items-start gap-4 p-4 bg-tomb border border-green-spooky/30 rounded-xl">
            {selected.poster_path && (
              <img src={`https://image.tmdb.org/t/p/w92${selected.poster_path}`} alt="" className="w-14 rounded" />
            )}
            <div>
              <p className="text-ghost font-display text-lg">{selected.title}</p>
              <p className="text-muted text-sm">{selected.release_year ?? "Unknown year"} · TMDB #{selected.tmdb_id}</p>
              <button onClick={() => setSelected(null)} className="text-xs text-muted hover:text-specter mt-1 transition-colors">← Change selection</button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted uppercase tracking-wider mb-1.5">Critic Score</label>
            <input
              type="number"
              min={0}
              max={100}
              value={score}
              onChange={e => setScore(e.target.value)}
              className="w-32 px-3 py-2 bg-crypt border border-shadow rounded-lg text-ghost text-sm focus:outline-none focus:border-green-spooky"
            />
          </div>

          <div>
            <label className="block text-xs text-muted uppercase tracking-wider mb-1.5">Subgenres</label>
            <div className="flex flex-wrap gap-2">
              {ALL_SUBGENRES.map(sg => (
                <button
                  key={sg}
                  type="button"
                  onClick={() => toggleSubgenre(sg)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${subgenres.includes(sg) ? "bg-green-spooky text-void" : "bg-shadow text-specter hover:text-ghost"}`}
                >
                  {sg}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            onClick={handleImport}
            disabled={importing}
            className="px-5 py-2 bg-green-spooky text-void font-bold text-sm rounded-lg hover:bg-green-dark transition-colors disabled:opacity-50"
          >
            {importing ? "Importing..." : "Import to Crypt"}
          </button>
        </div>
      )}
    </div>
  );
}
