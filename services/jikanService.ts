
import { JIKAN_BASE_URL } from '../constants';
import { Anime, JikanResponse, AnimeEpisode, AnimeRecommendationItem, TopChartFilter } from '../types';
import { anilistService } from './anilistService';

// Jikan allows ~3 req/s. We use a queue so parallel callers don't all
// fire at once, but the inter-request gap is small enough to not bottleneck
// the initial page load.
const RATE_LIMIT_MS = 150;
let lastJikanSend = 0;
const jikanQueue: Array<() => void> = [];
let jikanDraining = false;

function drainJikanQueue() {
  if (jikanDraining) return;
  jikanDraining = true;
  const next = () => {
    if (jikanQueue.length === 0) { jikanDraining = false; return; }
    const now = Date.now();
    const wait = Math.max(0, RATE_LIMIT_MS - (now - lastJikanSend));
    setTimeout(() => {
      lastJikanSend = Date.now();
      const resolve = jikanQueue.shift();
      resolve?.();
      next();
    }, wait);
  };
  next();
}

function waitForSlot(): Promise<void> {
  return new Promise<void>((resolve) => {
    jikanQueue.push(resolve);
    drainJikanQueue();
  });
}

const inflightRequests = new Map<string, Promise<unknown>>();

function dedupeRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflightRequests.get(key);
  if (existing) return existing as Promise<T>;
  const promise = fn().finally(() => inflightRequests.delete(key));
  inflightRequests.set(key, promise);
  return promise;
}

