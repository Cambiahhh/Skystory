
import React, { useState, useEffect } from 'react';
import { Cloud, Sparkles, BookOpen, Settings, Feather, X, Download, HelpCircle, Leaf, ArrowUp, ArrowDown } from 'lucide-react';
import { SkyMode, AppLanguage, NatureDomain } from '../types';
import { UI_TEXT } from '../constants';

interface HomeViewProps {
  onSelectMode: (mode: SkyMode) => void;
  onOpenJournal: () => void;
  onOpenSettings: () => void;
  onOpenTutorial: () => void;
  lang: AppLanguage;
}

const HomeView: React.FC<HomeViewProps> = ({ onSelectMode, onOpenJournal, onOpenSettings, onOpenTutorial, lang }) => {
  const t = UI_TEXT[lang];
  const [showPhilosophy, setShowPhilosophy] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <div className="h-full w-full bg-[#050505] relative overflow-hidden flex flex-col items-center justify-between py-12 px-6">
      
      {/* --- Dynamic Atmospheric Background --- */}
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] opacity-20 pointer-events-none animate-[spin_60s_linear_infinite]">
        <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,#000000_0%,#1e1b4b_25%,#312e81_50%,#0f172a_75%,#000000_100%)] blur-[100px]"></div>
      </div>
      
      {/* Breathing Orbs */}
      <div className="absolute top-[10%] right-[10%] w-96 h-96 bg-cyan-900/10 rounded-full blur-[120px] animate-pulse duration-[8000ms] pointer-events-none"></div>
      <div className="absolute bottom-[10%] left-[10%] w-96 h-96 bg-emerald-900/10 rounded-full blur-[120px] animate-pulse duration-[10000ms] delay-1000 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] brightness-100 contrast-150 pointer-events-none mix-blend-overlay"></div>


      {/* --- Header Section --- */}
      <div className="z-10 w-full mt-10 flex flex-col items-center relative animate-in fade-in slide-in-from-top-4 duration-1000">
        <h1 className="text-4xl md:text-5xl font-serif-display text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 tracking-[0.2em] uppercase drop-shadow-2xl text-center leading-normal ml-2">
          Dew
        </h1>
        
        <p className="mt-4 text-white/40 font-serif-text italic text-[10px] tracking-[0.2em] uppercase">
             — {t.subtitle} —
        </p>
      </div>


      {/* --- Main Cards Section --- */}
      <div className="z-10 w-full max-w-sm flex-1 flex flex-col justify-center gap-6 py-4">
        
        {/* SKY MODE (Look Up) */}
        <button 
          onClick={() => onSelectMode(SkyMode.CLOUD)} // Legacy enum mapping, handled via Camera smart mode now
          className="group relative w-full h-40 rounded-2xl overflow-hidden transition-all duration-700 hover:scale-[1.01] active:scale-[0.99] border border-white/5 hover:border-cyan-200/20"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 to-blue-900/10 opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1594156596782-fa8205b1f18f?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay group-hover:scale-110 transition-transform duration-[2s]"></div>
          
          <div className="relative z-10 w-full h-full flex items-center justify-between px-8">
             <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-2 text-cyan-200/50 mb-1 group-hover:text-cyan-200 transition-colors">
                     <ArrowUp size={10} />
                     <span className="text-[9px] font-mono uppercase tracking-widest">{t.modeSkyDesc}</span>
                </div>
                <span className="text-2xl font-serif-display text-white/90 tracking-[0.15em] uppercase group-hover:text-white transition-colors">
                    {t.modeSky}
                </span>
                <span className="w-8 h-[1px] bg-white/10 mt-2 group-hover:w-16 group-hover:bg-cyan-200/50 transition-all duration-700"></span>
             </div>
             <Cloud size={64} strokeWidth={0.5} className="text-white/5 absolute right-4 -bottom-4 group-hover:text-cyan-200/10 group-hover:-translate-y-2 transition-all duration-700" />
          </div>
        </button>

        {/* LAND MODE (Look Down) */}
        <button 
          onClick={() => onSelectMode(SkyMode.CLOUD)} // We route to same camera, mode determined by tilt
          className="group relative w-full h-40 rounded-2xl overflow-hidden transition-all duration-700 hover:scale-[1.01] active:scale-[0.99] border border-white/5 hover:border-emerald-200/20"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 to-teal-900/10 opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay group-hover:scale-110 transition-transform duration-[2s]"></div>

          <div className="relative z-10 w-full h-full flex items-center justify-between px-8">
             <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-2 text-emerald-200/50 mb-1 group-hover:text-emerald-200 transition-colors">
                     <ArrowDown size={10} />
                     <span className="text-[9px] font-mono uppercase tracking-widest">{t.modeLandDesc}</span>
                </div>
                <span className="text-2xl font-serif-display text-white/90 tracking-[0.15em] uppercase group-hover:text-white transition-colors">
                    {t.modeLand}
                </span>
                <span className="w-8 h-[1px] bg-white/10 mt-2 group-hover:w-16 group-hover:bg-emerald-200/50 transition-all duration-700"></span>
             </div>
             
             <Leaf size={64} strokeWidth={0.5} className="text-white/5 absolute right-4 -bottom-4 group-hover:text-emerald-200/10 group-hover:-translate-y-2 transition-all duration-700" />
          </div>
        </button>

      </div>

      {/* --- Footer Area --- */}
      <div className="z-20 mb-2 flex flex-col items-center gap-5 animate-in slide-in-from-bottom-4 duration-1000 delay-200">
        
        <div className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#111]/80 backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)]">
            <button onClick={() => setShowPhilosophy(true)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all group relative">
                <Feather size={18} strokeWidth={1.5} />
            </button>
            <div className="w-[1px] h-4 bg-white/10"></div>
            <button onClick={onOpenJournal} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all group relative">
                <BookOpen size={18} strokeWidth={1.5} />
            </button>
            <div className="w-[1px] h-4 bg-white/10"></div>
            <button onClick={onOpenTutorial} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all group relative">
                <HelpCircle size={18} strokeWidth={1.5} />
            </button>
            <div className="w-[1px] h-4 bg-white/10"></div>
            <button onClick={onOpenSettings} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all group relative">
                <Settings size={18} strokeWidth={1.5} />
            </button>

            {installPrompt && (
              <>
                 <div className="w-[1px] h-4 bg-white/10"></div>
                 <button onClick={handleInstall} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white transition-all animate-pulse">
                    <Download size={18} strokeWidth={1.5} />
                </button>
              </>
            )}
        </div>

        <span className="font-serif-text italic text-[10px] tracking-[0.15em] text-white/30 hover:text-white/60 transition-colors cursor-default select-none">
            {t.philosophy.contact}
        </span>
      </div>
      
      {/* --- Philosophy Modal --- */}
      {showPhilosophy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500">
           <div className="relative w-full max-w-sm max-h-[80vh] flex flex-col items-center text-center">
              <button onClick={() => setShowPhilosophy(false)} className="absolute -top-12 p-2 text-white/50 hover:text-white transition-colors">
                <X size={24} strokeWidth={1} />
              </button>
              <div className="overflow-y-auto no-scrollbar py-4 px-2 space-y-8">
                  <Feather size={24} className="mx-auto text-white/30 mb-8" strokeWidth={1} />
                  <h2 className="text-xl font-serif-display text-white tracking-[0.2em] uppercase">{t.philosophy.title}</h2>
                  <div className="w-8 h-[1px] bg-white/20 mx-auto"></div>
                  <p className="font-serif-text text-sm leading-8 text-white/80 whitespace-pre-wrap">{t.philosophy.content}</p>
                  <p className="font-serif-display text-xs text-white/50 uppercase tracking-widest mt-8">{t.philosophy.contact}</p>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default HomeView;
