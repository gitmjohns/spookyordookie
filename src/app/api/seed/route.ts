import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { fetchHorrorMovies, fetchHorrorTV, fetchSupernaturalTV, fetchMovieGenres } from "@/lib/tmdb";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pages = Math.min(parseInt(searchParams.get("pages") ?? "5", 10), 20);
  const startPage = Math.max(1, parseInt(searchParams.get("startPage") ?? "1", 10));
  const typeFilter = searchParams.get("type"); // "movie" | "tv" | "supernatural" | null (both)


  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const genresList = await fetchMovieGenres();
  const genreMap = Object.fromEntries(genresList.map((g) => [g.id, g.name]));

  let totalImported = 0;

  for (let page = startPage; page < startPage + pages; page++) {
    const [movies, tv] = await Promise.all([
      typeFilter === "tv" || typeFilter === "supernatural" ? Promise.resolve({ results: [] }) : fetchHorrorMovies(page),
      typeFilter === "movie" ? Promise.resolve({ results: [] }) : typeFilter === "supernatural" ? fetchSupernaturalTV(page) : fetchHorrorTV(page),
    ]);

    const moviesPayload = movies.results.map((m) => ({
      tmdb_id: m.id,
      media_type: "movie" as const,
      title: m.title,
      overview: m.overview || null,
      poster_path: m.poster_path,
      backdrop_path: m.backdrop_path,
      release_year: m.release_date
        ? parseInt(m.release_date.split("-")[0], 10)
        : null,
      genres: m.genre_ids.map((id) => genreMap[id]).filter(Boolean),
    }));

    const tvPayload = tv.results.map((s) => ({
      tmdb_id: s.id,
      media_type: "tv" as const,
      title: s.name,
      overview: s.overview || null,
      poster_path: s.poster_path,
      backdrop_path: s.backdrop_path,
      release_year: s.first_air_date
        ? parseInt(s.first_air_date.split("-")[0], 10)
        : null,
      genres: s.genre_ids.map((id) => genreMap[id]).filter(Boolean),
    }));

    const allPayload = [
      ...(typeFilter === "tv" ? [] : moviesPayload),
      ...(typeFilter === "movie" ? [] : tvPayload),
    ];
    if (allPayload.length === 0) continue;

    const { error, count } = await supabase.from("titles").upsert(allPayload, {
      onConflict: "tmdb_id,media_type",
      ignoreDuplicates: false,
      count: "exact",
    });

    if (error) {
      return NextResponse.json(
        { error: error.message, imported: totalImported },
        { status: 500 }
      );
    }

    totalImported += count ?? allPayload.length;
  }

  return NextResponse.json({
    success: true,
    imported: totalImported,
    pages,
  });
}
