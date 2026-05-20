"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { markWatched, toggleWatchlist } from "@/app/actions/watchlist";
import { tmdbImageUrl, getRatingColor } from "@/lib/utils";

interface WatchlistCardProps {
  entry: {
    id: string;
    title_id: string;
    watched: boolean;
    watched_at: string | null;
    created_at: string;
  };
  title: {
    id: string;
    title: string;
    poster_path: string | null;
    release_year: number | null;
    critic_score: number;
    media_type: string;
  };
}

export function WatchlistCard({ entry, title }: WatchlistCardProps) {
  const router = useRouter();
  const [watched, setWatched] = useState(entry.watched);
  const [removed, setRemoved] = useState(false);
  const [watchPending, startWatchTransition] = useTransition();
  const [removePending, startRemoveTransition] = useTransition();

  const posterUrl = tmdbImageUrl(title.poster_path, "w185");
  const titleHref = `/${title.media_type === "movie" ? "movies" : "tv"}/${title.id}`;
  const scoreColor = getRatingColor(title.critic_score / 10);

  function handleWatchToggle() {
    const newWatched = !watched;
    setWatched(newWatched);
    startWatchTransition(async () => {
      await markWatched(entry.title_id, newWatched);
      router.refresh();
    });
  }

  function handleRemove() {
    setRemoved(true);
    startRemoveTransition(async () => {
      await toggleWatchlist(entry.title_id, true);
      router.refresh();
    });
  }

  if (removed) return null;

  return (
    <div className="flex items-center gap-3 p-3 bg-tomb border border-shadow rounded-lg hover:border-purple-mid transition-colors">
      {/* Poster */}
      <Link href={titleHref} className="shrink-0">
        <div className="relative w-12 h-[68px] rounded overflow-hidden bg-shadow">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={title.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              💀
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link
          href={titleHref}
          className="text-sm font-medium text-ghost hover:text-green-spooky transition-colors truncate block"
        >
          {title.title}
        </Link>
        <div className="flex items-center gap-2 mt-0.5">
          {title.release_year && (
            <span className="text-xs text-muted">{title.release_year}</span>
          )}
          <span
            className="text-xs font-bold px-1.5 py-0.5 rounded text-void"
            style={{ backgroundColor: scoreColor }}
          >
            {title.critic_score}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleWatchToggle}
          disabled={watchPending}
          title={watched ? "Watched" : "Mark as watched"}
          className="flex items-center gap-1.5 text-xs transition-colors disabled:opacity-50"
        >
          {watched ? (
            <>
              <svg
                className="w-4 h-4 text-green-spooky"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden md:inline text-green-spooky">Watched</span>
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 text-muted hover:text-specter"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
              <span className="hidden md:inline text-muted">Mark watched</span>
            </>
          )}
        </button>

        <button
          onClick={handleRemove}
          disabled={removePending}
          title="Remove from watchlist"
          className="p-1 text-muted hover:text-dookie-light transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
