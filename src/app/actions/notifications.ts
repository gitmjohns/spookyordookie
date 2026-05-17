"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Notification } from "@/lib/types";

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);
  return count ?? 0;
}

export async function getRecentNotifications(limit = 5): Promise<Notification[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data || data.length === 0) return [];

  const actorIds = [...new Set(data.filter((n) => n.actor_id).map((n) => n.actor_id as string))];
  const titleIds = [...new Set(data.filter((n) => n.title_id).map((n) => n.title_id as string))];

  const [profilesRes, titlesRes] = await Promise.all([
    actorIds.length > 0
      ? supabase.from("profiles").select("id,username,avatar_emoji").in("id", actorIds)
      : Promise.resolve({ data: [] as { id: string; username: string; avatar_emoji: string }[] }),
    titleIds.length > 0
      ? supabase.from("titles").select("id,title,media_type").in("id", titleIds)
      : Promise.resolve({ data: [] as { id: string; title: string; media_type: string }[] }),
  ]);

  const profileMap = Object.fromEntries(
    (profilesRes.data ?? []).map((p) => [p.id, p])
  );
  const titleMap = Object.fromEntries(
    (titlesRes.data ?? []).map((t) => [t.id, t])
  );

  return (data ?? []).map((n) => ({
    ...n,
    actor_profile: n.actor_id ? profileMap[n.actor_id] : undefined,
    title: n.title_id ? titleMap[n.title_id] : undefined,
  })) as Notification[];
}

export async function markAllRead() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);
  revalidatePath("/notifications");
  return { success: true };
}

export async function markOneRead(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("user_id", user.id);
  return { success: true };
}
