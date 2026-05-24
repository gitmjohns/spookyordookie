"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addDebateReply, editDebateReply, toggleDebateFollow } from "@/app/actions/watchlist";
import { AvatarCircle } from "@/components/AvatarCircle";
import type { DebateReply } from "@/lib/types";

interface DebateThreadProps {
  threadId: string;
  prompt: string;
  initialReplies: DebateReply[];
  isLoggedIn: boolean;
  initialIsFollowing: boolean;
  currentUsername?: string;
  currentEmoji?: string;
  currentAvatarBg?: string;
  currentUserId?: string;
}

function timeAgo(date: string) {
  const mins = Math.round((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

export function DebateThread({
  threadId, prompt, initialReplies, isLoggedIn, initialIsFollowing,
  currentUsername, currentEmoji, currentAvatarBg, currentUserId,
}: DebateThreadProps) {
  const router = useRouter();
  const [replies, setReplies] = useState(initialReplies);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();

  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followPending, setFollowPending] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setReplies(initialReplies); }, [initialReplies]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editedContents, setEditedContents] = useState<Record<string, string>>({});

  async function handleFollowToggle() {
    if (!isLoggedIn) {
      window.location.href = "/auth/login";
      return;
    }
    setFollowPending(true);
    const result = await toggleDebateFollow(threadId);
    if (!("error" in result)) {
      setIsFollowing(result.following);
    }
    setFollowPending(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const content = text.trim();
    setText("");
    const optimistic: DebateReply = {
      id: `opt-${Date.now()}`,
      thread_id: threadId,
      user_id: "",
      content,
      upvote_count: 0,
      created_at: new Date().toISOString(),
      profiles: { username: currentUsername ?? "You", avatar_emoji: currentEmoji ?? "💀", avatar_bg: currentAvatarBg ?? "#0a0a0f" },
    };
    setReplies((r) => [...r, optimistic]);
    // Auto-follow optimistically when posting
    setIsFollowing(true);
    startTransition(async () => {
      await addDebateReply(threadId, content);
      router.refresh();
    });
  }

  function startEdit(replyId: string, currentContent: string) {
    setEditingId(replyId);
    setEditText(editedContents[replyId] ?? currentContent);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditText("");
  }

  function saveEdit(replyId: string) {
    if (!editText.trim()) return;
    const saved = editText.trim();
    startTransition(async () => {
      const result = await editDebateReply(replyId, saved);
      if (!result.error) {
        setEditedContents((prev) => ({ ...prev, [replyId]: saved }));
        setEditingId(null);
        setEditText("");
        router.refresh();
      }
    });
  }


  return (
    <div className="rounded-2xl border border-purple-mid bg-shadow/50 overflow-hidden mb-8">
      {/* Header */}
      <div className="bg-purple-deep/40 px-5 py-4 border-b border-purple-mid/50">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold uppercase tracking-widest text-green-spooky">
            🔥 Debate Thread
          </span>

          {/* Follow button */}
          <button
            onClick={handleFollowToggle}
            disabled={followPending}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
              isFollowing
                ? "bg-green-spooky/15 text-green-spooky hover:bg-red-900/20 hover:text-dookie-light"
                : "bg-shadow/80 text-specter hover:bg-purple-mid hover:text-ghost"
            }`}
          >
            {isFollowing ? (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Following
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Follow This Debate
              </>
            )}
          </button>
        </div>
        <p className="font-sans text-base text-ghost leading-relaxed">{prompt}</p>
      </div>

      {/* Replies */}
      <div className="px-5 py-4 space-y-4 max-h-80 overflow-y-auto">
        {replies.length === 0 ? (
          <p className="text-muted text-sm text-center py-4">
            No takes yet. Be the first to weigh in.
          </p>
        ) : (
          replies.map((r) => {
            const isOwn = !!currentUserId && currentUserId === r.user_id && !r.id.startsWith("opt-");
            const isEditingThis = editingId === r.id;
            const displayContent = editedContents[r.id] ?? r.content;

            return (
              <div key={r.id} className="flex gap-3 group">
                <AvatarCircle
                  emoji={(r.profiles as { avatar_emoji?: string } | undefined)?.avatar_emoji ?? "💀"}
                  bg={(r.profiles as { avatar_bg?: string } | undefined)?.avatar_bg}
                  size="sm"
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {r.profiles?.username ? (
                      <Link href={`/profile/${r.profiles.username}`} className="text-sm font-medium text-specter hover:text-green-spooky transition-colors">
                        {r.profiles.username}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-specter">Anonymous</span>
                    )}
                    <span className="text-xs text-muted">{timeAgo(r.created_at)}</span>
                    {isOwn && !isEditingThis && (
                      <button
                        onClick={() => startEdit(r.id, r.content)}
                        className="text-xs font-bold text-muted hover:text-specter transition-colors opacity-0 group-hover:opacity-100"
                      >
                        Edit
                      </button>
                    )}
                  </div>

                  {isEditingThis ? (
                    <div className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={2}
                        maxLength={500}
                        className="w-full bg-tomb border border-purple-deep rounded-lg px-3 py-2 text-sm text-ghost placeholder-muted focus:outline-none focus:border-purple-mid resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(r.id)}
                          disabled={isPending || !editText.trim()}
                          className="px-3 py-1 bg-purple-mid hover:bg-purple-light text-ghost text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isPending ? "Saving…" : "Save"}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 bg-shadow text-muted hover:text-ghost text-xs font-bold rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-ghost leading-relaxed">{displayContent}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reply input */}
      <div className="px-5 pb-5 border-t border-shadow/50 pt-4">
        {isLoggedIn ? (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add your take…"
              maxLength={500}
              className="flex-1 bg-tomb border border-shadow rounded-lg px-3 py-2 text-sm text-ghost placeholder-muted focus:outline-none focus:border-purple-mid"
            />
            <button
              type="submit"
              disabled={isPending || !text.trim()}
              className="px-4 py-2 bg-purple-mid hover:bg-purple-light text-ghost text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              Post
            </button>
          </form>
        ) : (
          <p className="text-center text-sm text-muted">
            <a href="/auth/login" className="font-bold text-green-spooky hover:underline">Sign In</a> to join the debate.
          </p>
        )}
      </div>
    </div>
  );
}
