export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./SettingsForm";

export const metadata = { title: "Settings — SpookyorDookie" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Split into two queries so an issue with is_prime_admin never
  // prevents the essential form data (username, emoji, bg) from loading.
  const [{ data: profile }, { data: adminRow }] = await Promise.all([
    supabase.from("profiles").select("username, avatar_emoji, avatar_bg").eq("id", user.id).maybeSingle(),
    supabase.from("profiles").select("is_prime_admin").eq("id", user.id).maybeSingle(),
  ]);

  return (
    <SettingsForm
      initialUsername={profile?.username ?? ""}
      initialEmoji={(profile?.avatar_emoji as string) ?? "💀"}
      initialBg={(profile?.avatar_bg as string) ?? "#0a0a0f"}
      isPrimeAdmin={adminRow?.is_prime_admin === true}
    />
  );
}
