"use client";

import { useState, useTransition } from "react";
import { toggleWatchlist } from "@/app/actions/watchlist";
import { cn } from "@/lib/utils";

interface WatchlistButtonProps {
  titleId: string;
  initialInList: boolean;
  isLoggedIn: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function WatchlistButton({
  titleId,
  initialInList,
  isLoggedIn,
  size = "sm",
  className,
}: WatchlistButtonProps) {
  const [inList, setInList] = useState(initialInList);
  const [isPending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      window.location.href = "/auth/login";
      return;
    }

    startTransition(async () => {
      setInList((v) => !v);
      await toggleWatchlist(titleId, inList);
    });
  }

  if (size === "sm") {
    return (
      <button
        onClick={handleClick}
        disabled={isPending}
        title={inList ? "Remove from Watchlist" : "Add to Watchlist"}
        className={cn(
          "flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200",
          inList
            ? "bg-green-spooky text-void"
            : "bg-void/70 text-ghost hover:bg-purple-mid border border-shadow",
          "backdrop-blur-sm",
          className
        )}
      >
        {inList ? (
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 3a2 2 0 00-2 2v16l7-3 7 3V5a2 2 0 00-2-2H5z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3a2 2 0 00-2 2v16l7-3 7 3V5a2 2 0 00-2-2H5z" />
          </svg>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200",
        inList
          ? "bg-green-spooky text-void"
          : "bg-tomb border border-shadow text-specter hover:border-purple-mid hover:text-ghost",
        className
      )}
    >
      {inList ? (
        <>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 3a2 2 0 00-2 2v16l7-3 7 3V5a2 2 0 00-2-2H5z" />
          </svg>
          On Watchlist
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3a2 2 0 00-2 2v16l7-3 7 3V5a2 2 0 00-2-2H5z" />
          </svg>
          Add to Watchlist
        </>
      )}
    </button>
  );
}
