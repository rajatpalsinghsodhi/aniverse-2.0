import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EpisodeNotification } from '../types';

interface NotificationBellProps {
  notifications: EpisodeNotification[];
  unreadCount: number;
  isLoading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

function formatRelativeDate(dateStr: string): string {
  const now = new Date();
  const airDate = new Date(dateStr);
  const diffMs = airDate.getTime() - now.getTime();
  if (diffMs < 0) return 'Aired';

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return 'Airing soon';
  if (hours < 24) return `In ${hours}h`;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const airDay = new Date(airDate.getFullYear(), airDate.getMonth(), airDate.getDate());
  const calendarDays = Math.round(
    (airDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  return calendarDays === 1 ? 'Tomorrow' : `In ${calendarDays} days`;
}

function isWithin24h(dateStr: string): boolean {
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff >= 0 && diff <= 24 * 60 * 60 * 1000;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications,
  unreadCount,
  isLoading,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Bell button — original styling preserved */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="hidden sm:flex p-2.5 min-w-[44px] min-h-[44px] items-center justify-center bg-paper/[0.03] border border-paper/10 text-muted hover:text-paper hover:bg-primary transition-all relative"
      >
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-primary text-paper text-[10px] font-bold rounded-full border-2 border-ink px-0.5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-[340px] bg-ink border border-paper/10 shadow-2xl z-[60] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-paper/[0.06]">
              <div className="flex items-center gap-2">
                <p className="font-mono text-[12px] tracking-[0.15em] uppercase text-paper">
                  Notifications
                </p>
                {unreadCount > 0 && (
                  <span className="min-w-[20px] h-[20px] flex items-center justify-center bg-primary/20 text-primary text-[10px] font-bold rounded-full px-1">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="font-mono text-[10px] tracking-[0.15em] uppercase text-primary hover:text-paper transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto no-scrollbar">
              {isLoading && notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">
                    Checking episodes...
                  </p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <span className="material-symbols-outlined text-muted/40 text-3xl">
                    notifications_off
                  </span>
                  <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">
                    No upcoming episodes
                  </p>
                </div>
              ) : (
                notifications.map((n) => {
                  const urgent = isWithin24h(n.airDate);
                  return (
                    <div
                      key={n.id}
                      onClick={() => !n.read && onMarkAsRead(n.id)}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-paper/[0.06] last:border-0 transition-colors ${
                        n.read
                          ? 'opacity-40'
                          : 'hover:bg-paper/[0.03] cursor-grow'
                      }`}
                      style={{
                        borderLeft: urgent
                          ? '2px solid #ef4444'
                          : '2px solid transparent',
                      }}
                    >
                      <img
                        src={n.animeImage}
                        alt=""
                        className="w-10 h-14 object-cover border border-paper/10 flex-shrink-0"
                      />
                      <div className="flex flex-col gap-0.5 overflow-hidden min-w-0 flex-1">
                        <p className="text-xs font-bold text-paper truncate">
                          {n.animeTitle}
                        </p>
                        <p className="font-mono text-[10px] tracking-wider text-muted uppercase">
                          Episode {n.episodeNumber}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] tracking-wider text-primary">
                            {formatRelativeDate(n.airDate)}
                          </span>
                          <span className="font-mono text-[10px] tracking-wider text-muted">
                            {new Date(n.airDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            {new Date(n.airDate).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                      {!n.read && (
                        <div className="size-2 bg-primary rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
