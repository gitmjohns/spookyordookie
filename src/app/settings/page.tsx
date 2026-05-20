export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./SettingsForm";

export const metadata = { title: "Settings — SpookyorDookie" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_emoji, avatar_bg, is_prime_admin")
    .eq("id", user.id)
    .single();

  return (
    <SettingsForm
      initialUsername={profile?.username ?? ""}
      initialEmoji={(profile?.avatar_emoji as string) ?? "💀"}
      initialBg={(profile?.avatar_bg as string) ?? "#0a0a0f"}
      isPrimeAdmin={profile?.is_prime_admin === true}
    />
  );
}
