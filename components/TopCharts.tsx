import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Star, Users } from 'lucide-react';
import { Anime } from '../types';
import AnimeCard from './AnimeCard';

const TopCharts: React.FC<{ onWatch: (id: number) => void }> = ({ onWatch }) => {
  const [topAnime, setTopAnime] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'bypopularity' | 'favorite' | 'airing'>('bypopularity');

  useEffect(() => {
    const fetchTop = async () => {
      try {
        setIsLoading(true);
        setPage(1);
        const res = await fetch(`https://api.jikan.moe/v4/top/anime?filter=${filter}&page=1`);
        const json = await res.json();
        setTopAnime(json.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTop();
  }, [filter]);

  const loadMore = async () => {
    if (isMoreLoading) return;
    try {
      setIsMoreLoading(true);
      const nextPage = page + 1;
      const res = await fetch(`https://api.jikan.moe/v4/top/anime?filter=${filter}&page=${nextPage}`);
      const json = await res.json();
      setTopAnime(prev => [...prev, ...(json.data || [])]);
      setPage(nextPage);
    } catch (err) {
      console.error(err);
    } finally {
      setIsMoreLoading(false);
    }
  };

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
            { id: 'bypopularity', label: 'Popular', icon: Users },
            { id: 'favorite', label: 'Favorites', icon: Star },
            { id: 'airing', label: 'Top airing', icon: TrendingUp },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id as any)}
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

          {topAnime.length > 0 && (
            <div className="mt-16 flex justify-center">
              <button 
                onClick={loadMore}
                disabled={isMoreLoading}
                className="px-10 py-4 bg-paper/[0.03] border border-paper/10 text-paper font-mono text-[12px] tracking-[0.2em] uppercase hover:bg-primary hover:border-primary transition-all disabled:opacity-50 flex items-center gap-3"
              >
                {isMoreLoading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <TrendingUp size={18} />
                )}
                Load more on this chart
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TopCharts;
