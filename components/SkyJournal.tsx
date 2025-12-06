
import React, { useState, useRef } from 'react';
import { JournalEntry, AppLanguage } from '../types';
import { X, Aperture, AlertCircle, Loader2, Trash2, AlertTriangle, Palette, Image as ImageIcon } from 'lucide-react';
import { UI_TEXT } from '../constants';

interface SkyJournalProps {
  entries: JournalEntry[];
  onClose: () => void;
  onSelectEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string) => void;
  appLang: AppLanguage;
}

// Sub-component for individual journal items to manage swipe state efficiently
const JournalItem: React.FC<{
    entry: JournalEntry;
    isPaletteMode: boolean;
    onSelect: (entry: JournalEntry) => void;
    onDelete: (id: string) => void;
    t: any;
}> = ({ entry, isPaletteMode, onSelect, onDelete, t }) => {
    
    // Local flip state that overrides global mode if user interacts
    const [localFlip, setLocalFlip] = useState<boolean | null>(null);
    const isFlipped = localFlip !== null ? localFlip : isPaletteMode;

    // Gesture State
    const touchStartRef = useRef<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartRef.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartRef.current === null) return;
        const diffX = touchStartRef.current - e.changedTouches[0].clientX;
        const SWIPE_THRESHOLD = 30;

        // Horizontal Swipe detection
        if (Math.abs(diffX) > SWIPE_THRESHOLD) {
             // Toggle flip state
             setLocalFlip(!isFlipped);
        }
        touchStartRef.current = null;
    };

    return (
        <div 
            className="break-inside-avoid perspective-1000 relative group mb-4"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <div className={`relative transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-n180' : ''}`}>
            
                {/* --- FRONT FACE --- */}
                <div 
                    onClick={() => entry.status === 'completed' && onSelect(entry)}
                    className={`backface-hidden bg-white p-2 pb-4 shadow-xl rounded-[2px] relative overflow-hidden ${entry.status === 'completed' ? 'cursor-pointer' : 'opacity-80'}`}
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
                            onDelete(entry.id);
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

                {/* --- BACK FACE (PALETTE - REFINED) --- */}
                <div 
                    onClick={() => setLocalFlip(!isFlipped)}
                    className="absolute inset-0 backface-hidden rotate-y-n180 bg-white shadow-xl rounded-[2px] overflow-hidden cursor-pointer flex flex-col justify-between p-4"
                    style={{
                            background: entry.dominantColors 
                            ? `linear-gradient(to bottom, ${entry.dominantColors[0]}, ${entry.dominantColors[1]}, ${entry.dominantColors[2]})`
                            : '#333'
                    }}
                >   
                     {/* Empty space */}
                     <div className="flex-1"></div>

                     <div className="flex justify-between items-end">
                        {/* Hex Codes */}
                        <div className="flex flex-col gap-0.5">
                             {entry.dominantColors?.map((c, i) => (
                                 <span key={i} className="font-sans font-[200] text-[8px] text-white/95 uppercase tracking-[0.25em] drop-shadow-sm">{c}</span>
                             ))}
                        </div>

                        {/* Date/Logo */}
                        <div className="flex flex-col items-end text-right">
                             <span className="font-serif-text italic font-light text-[8px] text-white/80 tracking-widest drop-shadow-sm">
                                 {new Date(Number(entry.id)).toLocaleDateString().replace(/\//g, '.')}
                             </span>
                             <span className="font-serif-display text-[10px] text-white tracking-[0.15em] drop-shadow-sm mt-0.5">SkyStory</span>
                        </div>
                     </div>
                     
                     <div className="absolute inset-0 border border-white/10 pointer-events-none"></div>
                </div>

            </div>
        </div>
    );
};

const SkyJournal: React.FC<SkyJournalProps> = ({ entries, onClose, onSelectEntry, onDeleteEntry, appLang }) => {
  const t = UI_TEXT[appLang];
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Global View Mode
  const [isPaletteMode, setIsPaletteMode] = useState(false);

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
        
        <div className="flex items-center gap-4">
            {/* View Toggle */}
            <button 
                onClick={() => setIsPaletteMode(!isPaletteMode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isPaletteMode ? 'bg-white text-black border-white' : 'bg-transparent text-white/60 border-white/20 hover:border-white/50'}`}
            >
                {isPaletteMode ? <ImageIcon size={14} /> : <Palette size={14} />}
                <span className="text-[10px] uppercase tracking-wider font-bold">
                    {isPaletteMode ? (appLang === 'CN' ? '照片' : 'Photo') : (appLang === 'CN' ? '色卡' : 'Palette')}
                </span>
            </button>

            <button 
              onClick={onClose}
              className="p-2 text-white/60 hover:text-white transition"
            >
              <X size={24} />
            </button>
        </div>
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
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
            {entries.map((entry) => (
                <JournalItem 
                    key={entry.id}
                    entry={entry}
                    isPaletteMode={isPaletteMode}
                    onSelect={onSelectEntry}
                    onDelete={setDeleteConfirmId}
                    t={t}
                />
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
