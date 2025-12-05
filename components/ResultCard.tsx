
import React, { useState, useEffect, useRef } from 'react';
import { SkyAnalysisResult, TargetLanguage, AppLanguage, FilterType, AppSettings, AspectRatio } from '../types';
import { LANGUAGES, UI_TEXT, PHOTO_FILTERS } from '../constants';
import { Download, X, Globe, RefreshCw, Scan } from 'lucide-react';

interface ResultCardProps {
  data: SkyAnalysisResult;
  onClose: () => void;
  onReprint: (newLang: TargetLanguage) => void;
  isReprinting: boolean;
  appLang: AppLanguage;
  settings: AppSettings;
  initialFilter?: FilterType;
}

const ResultCard: React.FC<ResultCardProps> = ({ 
  data, 
  onClose, 
  onReprint, 
  isReprinting, 
  appLang,
  settings,
  initialFilter = FilterType.NATURAL 
}) => {
  const t = UI_TEXT[appLang];
  const [isMounted, setIsMounted] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  
  // State for visual adjustments
  const [currentFilter, setCurrentFilter] = useState<FilterType>(initialFilter);
  const [localAspectRatio, setLocalAspectRatio] = useState<AspectRatio>(settings.aspectRatio);
  
  // Interaction State
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [showFeedback, setShowFeedback] = useState(false);

  // Refs
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const languageTriggerRef = useRef<HTMLButtonElement>(null);
  
  // Gesture Refs
  const touchStartRef = useRef<{x: number, y: number} | null>(null);
  const mouseStartRef = useRef<{x: number, y: number} | null>(null);

  // Constants
  const FILTER_KEYS = Object.keys(PHOTO_FILTERS) as FilterType[];
  const ASPECT_RATIOS: AspectRatio[] = ['2:3', '3:4', '1:1', '4:3', '3:2'];

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (showLanguageMenu) {
        if (languageMenuRef.current && !languageMenuRef.current.contains(target) &&
            languageTriggerRef.current && !languageTriggerRef.current.contains(target)) {
          setShowLanguageMenu(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLanguageMenu]);

  // Logic to calculate height multiplier based on aspect ratio
  const getHeightMultiplier = (ratio: AspectRatio) => {
    switch (ratio) {
      case '2:3': return 1.5;
      case '3:4': return 1.3333;
      case '1:1': return 1;
      case '4:3': return 0.75;
      case '3:2': return 0.6666;
      default: return 1;
    }
  };

  // Calculate Display Height
  const getDisplayHeightStyle = (baseWidth: number) => {
      return { height: `${baseWidth * getHeightMultiplier(localAspectRatio)}px` };
  };

  // --- Gesture Logic (Shared) ---
  const handleSwipe = (diffX: number, diffY: number) => {
      const SWIPE_THRESHOLD = 40; 

      if (Math.abs(diffX) > Math.abs(diffY)) {
          // Horizontal Swipe -> Cycle Aspect Ratio
          if (Math.abs(diffX) > SWIPE_THRESHOLD) {
              const currentIndex = ASPECT_RATIOS.indexOf(localAspectRatio);
              let nextIndex;
              if (diffX > 0) {
                  // Swipe Right -> Prev Ratio (Loop)
                  nextIndex = (currentIndex - 1 + ASPECT_RATIOS.length) % ASPECT_RATIOS.length;
              } else {
                  // Swipe Left -> Next Ratio (Loop)
                  nextIndex = (currentIndex + 1) % ASPECT_RATIOS.length;
              }
              const newRatio = ASPECT_RATIOS[nextIndex];
              setLocalAspectRatio(newRatio);
              triggerFeedback(t.aspectRatioOpts[newRatio]);
          }
      } else {
          // Vertical Swipe -> Cycle Filter
          if (Math.abs(diffY) > SWIPE_THRESHOLD) {
              const currentIndex = FILTER_KEYS.indexOf(currentFilter);
              let nextIndex;
              if (diffY > 0) {
                   // Drag Down -> Prev Filter
                   nextIndex = (currentIndex - 1 + FILTER_KEYS.length) % FILTER_KEYS.length;
              } else {
                   // Drag Up -> Next Filter
                   nextIndex = (currentIndex + 1) % FILTER_KEYS.length;
              }
              const nextFilter = FILTER_KEYS[nextIndex];
              setCurrentFilter(nextFilter);
              triggerFeedback(t.filters[nextFilter]);
          }
      }
  };

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      handleSwipe(touchStartRef.current.x - endX, touchStartRef.current.y - endY);
      touchStartRef.current = null;
  };

  // Mouse Handlers (Desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault(); // Prevent image drag behavior
      mouseStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = (e: React.MouseEvent) => {
      if (!mouseStartRef.current) return;
      const endX = e.clientX;
      const endY = e.clientY;
      handleSwipe(mouseStartRef.current.x - endX, mouseStartRef.current.y - endY);
      mouseStartRef.current = null;
  };

  const triggerFeedback = (text: string) => {
      setFeedbackText(text);
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 1500);
  };

  // Format poetry with smart line breaks
  const formatPoetry = (text: string) => {
    return text.replace(/([,;!?。，；！？])\s*/g, '$1\n');
  };

  // Editable state
  const [poeticText, setPoeticText] = useState(formatPoetry(data.poeticExpression));
  const [dateText, setDateText] = useState(new Date(data.timestamp).toLocaleDateString());
  const [detailsText, setDetailsText] = useState(data.proverb);
  const [titleText, setTitleText] = useState(data.scientificName);

  useEffect(() => {
    setPoeticText(formatPoetry(data.poeticExpression));
    setDateText(new Date(data.timestamp).toLocaleDateString());
    setDetailsText(data.proverb);
    setTitleText(data.scientificName);
  }, [data]);

  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
        const CARD_WIDTH = 340;
        const CARD_HEIGHT_ESTIMATE = 680; 
        const widthScale = window.innerWidth / (CARD_WIDTH + 40);
        const heightScale = (window.innerHeight - 150) / CARD_HEIGHT_ESTIMATE;
        
        let newScale = Math.min(widthScale, heightScale);
        if (newScale > 1) newScale = 1;
        setScale(newScale);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    setTimeout(() => setIsMounted(true), 100);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper to bake filter into image via Canvas API
  const bakeFilter = async (imgSrc: string, filterCss: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
         const canvas = document.createElement('canvas');
         canvas.width = img.naturalWidth;
         canvas.height = img.naturalHeight;
         const ctx = canvas.getContext('2d');
         if (ctx) {
           // Apply the standard CSS filter syntax to the canvas context
           ctx.filter = filterCss !== 'none' ? filterCss : 'none';
           ctx.drawImage(img, 0, 0);
           resolve(canvas.toDataURL('image/jpeg', 0.9));
         } else {
           resolve(imgSrc);
         }
      };
      img.onerror = () => resolve(imgSrc);
      img.src = imgSrc;
    });
  };

  // --- DOWNLOAD LOGIC ---
  const handleDownload = async () => {
    if (!(window as any).html2canvas) return;

    try {
      // Show simple loading feedback
      const originalText = feedbackText;
      triggerFeedback("Generating...");

      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '-10000px';
      container.style.left = '-10000px';
      container.style.zIndex = '-1';
      document.body.appendChild(container);

      // Scale Factors
      const SCALE_FACTOR = 2; // Render at 2x size for crisp text
      const BASE_WIDTH = 340 * SCALE_FACTOR;
      const PADDING = 20 * SCALE_FACTOR;
      const BOTTOM_PADDING = 32 * SCALE_FACTOR;
      const IMAGE_WIDTH = BASE_WIDTH - (PADDING * 2);
      
      const imgHeight = IMAGE_WIDTH * getHeightMultiplier(localAspectRatio);

      const card = document.createElement('div');
      card.style.width = `${BASE_WIDTH}px`;
      card.style.backgroundColor = '#fdfbf7';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.alignItems = 'center';
      card.style.padding = `${PADDING}px`;
      card.style.paddingBottom = `${BOTTOM_PADDING}px`;
      
      const imgContainer = document.createElement('div');
      imgContainer.style.width = `${IMAGE_WIDTH}px`;
      imgContainer.style.height = `${imgHeight}px`;
      imgContainer.style.backgroundColor = '#f1f5f9'; // slate-100
      imgContainer.style.position = 'relative';
      imgContainer.style.overflow = 'hidden';
      imgContainer.style.marginBottom = `${24 * SCALE_FACTOR}px`; 
      imgContainer.style.boxShadow = 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)';
      
      if (data.imageUrl) {
          const img = document.createElement('img');
          // PRE-BAKE FILTER: Apply filter to a new canvas and get base64
          // This avoids html2canvas issues with CSS filters
          const filteredSrc = await bakeFilter(data.imageUrl, PHOTO_FILTERS[currentFilter].css);
          
          img.src = filteredSrc;
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'cover';
          img.style.objectPosition = 'center'; 
          // Note: we do NOT apply img.style.filter here because the image source itself is now filtered
          img.crossOrigin = "anonymous";
          imgContainer.appendChild(img);
      }
      
      // Overlays
      const overlay1 = document.createElement('div');
      overlay1.style.position = 'absolute';
      overlay1.style.top = '0';
      overlay1.style.left = '0';
      overlay1.style.right = '0';
      overlay1.style.bottom = '0';
      overlay1.style.background = 'linear-gradient(to top right, rgba(249, 115, 22, 0.1), rgba(59, 130, 246, 0.1))';
      overlay1.style.mixBlendMode = 'overlay';
      imgContainer.appendChild(overlay1);

      const overlay2 = document.createElement('div');
      overlay2.style.position = 'absolute';
      overlay2.style.top = '0';
      overlay2.style.left = '0';
      overlay2.style.right = '0';
      overlay2.style.bottom = '0';
      overlay2.style.background = 'rgba(0, 0, 0, 0.05)';
      overlay2.style.mixBlendMode = 'multiply';
      imgContainer.appendChild(overlay2);
      
      card.appendChild(imgContainer);

      const content = document.createElement('div');
      content.style.width = '100%';
      content.style.display = 'flex';
      content.style.flexDirection = 'column';
      content.style.alignItems = 'center';
      content.style.padding = '0 8px';

      const poem = document.createElement('div');
      poem.innerText = poeticText;
      poem.style.width = '100%';
      poem.style.fontSize = `${24 * SCALE_FACTOR}px`;
      poem.style.lineHeight = '1.4';
      poem.style.fontFamily = "'Caveat', 'Long Cang', cursive";
      poem.style.color = '#1e293b'; // slate-800
      poem.style.textAlign = 'center';
      poem.style.marginBottom = `${24 * SCALE_FACTOR}px`;
      poem.style.whiteSpace = 'pre-wrap';
      content.appendChild(poem);

      const divider = document.createElement('div');
      divider.style.width = `${48 * SCALE_FACTOR}px`;
      divider.style.height = `${1 * SCALE_FACTOR}px`; 
      divider.style.backgroundColor = '#e2e8f0'; // slate-200
      divider.style.marginBottom = `${24 * SCALE_FACTOR}px`;
      content.appendChild(divider);

      const title = document.createElement('div');
      title.innerText = titleText;
      title.style.fontFamily = "'Cinzel', 'ZCOOL XiaoWei', serif";
      title.style.fontSize = `${14 * SCALE_FACTOR}px`;
      title.style.color = '#64748b'; // slate-500
      title.style.textTransform = 'uppercase';
      title.style.letterSpacing = '0.2em';
      title.style.textAlign = 'center';
      title.style.marginBottom = `${12 * SCALE_FACTOR}px`;
      title.style.width = '100%';
      title.style.wordBreak = 'break-word';
      content.appendChild(title);

      const proverb = document.createElement('div');
      proverb.innerText = detailsText;
      proverb.style.fontFamily = "'Noto Serif SC', serif";
      proverb.style.fontSize = `${12 * SCALE_FACTOR}px`;
      proverb.style.lineHeight = '1.6';
      proverb.style.fontStyle = 'italic';
      proverb.style.color = '#64748b';
      proverb.style.textAlign = 'center';
      proverb.style.marginBottom = `${16 * SCALE_FACTOR}px`;
      proverb.style.width = '100%';
      proverb.style.whiteSpace = 'pre-wrap';
      content.appendChild(proverb);

      const dateEl = document.createElement('div');
      dateEl.innerText = dateText;
      dateEl.style.color = '#cbd5e1'; // slate-300
      dateEl.style.fontSize = `${9 * SCALE_FACTOR}px`;
      dateEl.style.fontFamily = "monospace";
      dateEl.style.letterSpacing = '0.1em';
      dateEl.style.textTransform = 'uppercase';
      dateEl.style.marginBottom = `${12 * SCALE_FACTOR}px`;
      content.appendChild(dateEl);

      const dots = document.createElement('div');
      dots.style.display = 'flex';
      dots.style.justifyContent = 'center';
      dots.style.gap = `${8 * SCALE_FACTOR}px`;
      dots.style.opacity = '0.8';
      dots.style.marginTop = `${4 * SCALE_FACTOR}px`;
      
      data.dominantColors.forEach(c => {
          const d = document.createElement('div');
          d.style.width = `${10 * SCALE_FACTOR}px`;
          d.style.height = `${10 * SCALE_FACTOR}px`;
          d.style.borderRadius = '50%';
          d.style.backgroundColor = c;
          dots.appendChild(d);
      });
      content.appendChild(dots);

      card.appendChild(content);
      container.appendChild(card);

      // Wait for DOM to render styles
      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await (window as any).html2canvas(card, {
        backgroundColor: null,
        scale: 2, 
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: BASE_WIDTH,
        windowWidth: BASE_WIDTH + 100
      });

      document.body.removeChild(container);

      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `skystory-${Date.now()}.png`;
      link.click();
    } catch (error) {
      console.error("Download failed:", error);
      alert("Could not generate image. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden">
      
      <div 
        className={`absolute inset-0 bg-black/95 backdrop-blur-xl transition-opacity duration-700 ease-out ${isMounted ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      ></div>

      <div 
        className={`relative z-10 flex flex-col items-center justify-center w-full h-full transition-all duration-1000 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}
      >
        
        {/* The Polaroid */}
        <div 
            style={{ 
                transform: `scale(${scale}) rotate(1deg)`,
                transformOrigin: 'center center'
            }}
            className="relative transition-transform duration-300"
        > 
            <div 
                className={`bg-[#fdfbf7] p-5 pb-8 w-[340px] shadow-2xl polaroid-shadow transition-all duration-500 flex flex-col items-center ${isReprinting ? 'blur-[2px] opacity-80 grayscale' : ''}`}
            >
            
            {/* Image Section - Gestures Enabled */}
            <div 
              style={{
                  ...getDisplayHeightStyle(300),
                  touchAction: 'none' // CRITICAL: Enables swipe gestures without scrolling page
              }}
              className={`w-full bg-slate-100 relative overflow-hidden mb-6 shadow-inner cursor-grab active:cursor-grabbing group transition-all duration-500 ${PHOTO_FILTERS[currentFilter].style}`}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => { mouseStartRef.current = null; }}
            >
                {data.imageUrl && (
                    <img 
                        src={data.imageUrl} 
                        alt="Sky" 
                        className="w-full h-full object-cover object-center pointer-events-none select-none"
                        crossOrigin="anonymous" 
                    />
                )}
                
                {/* Visual Feedback Overlay */}
                <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-300 pointer-events-none ${showFeedback ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="text-white font-serif-display tracking-widest text-lg uppercase drop-shadow-lg border border-white/50 px-4 py-2 rounded-lg backdrop-blur-md">
                        {feedbackText}
                    </span>
                </div>

                {/* Texture */}
                <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/10 to-blue-500/10 mix-blend-overlay pointer-events-none"></div>
                <div className="absolute inset-0 bg-black/5 mix-blend-multiply pointer-events-none"></div>
                
                {/* Hint */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 pointer-events-none">
                     <div className="flex gap-8 text-white/80">
                         <Scan size={24} className="animate-pulse" />
                     </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="px-1 w-full flex flex-col items-center">
                
                {/* Poem */}
                <div className="relative w-full mb-6">
                    <textarea
                        value={poeticText}
                        onChange={(e) => setPoeticText(e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-[24px] leading-[1.4] font-handwriting text-slate-800 text-center resize-none overflow-hidden h-40 p-0 m-0"
                        spellCheck={false}
                    />
                </div>
                
                <div className="w-12 h-[1px] bg-slate-200 mb-6"></div>

                {/* Scientific Name */}
                <textarea 
                    value={titleText}
                    onChange={(e) => setTitleText(e.target.value)}
                    className="w-full bg-transparent border-none outline-none font-serif-display text-[14px] text-slate-500 uppercase tracking-[0.2em] text-center mb-3 resize-none overflow-hidden h-auto"
                    rows={1}
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                    }}
                />

                {/* Proverb */}
                <textarea
                    value={detailsText}
                    onChange={(e) => setDetailsText(e.target.value)}
                    className="w-full bg-transparent border-none outline-none font-serif-text text-[12px] leading-relaxed italic text-slate-500 text-center resize-none h-16 mb-2"
                    spellCheck={false}
                />
                
                {/* Date */}
                <input 
                    type="text"
                    value={dateText}
                    onChange={(e) => setDateText(e.target.value)}
                    className="bg-transparent text-slate-300 text-[9px] font-mono tracking-widest uppercase text-center w-full outline-none border-none mb-3"
                />

                {/* Color Dots */}
                <div className="flex justify-center gap-2 opacity-80">
                    {data.dominantColors.map((c, i) => (
                        <div key={i} className="w-2.5 h-2.5 rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]" style={{backgroundColor: c}}></div>
                    ))}
                </div>

            </div>
            </div>

            {/* Reprint Loading Overlay */}
            {isReprinting && (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="bg-black/80 text-white px-8 py-4 rounded-full text-sm font-serif-text tracking-widest animate-pulse backdrop-blur-md shadow-xl border border-white/10">
                        {t.reprinting}
                    </div>
                </div>
            )}
            
        </div>

        {/* Action Bar */}
        <div className="absolute bottom-8 flex items-center gap-4 bg-black/60 backdrop-blur-xl p-2 rounded-full border border-white/10 shadow-2xl z-20 animate-in slide-in-from-bottom-5 duration-700">
            
            <button 
                onClick={onClose}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/20 text-white transition"
            >
                <X size={20} />
            </button>

            <div className="w-[1px] h-8 bg-white/10"></div>

            <div className="relative">
                <button 
                    ref={languageTriggerRef}
                    onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 hover:bg-white/20 text-white transition text-xs font-bold tracking-widest uppercase"
                    disabled={isReprinting}
                >
                    {isReprinting ? <RefreshCw size={16} className="animate-spin" /> : <Globe size={16} />}
                    <span>{t.reprint}</span>
                </button>

                {showLanguageMenu && (
                    <div 
                        ref={languageMenuRef}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl py-1"
                    >
                        {LANGUAGES.map(lang => (
                            <button
                                key={lang.code}
                                onClick={() => {
                                    onReprint(lang.code);
                                    setShowLanguageMenu(false);
                                }}
                                className={`w-full text-left px-5 py-3 text-[10px] uppercase tracking-widest hover:bg-white/10 transition flex items-center justify-between ${lang.code === data.language ? 'text-blue-400' : 'text-white/70'}`}
                            >
                                <span>{lang.label.replace('Film: ', '')}</span>
                                {lang.code === data.language && <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <button 
                onClick={handleDownload}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 transition shadow-lg"
            >
                <Download size={20} />
            </button>

        </div>
        
        <p className="absolute bottom-24 text-white/30 text-[10px] font-mono tracking-widest uppercase pointer-events-none">
            Swipe Image: ↕ Filter &nbsp; ↔ Size
        </p>

      </div>
    </div>
  );
};

export default ResultCard;
