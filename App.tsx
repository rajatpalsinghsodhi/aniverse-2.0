
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import RightSidebar from './components/RightSidebar';
import Hero from './components/Hero';
import AnimeCard from './components/AnimeCard';
import IdentificationModal from './components/IdentificationModal';
import AnimeDetailsModal from './components/AnimeDetailsModal';
import TopCharts from './components/TopCharts';
import MyLibrary from './components/MyLibrary';
import LoginModal from './components/LoginModal';
import LandingPage from './components/LandingPage';
import NotificationBell from './components/NotificationBell';
import { useNotifications } from './hooks/useNotifications';
import { jikanService } from './services/jikanService';
import { Anime } from './types';
import { CATEGORIES } from './constants';

const App: React.FC = () => {
  const [trending, setTrending] = useState<Anime[]>([]);
  const [topRated, setTopRated] = useState<Anime[]>([]);
  const [activeCategory, setActiveCategory] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialFetch, setIsInitialFetch] = useState(true);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [showIdentifier, setShowIdentifier] = useState(false);
  const [watchingAnimeId, setWatchingAnimeId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Anime[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // New States
  const [activeView, setActiveView] = useState('landing');
  const [user, setUser] = useState<any>(null);
  const [library, setLibrary] = useState<any[]>([]);
  const [showLogin, setShowLogin] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Season Selection
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedSeason, setSelectedSeason] = useState<'winter' | 'spring' | 'summer' | 'fall'>('winter');
  const [isSeasonFilterActive, setIsSeasonFilterActive] = useState(false);

  const { notifications, unreadCount, isLoading: notifLoading, markAsRead, markAllAsRead } = useNotifications(library);

  const [isCategoryCarouselPaused, setIsCategoryCarouselPaused] = useState(false);
  const stopCategoryCarousel = () => setIsCategoryCarouselPaused(true);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const categoryCarouselPausedRef = useRef(false);

  const scrollCategoryCarousel = (dir: 'left' | 'right') => {
    stopCategoryCarousel();
    const el = categoryScrollRef.current;
    if (!el) return;
    const step = 240;
    el.scrollBy({ left: dir === 'left' ? -step : step, behavior: 'smooth' });
  };

  useEffect(() => {
    let raf = 0;
    const pxPerFrame = 0.6; // smooth, subtle

    const tick = () => {
      const e = categoryScrollRef.current;
      if (e && !categoryCarouselPausedRef.current) {
        // Only animate when there is actually overflow.
        if (e.scrollWidth > e.clientWidth) {
        e.scrollLeft += pxPerFrame;
        const half = e.scrollWidth / 2;
        if (e.scrollLeft >= half) e.scrollLeft = 0;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    categoryCarouselPausedRef.current = isCategoryCarouselPaused;
  }, [isCategoryCarouselPaused]);

  useEffect(() => {
    const TIMEOUT_MS = 12000;

    const fetchData = async () => {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Load timeout')), TIMEOUT_MS)
      );

      try {
        const [trendingData, topData] = await Promise.race([
          Promise.all([
            jikanService.getTrendingAnime(),
            jikanService.getTopAnime()
          ]),
          timeoutPromise
        ]);
        setTrending(trendingData || []);
        setTopRated(topData || []);
      } catch (err) {
        console.error("Error fetching initial data", err);
        setTrending([]);
        setTopRated([]);
      } finally {
        setIsInitialFetch(false);
      }

      try {
        const authRes = await fetch('/api/auth/me');
        if (authRes.ok) {
          const authData = await authRes.json();
          setUser(authData.user);
          fetchLibrary();
        }
      } catch (authErr) {
        console.error("Auth check failed", authErr);
      }
    };
    fetchData();
  }, []);

  const fetchLibrary = async () => {
    try {
      const res = await fetch('/api/library');
      if (res.ok) {
        const data = await res.json();
        setLibrary(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (e?: React.FormEvent, queryOverride?: string) => {
    if (e) e.preventDefault();
    const query = queryOverride || searchQuery;
    if (!query.trim()) return;
    try {
      setIsLoading(true);
      setPage(1);
      const results = await jikanService.searchAnime(query, 1);
      setTrending(results);
      setActiveView('home');
      setShowSuggestions(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = async () => {
    if (isMoreLoading) return;
    try {
      setIsMoreLoading(true);
      const nextPage = page + 1;
      let newData: Anime[] = [];
      
      if (searchQuery) {
        newData = await jikanService.searchAnime(searchQuery, nextPage);
      } else if (isSeasonFilterActive) {
        newData = await jikanService.getAnimeBySeason(selectedYear, selectedSeason, nextPage);
      } else if (activeCategory !== 0) {
        newData = await jikanService.getAnimeByGenre(activeCategory, nextPage);
      } else {
        newData = await jikanService.getTrendingAnime(nextPage);
      }

      setTrending(prev => [...prev, ...newData]);
      setPage(nextPage);
    } catch (err) {
      console.error(err);
    } finally {
      setIsMoreLoading(false);
    }
  };

  const handleSearchChange = async (val: string) => {
    setSearchQuery(val);
    if (val.length > 2) {
      try {
        const results = await jikanService.searchAnime(val);
        setSuggestions(results.slice(0, 5));
        setShowSuggestions(true);
      } catch (err) {
        console.error(err);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSeasonChange = async (year: number, season: any) => {
    setSelectedYear(year);
    setSelectedSeason(season);
    setIsSeasonFilterActive(true);
    try {
      setIsLoading(true);
      const data = await jikanService.getAnimeBySeason(year, season);
      setTrending(data);
      setActiveView('home');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryClick = async (catId: number) => {
    stopCategoryCarousel();
    setActiveCategory(catId);
    setIsSeasonFilterActive(false);
    try {
      setIsLoading(true);
      if (catId === 0) {
        const data = await jikanService.getTrendingAnime();
        setTrending(data);
      } else {
        const data = await jikanService.getAnimeByGenre(catId);
        setTrending(data);
      }
      setActiveView('home');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const openWatch = (id: number) => {
    setWatchingAnimeId(id);
  };

  const handleAddToLibrary = async (anime: Anime) => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    try {
      const res = await fetch('/api/library/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anime }),
      });
      if (res.ok) {
        const data = await res.json();
        setLibrary(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveFromLibrary = async (animeId: number) => {
    try {
      const res = await fetch('/api/library/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animeId }),
      });
      if (res.ok) {
        const data = await res.json();
        setLibrary(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (animeId: number, status: string) => {
    try {
      const res = await fetch('/api/library/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animeId, status }),
      });
      if (res.ok) {
        const data = await res.json();
        setLibrary(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setLibrary([]);
    setActiveView('home');
  };

  const resetHome = async () => {
    setSearchQuery('');
    setActiveCategory(0);
    setIsSeasonFilterActive(false);
    try {
      setIsLoading(true);
      const [trendingData, topData] = await Promise.all([
        jikanService.getTrendingAnime(),
        jikanService.getTopAnime()
      ]);
      setTrending(trendingData);
      setTopRated(topData);
      setActiveView('home');
    } catch (err) {
      console.error("Error resetting home", err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-primary font-mono text-xs tracking-[0.3em] uppercase">Summoning spirits...</p>
        </div>
      );
    }

    if (activeView === 'home' && isInitialFetch && trending.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-primary font-mono text-xs tracking-[0.3em] uppercase">Loading anime...</p>
        </div>
      );
    }

    switch (activeView) {
      case 'charts':
        return <TopCharts onWatch={openWatch} />;
      case 'library':
        return (
          <MyLibrary 
            user={user} 
            library={library} 
            onRemove={handleRemoveFromLibrary} 
            onUpdateStatus={handleUpdateStatus}
            onWatch={openWatch}
          />
        );
      case 'home':
      default: {
        if (!isInitialFetch && trending.length === 0 && topRated.length === 0) {
          return (
            <section className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 py-16 text-center gap-4">
              <h2 className="text-2xl md:text-3xl font-heading text-paper">
                We couldn&apos;t load anime right now
              </h2>
              <p className="max-w-md text-sm text-paper/40 font-light">
                This usually happens when the public anime API is temporarily busy or your connection is offline.
                Try again in a bit, or use search above to look up a specific title.
              </p>
              <button
                onClick={resetHome}
                className="mt-2 px-6 py-2.5 bg-primary text-paper font-mono text-[12px] tracking-[0.2em] uppercase hover:brightness-110 active:scale-95 transition"
              >
                Retry Loading
              </button>
            </section>
          );
        }

        return (
          <>
            {trending && trending.length > 0 && (
              <Hero featured={trending[0]} onWatch={openWatch} />
            )}

            {/* Genre Filter */}
            <section className="px-4 sm:px-6 md:px-6 lg:px-8 pb-6 relative">
              <div className="flex items-center gap-2 h-10">
                <button
                  type="button"
                  onClick={() => scrollCategoryCarousel('left')}
                  className="hidden md:flex flex-shrink-0 w-10 h-10 items-center justify-center bg-paper/[0.03] border border-paper/10 text-muted hover:text-primary hover:border-primary/40 transition-all"
                  aria-label="Scroll categories left"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>

                <div className="relative flex-1 min-w-0 h-10 overflow-hidden">
                  <div
                    ref={categoryScrollRef}
                    className="w-full h-10 flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth"
                    style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
                    onPointerDown={stopCategoryCarousel}
                    onTouchStart={stopCategoryCarousel}
                    onWheel={stopCategoryCarousel}
                  >
                    {[...CATEGORIES, ...CATEGORIES].map((cat, index) => (
                      <div 
                        key={`category-loop-${index}`}
                        onClick={() => handleCategoryClick(cat.id)}
                        className={`flex h-10 shrink-0 items-center justify-center gap-x-2 px-6 cursor-grow transition-all border font-mono text-[12px] tracking-[0.15em] uppercase ${
                          activeCategory === cat.id 
                            ? 'bg-primary text-paper border-primary' 
                            : 'bg-surface-dark border-paper/[0.06] text-paper/60 hover:bg-paper/[0.03] hover:text-paper'
                        }`}
                      >
                        <p>{cat.name}</p>
                      </div>
                    ))}
                  </div>

                  <div className="hidden sm:block absolute inset-y-0 left-0 w-10 pointer-events-none bg-gradient-to-r from-ink to-transparent" aria-hidden />
                  <div className="hidden sm:block absolute inset-y-0 right-0 w-10 pointer-events-none bg-gradient-to-l from-ink to-transparent" aria-hidden />
                </div>

                <button
                  type="button"
                  onClick={() => scrollCategoryCarousel('right')}
                  className="hidden md:flex flex-shrink-0 w-10 h-10 items-center justify-center bg-paper/[0.03] border border-paper/10 text-muted hover:text-primary hover:border-primary/40 transition-all"
                  aria-label="Scroll categories right"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </section>

            {/* Trending Now */}
            <section className="px-4 sm:px-6 md:px-6 lg:px-8 pb-10">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 gap-4">
                <h2 className="font-heading text-2xl text-paper tracking-normal flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary fill-1">bolt</span>
                  {isSeasonFilterActive ? `${selectedSeason.charAt(0).toUpperCase() + selectedSeason.slice(1)} ${selectedYear} Releases` : 'Trending Now'}
                </h2>
                
                <div className="w-fit flex-shrink-0 self-start lg:self-auto flex items-center gap-1 h-10 px-2 bg-surface-dark border border-paper/[0.06]">
                  <span className="material-symbols-outlined pl-1 text-primary pointer-events-none !text-lg" aria-hidden>calendar_today</span>
                  <select 
                    value={selectedSeason}
                    onChange={(e) => handleSeasonChange(selectedYear, e.target.value)}
                    className="appearance-none bg-transparent font-mono text-[12px] tracking-[0.15em] uppercase text-paper outline-none border-0 pl-1 pr-5 py-2 cursor-grow hover:text-primary transition-colors focus:ring-0 focus:outline-none h-10"
                  >
                    <option value="winter">Winter</option>
                    <option value="spring">Spring</option>
                    <option value="summer">Summer</option>
                    <option value="fall">Fall</option>
                  </select>
                  <select 
                    value={selectedYear}
                    onChange={(e) => handleSeasonChange(parseInt(e.target.value), selectedSeason)}
                    className="appearance-none bg-transparent font-mono text-[12px] tracking-[0.15em] uppercase text-paper outline-none border-0 pl-2 pr-6 py-2 cursor-grow hover:text-primary transition-colors focus:ring-0 focus:outline-none h-10"
                  >
                    {[2026, 2025, 2024, 2023, 2022].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <button 
                  onClick={() => setActiveView('charts')}
                  className="font-mono text-[12px] tracking-[0.2em] uppercase text-muted hover:text-paper flex items-center gap-2 transition-colors"
                >
                  View all →
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-5 lg:gap-6">
                {trending.map((anime, index) => (
                  <AnimeCard 
                    key={`${anime.mal_id}-${index}`} 
                    anime={anime} 
                    onWatch={openWatch} 
                    rank={index + 1}
                  />
                ))}
              </div>

              {trending.length > 0 && (
                <div className="mt-12 flex justify-center">
                  <button 
                    onClick={loadMore}
                    disabled={isMoreLoading}
                    className="px-8 py-3 bg-paper/[0.03] border border-paper/10 text-paper font-mono text-[12px] tracking-[0.2em] uppercase hover:bg-primary hover:text-paper hover:border-primary transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isMoreLoading ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span className="material-symbols-outlined">add</span>
                    )}
                    Load More Titles
                  </button>
                </div>
              )}
            </section>

            {/* Top Rated */}
            <section className="px-4 sm:px-6 md:px-6 lg:px-8 pb-10">
              <div className="flex items-center justify-between pb-6">
                <h2 className="font-heading text-2xl text-paper tracking-normal flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary fill-1">workspace_premium</span>
                  Top Rated
                </h2>
                <button 
                  onClick={() => setActiveView('charts')}
                  className="font-mono text-[12px] tracking-[0.2em] uppercase text-muted hover:text-paper flex items-center gap-2 transition-colors"
                >
                  View all →
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-5 lg:gap-6">
                {topRated.map(anime => (
                  <AnimeCard key={anime.mal_id} anime={anime} onWatch={openWatch} />
                ))}
              </div>
            </section>
          </>
        );
      }
    }
  };

  const enterApp = () => {
    setActiveView('home');
  };

  if (activeView === 'landing') {
    return (
      <div className="font-body bg-ink text-paper dark">
        <LandingPage
          onEnter={enterApp}
          onOpenIdentifier={() => setShowIdentifier(true)}
        />
        {showIdentifier && (
          <IdentificationModal
            onClose={() => setShowIdentifier(false)}
            onViewAnime={(malId) => {
              setShowIdentifier(false);
              setWatchingAnimeId(malId);
              setActiveView('home');
            }}
          />
        )}
        {watchingAnimeId !== null && (
          <AnimeDetailsModal
            animeId={watchingAnimeId}
            onClose={() => setWatchingAnimeId(null)}
            onAddToLibrary={handleAddToLibrary}
            isInLibrary={!!library.find(a => a.mal_id === watchingAnimeId)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden font-body bg-ink text-paper">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <Sidebar 
          activeView={activeView} 
          onViewChange={(v) => {
            if (v === 'home') resetHome();
            else if (v === 'login') setShowLogin(true);
            else setActiveView(v);
          }} 
          user={user}
          onLogout={handleLogout}
        />
      </div>

      {/* Sidebar - Mobile Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.div 
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-ink z-[101] lg:hidden shadow-2xl border-r border-paper/[0.06]"
            >
              <Sidebar 
                activeView={activeView} 
                onViewChange={(v) => {
                  setIsSidebarOpen(false);
                  if (v === 'home') resetHome();
                  else if (v === 'login') setShowLogin(true);
                  else setActiveView(v);
                }} 
                user={user}
                onLogout={handleLogout}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col overflow-y-auto no-scrollbar relative">
        <div className="flex-1 flex flex-col w-full max-w-[1600px] mx-auto">
        {/* Top Header */}
        <header className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-6 lg:px-8 py-4 glass-effect gap-4">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center bg-paper/[0.03] border border-paper/10 text-muted"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="flex flex-1 max-w-xl relative">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative w-full">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted text-xl">search</span>
                  <input 
                    className="w-full bg-ink/50 border border-paper/10 py-2.5 pl-12 pr-4 font-mono text-[12px] tracking-wider focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-muted text-paper" 
                    placeholder="Search anime..." 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => searchQuery.length > 2 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  />
                </div>
              </form>
              
              {/* Search Suggestions */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-ink border border-paper/10 shadow-2xl overflow-hidden z-[60]"
                  >
                    {suggestions.map((item) => (
                      <div 
                        key={item.mal_id}
                        onClick={() => {
                          setSearchQuery(item.title);
                          handleSearch(undefined, item.title);
                        }}
                        className="flex items-center gap-4 p-3 hover:bg-paper/[0.03] cursor-grow transition-colors border-b border-paper/[0.06] last:border-0"
                      >
                        <img src={item.images.jpg.image_url} className="w-10 h-14 object-cover border border-paper/10" alt="" />
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-sm font-bold text-paper truncate">{item.title_english || item.title}</span>
                          <span className="font-mono text-[12px] tracking-wider text-muted uppercase">{item.type} · {item.score} Rating</span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setShowIdentifier(true)}
              className="p-2.5 md:px-4 md:py-2.5 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center gap-2 bg-primary text-paper font-mono text-[12px] tracking-[0.15em] uppercase hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined !text-xl">auto_awesome</span>
              <span className="hidden md:inline">Identify</span>
            </button>
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              isLoading={notifLoading}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
            />
            <button 
              onClick={() => setActiveView('library')}
              className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center transition-all ${activeView === 'library' ? 'bg-primary text-paper' : 'bg-paper/[0.03] border border-paper/10 text-muted hover:text-paper hover:bg-primary'}`}
            >
              <span className="material-symbols-outlined">favorite</span>
            </button>
          </div>
        </header>

        {renderContent()}
        {/* Tablet portrait + mobile: Library & Trends inline */}
        <div className="lg:hidden w-full px-4 sm:px-6 pb-8">
          <RightSidebar
            user={user}
            library={library}
            onWatch={openWatch}
            variant="inline"
            trending={trending}
          />
        </div>
        </div>
      </main>

      <div className="hidden lg:block">
        <RightSidebar
          user={user}
          library={library}
          onWatch={openWatch}
          trending={trending}
        />
      </div>

      {showIdentifier && (
        <IdentificationModal
          onClose={() => setShowIdentifier(false)}
          onViewAnime={(malId) => {
            setShowIdentifier(false);
            setWatchingAnimeId(malId);
          }}
        />
      )}
      
      {watchingAnimeId !== null && (
        <AnimeDetailsModal 
          animeId={watchingAnimeId} 
          onClose={() => setWatchingAnimeId(null)} 
          onAddToLibrary={handleAddToLibrary}
          isInLibrary={!!library.find(a => a.mal_id === watchingAnimeId)}
        />
      )}

      {showLogin && (
        <LoginModal 
          onClose={() => setShowLogin(false)} 
          onLogin={(u) => {
            setUser(u);
            fetchLibrary();
          }} 
        />
      )}
    </div>
  );
};

export default App;
