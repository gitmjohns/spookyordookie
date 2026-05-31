import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adminDb } from "@/lib/supabase/admin";
import { AdminLayoutClient } from "./AdminLayoutClient";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // Use service role client so RLS cannot block the role check.
  const { data: profile } = await adminDb()
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
