export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Pagination } from "@/components/Pagination";
import { MarkAllReadButton } from "./MarkAllReadButton";
import { NotificationRow } from "./NotificationRow";

export const metadata = { title: "Notifications — SpookyorDookie" };

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

export default async function NotificationsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  const { data: notifs, count } = await supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  const actorIds = [
    ...new Set((notifs ?? []).filter((n) => n.actor_id).map((n) => n.actor_id as string)),
  ];
  const titleIds = [
    ...new Set((notifs ?? []).filter((n) => n.title_id).map((n) => n.title_id as string)),
  ];

  const [profilesRes, titlesRes] = await Promise.all([
    actorIds.length > 0
      ? supabase.from("profiles").select("id,username,avatar_emoji,avatar_bg").in("id", actorIds)
      : Promise.resolve({ data: [] as { id: string; username: string; avatar_emoji: string; avatar_bg: string }[] }),
    titleIds.length > 0
      ? supabase.from("titles").select("id,title,media_type").in("id", titleIds)
      : Promise.resolve({ data: [] as { id: string; title: string; media_type: string }[] }),
  ]);

  const profileMap = Object.fromEntries(
    (profilesRes.data ?? []).map((p) => [p.id, p])
  );
  const titleMap = Object.fromEntries(
    (titlesRes.data ?? []).map((t) => [t.id, t])
  );

  const enriched = (notifs ?? []).map((n) => ({
    ...n,
    actor_profile: n.actor_id ? (profileMap[n.actor_id] as { username: string; avatar_emoji: string; avatar_bg: string } | undefined) : undefined,
    title: n.title_id ? (titleMap[n.title_id] as { id: string; title: string; media_type: string } | undefined) : undefined,
  }));

  function notifText(n: typeof enriched[number]): string {
    const actor = n.actor_profile?.username ?? "Someone";
    const titleName = n.title?.title ?? "a title";
    if (n.type === "comment_upvote") return `${actor} upvoted your comment on ${titleName}`;
    if (n.type === "comment_reply") return `${actor} replied to your comment on ${titleName}`;
    if (n.type === "debate_reply") return `${actor} replied to a debate on ${titleName}`;
    if (n.type === "debate_follow_reply") return `${actor} replied to a debate you're following on ${titleName}`;
    return `New notification`;
  }

  function titleHref(n: typeof enriched[number]): string {
    if (!n.title) return "/notifications";
    return `/${n.title.media_type === "movie" ? "movies" : "tv"}/${n.title.id}`;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-4xl text-ghost">Notifications</h1>
        {enriched.length > 0 && <MarkAllReadButton />}
      </div>

      {enriched.length === 0 ? (
        <div className="text-center py-24">
          <p className="font-display text-3xl text-muted">No notifications yet</p>
          <p className="text-sm text-muted mt-2">You&apos;ll see activity here when people interact with your content.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {enriched.map((n) => (
            <NotificationRow
              key={n.id}
              id={n.id}
              read={n.read}
              href={titleHref(n)}
              text={notifText(n)}
              time={timeAgo(n.created_at)}
              actorEmoji={n.actor_profile?.avatar_emoji ?? "💀"}
              actorBg={n.actor_profile?.avatar_bg}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} basePath="/notifications" params={{}} />
      )}
    </div>
  );
}
