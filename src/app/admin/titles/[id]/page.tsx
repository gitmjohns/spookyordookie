export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { adminDb } from "@/lib/supabase/admin";
import { TitleEditForm } from "./TitleEditForm";

export default async function EditTitlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const svc = adminDb();
  const { data: title } = await svc.from("titles").select("*").eq("id", id).single();
  if (!title) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-display text-ghost mb-6">Edit Title</h1>
      <TitleEditForm title={title as any} />
    </div>
  );
}
