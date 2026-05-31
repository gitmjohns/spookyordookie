"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Signing you in…");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");
    const errorDesc = params.get("error_description");

    if (errorParam) {
      const friendlyMsg = errorDesc ?? "Sign in failed. Please try again.";
      setMessage("Sign in failed");
      setErrorMsg(friendlyMsg);
      const t = setTimeout(() => router.replace("/auth/login?error=auth_failed"), 4000);
      return () => clearTimeout(t);
    }

    const code = params.get("code");
    console.log("[auth/callback] code param present:", !!code, "hash present:", !!window.location.hash);
    const supabase = createClient();
    let unsubscribe: (() => void) | undefined;

    const timeout = setTimeout(() => {
      if (!handled.current) {
        console.warn("[auth/callback] timed out — finishSignIn never called");
        router.replace("/auth/login?error=auth_failed");
      }
    }, 15000);

    async function finishSignIn() {
      if (handled.current) return;
      handled.current = true;
      clearTimeout(timeout);
      console.log("[auth/callback] finishSignIn called — posting to /api/profile");
      setMessage("Setting up your account…");

      try {
        const res = await fetch("/api/profile", {
          method: "POST",
          credentials: "include",
        });
        console.log("[auth/callback] POST /api/profile status:", res.status);

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

    if (code) {
      console.log("[auth/callback] exchanging code for session");
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          console.error("[auth/callback] exchangeCodeForSession error:", error.message);
          clearTimeout(timeout);
          setMessage("Sign in failed");
          setErrorMsg("Sign in failed. Please try again.");
          setTimeout(() => router.replace("/auth/login?error=auth_failed"), 4000);
          return;
        }
        console.log("[auth/callback] exchangeCodeForSession succeeded");
        finishSignIn();
      });
    } else {
      console.log("[auth/callback] no code — waiting for onAuthStateChange");
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log("[auth/callback] onAuthStateChange event:", event, "has session:", !!session?.user);
          if (handled.current) return;
          if (event !== "SIGNED_IN" && event !== "INITIAL_SESSION") return;
          if (!session?.user) return;
          finishSignIn();
        }
      );
      unsubscribe = () => subscription.unsubscribe();
    }

    return () => {
      clearTimeout(timeout);
      unsubscribe?.();
    };
  }, [router]);

  return (
    <div className="min-h-[90vh] flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">💀</div>
        <p className="text-specter text-sm">{message}</p>
        {errorMsg && (
          <p className="text-dookie text-xs mt-3 max-w-xs mx-auto">{errorMsg}</p>
        )}
      </div>
    </div>
  );
}
