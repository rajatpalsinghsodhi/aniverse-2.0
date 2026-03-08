
import { JIKAN_BASE_URL } from '../constants';
import { Anime, JikanResponse, AnimeEpisode } from '../types';

const RATE_LIMIT_DELAY = 350;
let lastRequestTime = 0;

async function jikanFetch(url: string, retries = 3): Promise<any> {
  const now = Date.now();
  const timeSinceLast = now - lastRequestTime;
  if (timeSinceLast < RATE_LIMIT_DELAY) {
    await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY - timeSinceLast));
  }
  lastRequestTime = Date.now();

  const res = await fetch(url);

  if (res.status === 429 && retries > 0) {
    const retryAfter = parseInt(res.headers.get('Retry-After') || '2', 10);
    await new Promise(r => setTimeout(r, retryAfter * 1000));
    return jikanFetch(url, retries - 1);
  }

  if (!res.ok) {
    throw new Error(`Jikan API ${res.status}: ${url}`);
  }

  return res.json();
}

export const jikanService = {
  async getTopAnime(page: number = 1): Promise<Anime[]> {
    const json: JikanResponse<Anime[]> = await jikanFetch(`${JIKAN_BASE_URL}/top/anime?filter=bypopularity&page=${page}`);
    return json.data || [];
  },

  async getTrendingAnime(page: number = 1): Promise<Anime[]> {
    const json: JikanResponse<Anime[]> = await jikanFetch(`${JIKAN_BASE_URL}/seasons/now?page=${page}`);
    return json.data || [];
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
    const json: JikanResponse<Anime[]> = await jikanFetch(`${JIKAN_BASE_URL}/anime?q=${encodeURIComponent(query)}&page=${page}`);
    return json.data || [];
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
