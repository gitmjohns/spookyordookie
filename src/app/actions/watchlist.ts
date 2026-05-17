"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { applyWordFilter } from "@/lib/wordFilter";

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
  const trimmed = applyWordFilter(content.trim());
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

  const { error } = await supabase.from("debate_replies")
    .insert({ thread_id: threadId, user_id: user.id, content: applyWordFilter(content.trim()) });

  if (error) return { error: error.message };
  return { success: true };
}
