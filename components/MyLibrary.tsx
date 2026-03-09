import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Library, Search, Filter, Trash2 } from 'lucide-react';
import { Anime } from '../types';
import AnimeCard from './AnimeCard';

interface MyLibraryProps {
  library: any[];
  onRemove: (id: number) => void;
  onUpdateStatus: (id: number, status: string) => void;
  onWatch: (id: number) => void;
  user: any;
}

const MyLibrary: React.FC<MyLibraryProps> = ({ library, onRemove, onUpdateStatus, onWatch, user }) => {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLibrary = library.filter(anime => {
    const matchesFilter = filter === 'all' || anime.status === filter;
    const matchesSearch = anime.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    all: library.length,
    watching: library.filter(a => a.status === 'watching').length,
    completed: library.filter(a => a.status === 'completed').length,
    plan_to_watch: library.filter(a => a.status === 'plan_to_watch').length,
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-40 px-8 text-center space-y-6">
        <div className="w-24 h-24 bg-paper/[0.03] flex items-center justify-center text-muted">
          <Library size={48} />
        </div>
        <div className="max-w-md">
          <h2 className="font-heading text-2xl text-paper mb-2">Sign in to build your library</h2>
          <p className="text-paper/40 font-light text-sm">Track your progress, save your favorites, and organize your anime collection.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-5xl text-paper tracking-normal flex items-center gap-3">
            <Library className="text-primary" size={36} />
            My Library
          </h1>
          <p className="text-paper/40 mt-2 font-light text-sm">Manage your personal collection and watch history.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input 
              type="text" 
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-paper/[0.03] border border-paper/10 py-2.5 pl-12 pr-4 font-mono text-[12px] tracking-wider focus:ring-1 focus:ring-primary outline-none transition-all text-paper w-full md:w-64"
            />
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-px bg-paper/[0.06]">
        {[
          { id: 'all', label: 'All Anime', count: stats.all },
          { id: 'watching', label: 'Watching', count: stats.watching },
          { id: 'completed', label: 'Completed', count: stats.completed },
          { id: 'plan_to_watch', label: 'Plan to Watch', count: stats.plan_to_watch },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-6 py-3 font-mono text-[12px] tracking-[0.15em] uppercase transition-all flex items-center gap-3 ${
              filter === f.id 
                ? 'bg-primary text-paper' 
                : 'bg-ink text-muted hover:text-paper'
            }`}
          >
            {f.label}
            <span className={`px-2 py-0.5 text-[12px] ${filter === f.id ? 'bg-paper/20' : 'bg-paper/[0.05]'}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {filteredLibrary.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 text-center space-y-4">
          <div className="text-muted">
            <Filter size={48} />
          </div>
          <p className="text-paper/40 font-mono text-xs tracking-wider">No anime found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 md:gap-8">
          <AnimatePresence mode="popLayout">
            {filteredLibrary.map((anime) => (
              <motion.div
                key={anime.mal_id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative group"
              >
                <AnimeCard anime={anime} onWatch={onWatch} />
                
                <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => onRemove(anime.mal_id)}
                    className="p-2 bg-red-600 text-paper shadow-lg hover:brightness-110 transition-all"
                    title="Remove from library"
                  >
                    <Trash2 size={16} />
                  </button>
                  <select 
                    value={anime.status}
                    onChange={(e) => onUpdateStatus(anime.mal_id, e.target.value)}
                    className="bg-ink border border-paper/10 font-mono text-[12px] tracking-wider uppercase py-1 px-2 outline-none text-paper cursor-grow"
                  >
                    <option value="plan_to_watch">Plan to Watch</option>
                    <option value="watching">Watching</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default MyLibrary;
