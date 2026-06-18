import { Anime } from '../types';

const ANILIST_URL = 'https://graphql.anilist.co';

type AnilistSearchMedia = {
  id: number;
  idMal: number | null;
  title: { romaji: string; english: string | null };
  coverImage: { large: string | null } | null;
  averageScore: number | null;
  episodes: number | null;
  format: string | null;
  status: string | null;
  duration: number | null;
  popularity: number | null;
  genres: string[] | null;
};

function mapAnilistToAnime(media: AnilistSearchMedia): Anime {
  const imageUrl = media.coverImage?.large ?? '';
  return {
    mal_id: media.idMal ?? media.id,
    title: media.title.romaji,
    title_english: media.title.english,
    images: {
      jpg: {
        image_url: imageUrl,
        large_image_url: imageUrl,
      },
    },
    score: (media.averageScore ?? 0) / 10,
    synopsis: '',
    genres: (media.genres ?? []).map((name) => ({ name })),
    rank: 0,
    popularity: media.popularity ?? 0,
    episodes: media.episodes ?? 0,
    type: media.format ?? 'Unknown',
    status: media.status ?? '',
    duration: media.duration ? `${media.duration} min per ep` : '',
  };
}

const TRENDING_QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, season: SPRING, seasonYear: 2026, sort: [POPULARITY_DESC]) {
        id idMal
        title { romaji english }
        coverImage { large }
        averageScore episodes format status duration popularity genres
      }
    }
  }
`;

const TOP_RATED_QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, sort: [SCORE_DESC], averageScore_greater: 1) {
        id idMal
        title { romaji english }
        coverImage { large }
        averageScore episodes format status duration popularity genres
      }
    }
  }
`;

async function anilistFetch(query: string, variables: Record<string, unknown>): Promise<AnilistSearchMedia[]> {
  const response = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error(`AniList ${response.status}`);
  const json = await response.json();
  return json.data?.Page?.media ?? [];
}

export const anilistService = {
  async getTrending(page: number = 1): Promise<Anime[]> {
    const media = await anilistFetch(TRENDING_QUERY, { page, perPage: 25 });
    return media.map(mapAnilistToAnime);
  },

  async getTopRated(page: number = 1): Promise<Anime[]> {
    const media = await anilistFetch(TOP_RATED_QUERY, { page, perPage: 25 });
    return media.map(mapAnilistToAnime);
  },

  /** Bypass when Jikan/MAL search is unavailable (504). */
  async searchAnime(query: string, page: number = 1): Promise<Anime[]> {
    const SEARCH_QUERY = `
      query ($search: String, $page: Int) {
        Page(page: $page, perPage: 25) {
          media(search: $search, type: ANIME) {
            id idMal
            title { romaji english }
            coverImage { large }
            averageScore episodes format status duration popularity genres
          }
        }
      }
    `;
    const media = await anilistFetch(SEARCH_QUERY, { search: query, page });
    return media.map(mapAnilistToAnime);
  },

  /**
   * Fetches advanced title metadata and IDs to ensure we find the right stream
   */
  async getMapping(title: string): Promise<{ english: string; romaji: string; native: string; id: number } | null> {
    const query = `
      query ($search: String) {
        Media (search: $search, type: ANIME) {
          id
          title {
            romaji
            english
            native
          }
        }
      }
    `;

    try {
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ query, variables: { search: title } })
      });
      const json = await response.json();
      const media = json.data?.Media;
      return media ? {
        english: media.title.english,
        romaji: media.title.romaji,
        native: media.title.native,
        id: media.id
      } : null;
    } catch (e) {
      console.error("AniList mapping failed", e);
      return null;
    }
  }
};
