export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { adminDb } from "@/lib/supabase/admin";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const svc = adminDb();

  const [{ data: profile }, { data: ratings }, { data: comments }, { data: activity }] = await Promise.all([
    svc.from("profiles").select("*").eq("id", id).single(),
    svc.from("ratings").select("score,created_at,titles(title,media_type)").eq("user_id", id).order("created_at", { ascending: false }).limit(50),
    svc.from("comments").select("id,content,created_at,upvote_count,titles(title)").eq("user_id", id).order("created_at", { ascending: false }).limit(50),
    svc.from("activity_feed").select("id,type,created_at,metadata").eq("user_id", id).order("created_at", { ascending: false }).limit(20),
  ]);

  if (!profile) notFound();

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <span className="text-5xl">{(profile as any).avatar_emoji}</span>
          <div>
            <h1 className="text-2xl font-display text-ghost">{(profile as any).username}</h1>
            <p className="text-sm text-muted">Joined {new Date((profile as any).created_at).toLocaleDateString()}</p>
            <div className="flex gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${(profile as any).role === "admin" ? "bg-green-spooky/20 text-green-spooky" : "bg-shadow text-specter"}`}>
                {(profile as any).role}
              </span>
              {(profile as any).banned && (
                <span className="px-2 py-0.5 rounded text-xs bg-red-900/40 text-red-400">Banned</span>
              )}
            </div>
          </div>
        </div>
        <Link href="/admin/users" className="text-sm text-muted hover:text-specter transition-colors">← Back to Users</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Ratings", value: ratings?.length ?? 0 },
          { label: "Comments", value: comments?.length ?? 0 },
          { label: "Activity", value: activity?.length ?? 0 },
        ].map(stat => (
          <div key={stat.label} className="bg-tomb border border-shadow rounded-xl p-4 text-center">
            <p className="text-2xl font-display text-green-spooky">{stat.value}</p>
            <p className="text-xs text-muted uppercase tracking-wider mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Ratings */}
      {ratings && ratings.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3">Recent Ratings</h2>
          <div className="bg-tomb border border-shadow rounded-xl divide-y divide-shadow">
            {ratings.map((r: any) => (
              <div key={r.created_at} className="px-4 py-3 flex items-center justify-between">
                <span className="text-ghost text-sm">{r.titles?.title ?? "Unknown"}</span>
                <span className="text-green-spooky font-mono text-sm">{r.score}/10</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      {comments && comments.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3">Recent Comments</h2>
          <div className="bg-tomb border border-shadow rounded-xl divide-y divide-shadow">
            {comments.map((c: any) => (
              <div key={c.id} className="px-4 py-3">
                <p className="text-xs text-muted mb-1">{(c.titles as any)?.title ?? "Unknown"} · {new Date(c.created_at).toLocaleDateString()}</p>
                <p className="text-specter text-sm line-clamp-2">{c.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
