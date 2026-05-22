"use client";

import { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-void">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-20 bg-void/80"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 min-w-0">
        {/* Mobile admin bar — hamburger on the LEFT per spec */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-crypt border-b border-shadow">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-specter hover:text-ghost rounded-lg hover:bg-shadow transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-display text-green-spooky text-lg">Admin Crypt</span>
        </div>

        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
