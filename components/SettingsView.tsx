import React from 'react';
import { X, Globe, Smartphone } from 'lucide-react';
import { AppSettings, TargetLanguage, AppLanguage } from '../types';
import { LANGUAGES, UI_LANGUAGES, UI_TEXT } from '../constants';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onClose: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings, onClose }) => {
  
  const t = UI_TEXT[settings.appLanguage];

  const handleFilmStockChange = (lang: TargetLanguage) => {
    onUpdateSettings({ ...settings, defaultFilmStock: lang });
  };

  const handleAppLangChange = (lang: AppLanguage) => {
    onUpdateSettings({ ...settings, appLanguage: lang });
  };

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

        {/* App Language Section */}
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 text-white/70">
                <Smartphone size={16} />
                <span className="text-xs uppercase tracking-widest font-serif-text">{t.appLang}</span>
            </div>
            
            <div className="flex gap-3">
                {UI_LANGUAGES.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => handleAppLangChange(lang.code)}
                        className={`flex-1 px-4 py-3 rounded-lg border text-sm transition-all text-center ${
                            settings.appLanguage === lang.code 
                            ? 'border-white/60 bg-white/10 text-white' 
                            : 'border-white/10 hover:border-white/30 text-white/40'
                        }`}
                    >
                        {lang.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Content Language Section */}
        <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 text-white/70">
                <Globe size={16} />
                <span className="text-xs uppercase tracking-widest font-serif-text">{t.filmStock}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                {LANGUAGES.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => handleFilmStockChange(lang.code)}
                        className={`px-4 py-3 rounded-lg border text-sm transition-all text-left ${
                            settings.defaultFilmStock === lang.code 
                            ? 'border-white/60 bg-white/10 text-white' 
                            : 'border-white/10 hover:border-white/30 text-white/40'
                        }`}
                    >
                        <span className="block font-serif-display text-xs mb-1">{lang.flag}</span>
                        {lang.label.replace('Film: ', '')}
                    </button>
                ))}
            </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
             <p className="text-[10px] text-white/30 font-mono">
                 SkyStory v1.1.0 &middot; Built with Gemini
             </p>
        </div>

      </div>
    </div>
  );
};

export default SettingsView;