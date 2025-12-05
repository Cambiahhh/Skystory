
import React, { useState } from 'react';
import { JournalEntry, AppLanguage } from '../types';
import { X, Aperture, AlertCircle, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { UI_TEXT } from '../constants';

interface SkyJournalProps {
  entries: JournalEntry[];
  onClose: () => void;
  onSelectEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string) => void;
  appLang: AppLanguage;
}

const SkyJournal: React.FC<SkyJournalProps> = ({ entries, onClose, onSelectEntry, onDeleteEntry, appLang }) => {
  const t = UI_TEXT[appLang];
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const confirmDelete = () => {
    if (deleteConfirmId) {
      onDeleteEntry(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#0a0a0a] overflow-y-auto animate-in slide-in-from-bottom-10 duration-500 font-sans">
      
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
            <p className="text-[10px] text-blue-200/70 leading-relaxed font-serif-text">
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
                onClick={() => entry.status === 'completed' && onSelectEntry(entry)}
                className={`break-inside-avoid bg-white p-2 pb-4 shadow-xl rounded-[2px] relative overflow-hidden transition-all duration-300 group ${entry.status === 'completed' ? 'cursor-pointer hover:rotate-1 hover:scale-[1.02]' : 'opacity-80'}`}
              >
                
                {/* Processing Overlay */}
                {entry.status === 'pending' && (
                  <div className="absolute inset-0 z-20 bg-black/10 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2">
                    <Loader2 size={20} className="text-slate-800 animate-spin" />
                    <span className="text-[9px] font-serif-display tracking-widest text-slate-800 uppercase bg-white/50 px-2 py-1 rounded-full">{t.developing}</span>
                  </div>
                )}
                
                {/* Delete Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setDeleteConfirmId(entry.id);
                    }}
                    className="absolute top-0 right-0 z-30 p-3 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                >
                    <div className="bg-black/50 hover:bg-red-500 text-white rounded-full p-1.5 backdrop-blur-sm shadow-sm">
                        <Trash2 size={12} />
                    </div>
                </button>

                <div className="aspect-square bg-gray-100 overflow-hidden mb-2 filter contrast-110 sepia-[0.1]">
                  {entry.imageUrl && (
                    <img 
                      src={entry.imageUrl} 
                      alt={entry.scientificName || "Sky"} 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="text-center px-1 min-h-[40px] flex flex-col justify-center">
                    {entry.status === 'completed' ? (
                      <>
                        <p className="font-handwriting text-slate-800 text-sm leading-tight transform -rotate-1 truncate">
                            {entry.poeticExpression}
                        </p>
                        <div className="mt-2 flex justify-between items-center border-t border-slate-100 pt-1">
                            <span className="text-[7px] text-slate-400 font-mono uppercase tracking-wider">
                                {new Date(Number(entry.id)).toLocaleDateString()}
                            </span>
                            <span className="text-[7px] text-slate-400 font-serif-text uppercase truncate max-w-[50px]">
                              {entry.type}
                            </span>
                        </div>
                      </>
                    ) : (
                      <div className="h-4 bg-slate-100 rounded animate-pulse w-2/3 mx-auto"></div>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-[#1a1a1a] border border-white/10 p-6 rounded-2xl w-full max-w-xs shadow-2xl transform scale-100 transition-all">
              <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 mb-2">
                      <AlertTriangle size={24} />
                  </div>
                  
                  <h3 className="text-white font-serif-display tracking-widest uppercase text-lg">
                      {appLang === 'CN' ? '确认删除?' : 'Delete Memory?'}
                  </h3>
                  
                  <p className="text-white/50 text-xs leading-relaxed">
                      {appLang === 'CN' 
                        ? '这张天空的记忆将被永久删除，无法找回。' 
                        : 'This sky memory will be permanently deleted. This action cannot be undone.'}
                  </p>

                  <div className="flex gap-3 w-full mt-2">
                      <button 
                        onClick={() => setDeleteConfirmId(null)}
                        className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold tracking-wider uppercase transition"
                      >
                          {appLang === 'CN' ? '取消' : 'Cancel'}
                      </button>
                      <button 
                        onClick={confirmDelete}
                        className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold tracking-wider uppercase transition shadow-lg shadow-red-500/20"
                      >
                          {appLang === 'CN' ? '删除' : 'Delete'}
                      </button>
                  </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default SkyJournal;
