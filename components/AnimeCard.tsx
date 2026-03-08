
import React from 'react';
import { Anime } from '../types';

interface AnimeCardProps {
  anime: Anime;
  onWatch: (id: number) => void;
}

const AnimeCard: React.FC<AnimeCardProps & { rank?: number }> = ({ anime, onWatch, rank }) => {
  return (
    <div 
      onClick={() => onWatch(anime.mal_id)}
      className="w-full group cursor-grow relative overflow-hidden"
    >
      <div className="relative aspect-[2/3] overflow-hidden mb-3 border border-paper/[0.06]">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
          style={{ backgroundImage: `url(${anime.images.jpg.large_image_url})` }}
        />
        
        {/* Top red line on hover */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-primary origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-400 z-10" />

        {rank && (
          <div className="absolute top-0 left-0 z-10 px-2.5 py-1.5 bg-primary text-paper font-mono text-[12px] tracking-widest font-bold">
            #{rank}
          </div>
        )}

        <div className="absolute top-2 right-2 px-2 py-1 bg-ink/70 backdrop-blur-sm text-paper font-mono text-[12px] tracking-wider flex items-center gap-1">
          <span className="material-symbols-outlined text-yellow-400 fill-1 !text-[12px]">star</span>
          {anime.score || 'N/A'}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-paper/10 backdrop-blur-sm p-3 border border-paper/20 transform scale-75 group-hover:scale-100 transition-transform">
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
