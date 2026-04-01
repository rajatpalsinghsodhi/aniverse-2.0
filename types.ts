
export interface Anime {
  mal_id: number;
  title: string;
  title_english: string | null;
  images: {
    jpg: {
      image_url: string;
      large_image_url: string;
    }
  };
  trailer?: {
    youtube_id: string | null;
    url: string | null;
    embed_url: string | null;
  };
  score: number;
  synopsis: string;
  genres: Array<{ name: string }>;
  rank: number;
  popularity: number;
  episodes: number;
  type: string;
  status: string;
  duration: string;
}

/** Position on a catalog top-anime chart (Top Charts view only). Not the same as global score rank. */
export interface AnimeListRankChart {
  position: number;
  filter: 'bypopularity' | 'favorite' | 'airing';
}

export interface JikanResponse<T> {
  data: T;
  pagination?: {
    last_visible_page: number;
    has_next_page: boolean;
  };
}

export interface AnimeEpisode {
  mal_id: number;
  title: string;
  episode: string;
  aired: string;
  filler: boolean;
  recap: boolean;
}

export interface IdentificationResult {
  anilist: {
    id: number;
    idMal: number | null;
    title: { native: string | null; romaji: string | null; english: string | null };
    synonyms: string[];
    isAdult: boolean;
  };
  filename: string;
  episode: number | null;
  from: number;
  to: number;
  at: number;
  similarity: number;
  video: string;
  image: string;
}

export interface AnimeSummary {
  whyWatch: string;
  themes: string[];
  trivia: string;
}

export interface EpisodeNotification {
  id: string;
  malId: number;
  animeTitle: string;
  animeImage: string;
  episodeNumber: number;
  airDate: string;
  read: boolean;
}

// Consumet Types
export interface ConsumetSearchResult {
  id: string;
  title: string;
  image: string;
}

export interface ConsumetEpisode {
  id: string;
  number: number;
  title?: string;
  image?: string;
}

export interface ConsumetSource {
  url: string;
  isM3U8: boolean;
  quality: string;
  headers?: Record<string, string>;
}

export interface ConsumetStreamData {
  sources: ConsumetSource[];
  subtitles?: Array<{ url: string; lang: string }>;
}
