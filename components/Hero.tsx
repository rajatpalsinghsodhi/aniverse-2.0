
import React from 'react';
import { Anime } from '../types';

interface HeroProps {
  featured: Anime | null;
  onWatch: (id: number) => void;
}

const KANJI_DECORATIONS = ['鬼', '夢', '火', '剣'];

const Hero: React.FC<HeroProps> = ({ featured, onWatch }) => {
  if (!featured) return null;

  const randomKanji = KANJI_DECORATIONS[featured.mal_id % KANJI_DECORATIONS.length];

  return (
    <section className="relative px-4 md:px-6 lg:px-8 pt-4 pb-8">
      <div className="relative w-full min-h-[360px] md:min-h-[420px] lg:min-h-[520px] overflow-hidden group border border-paper/[0.06]">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={featured.images.jpg.large_image_url}
            alt={featured.title_english || featured.title}
            className="w-full h-full object-cover scale-110 blur-sm brightness-[0.4] transition-transform duration-1000 group-hover:scale-125"
          />
        </div>

        {/* Darkening gradients */}
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/60 lg:via-ink/30 to-transparent" />

        {/* Scanline-style decorative lines */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/40" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-paper/[0.06]" />

        {/* Decorative kanji watermark */}
        <div 
          className="absolute top-1/2 right-8 -translate-y-1/2 font-body font-black text-[120px] lg:text-[180px] text-transparent pointer-events-none select-none opacity-30"
          style={{ WebkitTextStroke: '1px rgba(200,16,46,0.12)' }}
        >
          {randomKanji}
        </div>

        {/* Corner markers */}
        <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-paper/20" />
        <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-paper/20" />

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col md:flex-row items-center md:items-center justify-between gap-6 md:gap-10 px-6 md:px-8 lg:px-12 py-8 lg:py-10">
          {/* Poster */}
          <div className="flex-shrink-0 flex justify-center md:justify-start">
            <div className="inline-block overflow-hidden border border-paper/10 shadow-[0_30px_80px_rgba(0,0,0,0.85)] bg-transparent">
              <img
                src={featured.images.jpg.large_image_url}
                alt={featured.title_english || featured.title}
                className="block max-h-[260px] sm:max-h-[280px] md:max-h-[320px] lg:max-h-[360px] w-auto"
              />
            </div>
          </div>

          {/* Text */}
          <div className="flex-1 max-w-2xl flex flex-col gap-3 md:gap-4 lg:gap-6">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-primary text-paper font-mono text-[12px] tracking-[0.2em] uppercase shadow-lg shadow-primary/30">
                Featured Now
              </span>
              <span className="flex items-center gap-1 text-paper font-bold font-mono text-[12px] bg-ink/60 backdrop-blur-md px-2 py-1">
                <span className="material-symbols-outlined text-yellow-400 fill-1 !text-base">star</span>
                {featured.score}
              </span>
            </div>
            
            <div className="space-y-2 md:space-y-3">
              <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-paper leading-tight tracking-normal drop-shadow-lg line-clamp-2">
                {featured.title_english || featured.title}
              </h2>
              <p className="text-paper/50 text-sm md:text-base leading-relaxed line-clamp-3 font-light">
                {featured.synopsis}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <button 
                onClick={() => onWatch(featured.mal_id)}
                className="relative font-mono text-[12px] tracking-[0.2em] uppercase text-paper bg-primary border border-primary px-6 py-3 overflow-hidden group/btn"
              >
                <span className="absolute inset-0 bg-paper -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-300" />
                <span className="relative z-[1] group-hover/btn:text-ink transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined !text-lg">info</span>
                  View Details
                </span>
              </button>
              <button 
                onClick={() => onWatch(featured.mal_id)}
                className="font-mono text-[12px] tracking-[0.2em] uppercase text-paper/50 bg-transparent border-none py-3 flex items-center gap-2.5 hover:text-paper transition-colors group/ghost"
              >
                <span className="material-symbols-outlined !text-lg">add</span>
                Add to Library
                <span className="transition-transform group-hover/ghost:translate-x-1">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
