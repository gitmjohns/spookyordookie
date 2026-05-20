export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UsernameForm } from "./UsernameForm";

export const metadata = { title: "Choose Your Username — SpookyorDookie" };

export default async function UsernamePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, username_confirmed")
    .eq("id", user.id)
    .maybeSingle();

  // Returning user who already confirmed — send them home
  if (!profile || profile.username_confirmed) redirect("/");

  return <UsernameForm suggestedUsername={profile.username} />;
}
