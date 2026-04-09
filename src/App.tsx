/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, ReactNode, TouchEvent } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Hardcoded Title Dictionary
const categoryTitles: Record<string, string> = {
  'nightlife': 'NIGHTLIFE',
  'concerts': 'CONCERTS',
  'redcarpet': 'RED CARPET',
  'studio': 'STUDIO',
  'portraits': 'PORTRAITS',
  'catalog': 'CATALOG',
  'weddings': 'WEDDINGS',
  'familyevents': 'FAMILY EVENTS',
  'realestate': 'REAL ESTATE',
  'dining': 'DINING',
  'products': 'PRODUCTS',
  'videowork': 'VIDEO WORK'
};

const categoryDescriptions: Record<string, string> = {
  'nightlife': 'a collection of moments from some of the biggest high end nightlife events in the world.',
  'concerts': 'exclusive moments of some of the worlds biggest artists',
  'redcarpet': 'exclusive arrivals and high-profile moments',
  'studio': 'precision lighting and flawless execution',
  'portraits': 'intimate captures revealing character',
  'catalog': 'clean, consistent, and detailed product or fashion catalogs',
  'weddings': 'timeless documentation of significant days',
  'familyevents': 'cherished gatherings preserved',
  'realestate': 'architectural elegance and spatial storytelling',
  'dining': 'culinary artistry and atmospheric experiences',
  'products': 'meticulous commercial and product photography',
  'videowork': 'cinematic motion and visual storytelling'
};

