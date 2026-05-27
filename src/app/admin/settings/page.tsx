export const dynamic = "force-dynamic";

import { adminDb } from "@/lib/supabase/admin";
import { AdminSettingsForm } from "./AdminSettingsForm";

export default async function AdminSettingsPage() {
  const svc = adminDb();

  const [
    { data: setting },
    { count: totalTitles },
    { count: totalUsers },
    { count: totalRatings },
    { count: totalComments },
    { count: newUsersWeek },
    { count: newRatingsWeek },
  ] = await Promise.all([
    svc.from("site_settings").select("value").eq("key", "featured_subgenre").single(),
    svc.from("titles").select("*", { count: "exact", head: true }),
    svc.from("profiles").select("*", { count: "exact", head: true }),
    svc.from("ratings").select("*", { count: "exact", head: true }),
    svc.from("comments").select("*", { count: "exact", head: true }),
    svc.from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    svc.from("ratings")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const stats = [
    { label: "Total Titles",       value: totalTitles ?? 0 },
    { label: "Total Users",        value: totalUsers ?? 0 },
    { label: "Total Ratings",      value: totalRatings ?? 0 },
    { label: "Total Comments",     value: totalComments ?? 0 },
    { label: "New Users (7 days)", value: newUsersWeek ?? 0 },
    { label: "New Ratings (7 days)", value: newRatingsWeek ?? 0 },
  ];

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-display text-ghost">Site Settings</h1>

      <AdminSettingsForm currentSubgenre={setting?.value ?? "Supernatural"} />

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">Site Stats</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {stats.map(s => (
            <div key={s.label} className="bg-tomb border border-shadow rounded-xl p-4">
              <p className="text-2xl font-display text-green-spooky">{s.value.toLocaleString()}</p>
              <p className="text-xs text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
