"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminUpdateTitle, adminDeleteTitle } from "@/app/actions/admin";

const ALL_SUBGENRES = [
  "Slasher", "Supernatural", "Found Footage", "Body Horror",
  "Comedy Horror", "Sci-Fi Horror", "Creature Feature", "Folk Horror",
  "Zombie", "Vampire", "Werewolf", "Ghost", "Action-Horror", "Occult",
  "Cult Classic",
];

interface Title {
  id: string;
  title: string;
  release_year: number | null;
  critic_score: number;
  subgenres: string[] | null;
  overview: string | null;
  media_type: "movie" | "tv";
  poster_path: string | null;
}

export function TitleEditForm({ title }: { title: Title }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showDelete, setShowDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState(title.title);
  const [year, setYear] = useState(String(title.release_year ?? ""));
  const [score, setScore] = useState(String(title.critic_score));
  const [overview, setOverview] = useState(title.overview ?? "");
  const [mediaType, setMediaType] = useState<"movie" | "tv">(title.media_type);
  const [subgenres, setSubgenres] = useState<string[]>(title.subgenres ?? []);

  function toggleSubgenre(sg: string) {
    setSubgenres(prev => prev.includes(sg) ? prev.filter(s => s !== sg) : [...prev, sg]);
  }

  function handleSave() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const res = await adminUpdateTitle(title.id, {
        title: name.trim(),
        release_year: year ? parseInt(year, 10) : null,
        critic_score: parseInt(score, 10),
        subgenres,
        overview: overview.trim() || null,
        media_type: mediaType,
      });
      if (res?.error) setError(res.error);
      else setSuccess(true);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await adminDeleteTitle(title.id);
      router.push("/admin/titles");
    });
  }

  return (
    <div className="space-y-5">
      {title.poster_path && (
        <img
          src={`https://image.tmdb.org/t/p/w185${title.poster_path}`}
          alt={title.title}
          className="w-24 rounded-lg border border-shadow"
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs text-muted uppercase tracking-wider mb-1.5">Title</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 bg-crypt border border-shadow rounded-lg text-ghost text-sm focus:outline-none focus:border-green-spooky"
          />
        </div>
        <div>
          <label className="block text-xs text-muted uppercase tracking-wider mb-1.5">Year</label>
          <input
            type="number"
            value={year}
            onChange={e => setYear(e.target.value)}
            className="w-full px-3 py-2 bg-crypt border border-shadow rounded-lg text-ghost text-sm focus:outline-none focus:border-green-spooky"
          />
        </div>
        <div>
          <label className="block text-xs text-muted uppercase tracking-wider mb-1.5">Critic Score</label>
          <input
            type="number"
            min={0}
            max={100}
            value={score}
            onChange={e => setScore(e.target.value)}
            className="w-full px-3 py-2 bg-crypt border border-shadow rounded-lg text-ghost text-sm focus:outline-none focus:border-green-spooky"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-muted uppercase tracking-wider mb-1.5">Media Type</label>
        <div className="flex gap-4">
          {(["movie", "tv"] as const).map(mt => (
            <label key={mt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={mt}
                checked={mediaType === mt}
                onChange={() => setMediaType(mt)}
                className="accent-green-spooky"
              />
              <span className="text-sm text-specter capitalize">{mt === "tv" ? "TV" : "Movie"}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-muted uppercase tracking-wider mb-1.5">Subgenres</label>
        <div className="flex flex-wrap gap-2">
          {ALL_SUBGENRES.map(sg => (
            <button
              key={sg}
              type="button"
              onClick={() => toggleSubgenre(sg)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                subgenres.includes(sg)
                  ? "bg-green-spooky text-void"
                  : "bg-shadow text-specter hover:text-ghost"
              }`}
            >
              {sg}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-muted uppercase tracking-wider mb-1.5">Overview</label>
        <textarea
          value={overview}
          onChange={e => setOverview(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 bg-crypt border border-shadow rounded-lg text-ghost text-sm focus:outline-none focus:border-green-spooky resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-green-spooky">Saved successfully.</p>}

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handleSave}
          disabled={pending}
          className="px-5 py-2 bg-green-spooky text-void font-bold text-sm rounded-lg hover:bg-green-dark transition-colors disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save Changes"}
        </button>
        <button
          onClick={() => setShowDelete(true)}
          className="px-4 py-2 bg-shadow text-red-400 text-sm rounded-lg hover:bg-red-900/30 transition-colors"
        >
          Delete Title
        </button>
      </div>

      {showDelete && (
        <div className="fixed inset-0 bg-void/80 flex items-center justify-center z-50 p-4">
          <div className="bg-tomb border border-shadow rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-display text-ghost mb-2">Remove from the Crypt?</h3>
            <p className="text-sm text-specter mb-6">Are you sure you want to remove this title from the crypt? This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={pending}
                className="flex-1 py-2 bg-red-900 text-red-100 font-medium rounded-lg hover:bg-red-800 transition-colors text-sm"
              >
                {pending ? "Removing..." : "Yes, Remove"}
              </button>
              <button
                onClick={() => setShowDelete(false)}
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
