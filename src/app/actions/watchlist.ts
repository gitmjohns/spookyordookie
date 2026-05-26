"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { applyWordFilter } from "@/lib/wordFilter";
import { sanitizeText } from "@/lib/sanitize";
import { postLimiter } from "@/lib/rate-limit";

function serviceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function toggleWatchlist(titleId: string, currentlyInList: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (currentlyInList) {
    await supabase.from("watchlist").delete()
      .eq("user_id", user.id).eq("title_id", titleId);
  } else {
    await supabase.from("watchlist").insert({ user_id: user.id, title_id: titleId });
  }

  revalidatePath("/watchlist");
  return { success: true };
}

export async function markWatched(titleId: string, watched: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  await supabase.from("watchlist")
    .update({ watched, watched_at: watched ? new Date().toISOString() : null })
    .eq("user_id", user.id).eq("title_id", titleId);
  revalidatePath("/watchlist");
  return { success: true };
}

export async function editDebateReply(replyId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  try { await postLimiter.consume(user.id); }
  catch { return { error: "Slow down — you're posting too fast" }; }
  const trimmed = applyWordFilter(sanitizeText(content.trim()));
  if (!trimmed) return { error: "Reply cannot be empty" };
  const { error } = await supabase.from("debate_replies")
    .update({ content: trimmed })
    .eq("id", replyId).eq("user_id", user.id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function addDebateReply(threadId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase.from("profiles").select("banned").eq("id", user.id).single();
  if (profile?.banned) return { error: "Your account has been suspended." };

  try { await postLimiter.consume(user.id); }
  catch { return { error: "Slow down — you're posting too fast" }; }

  const { error } = await supabase.from("debate_replies")
    .insert({ thread_id: threadId, user_id: user.id, content: applyWordFilter(sanitizeText(content.trim())) });

  if (error) return { error: error.message };

  // Auto-follow the thread for the poster
  await supabase.from("debate_follows")
    .upsert({ user_id: user.id, thread_id: threadId }, { onConflict: "user_id,thread_id" });

  // Notify all other followers using service role (inserts for other users)
  const svc = serviceClient();
  const [{ data: thread }, { data: followers }] = await Promise.all([
    svc.from("debate_threads").select("title_id").eq("id", threadId).single(),
    svc.from("debate_follows").select("user_id").eq("thread_id", threadId).neq("user_id", user.id),
  ]);

  if (thread?.title_id && followers && followers.length > 0) {
    await svc.from("notifications").insert(
      followers.map((f: { user_id: string }) => ({
        user_id: f.user_id,
        actor_id: user.id,
        title_id: thread.title_id,
        type: "debate_follow_reply",
        read: false,
      }))
    );
  }

  return { success: true };
}

export async function toggleDebateFollow(threadId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("debate_follows")
    .select("id")
    .eq("user_id", user.id)
    .eq("thread_id", threadId)
    .maybeSingle();

  if (existing) {
    await supabase.from("debate_follows")
      .delete().eq("user_id", user.id).eq("thread_id", threadId);
    return { success: true, following: false };
  } else {
    await supabase.from("debate_follows")
      .insert({ user_id: user.id, thread_id: threadId });
    return { success: true, following: true };
  }
}
