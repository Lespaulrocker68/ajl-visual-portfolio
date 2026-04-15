/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, ReactNode, TouchEvent, useRef } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';

// 1. Dictionaries & Metadata
const categoryTitles: Record<string, string> = {
  'nightlife': 'NIGHTLIFE',
  'concerts': 'CONCERTS',
  'redcarpet': 'RED CARPET',
  'studio': 'STUDIO',
  'portraits': 'PORTRAITS',
  'catalog': 'CATALOG',
  'weddings': 'WEDDINGS',
  'familyevents': 'PRIVATE EVENTS',
  'realestate': 'REAL ESTATE',
  'dining': 'DINING',
  'products': 'PRODUCTS',
  'videowork': 'VIDEO WORK',
  'videohorizontal': 'HORIZONTAL VIDEO',
  'videovertical': 'VERTICAL VIDEO'
};

const categoryDescriptions: Record<string, string> = {
  'nightlife': 'a collection of moments from some of the biggest high end nightlife events in the world.',
  'concerts': 'exclusive moments of some of the worlds biggest artists',
  'redcarpet': 'exclusive arrivals and high-profile moments',
  'studio': 'precision lighting and flawless execution',
  'portraits': 'intimate captures revealing character',
  'catalog': 'clean, consistent, and detailed product or fashion catalogs',
  'weddings': 'timeless documentation of significant days',
  'familyevents': 'exclusive private gatherings and celebrations',
  'realestate': 'architectural elegance and spatial storytelling',
  'dining': 'culinary artistry and atmospheric experiences',
  'products': 'meticulous commercial and product photography',
  'videowork': 'cinematic motion and dynamic visual storytelling',
  'videohorizontal': 'cinematic 16:9 motion and visual storytelling',
  'videovertical': '9:16 high-end formats optimized for mobile displays'
};

// 2. Specialized Components
const GridItem = ({ url }: { url: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    className="relative w-full mb-0 overflow-hidden break-inside-avoid"
  >
    <img 
      src={url} 
      className="w-full h-auto block select-none pointer-events-none" 
      draggable={false}
      onContextMenu={(e) => e.preventDefault()}
    />
  </motion.div>
);

const VideoGridItem = ({ 
  url, 
  isUnmuted, 
  onToggleMute 
}: { 
  url: string; 
  isUnmuted: boolean; 
  onToggleMute: () => void 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isUnmuted;
    }
  }, [isUnmuted]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full mb-0 overflow-hidden break-inside-avoid group bg-zinc-900/50"
    >
      <video 
        ref={videoRef}
        src={url} 
        autoPlay 
        loop 
        muted={!isUnmuted} 
        playsInline 
        preload="auto"
        disablePictureInPicture
        className="w-full h-auto block select-none pointer-events-none" 
        style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
      />
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onToggleMute();
        }}
        className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-50 p-2 md:p-3 bg-black/60 backdrop-blur-xl border border-white/20 rounded-full opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 text-white hover:bg-white hover:text-black shadow-lg"
      >
        {isUnmuted ? <Volume2 className="w-4 h-4 md:w-5 md:h-5" /> : <VolumeX className="w-4 h-4 md:w-5 md:h-5" />}
      </button>
    </motion.div>
  );
};

// 3. Dynamic Ingestion Logic
const imageFiles = import.meta.glob('/src/assets/portfolio/*/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', { eager: true, query: '?url', import: 'default' });
const videoFiles = import.meta.glob('/src/assets/portfolio/*/*.{mp4,webm,MP4,WEBM}', { eager: true, query: '?url', import: 'default' });

// Carousel Files
const carouselFilesRaw = import.meta.glob('/public/Carousel/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', { eager: true, query: '?url', import: 'default' });
const carouselImages = Object.values(carouselFilesRaw) as string[];
const displayCarouselImages = carouselImages.length > 0 ? carouselImages : [
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1604228322306-33d1d1528061?q=80&w=1200&auto=format&fit=crop"
];

const portfolioFiles: Record<string, string[]> = {};
Object.keys(categoryTitles).forEach(key => { portfolioFiles[key] = []; });

const processFiles = (files: Record<string, unknown>) => {
  const sortedPaths = Object.keys(files).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  for (const path of sortedPaths) {
    const parts = path.split('/');
    const folderName = parts[parts.length - 2].toLowerCase().replace(/[^a-z0-9]/g, '');
    const matchedKey = Object.keys(categoryTitles).find(k => k === folderName || k.includes(folderName) || folderName.includes(k));
    if (matchedKey) { portfolioFiles[matchedKey].push(files[path] as string); }
  }
};

processFiles(imageFiles);
processFiles(videoFiles);

