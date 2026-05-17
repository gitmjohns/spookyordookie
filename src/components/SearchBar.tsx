"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { tmdbImageUrl } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  poster_path: string | null;
  release_year: number | null;
  critic_score: number;
  media_type: "movie" | "tv";
}

interface SearchBarProps {
  placeholder?: string;
  className?: string;
}

export function SearchBar({ placeholder = "Search titles...", className = "" }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    setHighlighted(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(() => search(q.trim()), 220);
  }

  function navigate(result: SearchResult) {
    const path = result.media_type === "movie" ? "movies" : "tv";
    router.push(`/${path}/${result.id}`);
    setQuery("");
    setOpen(false);
    setResults([]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, -1));
    } else if (e.key === "Enter") {
      if (highlighted >= 0 && results[highlighted]) navigate(results[highlighted]);
      else if (results.length > 0) navigate(results[0]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  const scoreColor =
    (s: number) => s >= 75 ? "text-green-spooky" : s >= 45 ? "text-dookie-light" : "text-dookie";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2 bg-shadow border border-purple-deep rounded-lg text-sm text-ghost placeholder:text-muted focus:outline-none focus:border-green-spooky focus:ring-1 focus:ring-green-spooky/30 transition-colors"
          autoComplete="off"
          spellCheck={false}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-purple-mid border-t-green-spooky rounded-full animate-spin" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-tomb border border-shadow rounded-lg shadow-2xl z-[200] overflow-hidden max-h-[400px] overflow-y-auto">
          {results.map((r, i) => {
            const posterUrl = tmdbImageUrl(r.poster_path, "w185");
            return (
              <button
                key={r.id}
                onMouseDown={() => navigate(r)}
                onMouseEnter={() => setHighlighted(i)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b border-shadow/50 last:border-0 ${
                  highlighted === i ? "bg-shadow" : "hover:bg-shadow/60"
                }`}
              >
                <div className="w-8 h-12 flex-shrink-0 bg-shadow/80 rounded overflow-hidden relative">
                  {posterUrl ? (
                    <Image
                      src={posterUrl}
                      alt={r.title}
                      fill
                      sizes="32px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted text-xs font-display">?</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-ghost text-sm font-medium truncate leading-tight">{r.title}</p>
                  <p className="text-muted text-xs mt-0.5">
                    {r.release_year ?? "—"}&nbsp;&middot;&nbsp;{r.media_type === "tv" ? "TV" : "Movie"}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className={`text-xs font-bold tabular-nums ${scoreColor(r.critic_score)}`}>
                    {r.critic_score}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
