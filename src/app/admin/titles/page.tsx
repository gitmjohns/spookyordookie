export const dynamic = "force-dynamic";

import Link from "next/link";
import { adminDb } from "@/lib/supabase/admin";
import { TitleTable } from "./TitleTable";

const PER_PAGE = 40;

export default async function AdminTitlesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; type?: string; letter?: string }>;
}) {
  const { search = "", page: pageStr = "1", type = "", letter = "" } = await searchParams;
  const page = Math.max(1, parseInt(pageStr, 10) || 1);
  const offset = (page - 1) * PER_PAGE;

  const svc = adminDb();
  let q = svc.from("titles").select("id,title,release_year,media_type,critic_score,subgenres,poster_path", { count: "exact" });
  if (search) q = q.ilike("title", `%${search}%`);
  if (type === "movie" || type === "tv") q = q.eq("media_type", type);

  // Letter jump filter
  if (letter && letter !== "#") {
    q = q.ilike("title", `${letter}%`);
  } else if (letter === "#") {
    // Titles starting with a non-alphabetic character
    for (const l of "abcdefghijklmnopqrstuvwxyz") {
      q = (q as any).not("title", "ilike", `${l}%`);
    }
  }

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
        letter={letter}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}
