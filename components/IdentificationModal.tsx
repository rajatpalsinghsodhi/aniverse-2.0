
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { traceMoeService } from '../services/traceMoeService';
import { IdentificationResult } from '../types';

interface IdentificationModalProps {
  onClose: () => void;
  onViewAnime?: (malId: number) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getTitle(result: IdentificationResult): string {
  const t = result.anilist.title;
  return t.english || t.romaji || t.native || 'Unknown';
}

function getSimilarityColor(similarity: number) {
  if (similarity >= 0.9) return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' };
  if (similarity >= 0.8) return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' };
  return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' };
}

const IdentificationModal: React.FC<IdentificationModalProps> = ({ onClose, onViewAnime }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<IdentificationResult[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const searchWithBlob = useCallback(async (blob: Blob) => {
    setImagePreview(URL.createObjectURL(blob));
    setLoading(true);
    setResults([]);
    setError(null);

    try {
      const res = await traceMoeService.identifyAnime(blob);
      setResults(res.slice(0, 5));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to identify. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) searchWithBlob(file);
  };

  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (loading) return;
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) searchWithBlob(file);
        return;
      }
    }
  }, [loading, searchWithBlob]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (loading) return;

    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) {
      searchWithBlob(file);
    }
  }, [loading, searchWithBlob]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;
    el.focus();
    el.addEventListener('paste', handlePaste);
    return () => el.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const handleReset = () => {
    setResults([]);
    setImagePreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div
      ref={modalRef}
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm outline-none"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="bg-surface-dark w-full max-w-2xl overflow-hidden border border-paper/10 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-paper/[0.06] flex items-center justify-between">
          <h2 className="font-heading text-xl text-paper flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">auto_awesome</span>
            Anime Scene Finder
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-paper/[0.03] text-muted transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto no-scrollbar space-y-6">
          <div className="text-center space-y-1">
            <p className="text-paper/40 font-light text-sm">Upload, paste, or drop a screenshot to find the anime</p>
            <p className="text-muted font-mono text-[12px] tracking-[0.2em] uppercase">Powered by trace.moe</p>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed p-6 sm:p-8 md:p-12 transition-all cursor-grow flex flex-col items-center justify-center gap-4 ${
              isDragOver
                ? 'border-primary bg-primary/10 scale-[1.02]'
                : imagePreview
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-paper/10 hover:border-primary/40 hover:bg-paper/[0.02]'
            }`}
          >
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              accept="image/*" 
              onChange={handleFileChange}
            />
            
            {isDragOver ? (
              <>
                <div className="bg-primary/30 p-4">
                  <span className="material-symbols-outlined text-primary text-4xl">download</span>
                </div>
                <p className="text-primary font-mono text-[12px] tracking-[0.2em] uppercase">Drop image here</p>
              </>
            ) : imagePreview ? (
              <img src={imagePreview} className="max-h-64 shadow-lg border border-paper/10" alt="Preview" />
            ) : (
              <>
                <div className="bg-primary/20 p-4">
                  <span className="material-symbols-outlined text-primary text-4xl">cloud_upload</span>
                </div>
                <div className="text-center">
                  <p className="text-paper font-bold text-sm">Click, drop, or paste image</p>
                  <p className="text-muted font-mono text-[12px] tracking-wider">JPG, PNG up to 25MB · Ctrl+V to paste</p>
                </div>
              </>
            )}
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-primary font-mono text-[12px] tracking-[0.3em] uppercase animate-pulse">Searching anime database...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 text-center">
              <p className="text-red-400 font-mono text-[12px] tracking-wider">{error}</p>
              <button
                onClick={handleReset}
                className="mt-3 px-4 py-2 font-mono text-[12px] tracking-wider uppercase bg-paper/[0.03] hover:bg-paper/[0.06] text-paper/60 transition-all"
              >
                Try Again
              </button>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-4">
              {results.map((result, i) => {
                const title = getTitle(result);
                const sim = getSimilarityColor(result.similarity);
                const isTopResult = i === 0;

                return (
                  <div
                    key={i}
                    className={`border overflow-hidden transition-all relative group ${
                      isTopResult
                        ? 'bg-paper/[0.03] border-primary/30'
                        : 'bg-paper/[0.01] border-paper/[0.06]'
                    }`}
                  >
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-primary origin-left scale-x-0 group-hover:scale-x-100 transition-transform" />
                    
                    {isTopResult && result.video && (
                      <video
                        src={`${result.video}${result.video.includes('?') ? '&' : '?'}size=l`}
                        autoPlay
                        loop
                        muted
                        playsInline
                        crossOrigin="anonymous"
                        className="w-full max-h-48 object-contain bg-black"
                      />
                    )}

                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {isTopResult && (
                            <span className="font-mono text-[12px] tracking-[0.3em] uppercase text-primary mb-1 block">Best Match</span>
                          )}
                          <h3 className={`font-bold text-paper truncate ${isTopResult ? 'text-xl font-heading' : 'text-sm'}`}>
                            {title}
                          </h3>
                        </div>
                        <div className={`px-2.5 py-1 ${sim.bg} ${sim.text} font-mono text-[12px] tracking-wider border ${sim.border} shrink-0`}>
                          {Math.round(result.similarity * 100)}%
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {result.episode != null && (
                          <span className="px-2.5 py-1 bg-paper/[0.03] font-mono text-[12px] tracking-wider text-paper/60 flex items-center gap-1">
                            <span className="material-symbols-outlined !text-sm text-muted">movie</span>
                            Episode {result.episode}
                          </span>
                        )}
                        <span className="px-2.5 py-1 bg-paper/[0.03] font-mono text-[12px] tracking-wider text-paper/60 flex items-center gap-1">
                          <span className="material-symbols-outlined !text-sm text-muted">schedule</span>
                          {formatTime(result.from)} – {formatTime(result.to)}
                        </span>
                        {result.anilist.title.romaji && result.anilist.title.romaji !== title && (
                          <span className="px-2.5 py-1 bg-paper/[0.03] font-mono text-[12px] tracking-wider text-paper/40 italic">
                            {result.anilist.title.romaji}
                          </span>
                        )}
                      </div>

                      {isTopResult && result.anilist.idMal && onViewAnime && (
                        <button 
                          onClick={() => {
                            onClose();
                            onViewAnime(result.anilist.idMal!);
                          }}
                          className="w-full py-2.5 bg-primary text-paper font-mono text-[12px] tracking-[0.2em] uppercase flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                        >
                          <span className="material-symbols-outlined !text-sm">info</span>
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              <button
                onClick={handleReset}
                className="w-full py-3 bg-paper/[0.03] hover:bg-paper/[0.06] text-paper/60 font-mono text-[12px] tracking-[0.2em] uppercase flex items-center justify-center gap-2 transition-all"
              >
                <span className="material-symbols-outlined !text-lg">refresh</span>
                Search Another Image
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IdentificationModal;
