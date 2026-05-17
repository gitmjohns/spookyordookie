import type { Title, Comment } from "./types";
import { MOCK_TITLES, MOCK_COMMENTS, isMockMode } from "./mock-data";

async function db() {
  const { createClient } = await import("./supabase/server");
  return createClient();
}

// ─── Homepage sections ────────────────────────────────────────────────────────

export async function getGoats(limit = 20): Promise<Title[]> {
  if (isMockMode()) return MOCK_TITLES.slice(0, limit);
  const s = await db();
  const { data } = await s.from("titles").select("*").eq("media_type", "movie")
    .gte("critic_score", 85)
    .order("critic_score", { ascending: false })
    .limit(50);
  if (!data?.length) return [];
  const shuffled = [...data].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit) as Title[];
}

export async function getCultClassics(limit = 12): Promise<Title[]> {
  if (isMockMode()) return MOCK_TITLES.slice(0, limit);
  const s = await db();
  // Pull a larger pool tagged as Cult Classic, then randomize so repeat visitors see different titles
  const { data } = await s.from("titles").select("*").eq("media_type", "movie")
    .contains("subgenres", ["Cult Classic"])
    .order("critic_score", { ascending: false })
    .limit(80);
  if (!data?.length) return [];
  const shuffled = [...data].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit) as Title[];
}

export async function getSpookyComedies(limit = 20): Promise<Title[]> {
  if (isMockMode()) return MOCK_TITLES.slice(0, limit);
  const s = await db();
  const { data } = await s.from("titles").select("*").eq("media_type", "movie")
    .contains("subgenres", ["Comedy Horror"])
    .order("critic_score", { ascending: false })
    .limit(60);
  if (!data?.length) return [];
  const shuffled = [...data].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit) as Title[];
}

export const SUBGENRE_ROTATION = [
  { display: "Slashers",          db: "Slasher" },
  { display: "Found Footage",     db: "Found Footage" },
  { display: "Creature Features", db: "Creature Feature" },
  { display: "Sci-Fi Horror",     db: "Sci-Fi Horror" },
  { display: "Folk Horror",       db: "Folk Horror" },
  { display: "Zombie",            db: "Zombie" },
  { display: "Vampire",           db: "Vampire" },
  { display: "Werewolf",          db: "Werewolf" },
  { display: "Body Horror",       db: "Body Horror" },
] as const;

export function getCurrentSubgenreSpotlight() {
  const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  return SUBGENRE_ROTATION[week % SUBGENRE_ROTATION.length];
}

export async function getFeaturedSubgenre(): Promise<{ display: string; db: string }> {
  try {
    const s = await db();
    const { data } = await s.from("site_settings").select("value").eq("key", "featured_subgenre").single();
    if (data?.value) {
      const found = SUBGENRE_ROTATION.find(r => r.db === data.value);
      return found ?? { display: data.value, db: data.value };
    }
  } catch {}
  return getCurrentSubgenreSpotlight();
}

export async function getSubgenreSpotlightTitles(dbSubgenre: string, limit = 18): Promise<Title[]> {
  if (isMockMode()) return MOCK_TITLES.slice(0, limit);
  const s = await db();
  const { data } = await s.from("titles").select("*").eq("media_type", "movie")
    .contains("subgenres", [dbSubgenre])
    .order("critic_score", { ascending: false })
    .limit(50);
  if (!data?.length) return [];
  const shuffled = [...data].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit) as Title[];
}

export async function getLatestSpooks(limit = 20): Promise<Title[]> {
  if (isMockMode()) return MOCK_TITLES.slice(0, limit);
  const s = await db();
  const cutoff = new Date().getFullYear() - 3;
  const { data } = await s.from("titles").select("*").eq("media_type", "movie")
    .gte("release_year", cutoff)
    .order("release_year", { ascending: false })
    .order("critic_score", { ascending: false })
    .limit(50);
  if (!data?.length) return [];
  const shuffled = [...data].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit) as Title[];
}

