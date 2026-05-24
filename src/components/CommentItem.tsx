"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { upvoteComment, downvoteComment, addComment, deleteComment, editComment } from "@/app/actions/comments";
import { cn } from "@/lib/utils";
import { AvatarCircle } from "@/components/AvatarCircle";
import type { Comment } from "@/lib/types";

interface CommentItemProps {
  comment: Comment;
  titleId: string;
  isLoggedIn: boolean;
  currentUserId?: string;
  depth?: number;
}

function formatTimeAgo(dateStr: string) {
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
    Math.round((new Date(dateStr).getTime() - Date.now()) / 1000 / 60),
    "minutes"
  );
}

export function CommentItem({ comment, titleId, isLoggedIn, currentUserId, depth = 0 }: CommentItemProps) {
  const router = useRouter();
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [upvoted, setUpvoted] = useState(comment.user_has_voted ?? false);
  const [upvoteCount, setUpvoteCount] = useState(comment.upvote_count);
  const [downvoted, setDownvoted] = useState(comment.user_has_downvoted ?? false);
  const [downvoteCount, setDownvoteCount] = useState(comment.downvote_count ?? 0);
  const [isPending, startTransition] = useTransition();

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [displayContent, setDisplayContent] = useState(comment.content);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const isOwner = !!currentUserId && currentUserId === comment.user_id && !comment.id.startsWith("optimistic-");

  function handleUpvote() {
    if (!isLoggedIn) return;
    startTransition(async () => {
      await upvoteComment(comment.id);
      setUpvoted((v) => !v);
      setUpvoteCount((c) => (upvoted ? c - 1 : c + 1));
      if (downvoted) { setDownvoted(false); setDownvoteCount((c) => c - 1); }
    });
  }

  function handleDownvote() {
    if (!isLoggedIn) return;
    startTransition(async () => {
      await downvoteComment(comment.id);
      setDownvoted((v) => !v);
      setDownvoteCount((c) => (downvoted ? c - 1 : c + 1));
      if (upvoted) { setUpvoted(false); setUpvoteCount((c) => c - 1); }
    });
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim()) return;
    startTransition(async () => {
      await addComment(titleId, replyText.trim(), comment.id);
      setReplyText("");
      setShowReply(false);
      router.refresh();
    });
  }

  async function handleEditSave() {
    if (!editText.trim()) return;
    startTransition(async () => {
      const result = await editComment(comment.id, editText.trim());
      if (!result.error) {
        setDisplayContent(editText.trim());
        setIsEditing(false);
        router.refresh();
      }
    });
  }

  async function handleDelete() {
    startTransition(async () => {
      const result = await deleteComment(comment.id);
      if (!result.error) {
        setDeleted(true);
        router.refresh();
      }
    });
  }

  if (deleted) return null;

  return (
    <div className={cn("group", depth > 0 && "ml-6 border-l border-shadow pl-4")}>
      <div className="bg-tomb/50 rounded-lg p-4 hover:bg-tomb transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <AvatarCircle
              emoji={(comment.profiles as { avatar_emoji?: string } | undefined)?.avatar_emoji ?? "💀"}
              bg={(comment.profiles as { avatar_bg?: string } | undefined)?.avatar_bg}
              size="sm"
            />
            <div>
              {comment.profiles?.username ? (
                <Link href={`/profile/${comment.profiles.username}`} className="text-sm font-medium text-specter hover:text-green-spooky transition-colors">
                  {comment.profiles.username}
                </Link>
              ) : (
                <span className="text-sm font-medium text-specter">Anonymous</span>
              )}
              <span className="text-xs text-muted ml-2">{formatTimeAgo(comment.created_at)}</span>
            </div>
          </div>

          {isOwner && !isEditing && (
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => { setIsEditing(true); setEditText(displayContent); setShowDeleteConfirm(false); }}
                className="text-xs font-bold text-muted hover:text-specter transition-colors"
              >
                Edit
              </button>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs font-bold text-muted hover:text-dookie-light transition-colors"
                >
                  Delete
                </button>
              ) : (
                <span className="flex items-center gap-1.5">
                  <span className="text-xs text-muted">Delete?</span>
                  <button onClick={handleDelete} disabled={isPending} className="text-xs text-dookie-light hover:text-dookie font-bold transition-colors">Yes</button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="text-xs font-bold text-muted hover:text-specter transition-colors">No</button>
                </span>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={3}
              maxLength={1000}
              className="w-full bg-shadow border border-purple-deep rounded-lg px-3 py-2 text-sm text-ghost placeholder-muted focus:outline-none focus:border-purple-mid resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleEditSave}
                disabled={isPending || !editText.trim()}
                className="px-3 py-1.5 bg-purple-mid hover:bg-purple-light text-ghost text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {isPending ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => { setIsEditing(false); setEditText(displayContent); }}
                className="px-3 py-1.5 bg-shadow text-muted hover:text-ghost text-xs font-bold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-ghost leading-relaxed whitespace-pre-wrap">{displayContent}</p>
        )}

        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={handleUpvote}
            disabled={!isLoggedIn || isPending}
            title={isLoggedIn ? "Upvote" : "Sign in to vote"}
            className={cn("flex items-center gap-1 text-xs transition-colors", upvoted ? "text-green-spooky" : "text-muted hover:text-specter", !isLoggedIn && "cursor-default")}
          >
            <svg className="w-3.5 h-3.5" fill={upvoted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            {upvoteCount}
          </button>

          <button
            onClick={handleDownvote}
            disabled={!isLoggedIn || isPending}
            title={isLoggedIn ? "Downvote" : "Sign in to vote"}
            className={cn("flex items-center gap-1 text-xs transition-colors", downvoted ? "text-dookie-light" : "text-muted hover:text-specter", !isLoggedIn && "cursor-default")}
          >
            <svg className="w-3.5 h-3.5" fill={downvoted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {downvoteCount > 0 ? downvoteCount : ""}
          </button>

          {isLoggedIn && depth < 3 && !isEditing && (
            <button onClick={() => setShowReply((v) => !v)} className="text-xs font-bold text-muted hover:text-specter transition-colors">
              {showReply ? "Cancel" : "Reply"}
            </button>
          )}
        </div>
      </div>

      {showReply && (
        <form onSubmit={handleReply} className="mt-2 ml-4 flex gap-2">
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply…"
            maxLength={1000}
            className="flex-1 bg-shadow border border-purple-deep rounded-lg px-3 py-2 text-sm text-ghost placeholder-muted focus:outline-none focus:border-purple-mid"
          />
          <button type="submit" disabled={isPending || !replyText.trim()} className="px-4 py-2 bg-purple-mid hover:bg-purple-light text-ghost text-sm font-bold rounded-lg transition-colors disabled:opacity-50">
            Reply
          </button>
        </form>
      )}

      {comment.replies?.map((reply) => (
        <CommentItem key={reply.id} comment={reply} titleId={titleId} isLoggedIn={isLoggedIn} currentUserId={currentUserId} depth={depth + 1} />
      ))}
    </div>
  );
}
