"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Signing you in…");
  const handled = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    // Fallback: if no auth event fires within 15s, something went wrong
    const timeout = setTimeout(() => {
      if (!handled.current) {
        router.replace("/auth/login?error=auth_failed");
      }
    }, 15000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (handled.current) return;
        if (event !== "SIGNED_IN" && event !== "INITIAL_SESSION") return;
        if (!session?.user) return;

        handled.current = true;
        clearTimeout(timeout);
        setMessage("Setting up your account…");

        try {
          const res = await fetch("/api/profile", {
            method: "POST",
            credentials: "include",
          });

          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error ?? `Profile API returned ${res.status}`);
          }

          const { username_confirmed } = await res.json();
          router.replace(username_confirmed ? "/" : "/auth/username");
        } catch (err) {
          console.error("[auth/callback] profile setup failed", err);
          setMessage("Something went wrong. Redirecting…");
          setTimeout(() => router.replace("/auth/login?error=auth_failed"), 2000);
        }
      }
    );

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="min-h-[90vh] flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">💀</div>
        <p className="text-specter text-sm">{message}</p>
      </div>
    </div>
  );
}
