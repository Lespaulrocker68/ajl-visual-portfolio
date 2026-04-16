/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, TouchEvent, useRef } from 'react';
import { ArrowDown, ArrowLeft, Volume2, VolumeX } from 'lucide-react'; // Removed unused ArrowUp
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
const GridItem: React.FC<{ url: string }> = ({ url }) => {
  const isSrcSet = url.includes(' ');
  const fallbackSrc = isSrcSet ? url.split(' ')[0] : url;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full mb-0 overflow-hidden break-inside-avoid"
    >
      <img 
        src={fallbackSrc}
        srcSet={isSrcSet ? url : undefined}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        loading="lazy"
        decoding="async"
        className="w-full h-auto block select-none pointer-events-none" 
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
      />
    </motion.div>
  );
};

const VideoGridItem: React.FC<{ 
  url: string; 
  isUnmuted: boolean; 
  onToggleMute: () => void;
}> = ({ 
  url, 
  isUnmuted, 
  onToggleMute 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = useState(globalVideoCache[url] || url);

  useEffect(() => {
    if (!globalVideoCache[url]) {
      const interval = setInterval(() => {
        if (globalVideoCache[url]) {
          setVideoSrc(globalVideoCache[url]);
          clearInterval(interval);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [url]);

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
        src={videoSrc} 
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
const imageFiles = import.meta.glob('/src/assets/portfolio/*/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', { eager: true, query: '?w=400;800;1200&format=webp&as=srcset', import: 'default' });
const videoFiles = import.meta.glob('/src/assets/portfolio/*/*.{mp4,webm,MP4,WEBM}', { eager: true, query: '?url', import: 'default' });

// Carousel Files - FIXED PATH TO SRC/ASSETS
const carouselFilesRaw = import.meta.glob('/src/assets/Carousel/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', { eager: true, query: '?w=800;1600;2400&format=webp&as=srcset', import: 'default' });
const carouselImages = Object.values(carouselFilesRaw) as string[];
const displayCarouselImages = carouselImages.length > 0 ? carouselImages : [
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1200&auto=format&fit=crop"
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

const globalVideoCache: Record<string, string> = {};

export default function App() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [unmutedVideoUrl, setUnmutedVideoUrl] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 600], [1, 0]);

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
    const preloadMedia = async () => {
      const allUrls = Object.values(portfolioFiles).flat().filter(Boolean) as string[];
      const videoUrls = allUrls.filter(url => url.match(/\.(mp4|webm)$/i));
      videoUrls.forEach(async (url) => {
        if (!globalVideoCache[url]) {
          try {
            const response = await fetch(url);
            const blob = await response.blob();
            globalVideoCache[url] = URL.createObjectURL(blob);
          } catch (e) { console.warn(e); }
        }
      });
    };
    preloadMedia();
  }, []);

  useEffect(() => {
    document.body.style.overflowY = activeCategory ? 'hidden' : 'auto';
  }, [activeCategory]);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p')) e.preventDefault();
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

  const renderMedia = () => {
    if (!activeCategory) return null;
    const files = portfolioFiles[activeCategory];
    if (!files || files.length === 0) return <div className="text-zinc-800 uppercase tracking-widest py-20 w-full text-center">Bin empty</div>;

    return files.map((url) => {
      const isVideo = activeCategory.includes('video') || url.match(/\.(mp4|webm)$/i);
      if (isVideo) return <VideoGridItem key={url} url={url} isUnmuted={unmutedVideoUrl === url} onToggleMute={() => setUnmutedVideoUrl(unmutedVideoUrl === url ? null : url)} />;
      return <GridItem key={url} url={url} />;
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2.5 }} className="flex flex-col min-h-screen bg-black">
      <motion.nav className="fixed top-0 w-full z-[60] px-6 py-6 flex justify-between items-center pointer-events-none mix-blend-difference">
        <AnimatePresence>
          {activeCategory && (
            <motion.button initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onClick={handleReturnToMain} className="logo-font text-xl md:text-2xl tracking-[0.1em] uppercase text-white pointer-events-auto">
              AJL VISUAL
            </motion.button>
          )}
        </AnimatePresence>
        <div className="space-x-6 text-xs tracking-[0.2em] uppercase pointer-events-auto hidden md:block text-white">
          <a href="#categories" onClick={() => setActiveCategory(null)}>Work</a>
          <a href="#about" onClick={() => setActiveCategory(null)}>About</a>
          <a href="https://www.instagram.com/ajlvisual/" target="_blank" rel="noopener noreferrer">Contact</a>
        </div>
      </motion.nav>

      <section id="hero" className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden z-10 bg-black">
        <motion.div style={{ opacity: heroOpacity }} className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex">
          <motion.div animate={{ x: ["0%", "-50%"] }} transition={{ ease: "linear", duration: displayCarouselImages.length * 10, repeat: Infinity }} className="flex h-full">
            {[...displayCarouselImages, ...displayCarouselImages].map((url, i) => {
              const isSrcSet = url.includes(' ');
              const fallbackSrc = isSrcSet ? url.split(' ')[0] : url;
              return (
                <div key={i} className="w-screen h-screen flex-shrink-0 relative">
                  <img 
                    src={fallbackSrc} 
                    srcSet={isSrcSet ? url : undefined} 
                    sizes="100vw" 
                    className="absolute top-0 left-[-15vw] w-[130vw] max-w-none h-full object-cover opacity-40 mix-blend-screen" 
                    style={{ WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 23%, black 77%, transparent 100%)', maskImage: 'linear-gradient(to right, transparent 0%, black 23%, black 77%, transparent 100%)' }}
                  />
                </div>
              );
            })}
          </motion.div>
        </motion.div>

        <div className="relative text-center z-30">
          <h1 className="logo-font text-[14vw] md:text-9xl tracking-[0.05em] mb-4 text-white uppercase">AJL VISUAL</h1>
          <p className="text-sm md:text-base tracking-[0.4em] text-zinc-200 uppercase">high end media & visuals</p>
        </div>

        <motion.a href="#categories" className="absolute bottom-16 flex flex-col items-center text-zinc-300 z-30">
          <span className="text-xs tracking-[0.3em] uppercase mb-4">the portfolio</span>
          <ArrowDown className="w-6 h-6 text-white" />
        </motion.a>
      </section>

      <section id="categories" className="relative w-full min-h-screen py-32 z-10">
        <div className="flex flex-col items-center space-y-8 w-full px-4 text-center">
          <h3 className="text-xs tracking-[0.5em] text-white uppercase mb-8">Kinetic</h3>
          {['nightlife', 'concerts', 'redcarpet', 'studio', 'portraits', 'catalog', 'weddings', 'familyevents'].map((key) => (
            <h2 key={key} onClick={() => setActiveCategory(key)} className="text-2xl md:text-4xl font-light tracking-[0.4em] uppercase cursor-pointer text-zinc-400 hover:text-white transition-colors">{categoryTitles[key]}</h2>
          ))}
          <div className="w-full h-[1px] bg-white/10 my-12" />
          <h3 className="text-xs tracking-[0.5em] text-white uppercase mb-8">Static</h3>
          {['realestate', 'dining', 'products'].map((key) => (
            <h2 key={key} onClick={() => setActiveCategory(key)} className="text-2xl md:text-4xl font-light tracking-[0.4em] uppercase cursor-pointer text-zinc-400 hover:text-white transition-colors">{categoryTitles[key]}</h2>
          ))}
          <div className="w-full h-[1px] bg-white/10 my-12" />
          <h2 onClick={() => setActiveCategory('videowork')} className="text-2xl md:text-4xl font-light tracking-[0.3em] uppercase cursor-pointer text-white italic [text-shadow:0_0_10px_#34d399]">{categoryTitles['videowork']}</h2>
        </div>
      </section>

      <section id="about" className="relative w-full bg-zinc-900/30 py-20 flex flex-col md:flex-row items-center justify-center px-12 z-10 gap-12">
        <div className="w-32 aspect-square rounded-full overflow-hidden flex-shrink-0">
            <img src="/assets/hero/hero-image.JPG" className="w-full h-full object-cover" />
        </div>
        <div className="max-w-xl text-center md:text-left">
          <h2 className="text-xl tracking-[0.2em] mb-3 uppercase text-white">AJ Lachman</h2>
          <p className="text-xs uppercase tracking-[0.15em] text-zinc-400 leading-loose mb-8">Professional visual creator specializing in high-end media. Based in Los Angeles.</p>
          <a href="https://www.instagram.com/ajlvisual/" target="_blank" rel="noopener noreferrer" className="border border-zinc-700 px-6 py-2 text-xs tracking-[0.2em] uppercase text-gray-300 hover:bg-white hover:text-black transition-all">Get in Touch</a>
        </div>
      </section>

      <AnimatePresence>
        {activeCategory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/95 overflow-y-auto pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-6 mb-12 flex justify-between">
              <button onClick={handleOverlayReturn} className="flex items-center space-x-2 text-xs tracking-[0.2em] uppercase text-zinc-400"><ArrowLeft className="w-4 h-4" /><span>Return</span></button>
              <div className="text-right">
                <h1 className="text-lg tracking-[0.4em] uppercase text-white">{categoryTitles[activeCategory]}</h1>
                <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mt-2">{categoryDescriptions[activeCategory]}</p>
              </div>
            </div>
            <div className="w-full">
              {activeCategory === 'videowork' ? (
                <div className="flex flex-col md:flex-row justify-center gap-12 py-12">
                    <div onClick={() => setActiveCategory('videovertical')} className="w-64 aspect-square bg-zinc-900 flex items-center justify-center cursor-pointer border border-white/10 uppercase tracking-[0.4em]">Vertical</div>
                    <div onClick={() => setActiveCategory('videohorizontal')} className="w-64 aspect-square bg-zinc-900 flex items-center justify-center cursor-pointer border border-white/10 uppercase tracking-[0.4em]">Horizontal</div>
                </div>
              ) : (
                <div className={`w-full ${gridCols} gap-0`}>{renderMedia()}</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}