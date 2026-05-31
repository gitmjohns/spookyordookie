"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { adminDb } from "@/lib/supabase/admin";
import { ratingLimiter } from "@/lib/rate-limit";

export async function submitRating(titleId: string, score: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  try { await ratingLimiter.consume(user.id); }
  catch { return { error: "Slow down — you're rating too fast" }; }

  const { error } = await adminDb().from("ratings").upsert(
    { user_id: user.id, title_id: titleId, score },
    { onConflict: "user_id,title_id" }
  );

  if (error) return { error: error.message };
  revalidatePath(`/movies/${titleId}`);
  revalidatePath(`/tv/${titleId}`);
  return { success: true };
}

export async function getUserRating(titleId: string): Promise<number | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Use service role so RLS cannot block the read.
  const { data } = await adminDb()
    .from("ratings")
    .select("score")
    .eq("user_id", user.id)
    .eq("title_id", titleId)
    .maybeSingle();

  return data?.score ?? null;
}
