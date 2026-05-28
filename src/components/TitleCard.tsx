import Link from "next/link";
import { tmdbImageUrl, getRatingColor, tieredCombinedScore } from "@/lib/utils";
import { WatchlistButton } from "@/components/WatchlistButton";
import type { Title } from "@/lib/types";

interface TitleCardProps {
  title: Title;
  inWatchlist?: boolean;
  isLoggedIn?: boolean;
}

export function TitleCard({ title, inWatchlist, isLoggedIn }: TitleCardProps) {
  const href = title.media_type === "movie" ? `/movies/${title.id}` : `/tv/${title.id}`;
  const posterUrl = tmdbImageUrl(title.poster_path, "w342");
  const displayScore = Math.round(tieredCombinedScore(title.critic_score, title.rating_avg, title.rating_count));
  const scoreColor = getRatingColor(displayScore);

  return (
    <Link href={href} className="group block h-full">
      <div className="h-full flex flex-col overflow-hidden rounded-lg bg-tomb border border-shadow hover:border-purple-mid transition-all duration-300 hover:shadow-lg hover:shadow-purple-deep/30 hover:-translate-y-1">
        <div className="aspect-[2/3] relative bg-shadow flex-shrink-0">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={title.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted">
              <span className="font-display text-4xl">?</span>
            </div>
          )}

          <div
            className="font-display absolute top-2 right-2 px-2 py-0.5 rounded-md text-xs font-bold text-void"
            style={{ backgroundColor: scoreColor }}
          >
            {displayScore}
          </div>

          {inWatchlist !== undefined && (
            <div className="absolute bottom-2 right-2">
              <WatchlistButton
                titleId={title.id}
                initialInList={inWatchlist}
                isLoggedIn={!!isLoggedIn}
                size="sm"
              />
            </div>
          )}
        </div>

        <div className="p-3 flex-1">
          <h3 className="text-sm font-medium text-ghost group-hover:text-green-spooky transition-colors line-clamp-2 leading-tight">
            {title.title}
          </h3>
          <div className="mt-1">
            <span className="text-xs text-muted">{title.release_year}</span>
          </div>
          {title.subgenres && title.subgenres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {title.subgenres.slice(0, 2).map((s) => (
                <span key={s} className="text-xs text-muted/70 bg-shadow/60 px-1.5 py-0.5 rounded">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
