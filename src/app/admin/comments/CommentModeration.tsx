"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminDeleteComment, adminBanUser } from "@/app/actions/admin";

interface CommentRow {
  id: string;
  content: string;
  created_at: string;
  upvote_count: number;
  user_id: string;
  profiles: { username: string; avatar_emoji: string; banned: boolean } | null;
  titles: { title: string } | null;
}

interface Props {
  comments: CommentRow[];
  search: string;
  page: number;
  totalPages: number;
}

export function CommentModeration({ comments, search, page, totalPages }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmBan, setConfirmBan] = useState<{ id: string; username: string } | null>(null);

  function updateParams(params: Record<string, string>) {
    const p = new URLSearchParams();
    const merged = { search, page: String(page), ...params };
    if (merged.search) p.set("search", merged.search);
    if (merged.page && merged.page !== "1") p.set("page", merged.page);
    router.push(`/admin/comments?${p.toString()}`);
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search comments..."
          defaultValue={search}
          onKeyDown={e => { if (e.key === "Enter") updateParams({ search: (e.target as HTMLInputElement).value, page: "1" }); }}
          onBlur={e => updateParams({ search: e.target.value, page: "1" })}
          className="w-full max-w-sm px-3 py-2 bg-tomb border border-shadow rounded-lg text-sm text-ghost placeholder-muted focus:outline-none focus:border-green-spooky"
        />
      </div>

      <div className="bg-tomb border border-shadow rounded-xl divide-y divide-shadow">
        {comments.map(c => (
          <div key={c.id} className="px-4 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-base">{c.profiles?.avatar_emoji ?? "💀"}</span>
                  <span className="text-ghost text-sm font-medium">{c.profiles?.username ?? "Unknown"}</span>
                  {c.profiles?.banned && (
                    <span className="px-1.5 py-0.5 rounded text-xs bg-red-900/40 text-red-400">Banned</span>
                  )}
                  <span className="text-muted text-xs">on</span>
                  <span className="text-specter text-xs font-medium">{c.titles?.title ?? "Unknown"}</span>
                  <span className="text-muted text-xs ml-auto">{new Date(c.created_at).toLocaleDateString()}</span>
                  {c.upvote_count > 0 && (
                    <span className="text-xs text-specter">↑ {c.upvote_count}</span>
                  )}
                </div>
                <p className="text-specter text-sm line-clamp-3">{c.content}</p>
              </div>
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <button
                  onClick={() => setConfirmDelete(c.id)}
                  className="px-2.5 py-1 text-xs bg-shadow text-red-400 rounded hover:bg-red-900/30 transition-colors"
                >
                  Delete
                </button>
                {!c.profiles?.banned && c.user_id && (
                  <button
                    onClick={() => setConfirmBan({ id: c.user_id, username: c.profiles?.username ?? "User" })}
                    className="px-2.5 py-1 text-xs bg-shadow text-orange-400 rounded hover:bg-orange-900/20 transition-colors"
                  >
                    Ban User
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {comments.length === 0 && <p className="text-center py-12 text-muted">No comments found.</p>}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          <button disabled={page <= 1} onClick={() => updateParams({ page: String(page - 1) })} className="px-3 py-1.5 text-sm bg-tomb border border-shadow rounded text-specter hover:text-ghost disabled:opacity-40">←</button>
          <span className="text-sm text-specter px-2">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => updateParams({ page: String(page + 1) })} className="px-3 py-1.5 text-sm bg-tomb border border-shadow rounded text-specter hover:text-ghost disabled:opacity-40">→</button>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-void/80 flex items-center justify-center z-50 p-4">
          <div className="bg-tomb border border-shadow rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-display text-ghost mb-2">Delete Comment?</h3>
            <p className="text-sm text-specter mb-6">This will permanently delete the comment and any replies.</p>
            <div className="flex gap-3">
              <button
                onClick={() => { startTransition(async () => { await adminDeleteComment(confirmDelete); setConfirmDelete(null); }); }}
                disabled={pending}
                className="flex-1 py-2 bg-red-900 text-red-100 font-medium rounded-lg hover:bg-red-800 text-sm"
              >
                {pending ? "Deleting..." : "Delete"}
              </button>
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 bg-shadow text-specter font-medium rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {confirmBan && (
        <div className="fixed inset-0 bg-void/80 flex items-center justify-center z-50 p-4">
          <div className="bg-tomb border border-shadow rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-display text-ghost mb-2">Ban User?</h3>
            <p className="text-sm text-specter mb-6">Ban <strong className="text-ghost">{confirmBan.username}</strong>? They will no longer be able to post comments or replies.</p>
            <div className="flex gap-3">
              <button
                onClick={() => { startTransition(async () => { await adminBanUser(confirmBan.id, true); setConfirmBan(null); }); }}
                disabled={pending}
                className="flex-1 py-2 bg-orange-900 text-orange-100 font-medium rounded-lg hover:bg-orange-800 text-sm"
              >
                {pending ? "Banning..." : "Ban User"}
              </button>
              <button onClick={() => setConfirmBan(null)} className="flex-1 py-2 bg-shadow text-specter font-medium rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
