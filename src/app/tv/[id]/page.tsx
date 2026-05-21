export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { RatingSlider } from "@/components/RatingSlider";
import { CommentSection } from "@/components/CommentSection";
import { ScrollReset } from "@/components/ScrollReset";
import { WatchlistButton } from "@/components/WatchlistButton";
import { TitleCard } from "@/components/TitleCard";
import { DebateThread } from "@/components/DebateThread";
import { tmdbImageUrl, getRatingColor, getRatingLabel } from "@/lib/utils";
import {
  getTitleById, getComments, getUserRating, getCurrentUser,
  getSimilarTitles, getWatchlistIds, getDebateThread, getDebateReplies,
} from "@/lib/data";

interface PageProps { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const title = await getTitleById(id, "tv");
  if (!title) return { title: "Not Found" };
  return { title: `${title.title} — SpookyorDookie`, description: title.overview ?? undefined };
}

export default async function TVDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [title, user] = await Promise.all([getTitleById(id, "tv"), getCurrentUser()]);
  if (!title) notFound();

  const [comments, userRating, similar, watchlistIds, debateThread, profile] = await Promise.all([
    getComments(id, user?.id),
    getUserRating(id),
    getSimilarTitles(id, title.subgenres ?? [], title.critic_score, "tv", 6, title.release_year),
    user ? getWatchlistIds() : Promise.resolve(new Set<string>()),
    getDebateThread(id),
    user ? (async () => {
      const { createClient } = await import("@/lib/supabase/server");
      const s = await createClient();
      const { data } = await s.from("profiles").select("username,avatar_emoji,avatar_bg").eq("id", user.id).single();
      return data;
    })() : Promise.resolve(null),
  ]);

  const debateReplies = debateThread ? await getDebateReplies(debateThread.id) : [];

  const backdropUrl = tmdbImageUrl(title.backdrop_path, "w780");
  const posterUrl = tmdbImageUrl(title.poster_path, "w342");

  const hasRatings = title.rating_count > 0;
  const overallScore = Math.round(hasRatings ? title.critic_score * 0.4 + title.rating_avg * 0.6 : title.critic_score);
  const overallColor = getRatingColor(overallScore);
  const overallLabel = getRatingLabel(overallScore);
  const criticColor = getRatingColor(title.critic_score);
  const fanColor = hasRatings ? getRatingColor(title.rating_avg) : "#7c6a9e";

  return (
    <div>
      <ScrollReset />
      {backdropUrl && (
        <div className="relative h-52 sm:h-64 overflow-hidden">
          <img src={backdropUrl} alt={title.title} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-void via-void/50 to-transparent" />
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex gap-4 sm:gap-6 -mt-14 relative z-10 mb-8 items-start">
          {posterUrl && (
            <div className="shrink-0 pt-16 sm:pt-16">
              <div className="w-28 sm:w-40 rounded-xl overflow-hidden border-2 border-shadow shadow-2xl shadow-void">
                <img src={posterUrl} alt={title.title} width={160} height={240} className="w-full" />
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0 pt-16 sm:pt-16">
            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-purple-deep text-specter text-xs rounded uppercase tracking-wider">TV Series</span>
                  {(title.subgenres ?? []).slice(0, 3).map((g) => (
                    <span key={g} className="px-2 py-0.5 bg-shadow text-muted text-xs rounded">{g}</span>
                  ))}
                </div>
                <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-ghost leading-tight">{title.title}</h1>
                {title.release_year && <p className="text-muted mt-1 text-sm">{title.release_year}</p>}
                {title.overview && <p className="text-specter text-sm mt-3 leading-relaxed line-clamp-4">{title.overview}</p>}
                <div className="mt-3">
                  <WatchlistButton
                    titleId={id}
                    initialInList={watchlistIds.has(id)}
                    isLoggedIn={!!user}
                    size="md"
                  />
                </div>
              </div>

              <div className="md:w-52 shrink-0">
                <div className="bg-tomb border border-shadow rounded-2xl p-4 space-y-3">
                  <div className="text-center pb-3 border-b border-shadow">
                    <div className="text-xs text-muted uppercase tracking-wider mb-1">Overall Score</div>
                    <div className="font-display text-2xl leading-tight" style={{ color: overallColor }}>{overallLabel}</div>
                    <div className="text-5xl font-black leading-none mt-1" style={{ color: overallColor }}>
                      {overallScore}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center">
                      <div className="text-xs text-muted uppercase tracking-wider mb-0.5">Critic</div>
                      <div className="text-xl font-bold" style={{ color: criticColor }}>
                        {title.critic_score}<span className="text-xs text-muted font-normal">/100</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted uppercase tracking-wider mb-0.5">
                        Fan{hasRatings ? ` (${title.rating_count})` : ""}
                      </div>
                      <div className="text-xl font-bold" style={{ color: fanColor }}>
                        {hasRatings ? Math.round(title.rating_avg) : "—"}<span className="text-xs text-muted font-normal">/100</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-purple-deep bg-shadow p-6 sm:p-8 mb-8">
          <h2 className="font-display text-2xl text-ghost mb-4">Is it Spooky or Dookie?</h2>
          {user ? (
            <RatingSlider titleId={id} initialScore={userRating} />
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted mb-4">Sign in to add your rating</p>
              <a href="/auth/login" className="inline-block px-8 py-2.5 bg-purple-mid hover:bg-purple-light text-ghost font-medium rounded-xl transition-colors">Sign in to rate</a>
            </div>
          )}
        </div>

        {debateThread && (
          <DebateThread
            threadId={debateThread.id}
            prompt={debateThread.prompt}
            initialReplies={debateReplies as never[]}
            isLoggedIn={!!user}
            currentUsername={profile?.username}
            currentEmoji={profile?.avatar_emoji}
            currentAvatarBg={(profile as any)?.avatar_bg}
            currentUserId={user?.id}
          />
        )}

        <CommentSection titleId={id} initialComments={comments} isLoggedIn={!!user} currentUsername={profile?.username} currentEmoji={profile?.avatar_emoji} currentAvatarBg={(profile as any)?.avatar_bg} currentUserId={user?.id} />

        {similar.length > 0 && (
          <section className="mt-12 pt-8 border-t border-shadow">
            <h2 className="font-display text-2xl text-ghost mb-5">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {similar.slice(0, 6).map((t) => <TitleCard key={t.id} title={t} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
