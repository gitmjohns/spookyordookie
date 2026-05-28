"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CommentItem } from "./CommentItem";
import type { Comment } from "@/lib/types";

interface CommentSectionProps {
  titleId: string;
  initialComments: Comment[];
  isLoggedIn: boolean;
  currentUsername?: string;
  currentEmoji?: string;
  currentAvatarBg?: string;
  currentUserId?: string;
}

export function CommentSection({
  titleId,
  initialComments,
  isLoggedIn,
  currentUsername,
  currentEmoji,
  currentAvatarBg,
  currentUserId,
}: CommentSectionProps) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();

  // Sync with server data after router.refresh() completes
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const content = text.trim();
    setText("");

    // Optimistically add the comment so it appears immediately
    const optimistic: Comment = {
      id: `optimistic-${Date.now()}`,
      user_id: "",
      title_id: titleId,
      parent_id: null,
      content,
      upvote_count: 0,
      downvote_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profiles: { username: currentUsername ?? "You", avatar_emoji: currentEmoji ?? "💀", avatar_bg: currentAvatarBg ?? "#0a0a0f" },
      replies: [],
      user_has_voted: false,
    };
    setComments((prev) => [optimistic, ...prev]);

    startTransition(async () => {
      await fetch("/api/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ titleId, content, parentId: null }),
      });
      // Refresh server data to replace optimistic entry with real one
      router.refresh();
    });
  }

  return (
    <section className="space-y-6">
      <h2 className="font-display text-2xl text-ghost">
        Comments{" "}
        <span className="text-muted text-base font-sans">({comments.length})</span>
      </h2>

      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="flex gap-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your thoughts on this horror masterpiece (or dumpster fire)…"
            rows={3}
            maxLength={2000}
            className="flex-1 bg-tomb border border-shadow rounded-xl px-4 py-3 text-sm text-ghost placeholder-muted focus:outline-none focus:border-purple-mid resize-none"
          />
          <button
            type="submit"
            disabled={isPending || !text.trim()}
            className="self-end px-5 py-2.5 bg-purple-mid hover:bg-purple-light text-ghost text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            {isPending ? "Posting…" : "Post"}
          </button>
        </form>
      ) : (
        <div className="bg-tomb border border-shadow rounded-xl p-4 text-center text-sm text-muted">
          <a href="/auth/login" className="font-bold text-green-spooky hover:underline">
            Sign In
          </a>{" "}
          to leave a comment.
        </div>
      )}

      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-muted text-sm text-center py-8">
            No comments yet. The silence is almost… deadly.
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              titleId={titleId}
              isLoggedIn={isLoggedIn}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>
    </section>
  );
}
