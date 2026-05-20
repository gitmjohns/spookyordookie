"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { usernameHasBannedWord } from "@/lib/wordFilter";

function serviceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function confirmUsername(username: string) {
  const trimmed = username.trim().toLowerCase();
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmed)) {
    return { error: "Username must be 3–20 chars, letters/numbers/underscores only" };
  }
  if (usernameHasBannedWord(trimmed)) {
    return { error: "Username not allowed" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: conflict } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", trimmed)
    .neq("id", user.id)
    .maybeSingle();
  if (conflict) return { error: "Username already taken" };

  const { error } = await supabase
    .from("profiles")
    .update({ username: trimmed, username_confirmed: true })
    .eq("id", user.id);
  if (error) return { error: error.message };

  // Set cookie so middleware skips the DB query on future requests
  const cookieStore = await cookies();
  cookieStore.set("username_confirmed", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function updateUsername(username: string) {
  const trimmed = username.trim().toLowerCase();
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmed)) {
    return { error: "Username must be 3-20 chars, letters/numbers/underscores only" };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", trimmed)
    .neq("id", user.id)
    .single();
  if (existing) return { error: "Username already taken" };
  const { error } = await supabase.from("profiles").update({ username: trimmed }).eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  revalidatePath(`/profile/${trimmed}`);
  return { success: true };
}

export async function updateEmail(email: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email });
  if (error) return { error: error.message };
  return { success: true, message: "Check your new email for a confirmation link" };
}

export async function updatePassword(newPassword: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return { success: true };
}

export async function updateAvatarEmoji(emoji: string) {
  const VALID = ['💀','👻','🧟','🕷','🎃','🧛','🔪','🪓','🩸','🦇','🐺','👁','🕸','⚰️','🪦','🧠','🐀','🌕'];
  if (!VALID.includes(emoji)) return { error: "Invalid emoji selection" };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { error } = await supabase.from("profiles").update({ avatar_emoji: emoji }).eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

export async function updateAvatarAppearance(emoji: string, bg: string) {
  const VALID_EMOJI = ['💀','👻','🧟','🕷','🎃','🧛','🔪','🪓','🩸','🦇','🐺','👁','🕸','⚰️','🪦','🧠','🐀','🌕'];
  const VALID_BG   = ['#0a0a0f','#2d0a4a','#4a0a0a','#0a0a3a','#2a1500','#1a1a2a','#3a1500','#0a2a0a','#0a1a2a','#3a0015'];
  if (!VALID_EMOJI.includes(emoji)) return { error: "Invalid emoji selection" };
  if (!VALID_BG.includes(bg))       return { error: "Invalid color selection" };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { error } = await supabase.from("profiles").update({ avatar_emoji: emoji, avatar_bg: bg }).eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

export async function deleteAccount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_prime_admin")
    .eq("id", user.id)
    .single();
  if (profile?.is_prime_admin) {
    return { error: "This account cannot be deleted" };
  }

  const svc = serviceClient();
  await Promise.all([
    svc.from("watchlist").delete().eq("user_id", user.id),
    svc.from("ratings").delete().eq("user_id", user.id),
    svc.from("comment_votes").delete().eq("user_id", user.id),
    svc.from("comment_downvotes").delete().eq("user_id", user.id),
    svc.from("debate_replies").delete().eq("user_id", user.id),
    svc.from("notifications").delete().eq("user_id", user.id),
    svc.from("activity_feed").delete().eq("user_id", user.id),
  ]);
  await svc.from("comments").delete().eq("user_id", user.id);
  await svc.from("profiles").delete().eq("id", user.id);
  await svc.auth.admin.deleteUser(user.id);
  await supabase.auth.signOut();
  return { success: true };
}
