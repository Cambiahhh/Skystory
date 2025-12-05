import React, { useState, useEffect, useRef } from 'react';
import { SkyAnalysisResult, TargetLanguage, AppLanguage } from '../types';
import { LANGUAGES, UI_TEXT } from '../constants';
import { Download, X, Globe, RefreshCw } from 'lucide-react';

interface ResultCardProps {
  data: SkyAnalysisResult;
  onClose: () => void;
  onReprint: (newLang: TargetLanguage) => void;
  isReprinting: boolean;
  appLang: AppLanguage;
}

const ResultCard: React.FC<ResultCardProps> = ({ data, onClose, onReprint, isReprinting, appLang }) => {
  const t = UI_TEXT[appLang];
  const [isMounted, setIsMounted] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  
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
        const CARD_HEIGHT = 640; // Increased slightly for spacing
        const widthScale = window.innerWidth / (CARD_WIDTH + 40);
        const heightScale = (window.innerHeight - 150) / CARD_HEIGHT;
        
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
      // 1. Create a container for the export version
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '-10000px';
      container.style.left = '-10000px';
      container.style.zIndex = '-1';
      document.body.appendChild(container);

      // 2. Build a static HTML structure (not React inputs) to ensure perfect rendering
      // using standard DOM API to avoid React render cycle delays
      const card = document.createElement('div');
      card.className = "bg-[#fdfbf7] p-8 shadow-none flex flex-col items-center";
      card.style.width = "375px"; // Fixed print width
      card.style.minHeight = "600px";
      
      // Image Container
      const imgContainer = document.createElement('div');
      imgContainer.className = "aspect-square w-full bg-slate-100 relative overflow-hidden mb-8 filter sepia-[.05] contrast-[1.05]";
      if (data.imageUrl) {
          const img = document.createElement('img');
          img.src = data.imageUrl;
          img.className = "w-full h-full object-cover";
          img.crossOrigin = "anonymous";
          imgContainer.appendChild(img);
      }
      // Overlays
      const overlay1 = document.createElement('div');
      overlay1.className = "absolute inset-0 bg-gradient-to-tr from-orange-500/10 to-blue-500/10 mix-blend-overlay";
      imgContainer.appendChild(overlay1);
      
      card.appendChild(imgContainer);

      // Content Container
      const content = document.createElement('div');
      content.className = "w-full flex flex-col items-center px-2";

      // Poem
      const poem = document.createElement('div');
      poem.innerText = poeticText;
      poem.className = "w-full text-[24px] leading-[1.3] font-handwriting text-slate-800 text-center mb-6 whitespace-pre-wrap";
      content.appendChild(poem);

      // Divider
      const divider = document.createElement('div');
      divider.className = "w-12 h-[1px] bg-slate-200 mb-6";
      content.appendChild(divider);

      // Scientific Name (Title)
      const title = document.createElement('div');
      title.innerText = titleText;
      title.className = "font-serif-display text-[12px] text-slate-400 uppercase tracking-[0.2em] text-center mb-3 w-full break-words px-4";
      content.appendChild(title);

      // Proverb
      const proverb = document.createElement('div');
      proverb.innerText = detailsText;
      proverb.className = "font-serif-text text-[12px] leading-relaxed italic text-slate-500 text-center mb-4 w-full whitespace-pre-wrap px-2";
      content.appendChild(proverb);

      // Date
      const dateEl = document.createElement('div');
      dateEl.innerText = dateText;
      dateEl.className = "text-slate-300 text-[9px] font-mono tracking-widest uppercase mb-3";
      content.appendChild(dateEl);

      // Dots
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

      // 3. Capture
      await new Promise(resolve => setTimeout(resolve, 100)); // Font load buffer

      const canvas = await (window as any).html2canvas(card, {
        backgroundColor: null,
        scale: 3, 
        logging: false,
        useCORS: true,
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
      
      {/* Background */}
      <div 
        className={`absolute inset-0 bg-black/95 backdrop-blur-xl transition-opacity duration-700 ease-out ${isMounted ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      ></div>

      {/* Main Content Area */}
      <div 
        className={`relative z-10 flex flex-col items-center justify-center w-full h-full transition-all duration-1000 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}
      >
        
        {/* The Polaroid Container - Interactive React Version */}
        <div 
            style={{ 
                transform: `scale(${scale}) rotate(1deg)`,
                transformOrigin: 'center center'
            }}
            className="relative transition-transform duration-300"
        > 
            <div 
                className={`bg-[#fdfbf7] p-5 pb-8 w-[340px] shadow-2xl polaroid-shadow transition-all duration-500 flex flex-col items-center ${isReprinting ? 'blur-sm opacity-80' : ''}`}
            >
            
            {/* Image Section */}
            <div className="aspect-square w-full bg-slate-100 relative overflow-hidden mb-6 filter sepia-[.05] contrast-[1.05] shadow-inner">
                {data.imageUrl && (
                    <img 
                        src={data.imageUrl} 
                        alt="Sky" 
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous" 
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/10 to-blue-500/10 mix-blend-overlay pointer-events-none"></div>
                <div className="absolute inset-0 bg-black/5 mix-blend-multiply pointer-events-none"></div>
            </div>

            {/* Content Section */}
            <div className="px-1 w-full flex flex-col items-center">
                
                {/* Poem */}
                <div className="relative w-full mb-6">
                    <textarea
                        value={poeticText}
                        onChange={(e) => setPoeticText(e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-[24px] leading-[1.3] font-handwriting text-slate-800 text-center resize-none overflow-hidden h-32 p-0 m-0"
                        spellCheck={false}
                    />
                </div>
                
                {/* Divider */}
                <div className="w-12 h-[1px] bg-slate-200 mb-6"></div>

                {/* Scientific Name (Multiline supported) */}
                <textarea 
                    value={titleText}
                    onChange={(e) => setTitleText(e.target.value)}
                    className="w-full bg-transparent border-none outline-none font-serif-display text-[12px] text-slate-400 uppercase tracking-[0.2em] text-center mb-3 resize-none overflow-hidden h-auto"
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
                    className="w-full bg-transparent border-none outline-none font-serif-text text-[11px] leading-relaxed italic text-slate-500 text-center resize-none h-16 mb-2"
                    spellCheck={false}
                />
                
                {/* Date - Moved above dots */}
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
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="bg-black/80 text-white px-6 py-3 rounded-full text-xs font-serif-text tracking-widest animate-pulse backdrop-blur-md shadow-xl">
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
                    onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 hover:bg-white/20 text-white transition text-xs font-bold tracking-widest uppercase"
                    disabled={isReprinting}
                >
                    {isReprinting ? <RefreshCw size={16} className="animate-spin" /> : <Globe size={16} />}
                    <span>{t.reprint}</span>
                </button>

                {showLanguageMenu && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl py-1">
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