import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ unread_count: 0, recent: [] });

  const [{ count }, { data: notifs }] = await Promise.all([
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false),
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const actorIds = [
    ...new Set((notifs ?? []).filter((n) => n.actor_id).map((n) => n.actor_id as string)),
  ];
  const titleIds = [
    ...new Set((notifs ?? []).filter((n) => n.title_id).map((n) => n.title_id as string)),
  ];

  const [profilesRes, titlesRes] = await Promise.all([
    actorIds.length > 0
      ? supabase.from("profiles").select("id,username,avatar_emoji,avatar_bg").in("id", actorIds)
      : Promise.resolve({ data: [] as { id: string; username: string; avatar_emoji: string; avatar_bg: string }[] }),
    titleIds.length > 0
      ? supabase.from("titles").select("id,title,media_type").in("id", titleIds)
      : Promise.resolve({ data: [] as { id: string; title: string; media_type: string }[] }),
  ]);

  const profileMap = Object.fromEntries(
    (profilesRes.data ?? []).map((p: { id: string; username: string; avatar_emoji: string; avatar_bg: string }) => [p.id, p])
  );
  const titleMap = Object.fromEntries(
    (titlesRes.data ?? []).map((t: { id: string; title: string; media_type: string }) => [t.id, t])
  );

  const recent = (notifs ?? []).map((n) => ({
    ...n,
    actor_profile: n.actor_id ? profileMap[n.actor_id] : null,
    title: n.title_id ? titleMap[n.title_id] : null,
  }));

  return NextResponse.json({ unread_count: count ?? 0, recent });
}