export async function getDecadeSpotlight(decade: number, limit = 20): Promise<Title[]> {
  if (isMockMode()) return MOCK_TITLES.slice(0, limit);
  const s = await db();
  const { data } = await s.from("titles").select("*").eq("media_type", "movie")
    .gte("release_year", decade).lte("release_year", decade + 9)
    .order("critic_score", { ascending: false }).limit(limit);
  return (data ?? []) as Title[];
}

export async function getTopTV(limit = 20): Promise<Title[]> {
  if (isMockMode()) return MOCK_TITLES.filter((t) => t.media_type === "tv").slice(0, limit);
  const s = await db();
  const { data } = await s.from("titles").select("*").eq("media_type", "tv")
    .order("critic_score", { ascending: false })
    .order("rating_count", { ascending: false })
    .limit(60);
  if (!data?.length) return [];
  const shuffled = [...data].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit) as Title[];
}

export async function getStaffPick(): Promise<Title | null> {
  if (isMockMode()) return MOCK_TITLES[0] ?? null;
  const s = await db();
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const { data: pool } = await s.from("titles").select("*").eq("media_type", "movie")
    .gte("critic_score", 85).order("critic_score", { ascending: false }).limit(52);
  if (!pool?.length) return null;
  return pool[weekNumber % pool.length] as Title;
}

// ─── Listing pages ────────────────────────────────────────────────────────────

export interface TitleFilters {
  sort?: string;
  genre?: string; // now maps to subgenres column (horror categories)
  decade?: string;
  page?: number;
  limit?: number;
}

function applyFilters(q: any, filters: TitleFilters) {
  const { sort = "critic", genre, decade } = filters;
  if (genre) q = q.contains("subgenres", [genre]);
  if (decade) { const d = parseInt(decade, 10); q = q.gte("release_year", d).lte("release_year", d + 9); }
  if (sort === "rating") q = q.order("rating_avg", { ascending: false }).order("rating_count", { ascending: false });
  else if (sort === "newest") q = q.order("release_year", { ascending: false });
  else if (sort === "alpha-asc") q = q.order("title", { ascending: true });
  else if (sort === "alpha-desc") q = q.order("title", { ascending: false });
  else q = q.order("critic_score", { ascending: false });
  // Stable tiebreaker — prevents the same title appearing on two pages when scores/values tie
  q = q.order("id", { ascending: true });
  return q;
}

export async function getMovies(filters: TitleFilters): Promise<{ titles: Title[]; count: number }> {
  const { page = 1, limit = 42 } = filters;
  if (isMockMode()) {
    const results = MOCK_TITLES.filter((t) => t.media_type === "movie");
    return { titles: results.slice((page - 1) * limit, page * limit), count: results.length };
  }
  const s = await db();
  const offset = (page - 1) * limit;
  const base = s.from("titles").select("*", { count: "exact" }).eq("media_type", "movie").range(offset, offset + limit - 1);
  const { data, count } = await applyFilters(base, filters);
  return { titles: (data ?? []) as Title[], count: count ?? 0 };
}

export async function getTV(filters: TitleFilters): Promise<{ titles: Title[]; count: number }> {
  const { page = 1, limit = 42 } = filters;
  if (isMockMode()) {
    const results = MOCK_TITLES.filter((t) => t.media_type === "tv");
    return { titles: results.slice((page - 1) * limit, page * limit), count: results.length };
  }
  const s = await db();
  const offset = (page - 1) * limit;
  const base = s.from("titles").select("*", { count: "exact" }).eq("media_type", "tv").range(offset, offset + limit - 1);
  const { data, count } = await applyFilters(base, filters);
  return { titles: (data ?? []) as Title[], count: count ?? 0 };
}

export async function getTitleById(id: string, mediaType: "movie" | "tv"): Promise<Title | null> {
  if (isMockMode()) return MOCK_TITLES.find((t) => t.id === id && t.media_type === mediaType) ?? null;
  const s = await db();
  const { data } = await s.from("titles").select("*").eq("id", id).eq("media_type", mediaType).single();
  return (data as Title) ?? null;
}

