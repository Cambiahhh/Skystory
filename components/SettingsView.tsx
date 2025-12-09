
import React from 'react';
import { X, Globe, Smartphone, Ratio, Wifi } from 'lucide-react';
import { AppSettings, TargetLanguage, AppLanguage, AspectRatio, NetworkRegion } from '../types';
import { LANGUAGES, UI_LANGUAGES, UI_TEXT } from '../constants';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onClose: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings, onClose }) => {
  
  const t = UI_TEXT[settings.appLanguage];

  const handleCardLanguageChange = (lang: TargetLanguage) => {
    onUpdateSettings({ ...settings, cardLanguage: lang });
  };

  const handleAppLangChange = (lang: AppLanguage) => {
    onUpdateSettings({ ...settings, appLanguage: lang });
  };

  const handleAspectRatioChange = (ratio: AspectRatio) => {
    onUpdateSettings({ ...settings, aspectRatio: ratio });
  };

  const handleRegionChange = (region: NetworkRegion) => {
      onUpdateSettings({ ...settings, region });
  };

  const aspectRatios: AspectRatio[] = ['1:1', '2:3', '3:4', '4:3', '3:2'];

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
      
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto no-scrollbar">
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/50 hover:text-white"
        >
            <X size={24} />
        </button>

        <h2 className="text-2xl font-serif-display text-white tracking-widest uppercase mb-8 text-center">
            {t.settings}
        </h2>

        {/* Network / Region Section */}
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 text-white/70">
                <Wifi size={16} />
                <span className="text-xs uppercase tracking-widest font-serif-text">{t.networkRegion}</span>
            </div>
            
            <div className="flex gap-2 p-1 bg-white/5 rounded-lg border border-white/10">
                <button
                    onClick={() => handleRegionChange(NetworkRegion.GLOBAL)}
                    className={`flex-1 px-4 py-3 rounded-md text-[10px] font-bold tracking-wider uppercase transition-all flex flex-col items-center gap-1 ${
                        settings.region === NetworkRegion.GLOBAL 
                        ? 'bg-blue-500/20 text-blue-100 shadow-sm border border-blue-500/30' 
                        : 'text-white/30 hover:text-white/60'
                    }`}
                >
                    <span>Global</span>
                    <span className="scale-75 opacity-70">(Gemini)</span>
                </button>
                <button
                    onClick={() => handleRegionChange(NetworkRegion.CN)}
                    className={`flex-1 px-4 py-3 rounded-md text-[10px] font-bold tracking-wider uppercase transition-all flex flex-col items-center gap-1 ${
                        settings.region === NetworkRegion.CN 
                        ? 'bg-red-500/20 text-red-100 shadow-sm border border-red-500/30' 
                        : 'text-white/30 hover:text-white/60'
                    }`}
                >
                    <span>China</span>
                    <span className="scale-75 opacity-70">(Zhipu)</span>
                </button>
            </div>
            <p className="mt-2 text-[9px] text-white/30 text-center font-serif-text">
                {settings.region === NetworkRegion.GLOBAL ? t.regionGlobal : t.regionCN}
            </p>
        </div>

        {/* App Language Section - Toggle Style */}
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 text-white/70">
                <Smartphone size={16} />
                <span className="text-xs uppercase tracking-widest font-serif-text">{t.appLang}</span>
            </div>
            
            <div className="flex gap-2 p-1 bg-white/5 rounded-lg border border-white/10">
                {UI_LANGUAGES.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => handleAppLangChange(lang.code)}
                        className={`flex-1 px-4 py-2 rounded-md text-xs font-bold tracking-wider uppercase transition-all ${
                            settings.appLanguage === lang.code 
                            ? 'bg-white/10 text-white shadow-sm' 
                            : 'text-white/30 hover:text-white/60'
                        }`}
                    >
                        {lang.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Default Photo Ratio Section - Horizontal Scroll */}
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 text-white/70">
                <Ratio size={16} />
                <span className="text-xs uppercase tracking-widest font-serif-text">
                  {settings.appLanguage === 'CN' ? '照片默认比例' : 'Default Photo Ratio'}
                </span>
            </div>
            
            <div className="w-full overflow-x-auto pb-2 no-scrollbar">
                <div className="flex gap-2 w-max px-1">
                    {aspectRatios.map((ratio) => (
                        <button
                            key={ratio}
                            onClick={() => handleAspectRatioChange(ratio)}
                            className={`px-4 py-2.5 rounded-lg border text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap ${
                                settings.aspectRatio === ratio 
                                ? 'border-white/60 bg-white/10 text-white' 
                                : 'border-white/10 bg-white/5 text-white/40 hover:border-white/20'
                            }`}
                        >
                            {t.aspectRatioOpts[ratio]}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Card Language Section - Horizontal Scroll (Slide to Select) */}
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 text-white/70">
                <Globe size={16} />
                <span className="text-xs uppercase tracking-widest font-serif-text">{t.cardLang}</span>
            </div>
            
            <div className="w-full overflow-x-auto pb-4 no-scrollbar">
                <div className="flex gap-3 w-max px-1">
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleCardLanguageChange(lang.code)}
                            className={`flex flex-col items-center justify-center min-w-[80px] px-3 py-3 rounded-xl border transition-all ${
                                settings.cardLanguage === lang.code 
                                ? 'border-white/60 bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                                : 'border-white/5 bg-white/5 text-white/40 hover:border-white/20 hover:text-white/70'
                            }`}
                        >
                            <span className="font-serif-display text-lg mb-1">{lang.flag}</span>
                            <span className="text-[9px] uppercase tracking-wider whitespace-nowrap">
                                {lang.label.replace('Film: ', '')}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
             <p className="text-[10px] text-white/30 font-mono">
                 SkyStory v1.3.1 &middot; {settings.region === NetworkRegion.GLOBAL ? 'Gemini' : 'Zhipu'}
             </p>
        </div>

      </div>
    </div>
  );
};

export default SettingsView;
