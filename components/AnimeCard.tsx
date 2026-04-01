
import React, { useState, useRef, useEffect } from 'react';
import { Anime, AnimeListRankChart } from '../types';
import { TOP_CHART_FILTER_LABELS } from '../constants';

const LONG_PRESS_MS = 400;

interface AnimeCardProps {
  anime: Anime;
  onWatch: (id: number) => void;
  /** Only on Top Charts: position on the active top list (not the same as `anime.rank`). */
  listRankChart?: AnimeListRankChart;
}

const AnimeCard: React.FC<AnimeCardProps> = ({ anime, onWatch, listRankChart }) => {
  const [showInfoOverlay, setShowInfoOverlay] = useState(false);
  const isTouchRef = useRef(false);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isTouchRef.current = window.matchMedia('(pointer: coarse)').matches;
    const mq = window.matchMedia('(pointer: coarse)');
    const handler = () => { isTouchRef.current = mq.matches; };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!isTouchRef.current) return;
    const card = cardRef.current;
    if (!card) return;

    const handleStart = (e: TouchEvent) => {
      pressTimerRef.current = setTimeout(() => {
        pressTimerRef.current = null;
        setShowInfoOverlay(true);
      }, LONG_PRESS_MS);
    };
    const handleEnd = (e: TouchEvent) => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
      } else {
        e.preventDefault();
      }
    };
    const handleCancel = () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
      }
    };

    card.addEventListener('touchstart', handleStart, { passive: true });
    card.addEventListener('touchend', handleEnd, { passive: false });
    card.addEventListener('touchcancel', handleCancel, { passive: true });

    const dismissOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (card && !card.contains(target)) setShowInfoOverlay(false);
    };
    document.addEventListener('click', dismissOutside);
    document.addEventListener('touchstart', dismissOutside, { passive: true });

    return () => {
      card.removeEventListener('touchstart', handleStart);
      card.removeEventListener('touchend', handleEnd);
      card.removeEventListener('touchcancel', handleCancel);
      document.removeEventListener('click', dismissOutside);
      document.removeEventListener('touchstart', dismissOutside);
    };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    if (showInfoOverlay && isTouchRef.current) {
      setShowInfoOverlay(false);
      e.preventDefault();
      e.stopPropagation();
    } else {
      onWatch(anime.mal_id);
    }
  };

  const overlayVisible = showInfoOverlay || undefined;

  return (
    <div 
      ref={cardRef}
      onClick={handleClick}
      className="w-full group cursor-grow relative overflow-hidden"
    >
      <div className="relative aspect-[2/3] overflow-hidden mb-3 border border-paper/[0.06]">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
          style={{ backgroundImage: `url(${anime.images.jpg.large_image_url})` }}
        />
        
        {/* Top red line on hover */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-primary origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-400 z-10" />

        {listRankChart && (
          <div
            role="img"
            className="absolute top-0 left-0 z-[11] flex min-h-[2.25rem] min-w-[2.25rem] items-center justify-center px-2.5 py-2 bg-primary text-paper shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
            title={`Spot ${listRankChart.position} on the ${TOP_CHART_FILTER_LABELS[listRankChart.filter]} chart. Differs from worldwide score rank in details.`}
            aria-label={`Spot ${listRankChart.position} on the ${TOP_CHART_FILTER_LABELS[listRankChart.filter]} chart`}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.2] bg-[repeating-linear-gradient(180deg,transparent,transparent_2px,rgba(0,0,0,0.06)_2px,rgba(0,0,0,0.06)_3px)]"
              aria-hidden
            />
            <span
              className="relative z-10 font-mono text-[15px] font-bold tabular-nums leading-none tracking-wide text-paper"
              aria-hidden="true"
            >
              {listRankChart.position}
            </span>
          </div>
        )}

        <div className="absolute top-2 right-2 px-2 py-1 bg-ink/70 backdrop-blur-sm text-paper font-mono text-[12px] tracking-wider flex items-center gap-1">
          <span className="material-symbols-outlined text-yellow-400 fill-1 !text-[12px]">star</span>
          {anime.score || 'N/A'}
        </div>

        {/* Hover overlay (desktop) or long-press overlay (touch) */}
        <div 
          className={`absolute inset-0 transition-all flex items-center justify-center ${
            overlayVisible 
              ? 'bg-ink/50 opacity-100' 
              : 'bg-ink/0 opacity-0 group-hover:bg-ink/50 group-hover:opacity-100'
          }`}
        >
          <div className={`bg-paper/10 backdrop-blur-sm p-3 border border-paper/20 transition-transform ${
            overlayVisible ? 'scale-100' : 'scale-75 group-hover:scale-100'
          }`}>
            <span className="material-symbols-outlined text-paper text-2xl">info</span>
          </div>
        </div>

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-ink/80 to-transparent" />
      </div>
      <h3 className="text-paper font-bold text-sm truncate group-hover:text-primary transition-colors">
        {anime.title_english || anime.title}
      </h3>
      <p className="text-muted font-mono text-[12px] tracking-wider mt-1 uppercase">
        {anime.type} · {(anime.genres || []).slice(0, 1).map(g => g.name).join(', ') || 'Anime'}
      </p>
    </div>
  );
};

export default AnimeCard;
