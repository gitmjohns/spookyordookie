"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect, useRef } from "react";
import { adminDeleteTitle } from "@/app/actions/admin";
import { Pagination } from "@/components/Pagination";

interface Row {
  id: string;
  title: string;
  release_year: number | null;
  media_type: string;
  critic_score: number;
  subgenres: string[] | null;
  poster_path: string | null;
}

interface Props {
  titles: Row[];
  search: string;
  type: string;
  page: number;
  totalPages: number;
}

export function TitleTable({ titles, search, type, page, totalPages }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function buildUrl(params: Record<string, string>) {
    const p = new URLSearchParams();
    const merged = { search, type, page: String(page), ...params };
    if (merged.search) p.set("search", merged.search);
    if (merged.type) p.set("type", merged.type);
    if (merged.page && merged.page !== "1") p.set("page", merged.page);
    return `/admin/titles?${p.toString()}`;
  }

  // Debounced live search — fires 300ms after the user stops typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Only trigger if value has 2+ chars, or if it was cleared
    if (searchValue.length === 1) return;
    debounceRef.current = setTimeout(() => {
      router.replace(buildUrl({ search: searchValue, page: "1" }));
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  function handleDelete(id: string) {
    startTransition(async () => {
      await adminDeleteTitle(id);
      setConfirmId(null);
    });
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search titles..."
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            className="w-full px-3 py-2 pr-8 bg-tomb border border-shadow rounded-lg text-sm text-ghost placeholder-muted focus:outline-none focus:border-green-spooky"
          />
          {searchValue && (
            <button
              onClick={() => setSearchValue("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ghost transition-colors leading-none"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <select
          value={type}
          onChange={e => router.replace(buildUrl({ type: e.target.value, page: "1" }))}
          className="px-3 py-2 bg-tomb border border-shadow rounded-lg text-sm text-ghost focus:outline-none focus:border-green-spooky"
        >
          <option value="">All types</option>
          <option value="movie">Movies</option>
          <option value="tv">TV</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-tomb border border-shadow rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-shadow text-left">
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-muted font-semibold w-10"></th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-muted font-semibold">Title</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-muted font-semibold">Year</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-muted font-semibold">Type</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-muted font-semibold">Score</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-muted font-semibold">Subgenres</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-muted font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-shadow">
            {titles.map(t => (
              <tr key={t.id} className="hover:bg-shadow/30 transition-colors">
                <td className="px-4 py-2">
                  {t.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${t.poster_path}`}
                      alt=""
                      className="w-8 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-8 h-12 bg-shadow rounded flex items-center justify-center text-xs text-muted">?</div>
                  )}
                </td>
                <td className="px-4 py-2 text-ghost font-medium max-w-xs truncate">{t.title}</td>
                <td className="px-4 py-2 text-specter">{t.release_year ?? "—"}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.media_type === "movie" ? "bg-purple-deep text-purple-light" : "bg-shadow text-specter"}`}>
                    {t.media_type}
                  </span>
                </td>
                <td className="px-4 py-2 text-green-spooky font-mono">{t.critic_score}</td>
                <td className="px-4 py-2 text-specter text-xs max-w-xs truncate">
                  {(t.subgenres ?? []).join(", ") || "—"}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/titles/${t.id}`}
                      className="px-2.5 py-1 text-xs bg-purple-deep text-purple-light rounded hover:bg-purple-mid transition-colors"
                    >
                      Edit
                    </Link>
                    {confirmId === t.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDelete(t.id)}
                          disabled={pending}
                          className="px-2.5 py-1 text-xs bg-red-900 text-red-200 rounded hover:bg-red-800 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="px-2.5 py-1 text-xs bg-shadow text-specter rounded hover:bg-tomb transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(t.id)}
                        className="px-2.5 py-1 text-xs bg-shadow text-red-400 rounded hover:bg-red-900/30 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {titles.length === 0 && (
          <p className="text-center py-12 text-muted">No titles found.</p>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/titles"
        params={Object.fromEntries(
          Object.entries({ search, type }).filter(([, v]) => v)
        )}
      />

      {/* Delete confirmation modal */}
      {confirmId && (
        <div className="fixed inset-0 bg-void/80 flex items-center justify-center z-50 p-4">
          <div className="bg-tomb border border-shadow rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-display text-ghost mb-2">Remove from the Crypt?</h3>
            <p className="text-sm text-specter mb-6">Are you sure you want to remove this title from the crypt? This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(confirmId)}
                disabled={pending}
                className="flex-1 py-2 bg-red-900 text-red-100 font-medium rounded-lg hover:bg-red-800 transition-colors text-sm"
              >
                {pending ? "Removing..." : "Yes, Remove"}
              </button>
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 py-2 bg-shadow text-specter font-medium rounded-lg hover:bg-purple-deep transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
