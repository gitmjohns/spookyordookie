"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Props {
  suggestedUsername: string;
}

type CheckStatus = "available" | "taken" | "invalid" | "checking" | "idle";

const FORMAT_RE = /^[a-zA-Z0-9_]{3,20}$/;

export function UsernameForm({ suggestedUsername }: Props) {
  const router = useRouter();
  const [username, setUsername] = useState(suggestedUsername.toLowerCase());
  const [status, setStatus] = useState<CheckStatus>("available"); // suggested is already unique
  const [pending, setPending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip the availability check for the initial suggested value — it was just generated
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = username.trim();

    if (!FORMAT_RE.test(trimmed)) {
      setStatus("invalid");
      return;
    }

    setStatus("checking");

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/username/check?username=${encodeURIComponent(trimmed)}`,
          { credentials: "include" }
        );
        const json = await res.json();
        setStatus(json.available ? "available" : "taken");
      } catch {
        setStatus("idle");
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [username]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status !== "available" || pending) return;
    setPending(true);
    setServerError(null);
    const res = await fetch("/api/settings/confirm-username", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username: username.trim().toLowerCase() }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      setServerError(data.error ?? "Something went wrong");
      setStatus("taken");
      setPending(false);
    } else {
      router.replace("/");
    }
  }

  const canSubmit = status === "available" && !pending;

  function StatusIndicator() {
    if (status === "available") {
      return <span className="text-green-spooky text-xl font-bold">✓</span>;
    }
    if (status === "taken" || status === "invalid") {
      return <span className="text-dookie text-xl font-bold">✗</span>;
    }
    if (status === "checking") {
      return (
        <span className="w-4 h-4 border-2 border-purple-mid border-t-green-spooky rounded-full animate-spin block" />
      );
    }
    return null;
  }

  function StatusMessage() {
    if (status === "available") {
      return <span className="text-green-spooky">Available</span>;
    }
    if (status === "taken") {
      return <span className="text-dookie-light">Username already taken</span>;
    }
    if (status === "invalid") {
      const t = username.trim();
      if (t.length < 3) return <span className="text-dookie-light">Too short — minimum 3 characters</span>;
      if (t.length > 20) return <span className="text-dookie-light">Too long — maximum 20 characters</span>;
      return <span className="text-dookie-light">Letters, numbers, and underscores only</span>;
    }
    return null;
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">💀</div>
          <h1 className="font-display text-4xl sm:text-5xl text-green-spooky leading-tight mb-3">
            Welcome to Spooky or Dookie!
          </h1>
          <p className="text-specter text-sm leading-relaxed max-w-sm mx-auto">
            We&apos;ve given you a username &mdash; keep it or choose your own horror identity.
          </p>
        </div>

        {/* Card */}
        <div className="bg-tomb border border-shadow rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-specter mb-2">Your Username</label>

              {/* Input + status icon */}
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className="flex-1 bg-shadow border border-purple-deep rounded-lg px-4 py-3 text-ghost placeholder-muted text-sm focus:outline-none focus:border-green-spooky focus:ring-1 focus:ring-green-spooky/30 transition-colors"
                  maxLength={20}
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                />
                <div className="w-6 flex items-center justify-center flex-shrink-0">
                  <StatusIndicator />
                </div>
              </div>

              {/* Inline status message */}
              <div className="mt-1.5 text-xs min-h-[1.25rem]">
                <StatusMessage />
              </div>

              <p className="text-xs text-muted mt-1">
                3–20 characters &middot; letters, numbers, and underscores only
              </p>
            </div>

            {serverError && (
              <p className="text-xs text-dookie-light bg-dookie/10 border border-dookie/30 rounded-lg px-3 py-2">
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-3.5 bg-purple-mid hover:bg-purple-light text-ghost font-display text-2xl rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {pending ? "Entering…" : "Enter the Crypt"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
