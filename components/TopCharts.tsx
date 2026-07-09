import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Star, Users } from 'lucide-react';
import { Anime, TopChartFilter } from '../types';
import AnimeCard from './AnimeCard';
import { jikanService } from '../services/jikanService';

const TopCharts: React.FC<{ onWatch: (id: number) => void }> = ({ onWatch }) => {
  const [topAnime, setTopAnime] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<TopChartFilter>('bypopularity');
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    const fetchTop = async () => {
      try {
        setIsLoading(true);
        setPage(1);
        setHasMore(true);
        const { data, hasNextPage } = await jikanService.getTopChartAnime(filter, 1);
        setTopAnime(data);
        setHasMore(hasNextPage);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTop();
  }, [filter]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setIsMoreLoading(true);
    try {
      const nextPage = page + 1;
      const { data, hasNextPage } = await jikanService.getTopChartAnime(filter, nextPage);
      setTopAnime(prev => [...prev, ...data]);
      setPage(nextPage);
      setHasMore(hasNextPage);
    } catch (err) {
      console.error(err);
    } finally {
      loadingRef.current = false;
      setIsMoreLoading(false);
    }
  }, [filter, page, hasMore]);

  useEffect(() => {
    if (isLoading || !hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '300px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isLoading, hasMore, loadMore]);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-5xl text-paper tracking-normal flex items-center gap-3">
            <Trophy className="text-primary" size={36} />
            Top Charts
          </h1>
          <p className="text-paper/40 mt-2 font-light text-sm max-w-xl">
            Curated top lists from the catalog. The number on each poster is your place on <span className="text-paper/55">this</span> list only — open a title for score and worldwide rank by rating.
          </p>
        </div>

        <div className="flex flex-wrap gap-px p-0 bg-paper/[0.06] border border-paper/[0.06]">
          {[
            { id: 'bypopularity' as const, label: 'Popular', icon: Users },
            { id: 'byscore' as const, label: 'Highest rated', icon: Star },
            { id: 'airing' as const, label: 'Top airing', icon: TrendingUp },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id)}
              className={`flex items-center gap-2 px-6 py-2.5 font-mono text-[12px] tracking-[0.15em] uppercase transition-all ${
                filter === btn.id 
                  ? 'bg-primary text-paper' 
                  : 'bg-ink text-muted hover:text-paper'
              }`}
            >
              <btn.icon size={14} />
              {btn.label}
            </button>
          ))}
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-primary font-mono text-xs tracking-[0.3em] uppercase">Loading charts...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6 md:gap-8">
            {topAnime.map((anime, index) => (
              <motion.div
                key={`${anime.mal_id}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (index % 20) * 0.05 }}
                className="relative group"
              >
                <AnimeCard
                  anime={anime}
                  onWatch={onWatch}
                  listRankChart={{ position: index + 1, filter }}
                />
              </motion.div>
            ))}
          </div>

          <div ref={sentinelRef} className="h-1" aria-hidden />

          {isMoreLoading && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TopCharts;
