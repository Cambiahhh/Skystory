import React from 'react';
import { JournalEntry, AppLanguage } from '../types';
import { X, Aperture, AlertCircle } from 'lucide-react';
import { UI_TEXT } from '../constants';

interface SkyJournalProps {
  entries: JournalEntry[];
  onClose: () => void;
  onSelectEntry: (entry: JournalEntry) => void;
  appLang: AppLanguage;
}

const SkyJournal: React.FC<SkyJournalProps> = ({ entries, onClose, onSelectEntry, appLang }) => {
  const t = UI_TEXT[appLang];

  return (
    <div className="fixed inset-0 z-40 bg-[#0a0a0a] overflow-y-auto animate-in slide-in-from-bottom-10 duration-500">
      
      {/* Header */}
      <div className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md z-10 px-6 py-6 flex items-center justify-between border-b border-white/5">
        <h2 className="text-xl font-serif-display text-white tracking-widest uppercase">{t.journalTitle}</h2>
        <button 
          onClick={onClose}
          className="p-2 text-white/60 hover:text-white transition"
        >
          <X size={24} />
        </button>
      </div>

      {/* Info Warning */}
      <div className="px-6 pt-6 pb-2">
        <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-3 flex gap-3 items-start">
            <AlertCircle size={16} className="text-blue-400 mt-0.5 shrink-0" />
            <p className="text-[10px] text-blue-200/70 leading-relaxed">
                {t.journalWarning}
            </p>
        </div>
      </div>

      {/* Grid of "Photos" */}
      <div className="p-4 md:p-6 pb-20">
        {entries.length === 0 ? (
          <div className="h-[50vh] flex flex-col items-center justify-center text-white/20">
            <Aperture size={48} strokeWidth={1} className="mb-4 opacity-50" />
            <p className="font-serif-text italic text-sm">{t.emptyJournal}</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {entries.map((entry) => (
              <div 
                key={entry.id}
                onClick={() => onSelectEntry(entry)}
                className="break-inside-avoid bg-white p-2 pb-4 shadow-xl cursor-pointer hover:rotate-1 hover:scale-[1.02] transition-transform duration-300 rounded-[2px]"
              >
                <div className="aspect-square bg-gray-100 overflow-hidden mb-2 filter contrast-110 sepia-[0.1]">
                  {entry.imageUrl && (
                    <img 
                      src={entry.imageUrl} 
                      alt={entry.scientificName} 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="text-center px-1">
                    <p className="font-handwriting text-slate-800 text-sm leading-tight transform -rotate-1 truncate">
                        {entry.poeticExpression}
                    </p>
                    <div className="mt-2 flex justify-between items-center border-t border-slate-100 pt-1">
                        <span className="text-[7px] text-slate-400 font-mono uppercase tracking-wider">
                            {new Date(entry.timestamp).toLocaleDateString()}
                        </span>
                        <span className="text-[7px] text-slate-400 font-serif-text uppercase">
                           {entry.type}
                        </span>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SkyJournal;