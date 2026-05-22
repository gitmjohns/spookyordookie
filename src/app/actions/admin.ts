"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { adminDb } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Not authorized");
  return adminDb();
}

// ── Titles ────────────────────────────────────────────────────────────────────

export async function adminUpdateTitle(id: string, data: {
  title?: string;
  release_year?: number | null;
  critic_score?: number;
  subgenres?: string[];
  overview?: string | null;
  media_type?: "movie" | "tv";
}) {
  const svc = await requireAdmin();
  const { error } = await svc.from("titles").update(data).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/movies");
  revalidatePath("/tv");
  revalidatePath("/admin/titles");
  return { success: true };
}

export async function adminDeleteTitle(id: string) {
  const svc = await requireAdmin();
  const { error } = await svc.from("titles").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/movies");
  revalidatePath("/tv");
  revalidatePath("/admin/titles");
  return { success: true };
}

const TMDB_BASE = "https://api.themoviedb.org/3";

export async function adminImportTitle(
  tmdbId: number,
  mediaType: "movie" | "tv",
  subgenres: string[],
  criticScore: number
) {
  const svc = await requireAdmin();
  const path = mediaType === "movie" ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;
  const res = await fetch(
    `${TMDB_BASE}${path}?api_key=${process.env.TMDB_API_KEY}&language=en-US`,
    { cache: "no-store" }
  );
  if (!res.ok) return { error: "TMDB fetch failed" };
  const td = await res.json();
  const isMovie = mediaType === "movie";
  const title = isMovie ? td.title : td.name;
  const dateStr = isMovie ? td.release_date : td.first_air_date;
  const releaseYear = dateStr ? parseInt(dateStr.split("-")[0], 10) : null;
  const genres = (td.genres ?? []).map((g: { name: string }) => g.name);

  const { error } = await svc.from("titles").upsert({
    tmdb_id: tmdbId, media_type: mediaType, title,
    overview: td.overview || null,
    poster_path: td.poster_path ?? null,
    backdrop_path: td.backdrop_path ?? null,
    release_year: releaseYear, genres,
    subgenres, critic_score: criticScore,
  }, { onConflict: "tmdb_id,media_type" });

  if (error) return { error: error.message };
  revalidatePath("/admin/titles");
  return { success: true };
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function adminDeleteUser(userId: string) {
  const svc = await requireAdmin();

  const { data: target } = await svc.from("profiles").select("is_prime_admin").eq("id", userId).single();
  if (target?.is_prime_admin) {
    return { error: "This account cannot be deleted" };
  }

  await Promise.all([
    svc.from("watchlist").delete().eq("user_id", userId),
    svc.from("ratings").delete().eq("user_id", userId),
    svc.from("comment_votes").delete().eq("user_id", userId),
    svc.from("comment_downvotes").delete().eq("user_id", userId),
    svc.from("debate_replies").delete().eq("user_id", userId),
    svc.from("notifications").delete().eq("user_id", userId),
    svc.from("activity_feed").delete().eq("user_id", userId),
  ]);
  await svc.from("comments").delete().eq("user_id", userId);
  await svc.from("profiles").delete().eq("id", userId);
  await svc.auth.admin.deleteUser(userId);
  revalidatePath("/admin/users");
  return { success: true };
}

export async function adminSetRole(userId: string, role: "admin" | "user") {
  const svc = await requireAdmin();

  if (role !== "admin") {
    const { data: target } = await svc.from("profiles").select("is_prime_admin").eq("id", userId).single();
    if (target?.is_prime_admin) {
      return { error: "The prime admin role cannot be changed" };
    }
  }

  const { error } = await svc.from("profiles").update({ role }).eq("id", userId);
  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return { success: true };
}

export async function adminBanUser(userId: string, banned: boolean) {
  const svc = await requireAdmin();
  const { error } = await svc.from("profiles").update({ banned }).eq("id", userId);
  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  revalidatePath("/admin/comments");
  return { success: true };
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function adminDeleteComment(commentId: string) {
  const svc = await requireAdmin();
  await svc.from("comments").delete().eq("parent_id", commentId);
  const { error } = await svc.from("comments").delete().eq("id", commentId);
  if (error) return { error: error.message };
  revalidatePath("/admin/comments");
  return { success: true };
}

// ── Debates ───────────────────────────────────────────────────────────────────

export async function adminUpdateDebatePrompt(
  threadId: string,
  prompt: string,
  titleId?: string,
  mediaType?: string,
) {
  const svc = await requireAdmin();
  const { error } = await svc.from("debate_threads").update({ prompt: prompt.trim() }).eq("id", threadId);
  if (error) return { error: error.message };
  revalidatePath("/admin/debates");
  if (titleId && mediaType) {
    revalidatePath(`/${mediaType === "movie" ? "movies" : "tv"}/${titleId}`);
  }
  return { success: true };
}

export async function adminSearchTitles(query: string) {
  const svc = await requireAdmin();
  if (!query.trim()) return [];
  const { data } = await svc
    .from("titles")
    .select("id,title,media_type,release_year")
    .ilike("title", `%${query.trim()}%`)
    .order("title")
    .limit(10);
  return (data ?? []) as { id: string; title: string; media_type: string; release_year: number | null }[];
}

export async function adminCreateDebateThread(titleId: string, prompt: string, mediaType: string) {
  const svc = await requireAdmin();

  const { data: existing } = await svc
    .from("debate_threads")
    .select("id")
    .eq("title_id", titleId)
    .maybeSingle();

  if (existing) {
    return { error: "This title already has a debate thread. You can edit the existing one instead." };
  }

  const { error } = await svc
    .from("debate_threads")
    .insert({ title_id: titleId, prompt: prompt.trim() });

  if (error) return { error: error.message };

  revalidatePath("/admin/debates");
  revalidatePath(`/${mediaType === "movie" ? "movies" : "tv"}/${titleId}`);
  return { success: true };
}

export async function adminDeleteDebateReply(replyId: string) {
  const svc = await requireAdmin();
  const { error } = await svc.from("debate_replies").delete().eq("id", replyId);
  if (error) return { error: error.message };
  revalidatePath("/admin/debates");
  return { success: true };
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function adminUpdateFeaturedSubgenre(subgenre: string) {
  const svc = await requireAdmin();
  const { error } = await svc.from("site_settings").upsert(
    { key: "featured_subgenre", value: subgenre, updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { success: true };
}