export async function getComments(titleId: string, userId?: string): Promise<Comment[]> {
  if (isMockMode()) return MOCK_COMMENTS.filter((c) => c.title_id === titleId && !c.parent_id);
  const s = await db();

  const [commentsResult, repliesResult, votesResult, downvotesResult] = await Promise.all([
    s.from("comments").select("*").eq("title_id", titleId).is("parent_id", null)
      .order("upvote_count", { ascending: false }).order("created_at", { ascending: false }),
    s.from("comments").select("*").eq("title_id", titleId).not("parent_id", "is", null)
      .order("created_at", { ascending: true }),
    userId
      ? s.from("comment_votes").select("comment_id").eq("user_id", userId)
      : Promise.resolve({ data: [] }),
    userId
      ? s.from("comment_downvotes").select("comment_id").eq("user_id", userId)
      : Promise.resolve({ data: [] }),
  ]);

  const topComments = commentsResult.data ?? [];
  const replies = repliesResult.data ?? [];

  const allUserIds = [...new Set([...topComments, ...replies].map((c) => c.user_id))];
  const { data: profilesData } = allUserIds.length > 0
    ? await s.from("profiles").select("id, username, avatar_emoji, avatar_bg").in("id", allUserIds)
    : { data: [] };
  const profileMap = Object.fromEntries((profilesData ?? []).map((p) => [p.id, p]));

  const votedIds = new Set(
    ((votesResult as { data: { comment_id: string }[] | null }).data ?? []).map((v) => v.comment_id)
  );
  const downvotedIds = new Set(
    ((downvotesResult as { data: { comment_id: string }[] | null }).data ?? []).map((v) => v.comment_id)
  );

  return topComments.map((c) => ({
    ...c,
    profiles: profileMap[c.user_id] ?? { username: "Anonymous", avatar_emoji: "💀", avatar_bg: "#0a0a0f" },
    user_has_voted: votedIds.has(c.id),
    user_has_downvoted: downvotedIds.has(c.id),
    replies: replies
      .filter((r) => r.parent_id === c.id)
      .map((r) => ({
        ...r,
        profiles: profileMap[r.user_id] ?? { username: "Anonymous", avatar_emoji: "💀" },
        user_has_voted: votedIds.has(r.id),
        user_has_downvoted: downvotedIds.has(r.id),
      })),
  })) as Comment[];
}

export async function getUserRating(titleId: string): Promise<number | null> {
  if (isMockMode()) return null;
  const s = await db();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return null;
  const { data } = await s.from("ratings").select("score").eq("user_id", user.id).eq("title_id", titleId).single();
  return data?.score ?? null;
}

