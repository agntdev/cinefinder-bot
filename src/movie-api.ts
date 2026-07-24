export interface Movie {
  id: number;
  title: string;
  overview: string;
  releaseDate: string;
  genres: string[];
  cast: string[];
  runtime?: number;
  rating?: number;
  poster?: string;
}

interface TmdbMovie {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  genre_names?: string[];
  vote_average?: number;
  poster_path?: string | null;
}

const genres: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  18: "Drama", 14: "Fantasy", 27: "Horror", 878: "Sci-Fi", 53: "Thriller",
  10749: "Romance", 10751: "Family", 99: "Documentary",
};

function key(): string | undefined {
  return typeof process === "undefined" ? undefined : process.env.TMDB_API_KEY;
}

export function movieApiReady(): boolean {
  return Boolean(key());
}

function toMovie(item: TmdbMovie): Movie {
  return {
    id: item.id,
    title: item.title ?? item.name ?? "Untitled movie",
    overview: item.overview?.trim() || "No synopsis is available yet.",
    releaseDate: item.release_date ?? item.first_air_date ?? "Release date unavailable",
    genres: item.genre_names ?? (item.genre_ids ?? []).map((id) => genres[id]).filter(Boolean),
    cast: [],
    rating: typeof item.vote_average === "number" ? item.vote_average : undefined,
    poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : undefined,
  };
}

async function request<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const apiKey = key();
  if (!apiKey) throw new Error("movie API is not configured");
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  url.searchParams.set("api_key", apiKey);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  const response = await fetch(url.toString(), { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`movie API request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export async function trending(page = 1): Promise<{ movies: Movie[]; pages: number }> {
  const data = await request<{ results?: TmdbMovie[]; total_pages?: number }>("/trending/movie/week", { page: String(page) });
  return { movies: (data.results ?? []).map(toMovie), pages: Math.max(1, data.total_pages ?? 1) };
}

export async function nowPlaying(region: string): Promise<Movie[]> {
  const data = await request<{ results?: TmdbMovie[] }>("/movie/now_playing", { region, page: "1" });
  return (data.results ?? []).map(toMovie);
}

export async function searchMovies(query: string): Promise<Movie[]> {
  const data = await request<{ results?: TmdbMovie[] }>("/search/movie", { query, include_adult: "false", page: "1" });
  const titleMatches = (data.results ?? []).map(toMovie);
  if (titleMatches.length > 0) return titleMatches;
  const people = await request<{ results?: { id: number }[] }>("/search/person", { query, include_adult: "false", page: "1" });
  const person = people.results?.[0];
  if (!person) return [];
  const credits = await request<{ cast?: TmdbMovie[] }>(`/person/${person.id}/movie_credits`);
  return (credits.cast ?? []).sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0)).map(toMovie);
}

export async function recommendations(choice: string): Promise<Movie[]> {
  const genre = Object.entries(genres).find(([, name]) => name.toLowerCase() === choice.toLowerCase())?.[0];
  const data = await request<{ results?: TmdbMovie[] }>("/discover/movie", {
    sort_by: "popularity.desc", include_adult: "false", ...(genre ? { with_genres: genre } : {}), page: "1",
  });
  return (data.results ?? []).map(toMovie);
}

export async function movieDetails(id: number): Promise<Movie> {
  const data = await request<TmdbMovie & { genres?: { name: string }[]; runtime?: number; credits?: { cast?: { name: string }[] } }>(`/movie/${id}`, { append_to_response: "credits" });
  const movie = toMovie({ ...data, genre_names: data.genres?.map((genre) => genre.name) });
  movie.runtime = data.runtime;
  movie.cast = (data.credits?.cast ?? []).slice(0, 4).map((person) => person.name);
  return movie;
}

export function movieList(movies: Movie[], heading: string, rationale?: string): string {
  if (movies.length === 0) return "No movies matched that right now — try another choice.";
  const lines = movies.slice(0, 5).map((movie) => {
    const details = [movie.releaseDate, movie.genres.slice(0, 2).join(", "), movie.rating ? `${movie.rating.toFixed(1)}/10` : ""].filter(Boolean).join(" · ");
    return `• ${movie.title}${details ? ` — ${details}` : ""}`;
  });
  return `${heading}${rationale ? `\n${rationale}` : ""}\n\n${lines.join("\n")}`;
}
