import { getCollection, type CollectionEntry } from 'astro:content';

export type MovieEntry = CollectionEntry<'movies'>;

/** Flat, presentation-ready shape consumed by MovieCard / MovieGrid. */
export interface MovieVM {
  id: string;
  title: string;
  date: Date;
  /** Localized label, e.g. "2025年2月6日". */
  dateLabel: string;
  /** Machine-readable timestamp for the client-side sort. */
  sortKey: number;
  rating: number;
  review: string;
  poster: string;
  url: string;
  type: 'movie' | 'tv';
}

export interface YearStats {
  count: number;
  /** Mean rating for the year, rounded to one decimal. */
  avg: number;
}

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const yearOf = (entry: MovieEntry): number => entry.data.date.getFullYear();

function toViewModel(entry: MovieEntry): MovieVM {
  const { data } = entry;
  return {
    id: entry.id,
    title: data.title,
    date: data.date,
    dateLabel: dateFormatter.format(data.date),
    sortKey: data.date.getTime(),
    rating: data.rating,
    review: data.review,
    poster: data.cover,
    url: data.url,
    type: data.type,
  };
}

/**
 * Loads every public entry once and derives the values shared by both pages:
 * the descending list of years and the per-year counts that drive the nav.
 */
export async function getViewingData() {
  const all = (await getCollection('movies', ({ data }) => data.isPublic)).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime()
  );

  const years = [...new Set(all.map(yearOf))].sort((a, b) => b - a);

  const counts: Record<number, number> = Object.fromEntries(
    years.map((year) => [year, all.filter((entry) => yearOf(entry) === year).length])
  );

  return { all, years, counts };
}

/** Entries watched in `year`, newest first, mapped to view models. */
export function moviesForYear(all: MovieEntry[], year: number): MovieVM[] {
  return all.filter((entry) => yearOf(entry) === year).map(toViewModel);
}

export function statsForYear(movies: MovieVM[]): YearStats {
  const count = movies.length;
  if (count === 0) return { count: 0, avg: 0 };
  const total = movies.reduce((sum, movie) => sum + movie.rating, 0);
  return { count, avg: Math.round((total / count) * 10) / 10 };
}
