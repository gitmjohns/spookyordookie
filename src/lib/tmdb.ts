import type { TMDBMovie, TMDBTVShow, TMDBGenre } from "./types";

const TMDB_BASE = "https://api.themoviedb.org/3";
const HORROR_GENRE_ID = 27; // movies only
const ANIMATION_GENRE_ID = 16; // excluded per content policy — no animation of any kind
const HORROR_TV_KEYWORD_ID = 315058; // TMDB has no horror TV genre; use keyword instead
const MIN_YEAR = 1970;

// Movies: English + approved European and Asian horror languages only
const MOVIE_LANGUAGES = "en|fr|es|it|de|ja";
// TV: English-only (most horror TV is English; pipe list was silently ignored by TMDB)
const TV_LANGUAGE = "en";
// Secondary TV keyword to supplement the horror keyword
const SUPERNATURAL_TV_KEYWORD_ID = 10219;

// Nightly import quality floor — keeps hidden gems but removes truly invisible titles
const MIN_VOTE_COUNT = "10";
const MIN_POPULARITY = "5";

function tmdbFetch(path: string, params: Record<string, string> = {}) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error("TMDB_API_KEY is not set");

  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", apiKey);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  return fetch(url.toString(), { next: { revalidate: 3600 } });
}

export async function fetchHorrorMovies(page = 1): Promise<{
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}> {
  const res = await tmdbFetch("/discover/movie", {
    with_genres: String(HORROR_GENRE_ID),
    with_original_language: MOVIE_LANGUAGES,
    "primary_release_date.gte": `${MIN_YEAR}-01-01`,
    "vote_count.gte": MIN_VOTE_COUNT,
    sort_by: "popularity.desc",
    page: String(page),
  });
  if (!res.ok) throw new Error("Failed to fetch horror movies");
  return res.json();
}

export async function fetchHorrorTV(page = 1, keyword = HORROR_TV_KEYWORD_ID): Promise<{
  results: TMDBTVShow[];
  total_pages: number;
  total_results: number;
}> {
  const res = await tmdbFetch("/discover/tv", {
    with_keywords: String(keyword),
    with_original_language: TV_LANGUAGE,
    "first_air_date.gte": `${MIN_YEAR}-01-01`,
    "vote_count.gte": MIN_VOTE_COUNT,
    sort_by: "popularity.desc",
    page: String(page),
  });
  if (!res.ok) throw new Error("Failed to fetch horror TV");
  return res.json();
}

export async function fetchSupernaturalTV(page = 1): Promise<{
  results: TMDBTVShow[];
  total_pages: number;
  total_results: number;
}> {
  return fetchHorrorTV(page, SUPERNATURAL_TV_KEYWORD_ID);
}

export async function fetchMovieDetails(tmdbId: number): Promise<
  TMDBMovie & { genres: TMDBGenre[] }
> {
  const res = await tmdbFetch(`/movie/${tmdbId}`);
  if (!res.ok) throw new Error("Failed to fetch movie details");
  return res.json();
}

export async function fetchTVDetails(tmdbId: number): Promise<
  TMDBTVShow & { genres: TMDBGenre[] }
> {
  const res = await tmdbFetch(`/tv/${tmdbId}`);
  if (!res.ok) throw new Error("Failed to fetch TV details");
  return res.json();
}

export async function fetchNewHorrorReleases(date: string): Promise<{
  movies: TMDBMovie[];
  tv: TMDBTVShow[];
}> {
  const [moviesRes, tvRes] = await Promise.all([
    tmdbFetch("/discover/movie", {
      with_genres: String(HORROR_GENRE_ID),
      without_genres: String(ANIMATION_GENRE_ID),
      with_original_language: MOVIE_LANGUAGES,
      "primary_release_date.gte": date,
      "primary_release_date.lte": date,
      "popularity.gte": MIN_POPULARITY,
      "vote_count.gte": MIN_VOTE_COUNT,
      sort_by: "popularity.desc",
    }),
    tmdbFetch("/discover/tv", {
      with_keywords: String(HORROR_TV_KEYWORD_ID),
      without_genres: String(ANIMATION_GENRE_ID),
      with_original_language: TV_LANGUAGE,
      "first_air_date.gte": date,
      "first_air_date.lte": date,
      "popularity.gte": MIN_POPULARITY,
      "vote_count.gte": MIN_VOTE_COUNT,
      sort_by: "popularity.desc",
    }),
  ]);

  const [movies, tv] = await Promise.all([moviesRes.json(), tvRes.json()]);
  return { movies: movies.results ?? [], tv: tv.results ?? [] };
}

export async function fetchMovieGenres(): Promise<TMDBGenre[]> {
  const res = await tmdbFetch("/genre/movie/list");
  if (!res.ok) return [];
  const data = await res.json();
  return data.genres ?? [];
}
