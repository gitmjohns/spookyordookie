"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/SearchBar";
import { NotificationBell } from "@/components/NotificationBell";
import type { User } from "@supabase/supabase-js";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/movies", label: "Movies" },
  { href: "/tv", label: "TV" },
  { href: "/feed", label: "Community" },
];

export function Navigation() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [avatarEmoji, setAvatarEmoji] = useState("💀");
  const [avatarBg, setAvatarBg] = useState("#0a0a0f");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function loadProfile() {
      const res = await fetch("/api/profile/me", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.avatar_emoji) setAvatarEmoji(data.avatar_emoji);
      if (data.avatar_bg)    setAvatarBg(data.avatar_bg);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile();
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setAvatarEmoji("💀");
      } else if (event === "SIGNED_IN") {
        loadProfile();
      }
    });

    // Instant update when user saves a new emoji in Settings
    function onEmojiUpdated(e: Event) {
      const detail = (e as CustomEvent<{ emoji: string; bg?: string }>).detail ?? {};
      if (detail.emoji) setAvatarEmoji(detail.emoji);
      if (detail.bg)    setAvatarBg(detail.bg);
    }
    window.addEventListener("avatarEmojiUpdated", onEmojiUpdated);

    return () => {
      listener.subscription.unsubscribe();
      window.removeEventListener("avatarEmojiUpdated", onEmojiUpdated);
    };
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    window.location.href = "/";
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-shadow bg-crypt/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">
          <Link
            href="/"
            className="font-display text-2xl text-green-spooky hover:text-green-dark transition-colors flex-shrink-0"
          >
            SpookyorDookie
          </Link>

          <div className="hidden md:flex items-center gap-6 flex-shrink-0 ml-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium transition-colors hover:text-white"
                style={{ color: pathname === link.href ? "#7dff6b" : "#9a8aaa" }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex-1" />

          <div className="hidden md:block w-56 lg:w-72">
            <SearchBar placeholder="Search horror..." />
          </div>

          {user && <NotificationBell />}

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen((o) => !o)}
              className="md:hidden p-1.5 text-specter hover:text-ghost transition-colors rounded-lg hover:bg-shadow"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {user && (
              <div className="md:hidden">
                <NotificationBell />
              </div>
            )}

            {user ? (
              <>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen((o) => !o)}
                    className="flex items-center gap-2 text-sm text-specter hover:text-ghost transition-colors"
                  >
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-base"
                      style={{ backgroundColor: avatarBg }}
                    >
                      {avatarEmoji}
                    </span>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-tomb border border-shadow rounded-lg shadow-xl py-1">
                      <p className="px-4 py-2 text-xs text-muted truncate">
                        {user.email}
                      </p>
                      <hr className="border-shadow my-1" />
                      <Link
                        href="/profile/me"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-specter hover:text-ghost hover:bg-shadow transition-colors"
                      >
                        My Profile
                      </Link>
                      <Link
                        href="/watchlist"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-specter hover:text-ghost hover:bg-shadow transition-colors"
                      >
                        My Watchlist
                      </Link>
                      <Link
                        href="/notifications"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-specter hover:text-ghost hover:bg-shadow transition-colors"
                      >
                        Notifications
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-specter hover:text-ghost hover:bg-shadow transition-colors"
                      >
                        Settings
                      </Link>
                      <hr className="border-shadow my-1" />
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-specter hover:text-ghost hover:bg-shadow transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="text-sm text-specter hover:text-ghost transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="md:hidden border-t border-shadow bg-crypt/95 px-4 py-3">
          <SearchBar placeholder="Search horror..." className="w-full" />
        </div>
      )}
    </nav>
  );
}
