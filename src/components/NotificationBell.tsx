"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { markOneRead } from "@/app/actions/notifications";

interface NotifData {
  id: string;
  type: "comment_upvote" | "comment_reply" | "debate_reply";
  read: boolean;
  created_at: string;
  actor_profile: { username: string; avatar_emoji: string } | null;
  title: { id: string; title: string; media_type: string } | null;
}

function timeAgo(date: string) {
  const mins = Math.round((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

function notifText(n: NotifData): string {
  const actor = n.actor_profile?.username ?? "Someone";
  const titleName = n.title?.title ?? "a title";
  if (n.type === "comment_upvote") return `${actor} upvoted your comment on ${titleName}`;
  if (n.type === "comment_reply") return `${actor} replied to your comment on ${titleName}`;
  if (n.type === "debate_reply") return `${actor} replied to a debate on ${titleName}`;
  return `New notification from ${actor}`;
}

function titleHref(n: NotifData): string {
  if (!n.title) return "/notifications";
  return `/${n.title.media_type === "movie" ? "movies" : "tv"}/${n.title.id}`;
}

export function NotificationBell() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recent, setRecent] = useState<NotifData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unread_count ?? 0);
        setRecent(data.recent ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  async function handleBellClick() {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening) await fetchNotifications();
  }

  async function handleNotifClick(n: NotifData) {
    setIsOpen(false);
    if (!n.read) {
      await markOneRead(n.id);
      setRecent((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    router.push(titleHref(n));
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        className="relative p-1.5 text-specter hover:text-ghost transition-colors rounded-lg hover:bg-shadow"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-dookie-light text-void text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && !loading && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-tomb border border-shadow rounded-lg shadow-2xl z-[200]">
          <div className="px-4 py-2.5 border-b border-shadow">
            <span className="text-sm font-medium text-ghost">Notifications</span>
          </div>

          {recent.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted">
              No notifications
            </div>
          ) : (
            <div className="divide-y divide-shadow/50 max-h-80 overflow-y-auto">
              {recent.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-shadow/60 transition-colors flex items-start gap-3 ${
                    !n.read ? "bg-shadow/60 border-l-2 border-green-spooky" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-purple-deep flex items-center justify-center text-base shrink-0">
                    {n.actor_profile?.avatar_emoji ?? "💀"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-specter leading-relaxed">{notifText(n)}</p>
                    <p className="text-xs text-muted mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="px-4 py-2.5 border-t border-shadow">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs text-green-spooky hover:underline"
            >
              View all →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
