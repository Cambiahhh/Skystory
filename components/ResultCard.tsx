
import React, { useState, useEffect, useRef } from 'react';
import { SkyAnalysisResult, TargetLanguage, AppLanguage, FilterType, AppSettings, AspectRatio } from '../types';
import { LANGUAGES, UI_TEXT, PHOTO_FILTERS } from '../constants';
import { Download, X, Globe, RefreshCw, Scan, RotateCw } from 'lucide-react';

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
  
  // Rotation State (Accumulated Degrees)
  const [rotation, setRotation] = useState(0);
  const isFlipped = Math.abs(rotation) % 360 !== 0;

  // Interaction State
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [showFeedback, setShowFeedback] = useState(false);

  // Refs
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const languageTriggerRef = useRef<HTMLButtonElement>(null);
  const photoAreaRef = useRef<HTMLDivElement>(null);
  
  // Gesture Refs
  const touchStartRef = useRef<{x: number, y: number, targetType: 'photo' | 'card'} | null>(null);
  const mouseStartRef = useRef<{x: number, y: number, targetType: 'photo' | 'card'} | null>(null);

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

  // --- Gesture Logic ---
  const handleSwipe = (diffX: number, diffY: number, targetType: 'photo' | 'card') => {
      const SWIPE_THRESHOLD = 30; 

      if (Math.abs(diffX) > Math.abs(diffY)) {
          // Horizontal Swipe
          if (Math.abs(diffX) > SWIPE_THRESHOLD) {
              if (targetType === 'photo' && !isFlipped) {
                   // Swipe ON Photo -> Change Aspect Ratio
                   const currentIndex = ASPECT_RATIOS.indexOf(localAspectRatio);
                   let nextIndex;
                   if (diffX > 0) { // Swipe Right (Drag right)
                       nextIndex = (currentIndex - 1 + ASPECT_RATIOS.length) % ASPECT_RATIOS.length;
                   } else { // Swipe Left (Drag left)
                       nextIndex = (currentIndex + 1) % ASPECT_RATIOS.length;
                   }
                   const newRatio = ASPECT_RATIOS[nextIndex];
                   setLocalAspectRatio(newRatio);
                   triggerFeedback(t.aspectRatioOpts[newRatio]);
              } else {
                  // Swipe ON Card (or flipped) -> Directional Flip
                  if (diffX > 0) {
                      // Swipe L -> R: CW (+)
                      setRotation(r => r + 180);
                  } else {
                      // Swipe R -> L: CCW (-)
                      setRotation(r => r - 180);
                  }
              }
          }
      } else {
          // Vertical Swipe -> Cycle Filter (Only on Photo Area when not flipped)
          if (targetType === 'photo' && !isFlipped && Math.abs(diffY) > SWIPE_THRESHOLD) {
              const currentIndex = FILTER_KEYS.indexOf(currentFilter);
              let nextIndex;
              if (diffY > 0) { // Drag Down
                   nextIndex = (currentIndex - 1 + FILTER_KEYS.length) % FILTER_KEYS.length;
              } else { // Drag Up
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
      // Determine if touch started on the photo area
      const isPhoto = photoAreaRef.current && photoAreaRef.current.contains(e.target as Node);
      touchStartRef.current = { 
          x: e.touches[0].clientX, 
          y: e.touches[0].clientY,
          targetType: isPhoto ? 'photo' : 'card'
      };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      
      const deltaX = endX - touchStartRef.current.x;
      const deltaY = endY - touchStartRef.current.y;
      
      handleSwipe(deltaX, deltaY, touchStartRef.current.targetType);
      touchStartRef.current = null;
  };

  // Mouse Handlers (Desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
      const isPhoto = photoAreaRef.current && photoAreaRef.current.contains(e.target as Node);
      mouseStartRef.current = { 
          x: e.clientX, 
          y: e.clientY,
          targetType: isPhoto ? 'photo' : 'card'
      };
  };

  const handleMouseUp = (e: React.MouseEvent) => {
      if (!mouseStartRef.current) return;
      const deltaX = e.clientX - mouseStartRef.current.x;
      const deltaY = e.clientY - mouseStartRef.current.y;
      
      handleSwipe(deltaX, deltaY, mouseStartRef.current.targetType);
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
         const MAX_SIZE = 1200; 
         let w = img.naturalWidth;
         let h = img.naturalHeight;
         
         if (w > MAX_SIZE || h > MAX_SIZE) {
             const ratio = w / h;
             if (w > h) {
                 w = MAX_SIZE;
                 h = MAX_SIZE / ratio;
             } else {
                 h = MAX_SIZE;
                 w = MAX_SIZE * ratio;
             }
         }

         const canvas = document.createElement('canvas');
         canvas.width = w;
         canvas.height = h;
         const ctx = canvas.getContext('2d');
         if (ctx) {
           ctx.filter = filterCss !== 'none' ? filterCss : 'none';
           ctx.drawImage(img, 0, 0, w, h);
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
      triggerFeedback(t.developing);

      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '0';
      container.style.top = '0';
      container.style.width = '0';
      container.style.height = '0';
      container.style.overflow = 'hidden';
      container.style.zIndex = '-1';
      document.body.appendChild(container);

      // Scale Factors
      const SCALE_FACTOR = 2; // Render at 2x size
      const BASE_WIDTH = 340 * SCALE_FACTOR;
      
      const card = document.createElement('div');
      card.style.boxSizing = 'border-box';
      card.style.width = `${BASE_WIDTH}px`;
      
      if (isFlipped) {
          // --- RENDER BACK (GRADIENT PALETTE) ---
          const PADDING = 30 * SCALE_FACTOR;
          
          const imgH = (BASE_WIDTH - (20 * SCALE_FACTOR * 2)) * getHeightMultiplier(localAspectRatio);
          const frontHeightApprox = 20*SCALE_FACTOR + imgH + 280*SCALE_FACTOR; 
          card.style.height = `${frontHeightApprox}px`;

          // UPDATED: Smooth Top-to-bottom Gradient
          const colors = data.dominantColors;
          const gradient = `linear-gradient(180deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`;
          card.style.background = gradient;
          card.style.display = 'flex';
          card.style.flexDirection = 'column';
          card.style.justifyContent = 'space-between';
          card.style.padding = `${PADDING}px`;
          
          const body = document.createElement('div');
          body.style.flex = '1';
          body.style.position = 'relative';
          body.style.width = '100%';
          card.appendChild(body);

          const footer = document.createElement('div');
          footer.style.display = 'flex';
          footer.style.justifyContent = 'space-between';
          footer.style.alignItems = 'flex-end';
          footer.style.width = '100%';
          
          const leftCol = document.createElement('div');
          leftCol.style.display = 'flex';
          leftCol.style.flexDirection = 'column';
          leftCol.style.gap = `${4 * SCALE_FACTOR}px`;
          
          colors.forEach(color => {
              const code = document.createElement('div');
              code.innerText = color.toUpperCase();
              code.style.fontFamily = "'Inter', sans-serif";
              code.style.fontWeight = '200'; // Extra Light
              code.style.fontSize = `${10 * SCALE_FACTOR}px`;
              code.style.color = 'rgba(255,255,255,0.95)';
              code.style.letterSpacing = '0.25em'; // Very wide tracking
              code.style.textShadow = '0 1px 2px rgba(0,0,0,0.05)';
              leftCol.appendChild(code);
          });
          footer.appendChild(leftCol);

          const rightCol = document.createElement('div');
          rightCol.style.display = 'flex';
          rightCol.style.flexDirection = 'column';
          rightCol.style.alignItems = 'flex-end';
          
          const time = document.createElement('div');
          time.innerText = new Date(data.timestamp).toLocaleDateString().replace(/\//g, '.');
          time.style.fontFamily = "'Noto Serif SC', serif"; 
          time.style.fontStyle = 'italic';
          time.style.fontWeight = '300';
          time.style.fontSize = `${10 * SCALE_FACTOR}px`;
          time.style.color = 'rgba(255,255,255,0.8)';
          time.style.letterSpacing = '0.05em';
          time.style.marginBottom = `${4 * SCALE_FACTOR}px`;
          rightCol.appendChild(time);

          const brand = document.createElement('div');
          brand.innerText = "SkyStory";
          brand.style.fontFamily = "'Cinzel', serif";
          brand.style.fontWeight = '400';
          brand.style.fontSize = `${14 * SCALE_FACTOR}px`;
          brand.style.letterSpacing = '0.15em';
          brand.style.color = 'rgba(255,255,255,0.95)';
          rightCol.appendChild(brand);

          footer.appendChild(rightCol);
          card.appendChild(footer);

      } else {
          // --- RENDER FRONT (ORIGINAL) ---
          const PADDING = 20 * SCALE_FACTOR;
          const BOTTOM_PADDING = 32 * SCALE_FACTOR;
          const IMAGE_WIDTH = BASE_WIDTH - (PADDING * 2);
          const imgHeight = IMAGE_WIDTH * getHeightMultiplier(localAspectRatio);

          card.style.backgroundColor = '#fdfbf7';
          card.style.display = 'flex';
          card.style.flexDirection = 'column';
          card.style.alignItems = 'center';
          card.style.padding = `${PADDING}px`;
          card.style.paddingBottom = `${BOTTOM_PADDING}px`;
          
          const imgContainer = document.createElement('div');
          imgContainer.style.boxSizing = 'border-box';
          imgContainer.style.width = `${IMAGE_WIDTH}px`;
          imgContainer.style.height = `${imgHeight}px`;
          imgContainer.style.backgroundColor = '#f1f5f9'; 
          imgContainer.style.position = 'relative';
          imgContainer.style.overflow = 'hidden';
          imgContainer.style.marginBottom = `${24 * SCALE_FACTOR}px`; 
          imgContainer.style.boxShadow = 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)';
          
          if (data.imageUrl) {
              const filteredSrc = await bakeFilter(data.imageUrl, PHOTO_FILTERS[currentFilter].css);
              const imgDiv = document.createElement('div');
              imgDiv.style.width = '100%';
              imgDiv.style.height = '100%';
              imgDiv.style.backgroundImage = `url(${filteredSrc})`;
              imgDiv.style.backgroundSize = 'cover';
              imgDiv.style.backgroundPosition = 'center center';
              imgDiv.style.backgroundRepeat = 'no-repeat';
              imgContainer.appendChild(imgDiv);
          }
          
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
          content.style.boxSizing = 'border-box';
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
          poem.style.color = '#1e293b';
          poem.style.textAlign = 'center';
          poem.style.marginBottom = `${24 * SCALE_FACTOR}px`;
          poem.style.whiteSpace = 'pre-wrap';
          content.appendChild(poem);

          const divider = document.createElement('div');
          divider.style.width = `${48 * SCALE_FACTOR}px`;
          divider.style.height = `${1 * SCALE_FACTOR}px`; 
          divider.style.backgroundColor = '#e2e8f0'; 
          divider.style.marginBottom = `${24 * SCALE_FACTOR}px`;
          content.appendChild(divider);

          const title = document.createElement('div');
          title.innerText = titleText;
          title.style.fontFamily = "'Cinzel', 'ZCOOL XiaoWei', serif";
          title.style.fontSize = `${14 * SCALE_FACTOR}px`;
          title.style.color = '#64748b';
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
          dateEl.style.color = '#cbd5e1';
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
      }

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
        windowWidth: BASE_WIDTH + 100,
        scrollX: 0, 
        scrollY: 0
      });

      document.body.removeChild(container);

      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `skystory-${isFlipped ? 'palette' : 'photo'}-${Date.now()}.png`;
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
        
        {/* The 3D Container - Add handlers here for the CARD (Flip) */}
        <div 
            style={{ 
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
                touchAction: 'none'
            }}
            className="perspective-1000 relative"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
        > 
            <div 
                className="relative transition-all duration-700 transform-style-3d"
                style={{ width: '340px', transform: `rotateY(${rotation}deg)` }} // State-based Rotation
            >

                {/* --- FRONT FACE (PHOTO) --- */}
                <div 
                    className="backface-hidden bg-[#fdfbf7] p-5 pb-8 shadow-2xl polaroid-shadow flex flex-col items-center origin-center"
                >
                    {/* Image Section */}
                    <div 
                        ref={photoAreaRef}
                        style={{
                            ...getDisplayHeightStyle(300)
                        }}
                        className={`w-full bg-slate-100 relative overflow-hidden mb-6 shadow-inner cursor-grab active:cursor-grabbing group transition-all duration-500 ${PHOTO_FILTERS[currentFilter].style}`}
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
                        <div className="relative w-full mb-6">
                            <textarea
                                value={poeticText}
                                onChange={(e) => setPoeticText(e.target.value)}
                                className="w-full bg-transparent border-none outline-none text-[24px] leading-[1.4] font-handwriting text-slate-800 text-center resize-none overflow-hidden h-40 p-0 m-0"
                                spellCheck={false}
                            />
                        </div>
                        <div className="w-12 h-[1px] bg-slate-200 mb-6"></div>
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
                        <textarea
                            value={detailsText}
                            onChange={(e) => setDetailsText(e.target.value)}
                            className="w-full bg-transparent border-none outline-none font-serif-text text-[12px] leading-relaxed italic text-slate-500 text-center resize-none h-16 mb-2"
                            spellCheck={false}
                        />
                        <input 
                            type="text"
                            value={dateText}
                            onChange={(e) => setDateText(e.target.value)}
                            className="bg-transparent text-slate-300 text-[9px] font-mono tracking-widest uppercase text-center w-full outline-none border-none mb-3"
                        />
                        <div className="flex justify-center gap-2 opacity-80">
                            {data.dominantColors.map((c, i) => (
                                <div key={i} className="w-2.5 h-2.5 rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]" style={{backgroundColor: c}}></div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Reprint Loading Overlay (Front only) */}
                    {isReprinting && (
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                            <div className="bg-black/80 text-white px-8 py-4 rounded-full text-sm font-serif-text tracking-widest animate-pulse backdrop-blur-md shadow-xl border border-white/10">
                                {t.reprinting}
                            </div>
                        </div>
                    )}
                </div>

                {/* --- BACK FACE (GRADIENT PALETTE - REFINED) --- */}
                <div 
                    className="absolute inset-0 backface-hidden rotate-y-180 shadow-2xl polaroid-shadow flex flex-col justify-between p-8"
                    style={{
                        // Smooth Gradient
                        background: `linear-gradient(180deg, ${data.dominantColors[0]} 0%, ${data.dominantColors[1]} 50%, ${data.dominantColors[2]} 100%)`,
                    }}
                >
                    {/* Empty top space for pure color enjoyment */}
                    <div className="flex-1"></div>

                    {/* Footer Content */}
                    <div className="flex justify-between items-end">
                        
                        {/* Bottom Left: Hex Codes - Clean, Extra Light Inter */}
                        <div className="flex flex-col gap-1.5">
                             {data.dominantColors.map((color, i) => (
                                <span key={i} className="font-sans font-[200] text-[10px] text-white/95 uppercase tracking-[0.25em] drop-shadow-sm">
                                    {color}
                                </span>
                             ))}
                        </div>

                        {/* Bottom Right: Date & Logo */}
                        <div className="flex flex-col items-end gap-1 text-right">
                             {/* Noto Serif SC Italic for elegant date */}
                             <span className="font-serif-text italic font-light text-[10px] text-white/80 tracking-widest drop-shadow-sm">
                                 {new Date(data.timestamp).toLocaleDateString().replace(/\//g, '.')}
                             </span>
                             {/* Cinzel for Majestic Logo */}
                             <span className="font-serif-display text-[14px] text-white tracking-[0.15em] drop-shadow-sm mt-0.5">
                                SkyStory
                             </span>
                        </div>
                    </div>

                    {/* Subtle Overlay Texture for Back */}
                    <div className="absolute inset-0 bg-white/5 mix-blend-soft-light pointer-events-none"></div>
                    {/* Clean edge border */}
                    <div className="absolute inset-0 border border-white/10 pointer-events-none"></div>
                </div>

            </div>
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
            Swipe: ↔ Flip / Aspect &nbsp; ↕ Filter
        </p>

      </div>
    </div>
  );
};

export default ResultCard;
