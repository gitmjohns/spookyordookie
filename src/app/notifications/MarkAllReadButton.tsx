"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAllRead } from "@/app/actions/notifications";

export function MarkAllReadButton() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await markAllRead();
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
