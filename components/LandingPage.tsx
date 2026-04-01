import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Anime } from '../types';
import { jikanService } from '../services/jikanService';
import { SlideButton } from './SlideButton';

interface LandingPageProps {
  onEnter: () => void;
  onOpenIdentifier: () => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const FEATURES = [
  {
    title: 'Discover & Explore',
    desc: 'Browse thousands of titles filtered by genre, season, studio, or mood. Find your next obsession.',
    number: '01',
  },
  {
    title: 'Scene Identifier',
    desc: 'Drop a screenshot from any scene and we\'ll identify the anime, episode, and timestamp in seconds.',
    number: '02',
  },
  {
    title: 'Your Library',
    desc: 'Track what you\'ve watched, what you\'re watching, and what\'s next. Your collection, your way.',
    number: '03',
  },
];

const AUDIENCES = [
  { icon: 'whatshot', label: 'Casual Viewers', desc: 'Find your next binge-worthy series effortlessly.' },
  { icon: 'military_tech', label: 'Hardcore Otaku', desc: 'Deep-dive into stats, timelines, and top charts.' },
  { icon: 'psychology', label: 'The Curious', desc: '"What anime is this from?" — answered in seconds.' },
  { icon: 'group', label: 'Friend Groups', desc: 'Share discoveries and build watch lists together.', comingSoon: true },
];

const TOUCH_ANIM_DURATION_MS = 350;

const LandingPage: React.FC<LandingPageProps> = ({ onEnter, onOpenIdentifier }) => {
  const [heroAnime, setHeroAnime] = useState<Anime[]>([]);
  const [showCommunityTooltip, setShowCommunityTooltip] = useState(false);
  const [animeCount, setAnimeCount] = useState<string | null>(null);

  useEffect(() => {
    if (!showCommunityTooltip) return;
    const close = () => setShowCommunityTooltip(false);
    const t = setTimeout(() => document.addEventListener('click', close), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('click', close);
    };
  }, [showCommunityTooltip]);

  useEffect(() => {
    jikanService.getTrendingAnime(1).then(data => {
      if (data?.length) setHeroAnime(data.filter(a => a.images?.jpg?.large_image_url).slice(0, 8));
    }).catch(() => {});

    jikanService.getTotalCount().then(total => {
      if (total) setAnimeCount(`${Math.floor(total / 1000)}k+`);
    });
  }, []);

  return (
    <div className="min-h-screen bg-ink text-paper overflow-x-hidden font-body">

      {/* ===== NAV ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-6 bg-ink/80 backdrop-blur-md">
        <div className="absolute bottom-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-paper/15 to-transparent" />
        <a href="#" className="font-heading text-[22px] tracking-[0.08em] text-paper flex items-center gap-2.5">
          Anime<span className="text-primary">Verse</span>
          <span className="font-body text-[12px] font-light tracking-[0.3em] text-muted block leading-none">アニメバース</span>
        </a>
        <ul className="hidden md:flex gap-10 list-none">
          <li>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); onEnter(); }}
              className="font-mono text-[12px] tracking-[0.2em] text-muted uppercase no-underline hover:text-paper transition-colors relative group cursor-pointer"
            >
              Seasonal
              <span className="absolute bottom-[-4px] left-0 w-0 h-px bg-primary transition-all group-hover:w-full" />
            </a>
          </li>
          <li>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowCommunityTooltip((v) => !v);
              }}
              title="Coming soon"
              className="font-mono text-[12px] tracking-[0.2em] text-muted uppercase no-underline hover:text-paper transition-colors relative group cursor-default"
            >
              Community
              <span className="absolute bottom-[-4px] left-0 w-0 h-px bg-primary transition-all group-hover:w-full" />
              <span className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-paper/90 text-ink font-mono text-[10px] tracking-wider uppercase whitespace-nowrap transition-opacity pointer-events-none z-[60] ${showCommunityTooltip ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                Coming soon
              </span>
            </a>
          </li>
          <li>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); onOpenIdentifier(); }}
              className="font-mono text-[12px] tracking-[0.2em] text-muted uppercase no-underline hover:text-paper transition-colors relative group cursor-pointer"
            >
              Scene ID
              <span className="absolute bottom-[-4px] left-0 w-0 h-px bg-primary transition-all group-hover:w-full" />
            </a>
          </li>
        </ul>
        <button
          onClick={() => {
            if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
              setTimeout(onEnter, TOUCH_ANIM_DURATION_MS);
            } else {
              onEnter();
            }
          }}
          className="font-mono text-[12px] tracking-[0.2em] uppercase text-ink bg-paper border-none px-6 py-2.5 hover:bg-primary hover:text-paper active:bg-primary active:text-paper transition-colors"
        >
          Enter
        </button>
      </nav>

      {/* ===== HERO ===== */}
      <section className="lg:min-h-screen grid grid-cols-1 lg:grid-cols-2 relative overflow-hidden">
        {/* Large decorative kanji — hidden on mobile to avoid text overlap */}
        <div className="hidden md:block absolute top-1/2 left-[-20px] -translate-y-1/2 font-body text-[clamp(80px,12vw,140px)] font-black text-transparent pointer-events-none select-none z-[1]" style={{ WebkitTextStroke: '1px rgba(240,232,216,0.06)' }}>
          世界
        </div>

        {/* Corner markers */}
        <div className="hidden md:block absolute top-[100px] left-[60px] w-5 h-5 border-t border-l border-paper/20 z-10" />
        <div className="hidden md:block absolute bottom-10 right-5 w-5 h-5 border-b border-r border-paper/20 z-10" />

        {/* Vertical JP sidebar */}
        <div className="absolute left-0 top-0 bottom-0 w-12 border-r border-paper/[0.08] hidden lg:flex flex-col items-center justify-center py-[120px]">
          <span className="font-body text-[12px] font-light text-paper/20 tracking-[0.3em]" style={{ writingMode: 'vertical-rl' }}>
            アニメ・コミュニティ — 発見と探索
          </span>
        </div>

        {/* Left content */}
        <motion.div
          initial="hidden"
          animate="visible"
          className="flex flex-col justify-center relative z-[2] px-6 md:px-16 lg:pl-20 lg:pr-14 pt-[100px] md:pt-[120px] lg:pt-[140px] pb-8 lg:pb-20"
        >
          <motion.span
            variants={fadeUp}
            custom={0}
            className="font-mono text-[12px] tracking-[0.4em] text-primary uppercase mb-8 flex items-center gap-4"
          >
            <span className="w-8 h-px bg-primary" />
            アニメバース — Community Hub
          </motion.span>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="font-heading text-4xl md:text-[52px] lg:text-[clamp(52px,7vw,88px)] leading-none tracking-tight mb-2"
          >
            Enter the
          </motion.h1>
          <motion.span
            variants={fadeUp}
            custom={1.5}
            className="font-heading text-4xl md:text-[52px] lg:text-[clamp(52px,7vw,88px)] leading-none text-transparent block mb-4 lg:mb-6"
            style={{ WebkitTextStroke: '1px currentColor', color: 'transparent', WebkitTextStrokeColor: '#f0e8d8' }}
          >
            World
          </motion.span>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-[15px] md:text-sm font-light leading-[1.8] text-paper/55 max-w-[400px] mb-6 lg:mb-12"
          >
            Discover trending titles, identify any scene, build your collection. 
            A gateway for those who live and breathe anime.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="flex gap-4 items-center">
            <SlideButton
              onClick={onEnter}
              className="relative font-mono text-[12px] tracking-[0.2em] uppercase text-paper bg-primary border border-primary px-8 py-3.5 overflow-hidden group active:outline-none"
            >
              Start Exploring
            </SlideButton>
            <button
              onClick={onOpenIdentifier}
              className="font-mono text-[12px] tracking-[0.2em] uppercase text-paper/50 bg-transparent border-none px-0 py-3.5 flex items-center gap-2.5 hover:text-paper active:text-paper transition-colors group"
            >
              Identify a Scene
              <span className="transition-transform group-hover:translate-x-1.5 group-active:translate-x-1.5">→</span>
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={fadeUp}
            custom={4}
            className="flex flex-wrap gap-6 md:gap-12 mt-6 lg:mt-auto pt-4 lg:pt-16"
          >
            {[
              { number: animeCount ?? '—', label: 'Anime in database' },
              { number: '60k+', label: 'Hours of scenes indexed' },
              { number: '98%', label: 'Scene accuracy' },
            ].map((stat) => (
              <div key={stat.label}>
                <span className="font-heading text-[28px] text-paper block">{stat.number}</span>
                <span className="font-mono text-[12px] tracking-[0.3em] text-muted uppercase mt-1">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right visual — Anime poster mosaic */}
        <div className="relative overflow-hidden hidden lg:block">
          {/* Gradient overlays for seamless theme blending */}
          <div className="absolute inset-0 z-[5] pointer-events-none" style={{ background: 'linear-gradient(to right, #0d0d0f 0%, rgba(13,13,15,0.5) 25%, transparent 55%)' }} />
          <div className="absolute inset-0 z-[5] pointer-events-none" style={{ background: 'linear-gradient(to top, #0d0d0f 0%, transparent 25%)' }} />
          <div className="absolute inset-0 z-[5] pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(13,13,15,0.5) 0%, transparent 15%)' }} />
          <div className="absolute inset-0 z-[4] pointer-events-none" style={{ background: 'rgba(200,16,46,0.04)', mixBlendMode: 'color' }} />

          {/* Poster mosaic grid */}
          <div className="absolute inset-0 grid gap-[2px] z-[1]" style={{ gridTemplateColumns: '1.4fr 1fr', gridTemplateRows: '1.8fr 0.4fr 1.2fr', background: '#1a1010' }}>
            {/* Main large poster (left, spans 2 rows) */}
            <motion.div
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="relative overflow-hidden"
              style={{ gridRow: '1 / 3', background: 'linear-gradient(160deg, #1a0810 0%, #0d0d0f 60%)' }}
            >
              {heroAnime[0] && (
                <img src={heroAnime[0].images.jpg.large_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
              {heroAnime[0] && (
                <div className="absolute bottom-4 left-4 right-4 z-[2]">
                  <span className="font-mono text-[12px] tracking-[0.3em] text-primary uppercase block mb-1">
                    {heroAnime[0].genres?.slice(0, 2).map(g => g.name).join(' · ')}
                  </span>
                  <h3 className="font-heading text-lg text-paper/90">{heroAnime[0].title_english || heroAnime[0].title}</h3>
                </div>
              )}
            </motion.div>

            {/* Top right poster */}
            <motion.div
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
              className="relative overflow-hidden"
              style={{ background: 'linear-gradient(200deg, #0a1a3d 0%, #0d0d0f 70%)' }}
            >
              {heroAnime[1] && (
                <img src={heroAnime[1].images.jpg.large_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
              {heroAnime[1] && (
                <div className="absolute bottom-3 left-3 right-3 z-[2]">
                  <span className="font-mono text-[12px] tracking-[0.2em] text-primary/80 uppercase block mb-0.5">
                    {heroAnime[1].genres?.[0]?.name}
                  </span>
                  <h3 className="font-heading text-sm text-paper/80">{heroAnime[1].title_english || heroAnime[1].title}</h3>
                </div>
              )}
            </motion.div>

            {/* "Now Airing" accent panel */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex items-center justify-center bg-[#7a0a1c]"
            >
              <span className="font-heading text-[12px] tracking-[0.3em] text-paper/60 uppercase">Now Airing</span>
            </motion.div>

            {/* Bottom banner poster */}
            <motion.div
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
              className="relative overflow-hidden"
              style={{ gridColumn: '1 / 3', background: 'linear-gradient(90deg, #0f0d0d 0%, #150808 100%)' }}
            >
              {heroAnime[2] && (
                <img src={heroAnime[2].images.jpg.large_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: 'center 30%' }} />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-ink/60 via-transparent to-ink/60" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
              {heroAnime[2] && (
                <div className="absolute bottom-3 left-4 z-[2]">
                  <span className="font-mono text-[12px] tracking-[0.2em] text-primary/80 uppercase block mb-0.5">
                    {heroAnime[2].genres?.[0]?.name}
                  </span>
                  <h3 className="font-heading text-sm text-paper/70">{heroAnime[2].title_english || heroAnime[2].title}</h3>
                </div>
              )}
            </motion.div>
          </div>

          {/* Floating kanji decorations */}
          <div className="absolute font-body font-black text-transparent pointer-events-none z-[6]" style={{ WebkitTextStroke: '1px rgba(200,16,46,0.2)', fontSize: '180px', top: '10%', right: '5%' }}>
            <span className="float-kanji inline-block">界</span>
          </div>
          <div className="absolute font-body font-black text-transparent pointer-events-none z-[6]" style={{ WebkitTextStroke: '1px rgba(200,16,46,0.2)', fontSize: '100px', bottom: '15%', right: '30%' }}>
            <span className="float-kanji inline-block" style={{ animationDelay: '-3s' }}>火</span>
          </div>

          {/* Red slash accent */}
          <motion.div
            initial={{ height: '0%', opacity: 0 }}
            animate={{ height: '60%', opacity: 1 }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            className="absolute top-0 right-0 w-[3px] bg-primary z-[7]"
          />
        </div>

        {/* Mobile/Tablet anime card row — replaces the mosaic below lg */}
        {heroAnime.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            className="lg:hidden px-6 pb-8"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="w-4 h-px bg-primary" />
              <span className="font-mono text-[12px] tracking-[0.3em] text-primary uppercase">Now Airing</span>
            </div>
            <motion.div variants={fadeUp} custom={5} className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {heroAnime.slice(0, 4).map((anime) => (
                <div
                  key={`mobile-${anime.mal_id}`}
                  className="relative flex-shrink-0 w-[140px] aspect-[2/3] overflow-hidden bg-[#111013]"
                >
                  <img
                    src={anime.images.jpg.large_image_url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 z-[2]">
                    <span className="font-mono text-[12px] tracking-[0.2em] text-primary uppercase block mb-0.5">
                      {anime.genres?.[0]?.name}
                    </span>
                    <h3 className="font-heading text-xs text-paper/90 leading-tight">
                      {anime.title_english || anime.title}
                    </h3>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </section>

      {/* ===== MARQUEE ===== */}
      <div className="border-t border-b border-paper/[0.08] py-3.5 overflow-hidden" style={{ background: 'rgba(200,16,46,0.04)' }}>
        <div className="marquee-track flex w-max">
          {[...Array(2)].map((_, setIdx) => (
            ['Trending This Season', 'Scene Identifier', 'Build Your Library', 'Community Reviews', 'New Episodes Daily', 'アニメ発見'].map((item, i) => (
              <div key={`${setIdx}-${i}`} className="font-mono text-[12px] tracking-[0.3em] text-muted uppercase whitespace-nowrap px-10 flex items-center gap-10">
                {item}
                <span className="text-primary text-[12px]">✦</span>
              </div>
            ))
          ))}
        </div>
      </div>

      {/* ===== COMMUNITY / FEATURES ===== */}
      <AnimatedSection className="px-6 md:px-20 py-16 md:py-[120px] relative">
        <motion.div variants={fadeUp} custom={0} className="font-mono text-[12px] tracking-[0.4em] text-primary uppercase mb-8 md:mb-[60px] flex items-center gap-4">
          <span className="w-8 h-px bg-primary" />
          What We Offer
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: 'rgba(240,232,216,0.06)', border: '1px solid rgba(240,232,216,0.06)' }}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              variants={scaleIn}
              custom={i}
              className="bg-ink p-6 md:p-12 relative overflow-hidden group cursor-grow hover:bg-[#120808] active:bg-[#120808] transition-colors"
            >
              <div className="absolute top-0 left-0 w-full h-[2px] bg-primary origin-left scale-x-0 group-hover:scale-x-100 group-active:scale-x-100 transition-transform duration-400" />
              <div className="font-mono text-[12px] tracking-[0.3em] text-paper/15 mb-8">{f.number} —</div>
              <div className="w-10 h-px bg-primary mb-5" />
              <h3 className="font-heading text-[22px] mb-4 text-paper">{f.title}</h3>
              <p className="text-[17px] md:text-[15px] font-light leading-[1.8] text-paper/[0.65]">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {/* ===== IDENTIFY SPOTLIGHT ===== */}
      <AnimatedSection className="px-6 md:px-20 pb-14 md:pb-28">
        <div className="relative overflow-hidden border border-paper/[0.06]" style={{ background: 'linear-gradient(135deg, #1a0810 0%, #0d0d0f 60%)' }}>
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none" style={{ background: 'rgba(200,16,46,0.08)' }} />

          <div className="relative z-10 flex flex-col lg:flex-row items-start gap-10 lg:gap-16 p-8 md:p-12 lg:p-16">
            <div className="flex-1 max-w-xl">
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary font-mono text-[12px] tracking-[0.2em] uppercase mb-5">
                <span className="material-symbols-outlined !text-sm">auto_awesome</span>
                Signature Feature
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} className="font-heading text-4xl md:text-5xl lg:text-6xl tracking-normal mb-4 leading-tight">
                Identify Any Anime
                <br />
                <span className="text-primary">From a Single Screenshot</span>
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-paper/40 leading-relaxed mb-6 text-[15px] md:text-sm">
                Ever seen a stunning anime frame and wondered where it's from? Drop an image and our scene identifier instantly matches it to the exact anime, episode number, and timestamp.
              </motion.p>
              <motion.ul variants={fadeUp} custom={3} className="space-y-3 mb-8">
                {[
                  'Drag & drop, paste from clipboard, or enter an image URL',
                  'Matches to exact episode and timestamp with confidence score',
                  'Preview the matched scene with video playback',
                  'Jump straight to full anime details from the result',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[15px] md:text-sm text-paper/60">
                    <span className="text-primary mt-0.5 flex-shrink-0">—</span>
                    {item}
                  </li>
                ))}
              </motion.ul>
              <motion.div variants={fadeUp} custom={4}>
                <SlideButton
                  onClick={onOpenIdentifier}
                  className="relative font-mono text-[12px] tracking-[0.2em] uppercase text-paper bg-primary border border-primary px-8 py-3.5 overflow-hidden group active:outline-none block w-fit"
                >
                  Try It Now
                </SlideButton>
              </motion.div>
            </div>

            {/* Visual mockup */}
            <motion.div variants={scaleIn} custom={2} className="flex-1 w-full max-w-md">
              <div className="border border-paper/10 bg-ink p-5 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  <span className="ml-auto text-[12px] text-muted font-mono">scene-identifier</span>
                </div>
                <div className="border-2 border-dashed border-paper/10 bg-paper/[0.02] flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary !text-3xl">image_search</span>
                  </div>
                  <p className="text-sm font-semibold text-paper/60">Drop your anime screenshot here</p>
                  <p className="text-xs text-muted">PNG, JPG, or WebP &middot; Up to 10 MB</p>
                </div>
                <div className="mt-4 bg-paper/[0.03] border border-paper/5 p-4 flex items-center gap-4">
                  <div className="w-16 h-10 bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary !text-xl">movie</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-paper truncate">Attack on Titan S3</span>
                    <span className="text-[12px] text-muted">Ep 12 &middot; 14:32 &middot; 97.4% match</span>
                  </div>
                  <div className="ml-auto flex-shrink-0">
                    <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5">97.4%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* ===== WHO ITS FOR ===== */}
      <AnimatedSection className="px-6 md:px-20 pb-14 md:pb-24">
        <motion.div variants={fadeUp} custom={0} className="mb-12">
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl tracking-normal">
            Built for <span className="text-primary">Every Anime Fan</span>
          </h2>
          <p className="mt-3 text-paper/40 max-w-lg text-[15px] md:text-sm">
            Whether you just started watching or have seen 500+ titles — AnimeVerse fits your flow.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: 'rgba(240,232,216,0.06)' }}>
          {AUDIENCES.map((a, i) => (
            <motion.div
              key={a.label}
              variants={fadeUp}
              custom={i}
              className={`bg-ink p-6 group cursor-grow hover:bg-[#120808] active:bg-[#120808] transition-colors relative overflow-hidden ${a.comingSoon ? 'opacity-60' : ''}`}
            >
              <div className="absolute top-0 left-0 w-full h-[2px] bg-primary origin-left scale-x-0 group-hover:scale-x-100 group-active:scale-x-100 transition-transform duration-400" />
              {a.comingSoon && (
                <span className="absolute top-4 right-4 font-mono text-[10px] tracking-[0.2em] uppercase bg-primary/15 text-primary border border-primary/20 px-2 py-0.5">
                  Coming Soon
                </span>
              )}
              <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center mb-4">
                <span className="material-symbols-outlined">{a.icon}</span>
              </div>
              <h3 className="font-heading text-base mb-1 text-paper">{a.label}</h3>
              <p className="text-[15px] md:text-sm text-paper/40">{a.desc}</p>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {/* ===== FEATURED PREVIEW ===== */}
      <AnimatedSection className="px-6 md:px-20 pb-16 md:pb-[120px]">
        <div className="flex items-end justify-between mb-12">
          <div>
            <motion.div variants={fadeUp} custom={0} className="font-mono text-[12px] tracking-[0.4em] text-primary uppercase mb-4 flex items-center gap-4">
              <span className="w-8 h-px bg-primary" />
              Preview
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="font-heading text-[clamp(36px,4vw,54px)] leading-[1.1]">
              Trending<br />
              <span className="text-transparent" style={{ WebkitTextStroke: '1px #f0e8d8' }}>Right Now</span>
            </motion.h2>
          </div>
          <button onClick={onEnter} className="font-mono text-[12px] tracking-[0.3em] text-muted uppercase flex items-center gap-2.5 hover:text-paper transition-colors pb-1">
            View all →
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-[2px]" style={{ background: 'rgba(240,232,216,0.04)' }}>
          {(heroAnime.length >= 7 ? heroAnime.slice(3, 7) : []).map((anime, i) => (
            <motion.div
              key={anime.mal_id}
              variants={scaleIn}
              custom={i}
              className={`relative overflow-hidden bg-[#111013] cursor-grow group aspect-[2/3] ${i === 0 ? 'lg:aspect-auto lg:min-h-[400px]' : ''}`}
            >
              <img
                src={anime.images.jpg.large_image_url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 flex items-center justify-center font-body font-black text-[80px] lg:text-[140px] text-transparent select-none" style={{ WebkitTextStroke: '1px rgba(240,232,216,0.05)' }}>
                {['鬼', '攻', '夢', '剣'][i]}
              </div>
              <div className="absolute inset-0 flex flex-col justify-end p-4 lg:p-6 group-hover:pb-8 transition-all" style={{ background: 'linear-gradient(0deg, rgba(13,13,15,0.95) 0%, transparent 60%)' }}>
                <span className="font-mono text-[12px] tracking-[0.3em] text-primary uppercase mb-2">
                  {anime.genres?.slice(0, 2).map(g => g.name).join(' · ') || anime.type}
                </span>
                <h3 className={`font-heading text-paper mb-1 text-[16px] lg:text-[18px] ${i === 0 ? 'lg:text-[26px]' : ''}`}>
                  {anime.title_english || anime.title}
                </h3>
                <span className="font-mono text-[12px] tracking-[0.2em] text-paper/35">
                  {anime.episodes ? `${anime.episodes} Eps` : anime.status}
                  {anime.score ? ` · ★ ${anime.score}` : ''}
                </span>
              </div>
            </motion.div>
          ))}
          {heroAnime.length < 7 && [0, 1, 2, 3].map(i => (
            <div
              key={`skeleton-${i}`}
              className={`relative overflow-hidden bg-[#111013] aspect-[2/3] ${i === 0 ? 'lg:aspect-auto lg:min-h-[400px]' : ''}`}
            >
              <div className="absolute inset-0 animate-pulse" style={{ background: `radial-gradient(ellipse at ${50 + i * 10}% ${30 + i * 10}%, #1a0810 0%, #0d0d0f 70%)` }} />
              <div className="absolute inset-0 flex items-center justify-center font-body font-black text-[80px] lg:text-[140px] text-transparent select-none" style={{ WebkitTextStroke: '1px rgba(240,232,216,0.05)' }}>
                {['鬼', '攻', '夢', '剣'][i]}
              </div>
            </div>
          ))}
        </div>
      </AnimatedSection>

      {/* ===== FINAL CTA ===== */}
      <AnimatedSection className="px-6 md:px-20 pb-14 md:pb-20">
        <div className="relative overflow-hidden border border-paper/[0.06] py-16 px-8 md:px-16" style={{ background: 'linear-gradient(135deg, #1a0810 0%, #0d0d0f 60%)' }}>
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none" style={{ background: 'rgba(200,16,46,0.08)' }} />
          <motion.div variants={fadeUp} custom={0} className="relative z-10 flex flex-col items-start gap-5 max-w-xl">
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl tracking-normal">
              Ready to Discover?
            </h2>
            <p className="text-paper/40 text-[15px] md:text-sm">
              Jump in and start exploring thousands of anime titles, or identify that mystery scene right away.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <SlideButton
                onClick={onEnter}
                className="relative font-mono text-[12px] tracking-[0.2em] uppercase text-paper bg-primary border border-primary px-8 py-3.5 overflow-hidden group active:outline-none"
              >
                Enter AnimeVerse
              </SlideButton>
              <button
                onClick={onOpenIdentifier}
                className="font-mono text-[12px] tracking-[0.2em] uppercase text-paper/50 bg-transparent border-none px-0 py-3.5 flex items-center gap-2.5 hover:text-paper active:text-paper transition-colors group"
              >
                <span className="material-symbols-outlined !text-lg text-primary">auto_awesome</span>
                Identify a Scene
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-paper/[0.08] py-10 px-8 md:px-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="font-heading text-lg text-paper/30">
          Anime<span className="text-primary">Verse</span>
        </div>
        <div className="font-mono text-[12px] tracking-[0.3em] text-paper/15 uppercase flex flex-col sm:items-end gap-1">
          <span>Designed by Rajat Sodhi</span>
          <span>© 2026 AnimeVerse — アニメバース — All rights reserved</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
