export const dynamic = "force-dynamic";

import { TitleCard } from "@/components/TitleCard";
import { FilterSidebar } from "@/components/FilterSidebar";
import { FilterPills } from "@/components/FilterPills";
import { Pagination } from "@/components/Pagination";
import { getTV, getWatchlistIds, getCurrentUser } from "@/lib/data";

export const metadata = { title: "Serial Spooks: TV — SpookyorDookie" };

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function TVPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = 42;

  const [{ titles, count }, user, watchlistIds] = await Promise.all([
    getTV({ page, limit, sort: params.sort ?? "critic", genre: params.genre ?? params.subgenre, decade: params.decade }),
    getCurrentUser(),
    getWatchlistIds(),
  ]);
  const totalPages = Math.ceil(count / limit);
  const sortLabel =
    params.sort === "rating" ? "Fan Rating"
    : params.sort === "newest" ? "Newest"
    : params.sort === "alpha-asc" ? "A → Z"
    : params.sort === "alpha-desc" ? "Z → A"
    : "Critic Score";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl text-ghost">Serial Spooks: TV</h1>
        <p className="text-muted text-sm mt-1">{count} titles &middot; sorted by {sortLabel}</p>
      </div>

      {/* Mobile filter pills — hidden on desktop */}
      <div className="md:hidden">
        <FilterPills mediaType="tv" />
      </div>

      <div className="flex gap-8">
        <FilterSidebar mediaType="tv" />

        <div className="flex-1 min-w-0">
          {titles.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {titles.map((t) => <TitleCard key={t.id} title={t} inWatchlist={watchlistIds.has(t.id)} isLoggedIn={!!user} />)}
            </div>
          ) : (
            <div className="text-center py-24 text-muted">
              <p className="font-display text-3xl">No matches</p>
              <p className="mt-2 text-sm">Try adjusting your filters.</p>
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} basePath="/tv" params={params} />
        </div>
      </div>
    </div>
  );
}
