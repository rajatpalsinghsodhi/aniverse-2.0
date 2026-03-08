import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Plus, Check, Star, Clock, Play, Info, Users, Image as ImageIcon, Layers, Share2 } from 'lucide-react';
import { jikanService } from '../services/jikanService';
import { Anime } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AnimeDetailsModalProps {
  animeId: number;
  onClose: () => void;
  onAddToLibrary?: (anime: Anime) => void;
  isInLibrary?: boolean;
}

const AnimeDetailsModal: React.FC<AnimeDetailsModalProps> = ({ animeId, onClose, onAddToLibrary, isInLibrary }) => {
  const [currentAnimeId, setCurrentAnimeId] = useState(animeId);
  const [anime, setAnime] = useState<Anime | null>(null);
  const [streamingLinks, setStreamingLinks] = useState<any[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [pictures, setPictures] = useState<any[]>([]);
  const [relations, setRelations] = useState<any[]>([]);
  const [fallbackSynopsis, setFallbackSynopsis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'characters' | 'relations' | 'gallery' | 'watch'>('info');
  const [nextEpisodeLabel, setNextEpisodeLabel] = useState<string | null>(null);

  useEffect(() => {
    setCurrentAnimeId(animeId);
  }, [animeId]);

  const MAINSTREAM_PLATFORMS = [
    'Crunchyroll', 'Netflix', 'Amazon Prime Video', 'Amazon', 'Hulu',
    'Disney+', 'HIDIVE', 'Funimation', 'HBO Max', 'Apple TV+', 'YouTube'
  ];

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setIsLoading(true);
        const [fullDetails, chars, pics] = await Promise.all([
          jikanService.getAnimeDetailsFull(currentAnimeId),
          jikanService.getAnimeCharacters(currentAnimeId),
          jikanService.getAnimePictures(currentAnimeId),
        ]);
        setAnime(fullDetails);

        const stream = fullDetails.streaming || [];
        const external = fullDetails.external || [];
        const rels = fullDetails.relations || [];

        const mergedLinks = [...stream, ...external]
          .filter((link: any) => MAINSTREAM_PLATFORMS.some(p => link.name.includes(p)))
          .filter((v: any, i: number, a: any[]) => a.findIndex(t => (t.name === v.name)) === i);
        
        setStreamingLinks(mergedLinks);
        setCharacters(chars.slice(0, 12));
        setPictures(pics);
        setRelations(rels);

        if (!fullDetails.synopsis || fullDetails.synopsis.length < 100) {
          const kitsuSyn = await jikanService.getKitsuSynopsis(fullDetails.title);
          setFallbackSynopsis(kitsuSyn);
        }
      } catch (err) {
        console.error("Error fetching anime details", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [currentAnimeId]);

  useEffect(() => {
    const loadNextEpisode = async () => {
      try {
        const schedule = await jikanService.getSchedule();
        if (!anime) return;
        const item = (schedule || []).find((s: any) => s.idMal === anime.mal_id);
        if (!item || !item.airingSchedule?.nodes) {
          setNextEpisodeLabel(null);
          return;
        }
        const nodes = item.airingSchedule.nodes;
        const now = Date.now() / 1000;
        const nextNode = nodes.find((n: any) => n.airingAt && n.airingAt > now) || nodes[0];
        if (!nextNode) {
          setNextEpisodeLabel(null);
          return;
        }
        const airingDate = new Date(nextNode.airingAt * 1000);
        const datePart = airingDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        const timePart = airingDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        setNextEpisodeLabel(`Episode ${nextNode.episode} • ${datePart} at ${timePart}`);
      } catch (err) {
        console.error('Failed to load next episode info', err);
        setNextEpisodeLabel(null);
      }
    };
    loadNextEpisode();
  }, [anime]);


  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/90 backdrop-blur-xl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(200,16,46,0.4)]"></div>
          <p className="text-primary font-mono text-[12px] tracking-[0.3em] uppercase animate-pulse">Syncing Database</p>
        </div>
      </div>
    );
  }

  if (!anime) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-start lg:items-center justify-center p-0 lg:p-12 bg-ink/95 backdrop-blur-2xl overflow-y-auto"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 40 }}
          className="relative w-full max-w-7xl bg-[#0a0a0a] border border-paper/10 overflow-y-auto lg:overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col lg:flex-row h-screen lg:max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Background Atmosphere */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
            <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[120px]" />
            <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[100px]" />
          </div>

          {/* Poster Section */}
          <div className="w-full lg:w-[35%] relative flex flex-col border-b lg:border-b-0 lg:border-r border-paper/[0.06] bg-ink/40 backdrop-blur-md shrink-0 lg:overflow-y-auto no-scrollbar">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 z-[110] p-2.5 bg-paper/10 text-paper hover:bg-primary transition-all border border-paper/20 backdrop-blur-md shadow-2xl"
            >
              <X size={20} />
            </button>
            <div className="relative overflow-hidden p-6 sm:p-8 lg:p-12 flex flex-col justify-end min-h-[380px] sm:min-h-[420px] md:min-h-[440px] lg:min-h-0 lg:flex-1">
              <div className="absolute inset-0">
                <img 
                  src={anime.images.jpg.large_image_url} 
                  alt=""
                  className="w-full h-full object-cover opacity-40 blur-sm scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
              </div>

              <div className="relative z-10 space-y-4 lg:space-y-8 flex flex-col items-center">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-[160px] sm:max-w-[200px] md:max-w-[240px] lg:max-w-[280px] aspect-[2/3] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-paper/10 group flex-shrink-0"
                >
                  <img 
                    src={anime.images.jpg.large_image_url} 
                    alt={anime.title}
                    className="w-full h-full object-cover bg-black transition-transform duration-700 group-hover:scale-105"
                  />
                </motion.div>

                <div className="flex flex-col items-center text-center gap-4">
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1 text-yellow-500 mb-1">
                        <Star className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" />
                        <span className="text-xl md:text-2xl font-black font-heading">{anime.score}</span>
                      </div>
                      <span className="font-mono text-[12px] tracking-[0.3em] text-muted uppercase">Global Score</span>
                    </div>
                    <div className="w-px h-10 bg-paper/10" />
                    <div className="flex flex-col items-center">
                      <span className="text-xl md:text-2xl font-black text-paper font-heading mb-1">#{anime.rank}</span>
                      <span className="font-mono text-[12px] tracking-[0.3em] text-muted uppercase">Ranking</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 lg:gap-3 w-full">
                    <div className="p-2.5 lg:p-4 bg-paper/[0.03] border border-paper/[0.06] backdrop-blur-md">
                      <p className="font-mono text-[12px] tracking-[0.3em] text-muted uppercase mb-1">Status</p>
                      <p className="text-[12px] text-paper font-bold truncate">{anime.status}</p>
                    </div>
                    <div className="p-2.5 lg:p-4 bg-paper/[0.03] border border-paper/[0.06] backdrop-blur-md">
                      <p className="font-mono text-[12px] tracking-[0.3em] text-muted uppercase mb-1">Episodes</p>
                      <p className="text-[12px] text-paper font-bold">{anime.episodes || 'TBA'}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => onAddToLibrary?.(anime)}
                    disabled={isInLibrary}
                    className={cn(
                      "w-full py-3 lg:py-5 font-mono text-[12px] tracking-[0.2em] uppercase flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl",
                      isInLibrary 
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                        : "bg-primary text-paper hover:brightness-110 shadow-primary/20"
                    )}
                  >
                    {isInLibrary ? <Check size={16} strokeWidth={3} /> : <Plus size={16} strokeWidth={3} />}
                    {isInLibrary ? "COLLECTED" : "ADD TO LIBRARY"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div className="lg:flex-1 flex flex-col bg-[#0a0a0a]/80 backdrop-blur-xl lg:min-h-0">
            {/* Tab Nav */}
            <div className="sticky top-0 lg:top-0 z-[90] bg-[#0a0a0a] flex items-center gap-4 lg:gap-8 px-4 lg:px-12 pt-6 lg:pt-12 border-b border-paper/[0.06] overflow-x-auto no-scrollbar scroll-smooth">
              {[
                { id: 'info', label: 'OVERVIEW', icon: Info },
                { id: 'characters', label: 'CAST', icon: Users },
                { id: 'relations', label: 'TIMELINE', icon: Layers },
                { id: 'gallery', label: 'GALLERY', icon: ImageIcon },
                { id: 'watch', label: 'STREAM', icon: Play },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "pb-4 lg:pb-6 font-mono text-[12px] tracking-[0.2em] flex items-center gap-2 transition-all relative whitespace-nowrap uppercase",
                    activeTab === tab.id ? "text-primary" : "text-muted hover:text-paper"
                  )}
                >
                  <tab.icon size={12} className="lg:w-[14px] lg:h-[14px]" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="lg:flex-1 lg:overflow-y-auto p-4 md:p-6 lg:p-12 no-scrollbar pb-32 lg:pb-12">
              <AnimatePresence mode="wait">
                {activeTab === 'info' && (
                  <motion.div 
                    key="info"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-8 lg:space-y-12"
                  >
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {(anime.genres || []).map(g => (
                          <span key={g.name} className="px-3 py-1 md:px-4 md:py-1.5 bg-primary/10 border border-primary/20 font-mono text-[12px] tracking-[0.2em] text-primary uppercase">
                            {g.name}
                          </span>
                        ))}
                      </div>
                      <div className="lg:hidden flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-paper/[0.03] border border-paper/10 font-mono text-[12px] tracking-[0.2em] uppercase text-paper/60">
                          {anime.status}
                        </span>
                        <span className="px-2.5 py-1 bg-paper/[0.03] border border-paper/10 font-mono text-[12px] tracking-[0.2em] uppercase text-paper/60">
                          {anime.episodes ? `${anime.episodes} Episodes` : 'Episodes TBA'}
                        </span>
                      </div>
                      <h1 className="font-heading text-4xl md:text-6xl text-paper leading-tight tracking-normal">
                        {anime.title_english || anime.title}
                      </h1>
                      <p className="text-muted font-bold text-sm md:text-lg italic">{anime.title_english ? anime.title : ''}</p>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-3 text-primary">
                        <div className="h-px flex-1 bg-primary/20" />
                        <span className="font-mono text-[12px] tracking-[0.3em] uppercase">Synopsis</span>
                        <div className="h-px flex-1 bg-primary/20" />
                      </div>
                      <p className="text-paper/60 leading-[1.6] md:leading-[1.8] text-base md:text-lg font-light">
                        {anime.synopsis || fallbackSynopsis || "No detailed synopsis available for this title."}
                      </p>
                    </div>

                    {nextEpisodeLabel && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-primary">
                          <Clock className="w-4 h-4" />
                          <span className="font-mono text-[12px] tracking-[0.3em] uppercase">Next Episode</span>
                        </div>
                        <p className="text-paper/60 text-[15px] md:text-sm font-light">{nextEpisodeLabel}</p>
                      </div>
                    )}

                    <div className="space-y-6">
                      <div className="flex items-center gap-3 text-primary">
                        <div className="h-px flex-1 bg-primary/20" />
                        <span className="font-mono text-[12px] tracking-[0.3em] uppercase">External Databases</span>
                        <div className="h-px flex-1 bg-primary/20" />
                      </div>
                      <div className="flex flex-wrap gap-4">
                        {[
                          { name: 'AniList', url: `https://anilist.co/search/anime?search=${encodeURIComponent(anime.title)}`, hover: 'hover:bg-blue-500/20 hover:border-blue-500/40' },
                          { name: 'Kitsu', url: `https://kitsu.io/anime?text=${encodeURIComponent(anime.title)}`, hover: 'hover:bg-orange-500/20 hover:border-orange-500/40' },
                          { name: 'Shikimori', url: `https://shikimori.one/animes?search=${encodeURIComponent(anime.title)}`, hover: 'hover:bg-emerald-500/20 hover:border-emerald-500/40' },
                        ].map((link) => (
                          <a 
                            key={link.name}
                            href={link.url}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`px-6 py-3 bg-paper/[0.03] border border-paper/10 text-paper font-mono text-[12px] tracking-[0.15em] uppercase ${link.hover} transition-all flex items-center gap-2`}
                          >
                            {link.name} <ExternalLink size={12} />
                          </a>
                        ))}
                      </div>
                    </div>

                    {(() => {
                      const embedUrl = anime.trailer?.embed_url || (anime.trailer?.youtube_id ? `https://www.youtube.com/embed/${anime.trailer.youtube_id}` : null);
                      let normalized = embedUrl;
                      if (embedUrl && embedUrl.includes('youtube.com') && !embedUrl.includes('/embed/')) {
                        const match = embedUrl.match(/(?:watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
                        normalized = match ? `https://www.youtube.com/embed/${match[1]}` : embedUrl;
                      }
                      return normalized ? (
                        <div className="space-y-6">
                          <div className="flex items-center gap-3 text-primary">
                            <div className="h-px flex-1 bg-primary/20" />
                            <span className="font-mono text-[12px] tracking-[0.3em] uppercase">Official Trailer</span>
                            <div className="h-px flex-1 bg-primary/20" />
                          </div>
                          <div className="aspect-video overflow-hidden border border-paper/10 bg-black shadow-2xl">
                            <iframe
                              src={`${normalized}${normalized.includes('?') ? '&' : '?'}cc_load_policy=1&hl=en&autoplay=0&rel=0`}
                              title="Official Trailer"
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              loading="lazy"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="flex items-center gap-3 text-primary">
                            <div className="h-px flex-1 bg-primary/20" />
                            <span className="font-mono text-[12px] tracking-[0.3em] uppercase">Official Trailer</span>
                            <div className="h-px flex-1 bg-primary/20" />
                          </div>
                          <div className="aspect-video overflow-hidden border border-paper/10 bg-paper/[0.02] flex items-center justify-center">
                            <p className="text-muted font-mono text-[12px] tracking-wider px-4 text-center">No trailer available for this title.</p>
                          </div>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}

                {activeTab === 'characters' && (
                  <motion.div 
                    key="characters"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                  >
                    {characters.map((char) => (
                      <div key={char.character.mal_id} className="flex bg-paper/[0.03] overflow-hidden border border-paper/[0.06] hover:bg-paper/[0.06] transition-all group">
                        <div className="w-28 h-40 flex-shrink-0 overflow-hidden">
                          <img 
                            src={char.character.images.jpg.image_url} 
                            alt={char.character.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                          />
                        </div>
                        <div className="flex-1 p-6 flex flex-col justify-between">
                          <div>
                            <p className="text-paper font-bold text-lg tracking-tight">{char.character.name}</p>
                            <p className="text-primary font-mono text-[12px] tracking-[0.2em] uppercase mt-1">{char.role}</p>
                          </div>
                          {char.voice_actors?.[0] && (
                            <div className="flex items-center gap-3 justify-end">
                              <div className="text-right">
                                <p className="text-paper/60 text-xs font-bold">{char.voice_actors[0].person.name}</p>
                                <p className="text-muted font-mono text-[12px] tracking-wider uppercase">{char.voice_actors[0].language}</p>
                              </div>
                              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30">
                                <img src={char.voice_actors[0].person.images.jpg.image_url} className="w-full h-full object-cover" alt="" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'relations' && (
                  <motion.div 
                    key="relations"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    {relations.length > 0 ? (
                      relations.map((rel, idx) => (
                        <div key={idx} className="space-y-4">
                          <h4 className="font-mono text-[12px] tracking-[0.3em] text-primary uppercase pl-4 border-l-2 border-primary">
                            {rel.relation}
                          </h4>
                          <div className="grid grid-cols-1 gap-3">
                            {rel.entry.map((entry: any) => (
                              <div 
                                key={entry.mal_id}
                                className="p-5 bg-paper/[0.03] border border-paper/[0.06] flex items-center justify-between hover:bg-primary/10 hover:border-primary/30 transition-all cursor-grow group"
                                onClick={() => setCurrentAnimeId(entry.mal_id)}
                              >
                                <div>
                                  <p className="text-paper font-bold group-hover:text-primary transition-colors">{entry.name}</p>
                                  <p className="text-muted font-mono text-[12px] tracking-[0.2em] uppercase mt-1">{entry.type}</p>
                                </div>
                                <ExternalLink size={16} className="text-muted group-hover:text-primary" />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-20 text-muted font-mono text-xs tracking-wider">
                        No timeline data available.
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'gallery' && (
                  <motion.div 
                    key="gallery"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {pictures.map((pic, idx) => (
                      <div key={idx} className="aspect-[2/3] overflow-hidden border border-paper/10 hover:scale-[1.05] transition-all duration-500 cursor-grow shadow-2xl group">
                        <img 
                          src={pic.jpg.large_image_url} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          alt="" 
                        />
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'watch' && (
                  <motion.div 
                    key="watch"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    <div className="p-10 bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Play size={120} strokeWidth={1} />
                      </div>
                      <div className="relative z-10">
                        <h3 className="font-heading text-2xl text-paper mb-4 flex items-center gap-3">
                          <Play size={24} fill="currentColor" className="text-primary" />
                          Official Streaming
                        </h3>
                        <p className="text-paper/40 leading-relaxed max-w-md font-light text-sm">
                          Direct access to this title via official mainstream partners.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {streamingLinks.length > 0 ? (
                        streamingLinks.map((link) => (
                          <a 
                            key={link.url}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-6 bg-paper/[0.03] border border-paper/[0.06] flex items-center justify-between hover:bg-paper/[0.06] hover:border-primary/40 transition-all group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-paper/10 flex items-center justify-center text-paper group-hover:bg-primary group-hover:text-paper transition-all">
                                <Play size={24} fill="currentColor" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-paper font-bold text-lg tracking-tight">{link.name}</span>
                                <span className="text-primary font-mono text-[12px] tracking-[0.2em] uppercase">Direct Link</span>
                              </div>
                            </div>
                            <ExternalLink size={18} className="text-muted group-hover:text-primary transition-colors" />
                          </a>
                        ))
                      ) : (
                        <div className="col-span-2 p-12 bg-paper/[0.03] border border-dashed border-paper/10 text-center space-y-4">
                          <div className="w-16 h-16 bg-paper/[0.03] flex items-center justify-center mx-auto">
                            <Share2 size={32} className="text-muted" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-paper font-bold">No direct links found</p>
                            <p className="text-muted font-mono text-[12px] tracking-wider">Please check Crunchyroll, Netflix, or Muse Asia manually for this title.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AnimeDetailsModal;
