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
            body: JSON.stringify({}),
          });
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
