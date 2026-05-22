"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin/titles",   label: "Titles",   icon: "🎬" },
  { href: "/admin/users",    label: "Users",    icon: "👥" },
  { href: "/admin/comments", label: "Comments", icon: "💬" },
  { href: "/admin/debates",  label: "Debates",  icon: "⚔️" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

interface Props {
  open?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ open = false, onClose }: Props) {
  const pathname = usePathname();

  const navContent = (
    <>
      <nav className="flex-1 py-4 space-y-0.5 px-3">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-purple-deep text-green-spooky"
                  : "text-specter hover:text-ghost hover:bg-shadow"
              )}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-5 border-t border-shadow pt-4">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-ghost transition-colors rounded-lg hover:bg-shadow"
        >
          <span>←</span> Back to site
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop: always-visible sidebar */}
      <aside className="hidden md:flex w-56 flex-shrink-0 bg-crypt border-r border-shadow flex-col min-h-screen">
        <div className="px-5 py-5 border-b border-shadow">
          <p className="font-display text-green-spooky text-lg leading-tight">SpookyorDookie</p>
          <p className="text-xs text-muted uppercase tracking-widest mt-0.5">Admin Crypt</p>
        </div>
        {navContent}
      </aside>

      {/* Mobile: slide-out drawer from the left */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-30 w-64 bg-crypt border-r border-shadow flex flex-col transform transition-transform duration-200 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-shadow">
          <div>
            <p className="font-display text-green-spooky text-lg leading-tight">SpookyorDookie</p>
            <p className="text-xs text-muted uppercase tracking-widest mt-0.5">Admin Crypt</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted hover:text-ghost rounded-lg hover:bg-shadow transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {navContent}
      </aside>
    </>
  );
}
