"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { applyWordFilter } from "@/lib/wordFilter";

export async function downvoteComment(commentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("comment_downvotes")
    .select("id")
    .eq("user_id", user.id)
    .eq("comment_id", commentId)
    .single();

  if (existing) {
    await supabase.from("comment_downvotes").delete()
      .eq("user_id", user.id).eq("comment_id", commentId);
    await supabase.rpc("decrement_downvote", { comment_id: commentId });
  } else {
    await supabase.from("comment_downvotes")
      .insert({ user_id: user.id, comment_id: commentId });
    await supabase.rpc("increment_downvote", { comment_id: commentId });
  }

  return { success: true };
}

export async function addComment(
  titleId: string,
  content: string,
  parentId: string | null
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase.from("profiles").select("banned").eq("id", user.id).single();
  if (profile?.banned) return { error: "Your account has been suspended." };

  const { error } = await supabase.from("comments").insert({
    user_id: user.id,
    title_id: titleId,
    content: applyWordFilter(content),
    parent_id: parentId,
  });

  if (error) return { error: error.message };
  revalidatePath(`/movies/${titleId}`);
  revalidatePath(`/tv/${titleId}`);
  return { success: true };
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  // Also delete any replies to this comment
  await supabase.from("comments").delete().eq("parent_id", commentId);
  const { error } = await supabase.from("comments").delete()
    .eq("id", commentId).eq("user_id", user.id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function editComment(commentId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const trimmed = applyWordFilter(content.trim());
  if (!trimmed) return { error: "Comment cannot be empty" };
  const { error } = await supabase.from("comments")
    .update({ content: trimmed })
    .eq("id", commentId).eq("user_id", user.id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function upvoteComment(commentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("comment_votes")
    .select("id")
    .eq("user_id", user.id)
    .eq("comment_id", commentId)
    .single();

  if (existing) {
    await supabase
      .from("comment_votes")
      .delete()
      .eq("user_id", user.id)
      .eq("comment_id", commentId);

    await supabase.rpc("decrement_upvote", { comment_id: commentId });
  } else {
    await supabase
      .from("comment_votes")
      .insert({ user_id: user.id, comment_id: commentId });

    await supabase.rpc("increment_upvote", { comment_id: commentId });
  }

  return { success: true };
}
