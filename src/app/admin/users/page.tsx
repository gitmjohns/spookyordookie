import { adminDb } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { UserTable } from "./UserTable";

const PER_PAGE = 40;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const { search = "", page: pageStr = "1" } = await searchParams;
  const page = Math.max(1, parseInt(pageStr, 10) || 1);
  const offset = (page - 1) * PER_PAGE;

  const [supabase, svc] = [await createClient(), adminDb()];
  const { data: { user } } = await supabase.auth.getUser();

  let q = svc
    .from("profiles")
    .select("id,username,avatar_emoji,role,banned,created_at", { count: "exact" });
  if (search) q = q.ilike("username", `%${search}%`);
  q = q.order("created_at", { ascending: false }).range(offset, offset + PER_PAGE - 1);

  const { data: users, count } = await q;
  const totalPages = Math.ceil((count ?? 0) / PER_PAGE);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display text-ghost">Users</h1>
        <p className="text-sm text-muted mt-0.5">{count ?? 0} total</p>
      </div>
      <UserTable
        users={(users ?? []) as any[]}
        search={search}
        page={page}
        totalPages={totalPages}
        currentUserId={user?.id ?? ""}
      />
    </div>
  );
}