const GridItem = ({ url }: { url?: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    className="relative w-full mb-0 overflow-hidden break-inside-avoid"
  >
    <img 
      src={url} 
      className="w-full h-auto block" 
      /* loading="lazy" removed for instant rendering */
    />
  </motion.div>
);

const generateGridItems = (category: string, count: number) => {
  return Array.from({ length: count }).map((_, i) => (
    <GridItem key={i} index={i} category={category} delay={0.1 + (i * 0.05)}>
      {category} {i + 1}
    </GridItem>
  ));
};

const VideoGridItem = ({ url }: { url?: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    className="relative w-full mb-0 overflow-hidden break-inside-avoid"
  >
    <video 
      src={url} 
      autoPlay loop muted playsInline 
      className="w-full h-auto block" 
    />
  </motion.div>
);

const generateVideoGridItems = (count: number) => {
  return Array.from({ length: count }).map((_, i) => (
    <VideoGridItem key={`video-${i}`} index={i} delay={0.1 + (i * 0.05)}>
      Video {i + 1}
    </VideoGridItem>
  ));
};

// Dynamic Ingestion Logic
// Updated to find .JPG, .JPEG, and .jpg files automatically
const imageFiles = import.meta.glob('/src/assets/portfolio/*/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', { eager: true, query: '?url', import: 'default' });
const videoFiles = import.meta.glob('/src/assets/portfolio/*/*.{mp4,webm,MP4,WEBM}', { eager: true, query: '?url', import: 'default' });

const portfolioFiles: Record<string, string[]> = {};
Object.keys(categoryTitles).forEach(key => {
  portfolioFiles[key] = [];
});

const processFiles = (files: Record<string, unknown>) => {
  // Sort the file paths naturally so "photo-2" comes before "photo-10"
  const sortedPaths = Object.keys(files).sort((a, b) => 
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  for (const path of sortedPaths) {
    const parts = path.split('/');
    const folderName = parts[parts.length - 2].toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Find matching category key
    const matchedKey = Object.keys(categoryTitles).find(k => k === folderName || k.includes(folderName) || folderName.includes(k));
    
    if (matchedKey) {
      portfolioFiles[matchedKey].push(files[path] as string);
    }
  }
};

processFiles(imageFiles);
processFiles(videoFiles);

const displayNames: Record<string, string> = {
  'nightlife': 'Nightlife',
  'concerts': 'Concert',
  'redcarpet': 'Red Carpet',
  'studio': 'Studio',
  'portraits': 'Portrait',
  'catalog': 'Catalog',
  'weddings': 'Wedding',
  'familyevents': 'Family Event',
  'realestate': 'Real Estate',
  'dining': 'Dining',
  'products': 'Product',
  'videowork': 'Video'
};

const categoryData: Record<string, ReactNode> = {};

Object.keys(categoryTitles).forEach(key => {
  const files = portfolioFiles[key];
  const displayName = displayNames[key] || key;
  
  if (files && files.length > 0) {
    categoryData[key] = files.map((url, i) => {
      const isVideo = key === 'videowork' || url.match(/\.(mp4|webm)$/i);
      const delay = 0.1 + ((i % 10) * 0.05);
      
      if (isVideo) {
        return (
          <VideoGridItem key={i} index={i} delay={delay} url={url}>
            {displayName} {i + 1}
          </VideoGridItem>
        );
      }
      return (
        <GridItem key={i} index={i} category={displayName} delay={delay} url={url}>
          {displayName} {i + 1}
        </GridItem>
      );
    });
  } else {
    // Fallback to placeholders if no real files exist
    categoryData[key] = key === 'videowork' 
      ? generateVideoGridItems(9) 
      : generateGridItems(displayName, 9);
  }
});

export default function App() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    // Only register swipe if it starts near the left edge (like iOS)
    if (e.targetTouches[0].clientX < 80) {
      setTouchStart(e.targetTouches[0].clientX);
    } else {
      setTouchStart(null);
    }
  };

  const onTouchMove = (e: TouchEvent) => {
    if (touchStart !== null) {
      setTouchEnd(e.targetTouches[0].clientX);
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isRightSwipe) {
      setActiveCategory(null);
    }
  };

  const handleReturnToMain = () => {
    setActiveCategory(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Silent Background Preloader
  useEffect(() => {
    Object.values(portfolioFiles).flat().forEach((url) => {
      if (url && !url.match(/\.(mp4|webm)$/i)) {
        const img = new Image();
        img.src = url;
      }
    });
  }, []);

  useEffect(() => {
    if (activeCategory) {
      document.body.style.overflowY = 'hidden';
    } else {
      document.body.style.overflowY = 'auto';
    }
    return () => {
      document.body.style.overflowY = 'auto';
    };
  }, [activeCategory]);

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
              className="logo-font text-2xl md:text-3xl tracking-[0.1em] uppercase text-white hover:text-gray-400 transition-colors duration-500 pointer-events-auto"
            >
              AJL VISUAL
            </motion.button>
          ) : (
            <div />
          )}
        </AnimatePresence>
        <div className="space-x-6 text-sm tracking-[0.2em] uppercase font-light pointer-events-auto hidden md:block text-white">
          <a href="#categories" onClick={() => setActiveCategory(null)} className="hover:text-gray-400 transition-colors duration-500">Work</a>
          <a href="#about" onClick={() => setActiveCategory(null)} className="hover:text-gray-400 transition-colors duration-500">About</a>
          <a href="https://www.instagram.com/ajlvisual/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors duration-500">Contact</a>
        </div>
      </motion.nav>

      <section id="hero" className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden z-10">
        
        {/* Studio Strobe Light Effect */}
        <motion.div
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ 
            opacity: [0, 1, 0, 1, 0],
            scaleY: [0, 0.3, 0, 1, 1]
          }}
          transition={{ duration: 2.5, times: [0, 0.05, 0.1, 0.15, 1], delay: 0.3, ease: "easeOut" }}
          className="absolute top-0 left-0 w-full h-full pointer-events-none z-20 origin-top"
          style={{ background: 'radial-gradient(circle at 50% -20%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 70%)' }}
        />

        <motion.div 
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative text-center z-30"
        >
          <motion.h1 
            initial={{ opacity: 0, textShadow: "0px 0px 0px rgba(255,255,255,0)" }}
            animate={{ 
              opacity: [0, 0.4, 0, 1, 1],
              textShadow: [
                "0px 0px 0px rgba(255,255,255,0)", 
                "0px 0px 40px rgba(255,255,255,1)", 
                "0px 0px 0px rgba(255,255,255,0)",
                "0px 0px 60px rgba(255,255,255,1)",
                "0px 0px 0px rgba(255,255,255,0)"
              ] 
            }}
            transition={{ duration: 2.5, times: [0, 0.05, 0.1, 0.15, 1], delay: 0.3, ease: "easeOut" }}
            className="logo-font text-6xl md:text-8xl tracking-[0.05em] mb-4 text-white uppercase"
          >
            AJL VISUAL
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 0, 1, 1] }}
            transition={{ duration: 2.5, times: [0, 0.05, 0.1, 0.15, 1], delay: 0.3, ease: "easeOut" }}
            className="text-sm md:text-base tracking-[0.4em] text-gray-500 uppercase font-light"
          >
            high end media & visuals
          </motion.p>
        </motion.div>

        <motion.a 
          href="#categories" 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="absolute bottom-16 flex flex-col items-center text-gray-500 hover:text-white transition-colors duration-500 group z-30"
        >
          <span className="text-xs tracking-[0.3em] uppercase font-light mb-4 group-hover:tracking-[0.4em] transition-all duration-500">the portfolio</span>
          <ArrowDown className="w-5 h-5" strokeWidth={1} />
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
            className="text-sm md:text-base font-medium tracking-[0.5em] text-white uppercase mb-8 mt-4"
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
                className="text-xl md:text-3xl lg:text-4xl font-extralight tracking-[0.4em] uppercase cursor-pointer text-zinc-500 hover:text-white transition-colors duration-500"
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
            className="text-sm md:text-base font-medium tracking-[0.5em] text-white uppercase mb-8"
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
                className="text-xl md:text-3xl lg:text-4xl font-extralight tracking-[0.4em] uppercase cursor-pointer text-zinc-500 hover:text-white transition-colors duration-500"
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
              className="text-xl md:text-3xl lg:text-4xl font-light tracking-[0.3em] uppercase cursor-pointer text-zinc-400 hover:text-white transition-colors duration-500 italic"
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
            className="w-full h-full object-cover" 
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="flex flex-col items-center md:items-start max-w-xl"
        >
          <h2 className="text-xl md:text-2xl font-light tracking-[0.2em] mb-3 uppercase text-white">
            AJ Lachman
          </h2>
          <p className="text-xs md:text-sm uppercase tracking-[0.15em] text-zinc-400 font-light leading-loose mb-8 max-w-lg">
            a professional visual creator with years of international experience, specializing in high-end media creation and execution. Currently in Los Angeles.
          </p>
          <a 
            href="https://www.instagram.com/ajlvisual/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="border border-zinc-700 px-6 py-2 text-xs tracking-[0.2em] uppercase text-gray-300 hover:bg-white hover:text-black hover:border-white transition-all duration-500"
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
                onClick={() => setActiveCategory(null)} 
                className="flex items-center space-x-2 text-xs md:text-sm tracking-[0.2em] uppercase text-zinc-400 hover:text-white transition-colors duration-500 mt-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden md:inline">Return to Main Screen</span>
                <span className="md:hidden">Return</span>
              </motion.button>
              <div className="text-right flex flex-col items-end">
                <motion.h1 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="text-base md:text-xl tracking-[0.4em] uppercase font-extralight text-white"
                >
                  {categoryTitles[activeCategory]}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-zinc-500 font-light mt-2 max-w-[200px] md:max-w-xs"
                >
                  {categoryDescriptions[activeCategory]}
                </motion.p>
              </div>
            </div>

            <div className="w-full columns-1 md:columns-2 lg:columns-3 gap-0 space-y-0 [column-fill:_balance]">
              {categoryData[activeCategory]}
            </div>

            <div className="w-full flex justify-center py-20">
              <button 
                onClick={() => setActiveCategory(null)} 
                className="border border-zinc-700 px-8 py-4 text-xs tracking-[0.2em] uppercase text-gray-300 hover:bg-white hover:text-black hover:border-white transition-all duration-500 flex items-center space-x-3"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Main Screen</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}