
import React, { useState, useEffect, useRef } from 'react';
import { SkyAnalysisResult, TargetLanguage, AppLanguage, FilterType, AppSettings } from '../types';
import { LANGUAGES, UI_TEXT, PHOTO_FILTERS } from '../constants';
import { Download, X, Globe, RefreshCw, Palette } from 'lucide-react';

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
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<FilterType>(initialFilter);
  const [imageAspectRatio, setImageAspectRatio] = useState(1); // Width / Height
  
  // Refs
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const filterTriggerRef = useRef<HTMLDivElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const languageTriggerRef = useRef<HTMLButtonElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Filter Menu Logic
      if (showFilterMenu) {
        if (filterMenuRef.current && !filterMenuRef.current.contains(target) &&
            filterTriggerRef.current && !filterTriggerRef.current.contains(target)) {
          setShowFilterMenu(false);
        }
      }

      // Language Menu Logic
      if (showLanguageMenu) {
        if (languageMenuRef.current && !languageMenuRef.current.contains(target) &&
            languageTriggerRef.current && !languageTriggerRef.current.contains(target)) {
          setShowLanguageMenu(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterMenu, showLanguageMenu]);

  // Load Image Ratio
  useEffect(() => {
    if (data.imageUrl) {
        const img = new Image();
        img.src = data.imageUrl;
        img.onload = () => {
            const ratio = img.naturalWidth / img.naturalHeight;
            setImageAspectRatio(ratio);
        };
    }
  }, [data.imageUrl]);

  // Calculate Display Ratio based on Settings
  const getDisplayHeightStyle = (baseWidth: number) => {
      if (settings.aspectRatio === '1:1') return { height: `${baseWidth}px` };
      
      // Dynamic Logic
      // Max 9:16 (Tall) -> Ratio 0.5625 -> Height = Width / 0.5625
      // Min 3:2 (Wide) -> Ratio 1.5 -> Height = Width / 1.5
      
      let effectiveRatio = imageAspectRatio;
      if (effectiveRatio < 0.5625) effectiveRatio = 0.5625; // Don't get taller than 9:16
      if (effectiveRatio > 1.5) effectiveRatio = 1.5; // Don't get wider than 3:2
      
      return { height: `${baseWidth / effectiveRatio}px` };
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

  const handleDownload = async () => {
    if (!(window as any).html2canvas) return;

    try {
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '-10000px';
      container.style.left = '-10000px';
      container.style.zIndex = '-1';
      document.body.appendChild(container);

      const CARD_WIDTH = 375;

      const card = document.createElement('div');
      card.className = "bg-[#fdfbf7] p-8 shadow-none flex flex-col items-center";
      card.style.width = `${CARD_WIDTH}px`; 
      // Height is auto
      
      const imgContainer = document.createElement('div');
      // Apply aspect ratio style logic here
      let imgHeight = CARD_WIDTH; // Default 1:1
      if (settings.aspectRatio === 'dynamic') {
         let effectiveRatio = imageAspectRatio;
         if (effectiveRatio < 0.5625) effectiveRatio = 0.5625; 
         if (effectiveRatio > 1.5) effectiveRatio = 1.5; 
         imgHeight = CARD_WIDTH / effectiveRatio;
      }
      
      imgContainer.style.height = `${imgHeight}px`;
      imgContainer.style.width = '100%';
      // Add the Tailwind filter classes. 
      // Note: html2canvas sometimes struggles with Tailwind classes if styles aren't fully computed.
      // But usually it works. Just to be safe, we add them.
      imgContainer.className = `bg-slate-100 relative overflow-hidden mb-8 ${PHOTO_FILTERS[currentFilter].style}`;
      
      if (data.imageUrl) {
          const img = document.createElement('img');
          img.src = data.imageUrl;
          img.className = "w-full h-full object-cover";
          img.crossOrigin = "anonymous";
          imgContainer.appendChild(img);
      }
      
      // We remove complex blend mode overlays for export as html2canvas often fails them.
      // Or we can try a simple overlay.
      const overlay1 = document.createElement('div');
      overlay1.className = "absolute inset-0 bg-gradient-to-tr from-orange-500/10 to-blue-500/10 mix-blend-overlay pointer-events-none";
      imgContainer.appendChild(overlay1);
      
      card.appendChild(imgContainer);

      const content = document.createElement('div');
      content.className = "w-full flex flex-col items-center px-2";

      const poem = document.createElement('div');
      poem.innerText = poeticText;
      poem.className = "w-full text-[24px] leading-[1.4] font-handwriting text-slate-800 text-center mb-6 whitespace-pre-wrap";
      content.appendChild(poem);

      const divider = document.createElement('div');
      divider.className = "w-12 h-[1px] bg-slate-200 mb-6";
      content.appendChild(divider);

      const title = document.createElement('div');
      title.innerText = titleText;
      title.className = "font-serif-display text-[14px] text-slate-500 uppercase tracking-[0.2em] text-center mb-3 w-full break-words px-4";
      content.appendChild(title);

      const proverb = document.createElement('div');
      proverb.innerText = detailsText;
      proverb.className = "font-serif-text text-[12px] leading-relaxed italic text-slate-500 text-center mb-4 w-full whitespace-pre-wrap px-2";
      content.appendChild(proverb);

      const dateEl = document.createElement('div');
      dateEl.innerText = dateText;
      dateEl.className = "text-slate-300 text-[9px] font-mono tracking-widest uppercase mb-3";
      content.appendChild(dateEl);

      const dots = document.createElement('div');
      dots.className = "flex justify-center gap-2 opacity-80 mt-1";
      data.dominantColors.forEach(c => {
          const d = document.createElement('div');
          d.className = "w-2.5 h-2.5 rounded-full";
          d.style.backgroundColor = c;
          dots.appendChild(d);
      });
      content.appendChild(dots);

      card.appendChild(content);
      container.appendChild(card);

      await new Promise(resolve => setTimeout(resolve, 150));

      const canvas = await (window as any).html2canvas(card, {
        backgroundColor: null,
        scale: 3, 
        logging: false,
        useCORS: true,
        allowTaint: true, // Important for some filter effects
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
            
            {/* Image Section - Clickable for Filters */}
            <div 
              ref={filterTriggerRef}
              style={getDisplayHeightStyle(300)} // 340px padding 20px*2 = 300px width
              className={`w-full bg-slate-100 relative overflow-hidden mb-6 shadow-inner cursor-pointer group transition-all duration-500 ${PHOTO_FILTERS[currentFilter].style}`}
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
                {data.imageUrl && (
                    <img 
                        src={data.imageUrl} 
                        alt="Sky" 
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous" 
                    />
                )}
                {/* Texture */}
                <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/10 to-blue-500/10 mix-blend-overlay pointer-events-none"></div>
                <div className="absolute inset-0 bg-black/5 mix-blend-multiply pointer-events-none"></div>
                
                {/* Hint */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <Palette className="text-white drop-shadow-md" size={32} />
                </div>
            </div>

            {/* Filter Selection Menu */}
            {showFilterMenu && (
               <div 
                 ref={filterMenuRef}
                 className="absolute top-10 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-md rounded-xl p-6 z-30 w-auto min-w-[280px] grid grid-cols-3 gap-x-6 gap-y-6 shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-200"
               >
                  {(Object.keys(PHOTO_FILTERS) as FilterType[]).map((fType) => (
                    <button
                      key={fType}
                      onClick={() => { setCurrentFilter(fType); setShowFilterMenu(false); }}
                      className={`flex flex-col items-center gap-2 ${currentFilter === fType ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
                    >
                      <div className={`w-12 h-12 rounded-full bg-gray-200 overflow-hidden ring-2 transition-all duration-300 ${currentFilter === fType ? 'ring-white scale-110' : 'ring-transparent hover:ring-white/50'} ${PHOTO_FILTERS[fType].style}`}>
                         {data.imageUrl && <img src={data.imageUrl} className="w-full h-full object-cover" />}
                      </div>
                      <span className="text-[10px] text-white tracking-wider text-center leading-tight whitespace-nowrap">
                        {t.filters[fType]}
                      </span>
                    </button>
                  ))}
               </div>
            )}

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
            {t.tapToEdit}
        </p>

      </div>
    </div>
  );
};

export default ResultCard;
