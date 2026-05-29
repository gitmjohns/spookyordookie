"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function MarkAllReadButton() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await fetch("/api/notifications/read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({}),
          });
          window.dispatchEvent(new CustomEvent("notifications-read-all"));
          router.refresh();
        })
      }
      disabled={pending}
      className="text-sm text-green-spooky hover:underline disabled:opacity-50"
    >
      {pending ? "Marking…" : "Mark all as read"}
    </button>
  );
}
