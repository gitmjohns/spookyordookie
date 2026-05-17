import Link from "next/link";
import { adminDb } from "@/lib/supabase/admin";
import { TitleTable } from "./TitleTable";

const PER_PAGE = 40;

export default async function AdminTitlesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; type?: string }>;
}) {
  const { search = "", page: pageStr = "1", type = "" } = await searchParams;
  const page = Math.max(1, parseInt(pageStr, 10) || 1);
  const offset = (page - 1) * PER_PAGE;

  const svc = adminDb();
  let q = svc.from("titles").select("id,title,release_year,media_type,critic_score,subgenres,poster_path", { count: "exact" });
  if (search) q = q.ilike("title", `%${search}%`);
  if (type === "movie" || type === "tv") q = q.eq("media_type", type);
  q = q.order("title", { ascending: true }).range(offset, offset + PER_PAGE - 1);

  const { data: titles, count } = await q;
  const totalPages = Math.ceil((count ?? 0) / PER_PAGE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display text-ghost">Titles</h1>
          <p className="text-sm text-muted mt-0.5">{count ?? 0} total</p>
        </div>
        <Link
          href="/admin/titles/new"
          className="px-4 py-2 bg-green-spooky text-void text-sm font-bold rounded-lg hover:bg-green-dark transition-colors"
        >
          + Add New Title
        </Link>
      </div>

      <TitleTable
        titles={(titles ?? []) as any[]}
        search={search}
        type={type}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}
