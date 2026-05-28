"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { ReactNode } from "react";
import { AvatarCircle } from "@/components/AvatarCircle";

interface NotificationRowProps {
  id: string;
  read: boolean;
  href: string;
  text: ReactNode;
  time: string;
  actorEmoji: string;
  actorBg?: string;
  actorUsername?: string;
}

export function NotificationRow({ id, read, href, text, time, actorEmoji, actorBg, actorUsername }: NotificationRowProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("a")) return;
    if (!read) {
      startTransition(async () => {
        await fetch("/api/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id }),
        });
      });
    }
    router.push(href);
  }

  const avatar = actorUsername ? (
    <Link href={`/profile/${actorUsername}`} onClick={(e) => e.stopPropagation()}>
      <AvatarCircle emoji={actorEmoji} bg={actorBg} size="lg" />
    </Link>
  ) : (
    <AvatarCircle emoji={actorEmoji} bg={actorBg} size="lg" />
  );

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-4 p-4 rounded-lg border transition-colors hover:bg-shadow/40 cursor-pointer ${
        !read ? "bg-shadow/40 border-l-4 border-l-green-spooky border-shadow" : "border-shadow/60"
      }`}
    >
      {avatar}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-specter">{text}</p>
        <p className="text-xs text-muted mt-1">{time}</p>
      </div>
      {!read && <span className="w-2 h-2 rounded-full bg-green-spooky shrink-0 mt-2" />}
    </div>
  );
}
