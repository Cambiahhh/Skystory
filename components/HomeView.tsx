
import React, { useState, useEffect } from 'react';
import { Cloud, Sparkles, BookOpen, Settings, Feather, X, Download } from 'lucide-react';
import { SkyMode, AppLanguage } from '../types';
import { UI_TEXT } from '../constants';

interface HomeViewProps {
  onSelectMode: (mode: SkyMode) => void;
  onOpenJournal: () => void;
  onOpenSettings: () => void;
  lang: AppLanguage;
}

const HomeView: React.FC<HomeViewProps> = ({ onSelectMode, onOpenJournal, onOpenSettings, lang }) => {
  const t = UI_TEXT[lang];
  const [showPhilosophy, setShowPhilosophy] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Install Prompt Listener
  useEffect(() => {
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    // Show the install prompt
    installPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    // We've used the prompt, and can't use it again, throw it away
    setInstallPrompt(null);
  };

  return (
    <div className="h-full w-full bg-[#050505] relative overflow-hidden flex flex-col items-center justify-between py-12 px-6">
      
      {/* --- Dynamic Atmospheric Background --- */}
      {/* Subtle Aurora Gradient - Darker and more elegant */}
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] opacity-20 pointer-events-none animate-[spin_30s_linear_infinite]">
        <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,#000000_0%,#1e1b4b_25%,#312e81_50%,#0f172a_75%,#000000_100%)] blur-[100px]"></div>
      </div>
      
      {/* Breathing Orbs - Softer colors */}
      <div className="absolute top-[10%] right-[10%] w-96 h-96 bg-cyan-900/10 rounded-full blur-[120px] animate-pulse duration-[8000ms] pointer-events-none"></div>
      <div className="absolute bottom-[10%] left-[10%] w-96 h-96 bg-fuchsia-900/10 rounded-full blur-[120px] animate-pulse duration-[10000ms] delay-1000 pointer-events-none"></div>

      {/* Noise Texture */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] brightness-100 contrast-150 pointer-events-none mix-blend-overlay"></div>


      {/* --- Header Section --- */}
      <div className="z-10 w-full mt-10 flex flex-col items-center relative animate-in fade-in slide-in-from-top-4 duration-1000">
        <h1 className="text-4xl md:text-5xl font-serif-display text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 tracking-[0.4em] uppercase drop-shadow-2xl text-center leading-normal ml-2">
          SkyStory
        </h1>
        
        <p className="mt-4 text-white/40 font-serif-text italic text-[10px] tracking-[0.2em] uppercase">
             — {t.subtitle} —
        </p>
      </div>


      {/* --- Main Cards Section --- */}
      <div className="z-10 w-full max-w-sm flex-1 flex flex-col justify-center gap-6 py-4">
        
        {/* Cloud Card - Harmonious Design */}
        <button 
          onClick={() => onSelectMode(SkyMode.CLOUD)}
          className="group relative w-full h-36 rounded-2xl overflow-hidden transition-all duration-700 hover:scale-[1.01] active:scale-[0.99]"
        >
          {/* Base: Deep Glass */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-md border border-white/5 group-hover:border-cyan-200/20 transition-colors duration-500"></div>
          
          {/* Subtle Internal Gradient (Light Leak effect) */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
          
          {/* Content */}
          <div className="relative z-10 w-full h-full flex items-center justify-between px-8">
             <div className="flex flex-col items-start gap-1">
                <span className="text-[9px] font-mono uppercase tracking-widest text-cyan-200/50 mb-1 group-hover:text-cyan-200 transition-colors">Daylight Mode</span>
                <span className="text-2xl font-serif-display text-white/90 tracking-[0.15em] uppercase group-hover:text-white transition-colors">{t.cloudStory}</span>
                <span className="w-8 h-[1px] bg-white/10 mt-2 group-hover:w-16 group-hover:bg-cyan-200/50 transition-all duration-700"></span>
             </div>
             
             {/* Icon as a watermark */}
             <Cloud size={64} strokeWidth={0.5} className="text-white/5 absolute right-4 -bottom-4 group-hover:text-cyan-200/10 group-hover:-translate-y-2 transition-all duration-700" />
          </div>
        </button>

        {/* Star Card - Harmonious Design */}
        <button 
          onClick={() => onSelectMode(SkyMode.STAR)}
          className="group relative w-full h-36 rounded-2xl overflow-hidden transition-all duration-700 hover:scale-[1.01] active:scale-[0.99]"
        >
          {/* Base: Deep Glass */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-md border border-white/5 group-hover:border-purple-200/20 transition-colors duration-500"></div>
          
           {/* Subtle Internal Gradient (Light Leak effect) */}
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

          <div className="relative z-10 w-full h-full flex items-center justify-between px-8">
             <div className="flex flex-col items-start gap-1">
                <span className="text-[9px] font-mono uppercase tracking-widest text-purple-200/50 mb-1 group-hover:text-purple-200 transition-colors">Midnight Mode</span>
                <span className="text-2xl font-serif-display text-white/90 tracking-[0.15em] uppercase group-hover:text-white transition-colors">{t.starStory}</span>
                <span className="w-8 h-[1px] bg-white/10 mt-2 group-hover:w-16 group-hover:bg-purple-200/50 transition-all duration-700"></span>
             </div>
             
              {/* Icon as a watermark */}
             <Sparkles size={64} strokeWidth={0.5} className="text-white/5 absolute right-4 -bottom-4 group-hover:text-purple-200/10 group-hover:-translate-y-2 transition-all duration-700" />
          </div>
        </button>

      </div>


      {/* --- Footer Area: Floating Dock & Contact --- */}
      <div className="z-20 mb-2 flex flex-col items-center gap-5 animate-in slide-in-from-bottom-4 duration-1000 delay-200">
        
        {/* Floating Dock (The Island) */}
        <div className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#111]/80 backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)]">
            
            <button 
                onClick={onOpenJournal}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all group relative"
            >
                <BookOpen size={18} strokeWidth={1.5} />
                <span className="absolute -top-8 text-[9px] bg-white/10 text-white px-2 py-0.5 rounded backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Journal</span>
            </button>

            <div className="w-[1px] h-4 bg-white/10"></div>

             {/* Philosophy Button */}
             <button 
                onClick={() => setShowPhilosophy(true)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all group relative"
            >
                <Feather size={18} strokeWidth={1.5} />
                <span className="absolute -top-8 text-[9px] bg-white/10 text-white px-2 py-0.5 rounded backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Letter</span>
            </button>

            <div className="w-[1px] h-4 bg-white/10"></div>

            <button 
                onClick={onOpenSettings}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all group relative"
            >
                <Settings size={18} strokeWidth={1.5} />
                <span className="absolute -top-8 text-[9px] bg-white/10 text-white px-2 py-0.5 rounded backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Settings</span>
            </button>

            {/* Install Button - Only appears if PWA is installable */}
            {installPrompt && (
              <>
                 <div className="w-[1px] h-4 bg-white/10"></div>
                 <button 
                    onClick={handleInstall}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white transition-all group relative animate-pulse"
                >
                    <Download size={18} strokeWidth={1.5} />
                    <span className="absolute -top-8 text-[9px] bg-white/10 text-white px-2 py-0.5 rounded backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">{t.install}</span>
                </button>
              </>
            )}
        </div>

        {/* Contact Info - Visible, Elegant */}
        <span className="font-serif-text italic text-[10px] tracking-[0.15em] text-white/30 hover:text-white/60 transition-colors cursor-default select-none">
            {t.philosophy.contact}
        </span>
      </div>
      
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>

      {/* --- Philosophy Letter Modal --- */}
      {showPhilosophy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500">
           <div className="relative w-full max-w-sm max-h-[80vh] flex flex-col items-center text-center">
              
              <button 
                onClick={() => setShowPhilosophy(false)}
                className="absolute -top-12 p-2 text-white/50 hover:text-white transition-colors"
              >
                <X size={24} strokeWidth={1} />
              </button>

              <div className="overflow-y-auto no-scrollbar py-4 px-2 space-y-8">
                  <Feather size={24} className="mx-auto text-white/30 mb-8" strokeWidth={1} />
                  
                  <h2 className="text-xl font-serif-display text-white tracking-[0.2em] uppercase">
                    {t.philosophy.title}
                  </h2>
                  
                  <div className="w-8 h-[1px] bg-white/20 mx-auto"></div>
                  
                  <p className="font-serif-text text-sm leading-8 text-white/80 whitespace-pre-wrap">
                    {t.philosophy.content}
                  </p>
                  
                  <div className="pt-8 opacity-40 flex flex-col gap-2">
                    <span className="font-handwriting text-xl">SkyStory Team</span>
                  </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default HomeView;