async function jikanFetch(url: string, retries = 2, timeoutMs = 5000): Promise<any> {
  await waitForSlot();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(url, { signal: controller.signal });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Jikan API timeout: ${url}`);
    }
    throw err;
  }
  clearTimeout(timer);

  if (res.status === 429 && retries > 0) {
    const retryAfter = parseInt(res.headers.get('Retry-After') || '2', 10);
    await new Promise(r => setTimeout(r, retryAfter * 1000));
    return jikanFetch(url, retries - 1, timeoutMs);
  }

  if (res.status >= 500 && retries > 0) {
    await new Promise(r => setTimeout(r, 1500));
    return jikanFetch(url, retries - 1, timeoutMs);
  }

  if (!res.ok) {
    throw new Error(`Jikan API ${res.status}: ${url}`);
  }

  return res.json();
}

export interface TopChartPage {
  data: Anime[];
  hasNextPage: boolean;
}

function getTopChartUrl(filter: TopChartFilter, page: number): string {
  const base = `${JIKAN_BASE_URL}/anime?`;
  switch (filter) {
    case 'byscore':
      return `${base}order_by=score&sort=desc&min_score=1&page=${page}`;
    case 'bypopularity':
      return `${base}order_by=popularity&sort=asc&page=${page}`;
    case 'airing':
      return `${base}status=airing&order_by=popularity&sort=asc&page=${page}`;
  }
}

export const jikanService = {
  /** Paginated top-chart lists for the Top Charts view. */
  async getTopChartAnime(filter: TopChartFilter, page: number = 1): Promise<TopChartPage> {
    return dedupeRequest(`topChart:${filter}:${page}`, async () => {
      try {
        const json: JikanResponse<Anime[]> = await jikanFetch(getTopChartUrl(filter, page), 1, 4000);
        const data = json.data || [];
        return {
          data,
          hasNextPage: (json.pagination?.has_next_page ?? false) && data.length > 0,
        };
      } catch {
        return anilistService.getTopChartPage(filter, page);
      }
    });
  },

  /** Highest scored titles (home “Highest rated” row; not the popularity top list). */
  async getTopRatedByScore(page: number = 1): Promise<Anime[]> {
    return dedupeRequest(`topRated:${page}`, async () => {
      try {
        const json: JikanResponse<Anime[]> = await jikanFetch(
          `${JIKAN_BASE_URL}/top/anime?filter=bypopularity&page=${page}`,
          1,
          4000
        );
        return [...(json.data || [])].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      } catch {
        return anilistService.getTopRated(page);
      }
    });
  },

  async getTrendingAnime(page: number = 1): Promise<Anime[]> {
    return dedupeRequest(`trending:${page}`, async () => {
      try {
        const json: JikanResponse<Anime[]> = await jikanFetch(
          `${JIKAN_BASE_URL}/seasons/now?page=${page}`,
          1,
          4000
        );
        return json.data || [];
      } catch {
        return anilistService.getTrending(page);
      }
    });
  },

  async getAnimeBySeason(year: number, season: string, page: number = 1): Promise<Anime[]> {
    const json: JikanResponse<Anime[]> = await jikanFetch(`${JIKAN_BASE_URL}/seasons/${year}/${season}?page=${page}`);
    return json.data || [];
  },

  async getAnimeByGenre(genreId: number, page: number = 1): Promise<Anime[]> {
    const json: JikanResponse<Anime[]> = await jikanFetch(`${JIKAN_BASE_URL}/anime?genres=${genreId}&order_by=score&sort=desc&page=${page}`);
    return json.data || [];
  },

  async searchAnime(query: string, page: number = 1): Promise<Anime[]> {
    try {
      const json: JikanResponse<Anime[]> = await jikanFetch(
        `${JIKAN_BASE_URL}/anime?q=${encodeURIComponent(query)}&page=${page}`,
        0
      );
      return json.data || [];
    } catch {
      // MAL-backed search often 504 when MyAnimeList is slow; AniList bypass keeps search working.
      return anilistService.searchAnime(query, page);
    }
  },

  async getAnimeDetails(id: number): Promise<Anime> {
    const json: JikanResponse<Anime> = await jikanFetch(`${JIKAN_BASE_URL}/anime/${id}`);
    return json.data;
  },

  async getAnimeDetailsFull(id: number): Promise<any> {
    const json = await jikanFetch(`${JIKAN_BASE_URL}/anime/${id}/full`);
    return json.data;
  },

  async getAnimeEpisodes(id: number): Promise<AnimeEpisode[]> {
    const json: JikanResponse<AnimeEpisode[]> = await jikanFetch(`${JIKAN_BASE_URL}/anime/${id}/episodes`);
    return json.data;
  },

  async getLatestEpisodes(id: number): Promise<AnimeEpisode[]> {
    const json: any = await jikanFetch(`${JIKAN_BASE_URL}/anime/${id}/episodes`);
    const lastPage = json.pagination?.last_visible_page || 1;
    if (lastPage === 1) return json.data || [];
    const lastJson: any = await jikanFetch(`${JIKAN_BASE_URL}/anime/${id}/episodes?page=${lastPage}`);
    return lastJson.data || [];
  },

  async getAnimeExternalLinks(id: number): Promise<any[]> {
    const json: JikanResponse<any[]> = await jikanFetch(`${JIKAN_BASE_URL}/anime/${id}/external`);
    return json.data || [];
  },

  async getAnimeCharacters(id: number): Promise<any[]> {
    const json: JikanResponse<any[]> = await jikanFetch(`${JIKAN_BASE_URL}/anime/${id}/characters`);
    return json.data || [];
  },

  async getAnimePictures(id: number): Promise<any[]> {
    const json: JikanResponse<any[]> = await jikanFetch(`${JIKAN_BASE_URL}/anime/${id}/pictures`);
    return json.data || [];
  },

  async getAnimeRelations(id: number): Promise<any[]> {
    const json: JikanResponse<any[]> = await jikanFetch(`${JIKAN_BASE_URL}/anime/${id}/relations`);
    return json.data || [];
  },

  /** MyAnimeList community recommendations for this title (Jikan wraps MAL). */
  async getAnimeRecommendations(id: number): Promise<AnimeRecommendationItem[]> {
    const json: JikanResponse<AnimeRecommendationItem[]> = await jikanFetch(
      `${JIKAN_BASE_URL}/anime/${id}/recommendations`
    );
    return json.data || [];
  },

  async getAnimeStreaming(id: number): Promise<any[]> {
    const json: JikanResponse<any[]> = await jikanFetch(`${JIKAN_BASE_URL}/anime/${id}/streaming`);
    return json.data || [];
  },

  async getKitsuSynopsis(title: string): Promise<string | null> {
    try {
      const res = await fetch(`https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(title)}&page[limit]=1`);
      const json = await res.json();
      if (json.data && json.data.length > 0) {
        return json.data[0].attributes.synopsis;
      }
      return null;
    } catch (err) {
      console.error("Kitsu fetch error", err);
      return null;
    }
  },

  async getExternalLinks(id: number): Promise<any[]> {
    const json: JikanResponse<any[]> = await jikanFetch(`${JIKAN_BASE_URL}/anime/${id}/external`);
    return json.data || [];
  },

  async getTotalCount(): Promise<number | null> {
    try {
      const json = await jikanFetch(`${JIKAN_BASE_URL}/anime?limit=1`);
      return json.pagination?.items?.total ?? null;
    } catch {
      return null;
    }
  },

  async getSchedule(): Promise<any[]> {
    const res = await fetch(
      'https://raw.githubusercontent.com/RockinChaos/AniSchedule/master/readable/sub-schedule-readable.json'
    );
    const json = await res.json();
    return Array.isArray(json) ? json : [];
  }
};
