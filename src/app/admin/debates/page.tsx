import { adminDb } from "@/lib/supabase/admin";
import { DebateManagement } from "./DebateManagement";

export default async function AdminDebatesPage({
  searchParams,
}: {
  searchParams: Promise<{ thread?: string }>;
}) {
  const { thread: threadId } = await searchParams;
  const svc = adminDb();

  const { data: threads } = await svc
    .from("debate_threads")
    .select("id,prompt,title_id,titles(title,media_type)")
    .order("created_at", { ascending: false });

  // If a thread is selected, load its replies
  let replies: any[] = [];
  if (threadId) {
    const { data } = await svc
      .from("debate_replies")
      .select("id,content,created_at,upvote_count,user_id,profiles(username,avatar_emoji)")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: false });
    replies = data ?? [];
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display text-ghost">Debates</h1>
        <p className="text-sm text-muted mt-0.5">{threads?.length ?? 0} threads</p>
      </div>
      <DebateManagement
        threads={(threads ?? []) as any[]}
        selectedThreadId={threadId ?? null}
        replies={replies}
      />
    </div>
  );
}
