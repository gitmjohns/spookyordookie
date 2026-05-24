"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, useRef, useEffect } from "react";
import {
  adminUpdateDebatePrompt,
  adminDeleteDebateReply,
  adminCreateDebateThread,
  adminSearchTitles,
} from "@/app/actions/admin";

interface Thread {
  id: string;
  prompt: string;
  title_id: string;
  titles: { title: string; media_type: string } | null;
}

interface Reply {
  id: string;
  content: string;
  created_at: string;
  upvote_count: number;
  user_id: string;
  profiles: { username: string; avatar_emoji: string } | null;
}

interface TitleResult {
  id: string;
  title: string;
  media_type: string;
  release_year: number | null;
}

interface Props {
  threads: Thread[];
  selectedThreadId: string | null;
  replies: Reply[];
}

export function DebateManagement({ threads, selectedThreadId, replies }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingThread, setEditingThread] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [confirmReply, setConfirmReply] = useState<string | null>(null);

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TitleResult[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<TitleResult | null>(null);
  const [newPrompt, setNewPrompt] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createPending, startCreateTransition] = useTransition();
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSearchResults([]);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function selectThread(id: string) {
    router.push(`/admin/debates?thread=${id}`);
  }

  function startEdit(thread: Thread) {
    setEditingThread(thread.id);
    setEditPrompt(thread.prompt);
  }

  function handleSavePrompt(threadId: string) {
    const thread = threads.find((t) => t.id === threadId);
    startTransition(async () => {
      await adminUpdateDebatePrompt(threadId, editPrompt, thread?.title_id, thread?.titles?.media_type);
      setEditingThread(null);
      router.refresh();
    });
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setSearchQuery(q);
    setSelectedTitle(null);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!q.trim()) { setSearchResults([]); return; }
    searchTimerRef.current = setTimeout(async () => {
      const results = await adminSearchTitles(q);
      setSearchResults(results);
    }, 300);
  }

  function handleSelectTitle(t: TitleResult) {
    setSelectedTitle(t);
    setSearchQuery(`${t.title}${t.release_year ? ` (${t.release_year})` : ""}`);
    setSearchResults([]);
    setCreateError(null);
  }

  function handleCreate() {
    if (!selectedTitle || !newPrompt.trim()) return;
    setCreateError(null);
    startCreateTransition(async () => {
      const result = await adminCreateDebateThread(selectedTitle.id, newPrompt, selectedTitle.media_type);
      if ("error" in result && result.error) {
        setCreateError(result.error);
      } else {
        setShowCreate(false);
        setSearchQuery("");
        setSelectedTitle(null);
        setNewPrompt("");
        router.refresh();
      }
    });
  }

  function cancelCreate() {
    setShowCreate(false);
    setSearchQuery("");
    setSelectedTitle(null);
    setNewPrompt("");
    setCreateError(null);
    setSearchResults([]);
  }

  const selectedThread = threads.find((t) => t.id === selectedThreadId);

  return (
    <div className="space-y-6">
      {/* Create form */}
      {showCreate ? (
        <div className="bg-tomb border border-shadow rounded-xl p-5 space-y-4">
          <h2 className="text-base font-display text-ghost">New Debate Thread</h2>

          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs text-muted uppercase tracking-wider mb-1.5">Title</label>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search for a title…"
              autoFocus
              className="w-full px-3 py-2 bg-crypt border border-shadow rounded-lg text-ghost text-sm placeholder-muted focus:outline-none focus:border-green-spooky"
            />
            {searchResults.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-tomb border border-shadow rounded-lg shadow-2xl max-h-52 overflow-y-auto">
                {searchResults.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onMouseDown={() => handleSelectTitle(t)}
                    className="w-full text-left px-3 py-2.5 hover:bg-shadow/60 text-sm text-ghost transition-colors flex items-center justify-between gap-4"
                  >
                    <span>{t.title}{t.release_year ? ` (${t.release_year})` : ""}</span>
                    <span className="text-xs text-muted uppercase shrink-0">{t.media_type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-muted uppercase tracking-wider mb-1.5">Debate Prompt</label>
            <textarea
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              rows={3}
              placeholder="Is this actually scary, or just overhyped?"
              className="w-full px-3 py-2 bg-crypt border border-shadow rounded-lg text-ghost text-sm placeholder-muted focus:outline-none focus:border-green-spooky resize-none"
            />
          </div>

          {createError && (
            <p className="text-sm text-red-400 bg-red-900/20 px-3 py-2 rounded-lg">{createError}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={createPending || !selectedTitle || !newPrompt.trim()}
              className="px-4 py-1.5 bg-green-spooky text-void text-sm font-bold rounded-lg hover:bg-green-dark transition-colors disabled:opacity-50"
            >
              {createPending ? "Creating…" : "Create Thread"}
            </button>
            <button
              onClick={cancelCreate}
              className="px-4 py-1.5 bg-shadow text-specter text-sm font-bold rounded-lg hover:bg-tomb transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-green-spooky text-void text-sm font-bold rounded-lg hover:bg-green-dark transition-colors"
        >
          + Create New Debate Thread
        </button>
      )}

      <div className="flex gap-6">
        {/* Thread list */}
        <div className="w-72 flex-shrink-0">
          <div className="bg-tomb border border-shadow rounded-xl divide-y divide-shadow max-h-[600px] overflow-y-auto">
            {threads.map((t) => (
              <button
                key={t.id}
                onClick={() => selectThread(t.id)}
                className={`w-full text-left px-4 py-3 hover:bg-shadow/40 transition-colors ${
                  selectedThreadId === t.id ? "bg-purple-deep/50 border-l-2 border-green-spooky" : ""
                }`}
              >
                <p className="text-ghost text-sm font-medium truncate">{t.titles?.title ?? "Unknown"}</p>
                <p className="text-specter text-xs mt-0.5 truncate">{t.prompt}</p>
              </button>
            ))}
            {threads.length === 0 && (
              <p className="text-center py-8 text-muted text-sm">No debate threads yet.</p>
            )}
          </div>
        </div>

        {/* Thread detail */}
        <div className="flex-1 min-w-0">
          {selectedThread ? (
            <div className="space-y-5">
              <div className="bg-tomb border border-shadow rounded-xl p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs text-muted uppercase tracking-wider mb-1">Debate Prompt</p>
                    <p className="text-lg text-ghost font-display">{selectedThread.titles?.title ?? "Unknown"}</p>
                  </div>
                  {editingThread !== selectedThread.id && (
                    <button
                      onClick={() => startEdit(selectedThread)}
                      className="px-3 py-1.5 text-xs font-bold bg-purple-deep text-purple-light rounded hover:bg-purple-mid transition-colors flex-shrink-0"
                    >
                      Edit Prompt
                    </button>
                  )}
                </div>

                {editingThread === selectedThread.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-crypt border border-shadow rounded-lg text-ghost text-sm focus:outline-none focus:border-green-spooky resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSavePrompt(selectedThread.id)}
                        disabled={pending || !editPrompt.trim()}
                        className="px-4 py-1.5 bg-green-spooky text-void text-sm font-bold rounded-lg hover:bg-green-dark transition-colors disabled:opacity-50"
                      >
                        {pending ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => setEditingThread(null)}
                        className="px-4 py-1.5 bg-shadow text-specter text-sm font-bold rounded-lg hover:bg-tomb transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-specter text-sm">{selectedThread.prompt}</p>
                )}
              </div>

              <div>
                <p className="text-xs text-muted uppercase tracking-wider mb-3">
                  Replies ({replies.length})
                </p>
                <div className="bg-tomb border border-shadow rounded-xl divide-y divide-shadow">
                  {replies.map((r) => (
                    <div key={r.id} className="px-4 py-3 flex items-start gap-3">
                      <span className="text-lg flex-shrink-0">{r.profiles?.avatar_emoji ?? "💀"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-ghost text-sm font-medium">
                            {r.profiles?.username ?? "Unknown"}
                          </span>
                          <span className="text-muted text-xs">
                            {new Date(r.created_at).toLocaleDateString()}
                          </span>
                          {r.upvote_count > 0 && (
                            <span className="text-xs text-specter">↑ {r.upvote_count}</span>
                          )}
                        </div>
                        <p className="text-specter text-sm">{r.content}</p>
                      </div>
                      <button
                        onClick={() => setConfirmReply(r.id)}
                        className="px-2.5 py-1 text-xs font-bold bg-shadow text-red-400 rounded hover:bg-red-900/30 transition-colors flex-shrink-0"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                  {replies.length === 0 && (
                    <p className="text-center py-8 text-muted text-sm">No replies yet.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-tomb border border-shadow rounded-xl p-8 text-center text-muted">
              Select a debate thread to view replies and edit the prompt.
            </div>
          )}
        </div>
      </div>

      {confirmReply && (
        <div className="fixed inset-0 bg-void/80 flex items-center justify-center z-50 p-4">
          <div className="bg-tomb border border-shadow rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-display text-ghost mb-2">Delete Reply?</h3>
            <p className="text-sm text-specter mb-6">
              This will permanently remove this debate reply.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  startTransition(async () => {
                    await adminDeleteDebateReply(confirmReply);
                    setConfirmReply(null);
                    router.refresh();
                  });
                }}
                disabled={pending}
                className="flex-1 py-2 bg-red-900 text-red-100 font-bold rounded-lg hover:bg-red-800 text-sm"
              >
                {pending ? "Deleting…" : "Delete"}
              </button>
              <button
                onClick={() => setConfirmReply(null)}
                className="flex-1 py-2 bg-shadow text-specter font-bold rounded-lg text-sm"
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
