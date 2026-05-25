export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { WatchlistCard } from "@/components/WatchlistCard";

export const metadata = { title: "My Watchlist — Spooky or Dookie" };

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function WatchlistPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const params = await searchParams;
  const sort = params.sort ?? "date";

  const { data: watchlistRows } = await supabase
    .from("watchlist")
    .select("*")
    .eq("user_id", user.id);

  const titleIds = (watchlistRows ?? []).map((w: { title_id: string }) => w.title_id);

  let titlesData: {
    id: string;
    title: string;
    poster_path: string | null;
    release_year: number | null;
    critic_score: number;
    rating_avg: number;
    rating_count: number;
    media_type: string;
  }[] = [];

  if (titleIds.length > 0) {
    const { data } = await supabase
      .from("titles")
      .select("id,title,poster_path,release_year,critic_score,rating_avg,rating_count,media_type")
      .in("id", titleIds);
    titlesData = (data ?? []) as typeof titlesData;
  }

  const titleMap = Object.fromEntries(titlesData.map((t) => [t.id, t]));

  type EntryWithTitle = {
    id: string;
    title_id: string;
    watched: boolean;
    watched_at: string | null;
    created_at: string;
    title: (typeof titlesData)[number];
  };

  const enriched: EntryWithTitle[] = (watchlistRows ?? [])
    .filter((w: { title_id: string }) => titleMap[w.title_id])
    .map((w: { id: string; title_id: string; watched: boolean; watched_at: string | null; created_at: string }) => ({
      ...w,
      title: titleMap[w.title_id],
    }));

  // Apply sort
  const sorted = [...enriched].sort((a, b) => {
    if (sort === "title") {
      return a.title.title.localeCompare(b.title.title);
    }
    if (sort === "score") {
      const combined = (t: typeof enriched[number]["title"]) =>
        t.rating_count > 0 ? t.critic_score * 0.4 + t.rating_avg * 0.6 : t.critic_score;
      return combined(b.title) - combined(a.title);
    }
    // date (default): newest first
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const wantToWatch = sorted.filter((e) => !e.watched);
  const alreadyWatched = sorted.filter((e) => e.watched);

  const sortLinks = [
    { label: "Date Added", value: "date" },
    { label: "Title A-Z", value: "title" },
    { label: "Score", value: "score" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-display text-4xl text-ghost">My Watchlist</h1>
      </div>
      <p className="text-muted text-sm mb-6">
        <span className="text-specter font-medium">{wantToWatch.length}</span> want to watch
        {alreadyWatched.length > 0 && (
          <>
            {" · "}
            <span className="text-specter font-medium">{alreadyWatched.length}</span> watched
          </>
        )}
      </p>

      {/* Sort controls */}
      {enriched.length > 0 && (
        <div className="flex gap-2 mb-8">
          {sortLinks.map((s) => (
            <Link
              key={s.value}
              href={`/watchlist?sort=${s.value}`}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                sort === s.value
                  ? "bg-green-spooky text-void"
                  : "bg-tomb text-specter border border-shadow hover:border-purple-mid hover:text-ghost"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      )}

      {enriched.length === 0 ? (
        <div className="text-center py-24">
          <p className="font-display text-3xl text-muted">Nothing here yet</p>
          <p className="text-sm text-muted mt-2">
            Browse{" "}
            <a href="/movies" className="text-green-spooky hover:underline">movies</a> or{" "}
            <a href="/tv" className="text-green-spooky hover:underline">TV shows</a> and add titles to your watchlist.
          </p>
        </div>
      ) : (
        <>
          {/* Want to Watch */}
          {wantToWatch.length > 0 && (
            <section className="mb-10">
              <h2 className="font-display text-2xl text-ghost mb-4">
                Want to Watch{" "}
                <span className="text-muted text-lg">({wantToWatch.length})</span>
              </h2>
              <div className="space-y-2">
                {wantToWatch.map((e) => (
                  <WatchlistCard key={e.id} entry={e} title={e.title} />
                ))}
              </div>
            </section>
          )}

          {/* Already Watched */}
          {alreadyWatched.length > 0 && (
            <section>
              <h2 className="font-display text-2xl text-ghost mb-4">
                Already Watched{" "}
                <span className="text-muted text-lg">({alreadyWatched.length})</span>
              </h2>
              <div className="space-y-2">
                {alreadyWatched.map((e) => (
                  <WatchlistCard key={e.id} entry={e} title={e.title} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
