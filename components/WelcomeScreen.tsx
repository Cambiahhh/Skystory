
import React, { useState } from 'react';
import { Globe, Smartphone, ArrowRight, Cloud, Wifi } from 'lucide-react';
import { AppLanguage, NetworkRegion } from '../types';
import { UI_LANGUAGES, UI_TEXT } from '../constants';

interface WelcomeScreenProps {
  onComplete: (lang: AppLanguage, region: NetworkRegion) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete }) => {
  // Default to English initially, but UI will update immediately on selection
  const [selectedLang, setSelectedLang] = useState<AppLanguage>(AppLanguage.EN);
  const [selectedRegion, setSelectedRegion] = useState<NetworkRegion | null>(null);

  const t = UI_TEXT[selectedLang].welcome;

  const handleStart = () => {
    if (selectedRegion) {
      onComplete(selectedLang, selectedRegion);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-white overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] opacity-20 pointer-events-none animate-[spin_60s_linear_infinite]">
        <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,#000000_0%,#1e1b4b_25%,#312e81_50%,#0f172a_75%,#000000_100%)] blur-[100px]"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-sm flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        {/* Header */}
        <div className="text-center">
             <Cloud size={48} strokeWidth={1} className="mx-auto mb-6 text-white/80" />
             <h1 className="text-4xl font-serif-display tracking-widest uppercase mb-2">SkyStory</h1>
             <p className="text-white/40 font-serif-text italic text-xs tracking-[0.2em]">{t.title}</p>
        </div>

        {/* 1. Language Selection */}
        <div className="space-y-4">
             <div className="flex items-center gap-2 text-white/60 mb-2">
                 <Smartphone size={14} />
                 <span className="text-[10px] uppercase tracking-widest font-bold">{t.selectLang}</span>
             </div>
             <div className="grid grid-cols-2 gap-3">
                 {UI_LANGUAGES.map(lang => (
                     <button
                        key={lang.code}
                        onClick={() => setSelectedLang(lang.code)}
                        className={`py-3 rounded-xl border text-sm transition-all duration-300 ${
                            selectedLang === lang.code
                            ? 'bg-white text-black border-white font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                            : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
                        }`}
                     >
                         {lang.label}
                     </button>
                 ))}
             </div>
        </div>

        {/* 2. Region Selection */}
        <div className="space-y-4">
             <div className="flex items-center gap-2 text-white/60 mb-2">
                 <Wifi size={14} />
                 <span className="text-[10px] uppercase tracking-widest font-bold">{t.selectRegion}</span>
             </div>
             
             <div className="flex flex-col gap-3">
                 {/* Global */}
                 <button
                    onClick={() => setSelectedRegion(NetworkRegion.GLOBAL)}
                    className={`relative p-4 rounded-xl border text-left transition-all duration-300 flex items-center justify-between group ${
                        selectedRegion === NetworkRegion.GLOBAL
                        ? 'bg-blue-500/20 border-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                        : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
                    }`}
                 >
                     <div className="flex flex-col">
                        <span className="text-sm font-bold tracking-wide">{UI_TEXT[selectedLang].regionGlobal}</span>
                        <span className="text-[9px] opacity-60 mt-1 font-mono">Google Gemini AI</span>
                     </div>
                     <Globe size={18} className={selectedRegion === NetworkRegion.GLOBAL ? 'text-blue-300' : 'opacity-30'} />
                 </button>

                 {/* CN */}
                 <button
                    onClick={() => setSelectedRegion(NetworkRegion.CN)}
                    className={`relative p-4 rounded-xl border text-left transition-all duration-300 flex items-center justify-between group ${
                        selectedRegion === NetworkRegion.CN
                        ? 'bg-red-500/20 border-red-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                        : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
                    }`}
                 >
                     <div className="flex flex-col">
                        <span className="text-sm font-bold tracking-wide">{UI_TEXT[selectedLang].regionCN}</span>
                        <span className="text-[9px] opacity-60 mt-1 font-mono">Zhipu AI (GLM-4)</span>
                     </div>
                     <div className={`w-4 h-4 rounded-full border-2 ${selectedRegion === NetworkRegion.CN ? 'border-red-400 bg-red-400' : 'border-white/30'}`}></div>
                 </button>
             </div>
             
             <p className="text-[9px] text-white/30 text-center font-serif-text mt-2">
                 {t.regionHint}
             </p>
        </div>

        {/* Start Button */}
        <button
            onClick={handleStart}
            disabled={!selectedRegion}
            className={`mt-4 w-full py-4 rounded-full font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all duration-500 ${
                selectedRegion 
                ? 'bg-white text-black hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.4)]' 
                : 'bg-white/10 text-white/20 cursor-not-allowed'
            }`}
        >
            <span>{t.start}</span>
            <ArrowRight size={16} />
        </button>

      </div>
    </div>
  );
};

export default WelcomeScreen;