export async function getSimilarTitles(
  titleId: string,
  subgenres: string[],
  criticScore: number,
  mediaType: "movie" | "tv",
  limit = 8,
  releaseYear?: number | null
): Promise<Title[]> {
  if (isMockMode()) return MOCK_TITLES.filter((t) => t.id !== titleId).slice(0, limit);
  const s = await db();
  const q = s.from("titles").select("*").eq("media_type", mediaType).neq("id", titleId)
    .gte("critic_score", Math.max(1, criticScore - 30))
    .lte("critic_score", Math.min(100, criticScore + 30))
    .order("critic_score", { ascending: false })
    .limit(120); // fetch wider pool so re-ranking has candidates to work with
  const { data } = subgenres.length > 0
    ? await q.overlaps("subgenres", subgenres)
    : await q;

  const candidates = (data ?? []) as Title[];
  if (!candidates.length) return [];

  const sourceDec = releaseYear ? Math.floor(releaseYear / 10) : null;
  const sourceSubgenres = new Set(subgenres);

  function decadeBonus(year: number | null): number {
    if (!sourceDec || !year) return 0;
    const diff = Math.abs(Math.floor(year / 10) - sourceDec);
    if (diff === 0) return 15;
    if (diff === 1) return 8;
    if (diff === 2) return 3;
    return 0;
  }

  function eraBonus(year: number | null): number {
    if (!releaseYear || !year) return 0;
    const diff = Math.abs(year - releaseYear);
    if (diff <= 2) return 20;
    if (diff <= 5) return 10;
    if (diff <= 8) return 4;
    return 0;
  }

  // Group candidates by how many subgenres they share with the source
  const grouped = new Map<number, Title[]>();
  for (const t of candidates) {
    const count = (t.subgenres ?? []).filter(s => sourceSubgenres.has(s)).length;
    if (!grouped.has(count)) grouped.set(count, []);
    grouped.get(count)!.push(t);
  }

  // Fill results starting from the best-matching tier, only dropping down when needed
  const result: Title[] = [];
  const maxOverlap = Math.max(...grouped.keys());

  for (let o = maxOverlap; o >= 1 && result.length < limit; o--) {
    const tier = grouped.get(o) ?? [];
    if (!tier.length) continue;

    // Within each tier sort by composite score then shuffle for variety
    // Shuffle the full tier first so every candidate gets a fair chance
    for (let i = tier.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tier[i], tier[j]] = [tier[j], tier[i]];
    }
    // Then do a light era/decade re-sort so closer titles are still slightly preferred
    tier.sort((a, b) =>
      (decadeBonus(b.release_year) + eraBonus(b.release_year)) -
      (decadeBonus(a.release_year) + eraBonus(a.release_year))
    );
    result.push(...tier.slice(0, limit - result.length));
  }

  return result;
}

export async function getWatchlistIds(): Promise<Set<string>> {
  if (isMockMode()) return new Set();
  const s = await db();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return new Set();
  const { data } = await s.from("watchlist").select("title_id").eq("user_id", user.id);
  return new Set((data ?? []).map((w: { title_id: string }) => w.title_id));
}

export async function getWatchlistTitles(): Promise<Title[]> {
  if (isMockMode()) return [];
  const s = await db();
  const { data: { user } } = await s.auth.getUser();
  if (!user) return [];
  const { data: watchlistData } = await s.from("watchlist").select("title_id").eq("user_id", user.id).order("created_at", { ascending: false });
  if (!watchlistData?.length) return [];
  const titleIds = watchlistData.map((w: { title_id: string }) => w.title_id);
  const { data } = await s.from("titles").select("*").in("id", titleIds);
  return (data ?? []) as Title[];
}

export async function getDebateThread(titleId: string) {
  if (isMockMode()) return null;
  const s = await db();
  const { data } = await s.from("debate_threads").select("*").eq("title_id", titleId).single();
  return data ?? null;
}

export async function getDebateReplies(threadId: string) {
  if (isMockMode()) return [];
  const s = await db();
  const [repliesResult, userId] = await Promise.all([
    s.from("debate_replies").select("*").eq("thread_id", threadId).order("created_at", { ascending: true }),
    s.auth.getUser().then(({ data }) => data.user?.id),
  ]);
  const replies = repliesResult.data ?? [];
  const allUserIds = [...new Set(replies.map((r: { user_id: string }) => r.user_id))];
  const { data: profilesData } = allUserIds.length > 0
    ? await s.from("profiles").select("id, username, avatar_emoji, avatar_bg").in("id", allUserIds)
    : { data: [] };
  const profileMap = Object.fromEntries((profilesData ?? []).map((p: { id: string; username: string; avatar_emoji: string; avatar_bg: string }) => [p.id, p]));
  return replies.map((r: { user_id: string; id: string }) => ({
    ...r,
    profiles: profileMap[r.user_id] ?? { username: "Anonymous", avatar_emoji: "💀", avatar_bg: "#0a0a0f" },
  }));
}

export async function getCurrentUser() {
  if (isMockMode()) return null;
  const s = await db();
  const { data: { user } } = await s.auth.getUser();
  return user;
}
