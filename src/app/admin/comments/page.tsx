import { adminDb } from "@/lib/supabase/admin";
import { CommentModeration } from "./CommentModeration";

const PER_PAGE = 50;

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const { search = "", page: pageStr = "1" } = await searchParams;
  const page = Math.max(1, parseInt(pageStr, 10) || 1);
  const offset = (page - 1) * PER_PAGE;

  const svc = adminDb();
  let q = svc
    .from("comments")
    .select(
      "id,content,created_at,upvote_count,user_id,title_id,profiles(username,avatar_emoji,banned),titles(title)",
      { count: "exact" }
    )
    .is("parent_id", null);
  if (search) q = q.ilike("content", `%${search}%`);
  q = q.order("created_at", { ascending: false }).range(offset, offset + PER_PAGE - 1);

  const { data: comments, count } = await q;
  const totalPages = Math.ceil((count ?? 0) / PER_PAGE);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display text-ghost">Comments</h1>
        <p className="text-sm text-muted mt-0.5">{count ?? 0} total</p>
      </div>
      <CommentModeration
        comments={(comments ?? []) as any[]}
        search={search}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}
