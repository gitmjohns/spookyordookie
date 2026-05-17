"use client";

import Link from "next/link";
import { useTransition } from "react";
import { markOneRead } from "@/app/actions/notifications";
import { AvatarCircle } from "@/components/AvatarCircle";

interface NotificationRowProps {
  id: string;
  read: boolean;
  href: string;
  text: string;
  time: string;
  actorEmoji: string;
  actorBg?: string;
}

export function NotificationRow({ id, read, href, text, time, actorEmoji, actorBg }: NotificationRowProps) {
  const [, startTransition] = useTransition();

  function handleClick() {
    if (!read) startTransition(async () => { await markOneRead(id); });
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={`flex items-start gap-4 p-4 rounded-lg border transition-colors hover:bg-shadow/40 ${
        !read ? "bg-shadow/40 border-l-4 border-l-green-spooky border-shadow" : "border-shadow/60"
      }`}
    >
      <AvatarCircle emoji={actorEmoji} bg={actorBg} size="lg" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-specter">{text}</p>
        <p className="text-xs text-muted mt-1">{time}</p>
      </div>
      {!read && <span className="w-2 h-2 rounded-full bg-green-spooky shrink-0 mt-2" />}
    </Link>
  );
}
