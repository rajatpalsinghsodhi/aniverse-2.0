
import React, { useEffect, useState } from 'react';
import { jikanService } from '../services/jikanService';
import type { Anime } from '../types';

interface RightSidebarProps {
  user: any;
  library: any[];
  onWatch: (id: number) => void;
  variant?: 'sidebar' | 'inline';
  trending?: Anime[];
}

const RightSidebar: React.FC<RightSidebarProps> = ({ user, library, onWatch, variant = 'sidebar', trending = [] }) => {
  const recentLibrary = library.slice(-3).reverse();
  const isInline = variant === 'inline';
  const [schedule, setSchedule] = useState<any[]>([]);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [schedulePage, setSchedulePage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setIsScheduleLoading(true);
        setScheduleError(null);

        const scheduleData = await jikanService.getSchedule();

        const withNodes = (scheduleData || []).filter(
          (item: any) =>
            Array.isArray(item.airingSchedule?.nodes) &&
            item.airingSchedule.nodes.length > 0
        );

        let ordered: any[] = [];

        if (trending && trending.length > 0) {
          const indexMap = new Map<number, number>();
          trending.forEach((anime, index) => {
            indexMap.set(anime.mal_id, index);
          });

          ordered = withNodes
            .filter((item: any) => item.idMal && indexMap.has(item.idMal))
            .sort((a: any, b: any) => {
              const aIndex = indexMap.get(a.idMal) ?? Number.MAX_SAFE_INTEGER;
              const bIndex = indexMap.get(b.idMal) ?? Number.MAX_SAFE_INTEGER;
              return aIndex - bIndex;
            });
        }

        if (!ordered.length) {
          ordered = withNodes.sort((a: any, b: any) => {
            const now = Date.now() / 1000;

            const nextA =
              a.airingSchedule.nodes.find((n: any) => n.airingAt && n.airingAt > now) ||
              a.airingSchedule.nodes[0];
            const nextB =
              b.airingSchedule.nodes.find((n: any) => n.airingAt && n.airingAt > now) ||
              b.airingSchedule.nodes[0];

            const aTime = nextA?.airingAt ?? Number.MAX_SAFE_INTEGER;
            const bTime = nextB?.airingAt ?? Number.MAX_SAFE_INTEGER;

            return aTime - bTime;
          });
        }

        setSchedule(ordered.slice(0, 100));
        setSchedulePage(1);
      } catch (err) {
        console.error('Failed to load airing schedule', err);
        setSchedule([]);
        setScheduleError('Schedule temporarily unavailable.');
      } finally {
        setIsScheduleLoading(false);
      }
    };
    loadSchedule();
  }, [trending]);

  const totalSchedulePages = Math.max(1, Math.ceil(schedule.length / ITEMS_PER_PAGE));
  const currentScheduleSlice = schedule.slice(
    (schedulePage - 1) * ITEMS_PER_PAGE,
    schedulePage * ITEMS_PER_PAGE
  );

  const content = (
    <>
      {user ? (
        <>
          <h2 className="font-heading text-lg text-paper mb-4 md:mb-6">In Your Library</h2>
          {recentLibrary.length > 0 ? (
            <div className={isInline ? 'flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-1' : 'flex flex-col gap-6'}>
              {recentLibrary.map(item => (
                <div 
                  key={item.mal_id} 
                  className={`flex gap-4 group cursor-grow ${isInline ? 'flex-shrink-0 w-[280px]' : ''}`}
                  onClick={() => onWatch(item.mal_id)}
                >
                  <div className="w-24 h-16 overflow-hidden flex-shrink-0 relative border border-paper/[0.06]">
                    <img 
                      src={item.images.jpg.image_url} 
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  </div>
                  <div className="flex flex-col justify-center overflow-hidden min-w-0">
                    <p className="text-xs font-bold text-paper truncate">{item.title}</p>
                    <p className="font-mono text-[12px] text-primary mt-1 tracking-[0.2em] uppercase">{item.status?.replace('_', ' ') ?? ''}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 md:p-6 bg-paper/[0.03] border border-dashed border-paper/10 text-center">
              <p className="text-[13px] md:text-xs text-muted font-mono tracking-wider">Your library is empty. Start adding some anime!</p>
            </div>
          )}
        </>
      ) : (
        <div className="p-6 md:p-8 bg-primary/10 border border-primary/20 text-center space-y-4">
          <div className="w-12 h-12 bg-primary/20 text-primary flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined">account_circle</span>
          </div>
          <h3 className="font-heading text-lg text-paper">Join AnimeVerse</h3>
          <p className="text-[13px] md:text-xs text-paper/40 leading-relaxed font-light">Create an account to track your progress and build your personal collection.</p>
        </div>
      )}

      <div className={isInline ? 'mt-8' : 'mt-12'}>
        <h2 className="font-heading text-lg text-paper mb-4 md:mb-6">Airing Schedule</h2>
        {isScheduleLoading ? (
          <div className={isInline ? 'flex gap-4' : 'space-y-3'}>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`p-4 bg-surface-dark/60 border border-paper/[0.06] animate-pulse ${isInline ? 'flex-shrink-0 w-[260px]' : ''}`}
              >
                <div className="h-3 w-20 bg-paper/10 mb-2" />
                <div className="h-4 w-40 bg-paper/10 mb-1" />
                <div className="h-3 w-32 bg-paper/10" />
              </div>
            ))}
          </div>
        ) : scheduleError ? (
          <div className="p-4 bg-surface-dark/70 border border-paper/10 text-xs text-muted font-mono tracking-wider">
            {scheduleError}
          </div>
        ) : (
          <>
          <div className={isInline ? 'flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-1' : 'space-y-4'}>
            {currentScheduleSlice.map((item: any) => {
              const nodes = item.airingSchedule?.nodes || [];
              const now = Date.now() / 1000;
              const nextNode =
                nodes.find((n: any) => n.airingAt && n.airingAt > now) || nodes[0];
              if (!nextNode) return null;

              const airingDate = new Date(nextNode.airingAt * 1000);
              const dayLabel = airingDate.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              });
              const timeLabel = airingDate.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit'
              });
              const label = `${dayLabel} • ${timeLabel}`;

              const seasonLabel =
                item.seasonYear && item.format
                  ? `${item.format} • ${item.seasonYear}`
                  : item.format || '';

              const displayTitle =
                item.title?.english ||
                item.title?.userPreferred ||
                item.title?.romaji ||
                item.title?.native ||
                'Unknown title';

              return (
                <div
                  key={item.idMal ?? `${displayTitle}-${label}`}
                  className={`p-4 bg-surface-dark border border-paper/[0.06] relative overflow-hidden group hover:bg-[#120808] transition-colors ${isInline ? 'flex-shrink-0 w-[260px]' : ''}`}
                >
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-primary origin-left scale-x-0 group-hover:scale-x-100 transition-transform" />
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[12px] tracking-[0.2em] text-primary uppercase">
                      {label}
                    </span>
                    {seasonLabel && (
                      <span className="font-mono text-[12px] text-muted tracking-wider">{seasonLabel}</span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-paper line-clamp-2">
                    {displayTitle}
                  </p>
                  {nextNode.episode && (
                    <p className="font-mono text-[13px] text-paper/[0.55] tracking-wider mt-1">
                      {`Episode ${nextNode.episode} • Upcoming`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {schedule.length > ITEMS_PER_PAGE && (
            <div className="mt-4 flex items-center justify-between font-mono text-[12px] text-muted tracking-wider">
              <span>
                Page {schedulePage} of {totalSchedulePages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSchedulePage((p) => Math.max(1, p - 1))}
                  disabled={schedulePage === 1}
                  className="px-2 py-1 border border-paper/10 bg-surface-dark disabled:opacity-40 disabled:cursor-not-allowed font-mono text-[12px] tracking-wider uppercase hover:bg-primary hover:text-paper hover:border-primary transition-colors"
                >
                  Prev
                </button>
                <button
                  onClick={() => setSchedulePage((p) => Math.min(totalSchedulePages, p + 1))}
                  disabled={schedulePage === totalSchedulePages}
                  className="px-2 py-1 border border-paper/10 bg-surface-dark disabled:opacity-40 disabled:cursor-not-allowed font-mono text-[12px] tracking-wider uppercase hover:bg-primary hover:text-paper hover:border-primary transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          </>
        )}
      </div>

      {!isInline && (
        <div className="mt-auto pt-8">
          <div className="relative overflow-hidden p-6 bg-paper/[0.03] border border-paper/[0.06]">
            <p className="text-sm font-bold text-paper mb-1">Official Data</p>
            <p className="font-mono text-[12px] text-muted tracking-wider mb-4 leading-relaxed uppercase">Powered by Jikan API and MyAnimeList</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[12px] text-emerald-500 tracking-[0.3em] uppercase">Live Sync</span>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (isInline) {
    return (
      <section className="w-full space-y-8 pt-6 border-t border-paper/[0.06]">
        {content}
      </section>
    );
  }

  return (
    <aside className="w-64 lg:w-72 xl:w-80 flex-shrink-0 h-screen border-l border-paper/[0.06] bg-ink/30 hidden lg:flex flex-col p-4 sm:p-6 xl:p-8 overflow-y-auto no-scrollbar">
      {content}
    </aside>
  );
};

export default RightSidebar;
