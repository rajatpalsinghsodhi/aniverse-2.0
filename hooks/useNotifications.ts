import { useState, useEffect, useCallback, useRef } from 'react';
import { jikanService } from '../services/jikanService';
import { EpisodeNotification } from '../types';

const STORAGE_KEY = 'animeverse_notifications_read';
const POLL_INTERVAL_MS = 60 * 60 * 1000;

function loadReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function persistReadIds(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export function useNotifications(library: any[]) {
  const [notifications, setNotifications] = useState<EpisodeNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const readIds = useRef(loadReadIds());
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    const candidates = library.filter(
      (a) => a.status !== 'completed' && a.type !== 'Movie'
    );
    if (candidates.length === 0) {
      setNotifications([]);
      return;
    }

    abortRef.current = false;
    setIsLoading(true);

    const nowMs = Date.now();
    const nowSec = nowMs / 1000;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const sevenDaysSec = sevenDaysMs / 1000;
    const collected: EpisodeNotification[] = [];
    const coveredMalIds = new Set<number>();

    const libraryByMalId = new Map<number, any>();
    for (const a of candidates) libraryByMalId.set(a.mal_id, a);

    // --- PRIMARY: AniSchedule (same data source as the Airing Schedule widget) ---
    // Single request that covers all currently airing anime with exact future times.
    try {
      const scheduleData = await jikanService.getSchedule();
      if (Array.isArray(scheduleData)) {
        for (const item of scheduleData) {
          if (!item.idMal || !libraryByMalId.has(item.idMal)) continue;

          const anime = libraryByMalId.get(item.idMal)!;
          const nodes = item.airingSchedule?.nodes;
          if (!Array.isArray(nodes)) continue;

          for (const node of nodes) {
            if (!node.airingAt || !node.episode) continue;
            if (node.airingAt < nowSec || node.airingAt > nowSec + sevenDaysSec)
              continue;

            const id = `${anime.mal_id}-${node.episode}`;
            collected.push({
              id,
              malId: anime.mal_id,
              animeTitle:
                item.title?.english ||
                item.title?.userPreferred ||
                item.title?.romaji ||
                anime.title_english ||
                anime.title,
              animeImage: anime.images?.jpg?.image_url ?? '',
              episodeNumber: node.episode,
              airDate: new Date(node.airingAt * 1000).toISOString(),
              read: readIds.current.has(id),
            });
            coveredMalIds.add(anime.mal_id);
          }
        }
      }
    } catch {
      // schedule unavailable — fall through to Jikan episodes
    }

    // --- FALLBACK: Jikan episodes for anime not found in AniSchedule ---
    for (const anime of candidates) {
      if (abortRef.current) break;
      if (coveredMalIds.has(anime.mal_id)) continue;
      try {
        const episodes = await jikanService.getLatestEpisodes(anime.mal_id);
        if (!Array.isArray(episodes) || episodes.length === 0) continue;

        let foundFuture = false;
        for (const ep of episodes) {
          if (!ep.aired) continue;
          const airMs = new Date(ep.aired).getTime();
          if (isNaN(airMs)) continue;
          if (airMs >= nowMs && airMs <= nowMs + sevenDaysMs) {
            foundFuture = true;
            const id = `${anime.mal_id}-${ep.mal_id}`;
            collected.push({
              id,
              malId: anime.mal_id,
              animeTitle: anime.title_english || anime.title,
              animeImage: anime.images?.jpg?.image_url ?? '',
              episodeNumber: ep.mal_id,
              airDate: ep.aired,
              read: readIds.current.has(id),
            });
          }
        }

        if (!foundFuture) {
          const aired = episodes
            .filter(
              (ep) => ep.aired && !isNaN(new Date(ep.aired).getTime())
            )
            .sort(
              (a, b) =>
                new Date(b.aired).getTime() - new Date(a.aired).getTime()
            );

          if (aired.length > 0) {
            const latest = aired[0];
            const latestMs = new Date(latest.aired).getTime();
            const totalEps = anime.episodes as number | undefined;
            if (totalEps && latest.mal_id >= totalEps) continue;

            const projectedMs = latestMs + 7 * 24 * 60 * 60 * 1000;
            if (projectedMs >= nowMs && projectedMs <= nowMs + sevenDaysMs) {
              const nextEpNum = latest.mal_id + 1;
              const id = `${anime.mal_id}-${nextEpNum}`;
              collected.push({
                id,
                malId: anime.mal_id,
                animeTitle: anime.title_english || anime.title,
                animeImage: anime.images?.jpg?.image_url ?? '',
                episodeNumber: nextEpNum,
                airDate: new Date(projectedMs).toISOString(),
                read: readIds.current.has(id),
              });
            }
          }
        }
      } catch {
        // individual anime failure shouldn't block others
      }
    }

    collected.sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1;
      return new Date(a.airDate).getTime() - new Date(b.airDate).getTime();
    });

    if (!abortRef.current) {
      setNotifications(collected);
      setIsLoading(false);
    }
  }, [library]);

  const markAsRead = useCallback((id: string) => {
    readIds.current.add(id);
    persistReadIds(readIds.current);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      for (const n of prev) readIds.current.add(n.id);
      persistReadIds(readIds.current);
      return prev.map((n) => ({ ...n, read: true }));
    });
  }, []);

  useEffect(() => {
    if (library.length > 0) fetchNotifications();

    pollTimer.current = setInterval(() => {
      if (library.length > 0) fetchNotifications();
    }, POLL_INTERVAL_MS);

    return () => {
      abortRef.current = true;
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [library, fetchNotifications]);

  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    isLoading,
    markAsRead,
    markAllAsRead,
  };
}