export default function App() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [unmutedVideoUrl, setUnmutedVideoUrl] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 600], [1, 0]);

  // Auto-silence when changing categories
  useEffect(() => {
    setUnmutedVideoUrl(null);
  }, [activeCategory]);

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    if (e.targetTouches[0].clientX < 80) setTouchStart(e.targetTouches[0].clientX);
    else setTouchStart(null);
  };

  const onTouchMove = (e: TouchEvent) => { if (touchStart !== null) setTouchEnd(e.targetTouches[0].clientX); };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    if (touchStart - touchEnd < -50) handleOverlayReturn();
  };

  const handleReturnToMain = () => { setActiveCategory(null); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const handleOverlayReturn = () => {
    if (activeCategory === 'videohorizontal' || activeCategory === 'videovertical') setActiveCategory('videowork');
    else setActiveCategory(null);
  };

  useEffect(() => {
    Object.values(portfolioFiles).flat().forEach((url) => {
      if (url) {
        if (url.match(/\.(mp4|webm)$/i)) {
          // Extremely aggressive preloading: force browser to fetch video into cache
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'video';
          link.href = url;
          document.head.appendChild(link);
          
          // Also keep the video element preload as a fallback
          const video = document.createElement('video');
          video.preload = 'auto';
          video.src = url;
          video.load();
        } else {
          const img = new Image(); 
          img.src = url;
        }
      }
    });
    // Preload hero image
    const heroImg = new Image();
    heroImg.src = "/assets/hero/hero-image.JPG";
  }, []);

  useEffect(() => {
    document.body.style.overflowY = activeCategory ? 'hidden' : 'auto';
  }, [activeCategory]);

  // Global protection against downloading and saving
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl+S, Cmd+S, Ctrl+P, Cmd+P
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p')) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  let gridCols = "columns-1 md:columns-2 lg:columns-3"; 
  if (activeCategory === 'videohorizontal') gridCols = "columns-1 lg:columns-2"; 
  else if (activeCategory === 'videovertical') gridCols = "columns-1 md:columns-3 lg:columns-4"; 

  // Render Category Media
  const renderMedia = () => {
    if (!activeCategory) return null;
    const files = portfolioFiles[activeCategory];
    if (!files || files.length === 0) return <div className="text-zinc-800 uppercase tracking-widest py-20 w-full text-center">Bin empty - check media management</div>;

    return files.map((url) => {
      const isVideo = activeCategory.includes('video') || url.match(/\.(mp4|webm)$/i);
      if (isVideo) {
        return (
          <VideoGridItem 
            key={url} 
            url={url} 
            isUnmuted={unmutedVideoUrl === url} 
            onToggleMute={() => setUnmutedVideoUrl(unmutedVideoUrl === url ? null : url)}
          />
        );
      }
      return <GridItem key={url} url={url} />;
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2.5, ease: "easeInOut" }}
      className="flex flex-col min-h-screen bg-black selection:bg-white/20"
    >
      <motion.nav 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 1 }}
        className="fixed top-0 w-full z-[60] px-6 py-6 flex justify-between items-center pointer-events-none mix-blend-difference"
      >
        <AnimatePresence>
          {activeCategory ? (
            <motion.button 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onClick={handleReturnToMain}
              className="logo-font text-xl md:text-2xl tracking-[0.1em] uppercase text-white hover:text-gray-400 transition-colors duration-500 pointer-events-auto"
            >
              AJL VISUAL
            </motion.button>
          ) : (
            <div />
          )}
        </AnimatePresence>
        <div className="space-x-6 text-xs tracking-[0.2em] uppercase font-light pointer-events-auto hidden md:block text-white">
          <a href="#categories" onClick={() => setActiveCategory(null)} className="hover:text-gray-400 transition-colors duration-500">Work</a>
          <a href="#about" onClick={() => setActiveCategory(null)} className="hover:text-gray-400 transition-colors duration-500">About</a>
          <a href="https://www.instagram.com/ajlvisual/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors duration-500">Contact</a>
        </div>
      </motion.nav>

      <section id="hero" className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden z-10 bg-black">
        
        {/* Background Carousel */}
        <motion.div 
          style={{ opacity: heroOpacity }}
          className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex"
        >
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ ease: "linear", duration: displayCarouselImages.length * 10, repeat: Infinity }}
            className="flex h-full"
          >
            {[...displayCarouselImages, ...displayCarouselImages].map((url, i) => (
              <div key={i} className="w-screen h-screen flex-shrink-0 relative">
                <img 
                  src={url}
                  className="absolute top-0 left-[-15vw] w-[130vw] max-w-none h-full object-cover opacity-40 mix-blend-screen"
                  style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 23%, black 77%, transparent 100%)', maskImage: 'linear-gradient(to right, transparent 0%, black 23%, black 77%, transparent 100%)' }}
                  alt=""
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative text-center z-30"
        >
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
            className="logo-font text-[14vw] sm:text-[10vw] md:text-9xl tracking-[0.05em] mb-4 text-white uppercase whitespace-nowrap"
          >
            AJL VISUAL
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 1, ease: "easeInOut" }}
            className="text-sm md:text-base tracking-[0.4em] text-zinc-200 uppercase font-normal drop-shadow-lg"
          >
            high end media & visuals
          </motion.p>
        </motion.div>

        <motion.a 
          href="#categories" 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="absolute bottom-16 flex flex-col items-center text-zinc-300 hover:text-white transition-colors duration-500 group z-30"
        >
          <span className="text-xs md:text-sm tracking-[0.3em] uppercase font-medium mb-4 group-hover:tracking-[0.4em] transition-all duration-500 drop-shadow-lg">the portfolio</span>
          <div className="relative">
            <ArrowDown className="w-6 h-6 md:w-8 md:h-8 text-white/20" strokeWidth={1} />
            <motion.div
              animate={{ clipPath: ['inset(0% 0% 100% 0%)', 'inset(0% 0% 0% 0%)', 'inset(100% 0% 0% 0%)'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.2 }}
              className="absolute inset-0"
              style={{ filter: "drop-shadow(0px 0px 6px rgba(255,255,255,0.8))" }}
            >
              <ArrowDown className="w-6 h-6 md:w-8 md:h-8 text-white" strokeWidth={2} />
            </motion.div>
          </div>
        </motion.a>
      </section>

      <section id="categories" className="relative w-full min-h-screen flex flex-col items-center justify-center py-32 z-10">
        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.08 }
            }
          }}
          className="flex flex-col items-center space-y-6 md:space-y-8 w-full px-4 text-center"
        >
          <motion.h3
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
            }}
            className="text-xs md:text-sm font-medium tracking-[0.5em] text-white uppercase mb-8 mt-4"
          >
            Kinetic
          </motion.h3>

          {['nightlife', 'concerts', 'redcarpet', 'studio', 'portraits', 'catalog', 'weddings', 'familyevents'].map((key) => (
            <motion.div
              key={key}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
              }}
            >
              <h2 
                onClick={() => setActiveCategory(key)} 
                className="text-[4.5vw] sm:text-2xl md:text-3xl lg:text-4xl font-light tracking-[0.4em] uppercase cursor-pointer text-zinc-400 hover:text-white transition-colors duration-500 whitespace-nowrap"
              >
                {categoryTitles[key]}
              </h2>
            </motion.div>
          ))}

          <motion.div
            variants={{
              hidden: { opacity: 0, scaleX: 0 },
              show: { opacity: 1, scaleX: 1, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
            }}
            className="w-full h-[1px] bg-white/10 my-12"
          />

          <motion.h3
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
            }}
            className="text-xs md:text-sm font-medium tracking-[0.5em] text-white uppercase mb-8"
          >
            Static
          </motion.h3>

          {['realestate', 'dining', 'products'].map((key) => (
            <motion.div
              key={key}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
              }}
            >
              <h2 
                onClick={() => setActiveCategory(key)} 
                className="text-[4.5vw] sm:text-2xl md:text-3xl lg:text-4xl font-light tracking-[0.4em] uppercase cursor-pointer text-zinc-400 hover:text-white transition-colors duration-500 whitespace-nowrap"
              >
                {categoryTitles[key]}
              </h2>
            </motion.div>
          ))}

          <motion.div
            variants={{
              hidden: { opacity: 0, scaleX: 0 },
              show: { opacity: 1, scaleX: 1, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
            }}
            className="w-full h-[1px] bg-white/10 my-12"
          />

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
            }}
          >
            <h2 
              onClick={() => setActiveCategory('videowork')} 
              className="text-[4.5vw] sm:text-2xl md:text-3xl lg:text-4xl font-light tracking-[0.3em] uppercase cursor-pointer text-white transition-all duration-500 italic [text-shadow:0_0_10px_#34d399,0_0_20px_#34d399,0_0_30px_#34d399] hover:[text-shadow:0_0_10px_#fff,0_0_20px_#34d399,0_0_40px_#34d399,0_0_60px_#34d399] whitespace-nowrap"
            >
              {categoryTitles['videowork']}
            </h2>
          </motion.div>
        </motion.div>
      </section>

      <section id="about" className="relative w-full bg-zinc-900/30 py-16 md:py-20 flex flex-col md:flex-row items-center justify-center text-center md:text-left px-6 md:px-12 z-10 border-t border-white/5 gap-8 md:gap-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="w-24 md:w-32 aspect-square rounded-full overflow-hidden flex-shrink-0"
        >
          <img 
            src="/assets/hero/hero-image.JPG" 
            alt="AJL VISUAL Portrait" 
            className="w-full h-full object-cover select-none pointer-events-none" 
            referrerPolicy="no-referrer" 
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            onError={(e) => {
              // Fallback if image doesn't exist
              e.currentTarget.src = "https://picsum.photos/seed/portrait/800/800";
            }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="flex flex-col items-center md:items-start max-w-xl"
        >
          <h2 className="text-lg md:text-xl font-light tracking-[0.2em] mb-3 uppercase text-white">
            AJ Lachman
          </h2>
          <p className="text-[10px] md:text-xs uppercase tracking-[0.15em] text-zinc-400 font-light leading-loose mb-8 max-w-lg">
            a professional visual creator with years of international experience, specializing in high-end media creation and execution. Currently in Los Angeles.
          </p>
          <a 
            href="https://www.instagram.com/ajlvisual/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="border border-zinc-700 px-6 py-2 text-[10px] tracking-[0.2em] uppercase text-gray-300 hover:bg-white hover:text-black hover:border-white transition-all duration-500"
          >
            Get in Touch
          </a>
        </motion.div>
      </section>

      <AnimatePresence>
        {activeCategory && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(24px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 bg-black/90 overflow-y-auto pt-24 pb-20 smooth-scroll"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div className="max-w-7xl mx-auto px-6 mb-12 flex justify-between items-start">
              <motion.button 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                onClick={handleOverlayReturn} 
                className="flex items-center space-x-2 text-[10px] md:text-xs tracking-[0.2em] uppercase text-zinc-400 hover:text-white transition-colors duration-500 mt-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden md:inline">Return</span>
                <span className="md:hidden">Return</span>
              </motion.button>
              <div className="text-right flex flex-col items-end">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCategory}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col items-end"
                  >
                    <h1 className="text-sm md:text-lg tracking-[0.4em] uppercase font-light text-white">
                      {categoryTitles[activeCategory]}
                    </h1>
                    <p className="text-[8px] md:text-[10px] tracking-[0.2em] uppercase text-zinc-500 font-light mt-2 max-w-[200px] md:max-w-xs">
                      {categoryDescriptions[activeCategory]}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="w-full"
              >
                {activeCategory === 'videowork' ? (
                  <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 py-12">
                    <motion.div whileHover={{ scale: 1.02 }} onClick={() => setActiveCategory('videovertical')} className="relative w-full md:w-1/2 max-w-md aspect-square group cursor-pointer overflow-hidden bg-zinc-900 border border-white/10 flex items-center justify-center">
                      <img 
                        src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop" 
                        className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm group-hover:opacity-60 transition-all duration-700 select-none pointer-events-none" 
                        referrerPolicy="no-referrer"
                        draggable={false}
                        onContextMenu={(e) => e.preventDefault()}
                        onError={(e) => { e.currentTarget.src = "https://picsum.photos/seed/vertical/800/800"; }}
                      />
                      <h2 className="relative z-10 text-xl md:text-3xl font-extralight tracking-[0.4em] uppercase">Vertical</h2>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} onClick={() => setActiveCategory('videohorizontal')} className="relative w-full md:w-1/2 max-w-md aspect-square group cursor-pointer overflow-hidden bg-zinc-900 border border-white/10 flex items-center justify-center">
                      <img 
                        src="https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800&auto=format&fit=crop" 
                        className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm group-hover:opacity-60 transition-all duration-700 select-none pointer-events-none" 
                        referrerPolicy="no-referrer"
                        draggable={false}
                        onContextMenu={(e) => e.preventDefault()}
                        onError={(e) => { e.currentTarget.src = "https://picsum.photos/seed/horizontal/800/800"; }}
                      />
                      <h2 className="relative z-10 text-xl md:text-3xl font-extralight tracking-[0.4em] uppercase">Horizontal</h2>
                    </motion.div>
                  </div>
                ) : (
                  <div className={`w-full ${gridCols} gap-0 space-y-0 [column-fill:_balance]`}>
                    {renderMedia()}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="w-full flex justify-center py-20">
              <button 
                onClick={handleOverlayReturn} 
                className="border border-zinc-700 px-8 py-4 text-[10px] tracking-[0.2em] uppercase text-gray-300 hover:bg-white hover:text-black hover:border-white transition-all duration-500 flex items-center space-x-3"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

