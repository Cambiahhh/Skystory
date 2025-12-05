import React from 'react';
import { Cloud, Star, BookOpen, Settings } from 'lucide-react';
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

  return (
    <div className="h-full w-full bg-slate-950 relative overflow-hidden flex flex-col items-center justify-between py-12 animate-in fade-in duration-700">
      
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[60%] bg-gradient-to-b from-blue-900/20 to-transparent rounded-full blur-[120px] pointer-events-none"></div>
      
      {/* Header */}
      <div className="z-10 text-center space-y-2">
        <h1 className="text-4xl md:text-5xl font-serif-display text-white tracking-[0.4em] uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
          SkyStory
        </h1>
        <p className="text-white/40 font-serif-text italic text-xs tracking-widest">
          {t.subtitle}
        </p>
      </div>

      {/* Main Actions */}
      <div className="flex flex-col gap-6 z-10 w-full max-w-xs px-6">
        
        {/* Cloud Story Button */}
        <button 
          onClick={() => onSelectMode(SkyMode.CLOUD)}
          className="group relative w-full h-32 rounded-xl overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-400/10 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 backdrop-blur-sm group-hover:bg-black/30 transition-colors">
            <Cloud size={32} className="text-blue-200/80 group-hover:scale-110 transition-transform duration-500" strokeWidth={1} />
            <span className="font-serif-display text-lg tracking-widest text-white/90">{t.cloudStory}</span>
          </div>
        </button>

        {/* Star Story Button */}
        <button 
          onClick={() => onSelectMode(SkyMode.STAR)}
          className="group relative w-full h-32 rounded-xl overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/20 to-purple-900/20 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 backdrop-blur-sm group-hover:bg-black/30 transition-colors">
            <Star size={32} className="text-purple-200/80 group-hover:scale-110 transition-transform duration-500" strokeWidth={1} />
            <span className="font-serif-display text-lg tracking-widest text-white/90">{t.starStory}</span>
          </div>
        </button>

      </div>

      {/* Footer Navigation */}
      <div className="z-10 flex gap-12 text-white/50">
        <button 
            onClick={onOpenJournal}
            className="flex flex-col items-center gap-1 hover:text-white transition-colors group"
        >
            <div className="p-3 rounded-full border border-white/10 group-hover:bg-white/5 transition-all">
                <BookOpen size={20} strokeWidth={1.5} />
            </div>
            <span className="text-[10px] tracking-widest uppercase mt-1">{t.journal}</span>
        </button>

        <button 
            onClick={onOpenSettings}
            className="flex flex-col items-center gap-1 hover:text-white transition-colors group"
        >
            <div className="p-3 rounded-full border border-white/10 group-hover:bg-white/5 transition-all">
                <Settings size={20} strokeWidth={1.5} />
            </div>
            <span className="text-[10px] tracking-widest uppercase mt-1">{t.settings}</span>
        </button>
      </div>

    </div>
  );
};

export default HomeView;