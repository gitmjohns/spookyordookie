"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminDeleteUser, adminSetRole, adminBanUser } from "@/app/actions/admin";
import { Pagination } from "@/components/Pagination";

interface UserRow {
  id: string;
  username: string;
  avatar_emoji: string;
  role: string;
  banned: boolean;
  created_at: string;
  is_prime_admin: boolean;
}

interface Props {
  users: UserRow[];
  search: string;
  page: number;
  totalPages: number;
  currentUserId: string;
}

type Modal =
  | { type: "block-prime-delete" }
  | { type: "block-prime-revoke" }
  | { type: "block-self-delete" }
  | { type: "block-self-revoke" }
  | { type: "confirm-delete"; userId: string; username: string; isAdmin: boolean }
  | { type: "confirm-revoke"; userId: string; username: string }
  | { type: "confirm-ban"; userId: string; username: string }
  | null;

export function UserTable({ users, search, page, totalPages, currentUserId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [modal, setModal] = useState<Modal>(null);

  function updateParams(params: Record<string, string>) {
    const p = new URLSearchParams();
    const merged = { search, page: String(page), ...params };
    if (merged.search) p.set("search", merged.search);
    if (merged.page && merged.page !== "1") p.set("page", merged.page);
    router.push(`/admin/users?${p.toString()}`);
  }

  function onDeleteClick(u: UserRow) {
    if (u.is_prime_admin) {
      setModal({ type: "block-prime-delete" });
    } else if (u.id === currentUserId) {
      setModal({ type: "block-self-delete" });
    } else {
      setModal({ type: "confirm-delete", userId: u.id, username: u.username, isAdmin: u.role === "admin" });
    }
  }

  function onRevokeClick(u: UserRow) {
    if (u.is_prime_admin) {
      setModal({ type: "block-prime-revoke" });
    } else if (u.id === currentUserId) {
      setModal({ type: "block-self-revoke" });
    } else {
      setModal({ type: "confirm-revoke", userId: u.id, username: u.username });
    }
  }

  function onBanClick(u: UserRow) {
    setModal({ type: "confirm-ban", userId: u.id, username: u.username });
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by username..."
          defaultValue={search}
          onKeyDown={e => {
            if (e.key === "Enter") updateParams({ search: (e.target as HTMLInputElement).value, page: "1" });
          }}
          onBlur={e => updateParams({ search: e.target.value, page: "1" })}
          className="w-full max-w-sm px-3 py-2 bg-tomb border border-shadow rounded-lg text-sm text-ghost placeholder-muted focus:outline-none focus:border-green-spooky"
        />
      </div>

      <div className="bg-tomb border border-shadow rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-shadow text-left">
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-muted font-semibold">User</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-muted font-semibold">Joined</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-muted font-semibold">Role</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-muted font-semibold">Status</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wider text-muted font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-shadow">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-shadow/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{u.avatar_emoji}</span>
                    <span className="text-ghost font-medium">{u.username}</span>
                    {u.is_prime_admin && (
                      <span className="px-1.5 py-0.5 rounded text-xs bg-yellow-400/15 text-yellow-400">Prime Admin</span>
                    )}
                    {u.id === currentUserId && (
                      <span className="px-1.5 py-0.5 rounded text-xs bg-green-spooky/15 text-green-spooky">You</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-specter text-xs">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === "admin" ? "bg-green-spooky/20 text-green-spooky" : "bg-shadow text-specter"}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.banned && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-900/40 text-red-400">Banned</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="px-2 py-1 text-xs bg-purple-deep text-purple-light rounded hover:bg-purple-mid transition-colors"
                    >
                      View
                    </Link>

                    {!u.is_prime_admin && (
                      <>
                        {u.role !== "admin" ? (
                          <button
                            onClick={() => startTransition(async () => { await adminSetRole(u.id, "admin"); })}
                            disabled={pending}
                            className="px-2 py-1 text-xs bg-shadow text-green-spooky rounded hover:bg-green-spooky/10 transition-colors"
                          >
                            Make Admin
                          </button>
                        ) : (
                          <button
                            onClick={() => onRevokeClick(u)}
                            disabled={pending}
                            className="px-2 py-1 text-xs bg-shadow text-yellow-400 rounded hover:bg-yellow-900/20 transition-colors"
                          >
                            Revoke Admin
                          </button>
                        )}

                        {!u.banned ? (
                          <button
                            onClick={() => onBanClick(u)}
                            disabled={pending}
                            className="px-2 py-1 text-xs bg-shadow text-orange-400 rounded hover:bg-orange-900/20 transition-colors"
                          >
                            Ban
                          </button>
                        ) : (
                          <button
                            onClick={() => startTransition(async () => { await adminBanUser(u.id, false); })}
                            disabled={pending}
                            className="px-2 py-1 text-xs bg-shadow text-green-spooky rounded hover:bg-green-spooky/10 transition-colors"
                          >
                            Unban
                          </button>
                        )}
                      </>
                    )}

                    {!u.is_prime_admin && (
                      <button
                        onClick={() => onDeleteClick(u)}
                        className="px-2 py-1 text-xs bg-shadow text-red-400 rounded hover:bg-red-900/30 transition-colors"
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
        {users.length === 0 && <p className="text-center py-12 text-muted">No users found.</p>}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/users"
        params={Object.fromEntries(Object.entries({ search }).filter(([, v]) => v))}
      />

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {/* Blocking: prime admin delete */}
      {modal?.type === "block-prime-delete" && (
        <Dialog>
          <h3 className="text-lg font-display text-ghost mb-3">Cannot Delete This Account</h3>
          <p className="text-sm text-specter mb-6">This account cannot be deleted.</p>
          <button onClick={() => setModal(null)} className="w-full py-2 bg-shadow text-ghost font-medium rounded-lg hover:bg-purple-deep transition-colors text-sm">OK</button>
        </Dialog>
      )}

      {/* Blocking: prime admin revoke */}
      {modal?.type === "block-prime-revoke" && (
        <Dialog>
          <h3 className="text-lg font-display text-ghost mb-3">Cannot Revoke This Access</h3>
          <p className="text-sm text-specter mb-6">The prime admin role cannot be changed.</p>
          <button onClick={() => setModal(null)} className="w-full py-2 bg-shadow text-ghost font-medium rounded-lg hover:bg-purple-deep transition-colors text-sm">OK</button>
        </Dialog>
      )}

      {/* Blocking: self-delete */}
      {modal?.type === "block-self-delete" && (
        <Dialog>
          <h3 className="text-lg font-display text-ghost mb-3">Cannot Delete Your Own Account</h3>
          <p className="text-sm text-specter mb-6">You cannot delete your own admin account. Please ask another admin to do this.</p>
          <button onClick={() => setModal(null)} className="w-full py-2 bg-shadow text-ghost font-medium rounded-lg hover:bg-purple-deep transition-colors text-sm">OK</button>
        </Dialog>
      )}

      {/* Blocking: self-revoke */}
      {modal?.type === "block-self-revoke" && (
        <Dialog>
          <h3 className="text-lg font-display text-ghost mb-3">Cannot Revoke Your Own Access</h3>
          <p className="text-sm text-specter mb-6">You cannot revoke your own admin access. Please ask another admin to do this.</p>
          <button onClick={() => setModal(null)} className="w-full py-2 bg-shadow text-ghost font-medium rounded-lg hover:bg-purple-deep transition-colors text-sm">OK</button>
        </Dialog>
      )}

      {/* Confirm: delete */}
      {modal?.type === "confirm-delete" && (
        <Dialog>
          <h3 className="text-lg font-display text-ghost mb-3">Delete Account?</h3>
          {modal.isAdmin && (
            <p className="text-sm text-red-400 font-medium mb-3">
              Warning: This is an admin account. Deleting this account will remove their admin access permanently.
            </p>
          )}
          <p className="text-sm text-specter mb-6">
            Are you sure you want to delete <strong className="text-ghost">{modal.username}</strong>'s account? This will permanently remove all their ratings, comments, and activity. This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { startTransition(async () => { await adminDeleteUser(modal.userId); setModal(null); }); }}
              disabled={pending}
              className="flex-1 py-2 bg-red-900 text-red-100 font-medium rounded-lg hover:bg-red-800 transition-colors text-sm"
            >
              {pending ? "Deleting..." : "Delete"}
            </button>
            <button onClick={() => setModal(null)} className="flex-1 py-2 bg-shadow text-specter font-medium rounded-lg text-sm">Cancel</button>
          </div>
        </Dialog>
      )}

      {/* Confirm: revoke admin */}
      {modal?.type === "confirm-revoke" && (
        <Dialog>
          <h3 className="text-lg font-display text-ghost mb-3">Revoke Admin Access?</h3>
          <p className="text-sm text-specter mb-6">
            This will remove admin access from <strong className="text-ghost">{modal.username}</strong>. They will no longer be able to access the admin panel.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { startTransition(async () => { await adminSetRole(modal.userId, "user"); setModal(null); }); }}
              disabled={pending}
              className="flex-1 py-2 bg-yellow-900 text-yellow-100 font-medium rounded-lg hover:bg-yellow-800 transition-colors text-sm"
            >
              {pending ? "Revoking..." : "Revoke Admin"}
            </button>
            <button onClick={() => setModal(null)} className="flex-1 py-2 bg-shadow text-specter font-medium rounded-lg text-sm">Cancel</button>
          </div>
        </Dialog>
      )}

      {/* Confirm: ban */}
      {modal?.type === "confirm-ban" && (
        <Dialog>
          <h3 className="text-lg font-display text-ghost mb-3">Ban User?</h3>
          <p className="text-sm text-specter mb-6">
            Ban <strong className="text-ghost">{modal.username}</strong>? They will no longer be able to post comments or replies. You can unban them at any time.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { startTransition(async () => { await adminBanUser(modal.userId, true); setModal(null); }); }}
              disabled={pending}
              className="flex-1 py-2 bg-orange-900 text-orange-100 font-medium rounded-lg hover:bg-orange-800 transition-colors text-sm"
            >
              {pending ? "Banning..." : "Ban User"}
            </button>
            <button onClick={() => setModal(null)} className="flex-1 py-2 bg-shadow text-specter font-medium rounded-lg text-sm">Cancel</button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function Dialog({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-void/80 flex items-center justify-center z-50 p-4">
      <div className="bg-tomb border border-shadow rounded-xl p-6 max-w-sm w-full shadow-2xl">
        {children}
      </div>
    </div>
  );
}
