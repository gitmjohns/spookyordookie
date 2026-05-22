export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Pagination } from "@/components/Pagination";
import { AvatarCircle } from "@/components/AvatarCircle";
import { tmdbImageUrl, getRatingColor } from "@/lib/utils";

export const metadata = { title: "Community — SpookyorDookie" };

const PAGE_SIZE = 20;

function timeAgo(date: string) {
  const mins = Math.round((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

interface ActivityRow {
  id: string;
  user_id: string;
  type: "rating" | "comment" | "debate_reply" | "joined";
  title_id: string | null;
  reference_id: string | null;
  metadata: { score?: number; content?: string; username?: string; thread_id?: string };
  created_at: string;
}

export default async function FeedPage({ searchParams }: PageProps) {
  const supabase = await createClient();

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const { data: feedData, count } = await supabase
    .from("activity_feed")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  const userIds = [
    ...new Set((feedData ?? []).map((a: ActivityRow) => a.user_id)),
  ];
  const titleIds = [
    ...new Set(
      (feedData ?? [])
        .filter((a: ActivityRow) => a.title_id)
        .map((a: ActivityRow) => a.title_id as string)
    ),
  ];

  const [profilesRes, titlesRes] = await Promise.all([
    userIds.length > 0
      ? supabase.from("profiles").select("id,username,avatar_emoji,avatar_bg").in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; username: string; avatar_emoji: string; avatar_bg: string }[] }),
    titleIds.length > 0
      ? supabase.from("titles").select("id,title,poster_path,media_type").in("id", titleIds)
      : Promise.resolve({
          data: [] as { id: string; title: string; poster_path: string | null; media_type: string }[],
        }),
  ]);

  const profileMap = Object.fromEntries(
    (profilesRes.data ?? []).map((p) => [p.id, p])
  );
  const titleMap = Object.fromEntries(
    (titlesRes.data ?? []).map((t) => [t.id, t])
  );

  type EnrichedActivity = ActivityRow & {
    profile?: { id: string; username: string; avatar_emoji: string; avatar_bg: string };
    title?: { id: string; title: string; poster_path: string | null; media_type: string };
  };

  const enriched: EnrichedActivity[] = (feedData ?? []).map((a: ActivityRow) => ({
    ...a,
    profile: profileMap[a.user_id] as EnrichedActivity["profile"],
    title: a.title_id ? (titleMap[a.title_id] as EnrichedActivity["title"]) : undefined,
  }));

  function activityText(a: EnrichedActivity): React.ReactNode {
    const rawUsername = a.profile?.username ?? a.metadata?.username ?? "Someone";
    const usernameNode = a.profile?.username ? (
      <Link href={`/profile/${a.profile.username}`} className="font-medium text-ghost hover:text-green-spooky transition-colors">
        {a.profile.username}
      </Link>
    ) : (
      <span className="font-medium text-ghost">{rawUsername}</span>
    );
    const titleName = a.title?.title ?? "a title";
    const titlePath = a.title
      ? `/${a.title.media_type === "movie" ? "movies" : "tv"}/${a.title.id}`
      : null;

    if (a.type === "rating") {
      const score = a.metadata?.score;
      const scoreColor = score != null ? getRatingColor(score / 10) : undefined;
      return (
        <>
          {usernameNode}
          {" rated "}
          {titlePath ? (
            <Link href={titlePath} className="text-green-spooky hover:underline">
              {titleName}
            </Link>
          ) : (
            <span>{titleName}</span>
          )}
          {score != null && (
            <>
              {" · "}
              <span
                className="inline-block px-1.5 py-0.5 rounded text-xs font-bold text-void"
                style={{ backgroundColor: scoreColor }}
              >
                {score}
              </span>
            </>
          )}
        </>
      );
    }

    if (a.type === "comment") {
      const excerpt = a.metadata?.content
        ? a.metadata.content.slice(0, 80) + (a.metadata.content.length > 80 ? "…" : "")
        : "";
      return (
        <>
          {usernameNode}
          {" commented on "}
          {titlePath ? (
            <Link href={titlePath} className="text-green-spooky hover:underline">
              {titleName}
            </Link>
          ) : (
            <span>{titleName}</span>
          )}
          {excerpt && (
            <span className="text-muted"> · &ldquo;{excerpt}&rdquo;</span>
          )}
        </>
      );
    }

    if (a.type === "debate_reply") {
      return (
        <>
          {usernameNode}
          {" joined the debate on "}
          {titlePath ? (
            <Link href={titlePath} className="text-green-spooky hover:underline">
              {titleName}
            </Link>
          ) : (
            <span>{titleName}</span>
          )}
        </>
      );
    }

    // joined
    return (
      <>
        {usernameNode}
        {" joined SpookyorDookie"}
      </>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl text-ghost">Community</h1>
        <p className="text-muted text-sm mt-1">
          Live from the crypt — every rating, comment, and new member
        </p>
      </div>

      {enriched.length === 0 ? (
        <div className="text-center py-24">
          <p className="font-display text-3xl text-muted">Nothing yet</p>
          <p className="text-sm text-muted mt-2">
            Activity from the community will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {enriched.map((a) => {
            const posterUrl = a.title ? tmdbImageUrl(a.title.poster_path, "w185") : null;
            const titlePath = a.title
              ? `/${a.title.media_type === "movie" ? "movies" : "tv"}/${a.title.id}`
              : null;

            return (
              <div
                key={a.id}
                className="bg-tomb border border-shadow rounded-lg p-4 flex items-start gap-3"
              >
                {/* Avatar */}
                <AvatarCircle
                  emoji={a.profile?.avatar_emoji ?? "💀"}
                  bg={a.profile?.avatar_bg}
                  size="lg"
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-specter leading-relaxed">
                    {activityText(a)}
                  </p>
                  <p className="text-xs text-muted mt-1">{timeAgo(a.created_at)}</p>
                </div>

                {/* Poster */}
                {titlePath && posterUrl && (
                  <Link href={titlePath} className="shrink-0">
                    <div className="relative w-10 h-14 rounded overflow-hidden">
                      <img
                        src={posterUrl}
                        alt={a.title?.title ?? ""}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} basePath="/feed" params={{}} />
      )}
    </div>
  );
}
