
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { JournalEntry, AppLanguage } from '../types';
import { X, Aperture, AlertCircle, Loader2, Trash2, AlertTriangle, Palette, Image as ImageIcon, Filter } from 'lucide-react';
import { UI_TEXT } from '../constants';

interface SkyJournalProps {
  entries: JournalEntry[];
  onClose: () => void;
  onSelectEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string) => void;
  onReorderEntries: (newEntries: JournalEntry[]) => void;
  appLang: AppLanguage;
}

// --- Color Helper Logic ---

type ColorCategory = 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'purple' | 'white' | 'gray' | 'black';

const COLOR_FILTERS: { id: ColorCategory; hex: string; label: string }[] = [
    { id: 'red', hex: '#ef4444', label: 'Red' },
    { id: 'orange', hex: '#f97316', label: 'Orange' },
    { id: 'yellow', hex: '#eab308', label: 'Yellow' },
    { id: 'green', hex: '#22c55e', label: 'Green' },
    { id: 'cyan', hex: '#06b6d4', label: 'Cyan' },
    { id: 'blue', hex: '#3b82f6', label: 'Blue' },
    { id: 'purple', hex: '#a855f7', label: 'Purple' },
    { id: 'white', hex: '#f8fafc', label: 'White' },
    { id: 'gray', hex: '#94a3b8', label: 'Gray' },
    { id: 'black', hex: '#1e293b', label: 'Black' },
];

// Convert Hex to HSL to categorize colors
const hexToHsl = (hex: string) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt("0x" + hex[1] + hex[1]);
        g = parseInt("0x" + hex[2] + hex[2]);
        b = parseInt("0x" + hex[3] + hex[3]);
    } else if (hex.length === 7) {
        r = parseInt("0x" + hex[1] + hex[2]);
        g = parseInt("0x" + hex[3] + hex[4]);
        b = parseInt("0x" + hex[5] + hex[6]);
    }
    r /= 255; g /= 255; b /= 255;
    const cmin = Math.min(r, g, b), cmax = Math.max(r, g, b), delta = cmax - cmin;
    let h = 0, s = 0, l = 0;

    if (delta === 0) h = 0;
    else if (cmax === r) h = ((g - b) / delta) % 6;
    else if (cmax === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;

    h = Math.round(h * 60);
    if (h < 0) h += 360;
    l = (cmax + cmin) / 2;
    s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return { h, s, l };
};

const getColorCategory = (hex: string): ColorCategory => {
    const { h, s, l } = hexToHsl(hex);

    // Achromatic Check
    if (l < 20) return 'black';
    if (l > 85) return 'white';
    if (s < 15) return 'gray';

    // Hue Check
    if (h >= 345 || h < 15) return 'red';
    if (h >= 15 && h < 45) return 'orange';
    if (h >= 45 && h < 75) return 'yellow';
    if (h >= 75 && h < 155) return 'green';
    if (h >= 155 && h < 195) return 'cyan';
    if (h >= 195 && h < 265) return 'blue';
    if (h >= 265 && h < 345) return 'purple';
    
    return 'gray'; // Fallback
};

// Check if an entry matches the selected filter
const matchesFilter = (entry: JournalEntry, filter: ColorCategory | null): boolean => {
    if (!filter) return true;
    if (!entry.dominantColors) return false;
    
    // If any of the 3 dominant colors matches the category
    return entry.dominantColors.some(hex => getColorCategory(hex) === filter);
};

// --- End Color Helper Logic ---

// Sub-component for individual journal items
const JournalItem: React.FC<{
    entry: JournalEntry;
    index: number;
    isPaletteMode: boolean;
    isFalling: boolean;
    onSelect: (entry: JournalEntry) => void;
    onDelete: (id: string) => void;
    onDragStart: (e: React.DragEvent, index: number) => void;
    onDragOver: (e: React.DragEvent, index: number) => void;
    onDrop: (e: React.DragEvent, index: number) => void;
    t: any;
}> = ({ entry, index, isPaletteMode, isFalling, onSelect, onDelete, onDragStart, onDragOver, onDrop, t }) => {
    
    // Rotation State (Degrees)
    const [rotation, setRotation] = useState(0);
    const [isHandleHovered, setIsHandleHovered] = useState(false);
    
    // Generate a unique, deterministic random seed for this entry based on its ID
    const tapeVisuals = useMemo(() => {
        const seed = entry.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const pseudoRandom = (offset: number) => {
            const x = Math.sin(seed + offset) * 10000;
            return x - Math.floor(x);
        };

        // Generate jagged polygon path for realistic torn tape
        let poly = "polygon(";
        
        // Top Edge (Straight-ish but imperfect)
        for (let i = 0; i <= 10; i++) {
            const x = i * 10;
            const y = 0 + (pseudoRandom(i) * 5); // 0% to 5% variation
            poly += `${x}% ${y}%, `;
        }
        
        // Right Edge (Jagged)
        for (let i = 0; i <= 5; i++) {
            const y = i * 20; 
            const x = 100 - (pseudoRandom(i + 10) * 8); // 92% to 100%
            poly += `${x}% ${y}%, `;
        }

        // Bottom Edge (Straight-ish)
        for (let i = 10; i >= 0; i--) {
            const x = i * 10;
            const y = 100 - (pseudoRandom(i + 20) * 5); // 95% to 100%
            poly += `${x}% ${y}%, `;
        }

        // Left Edge (Jagged)
        for (let i = 5; i >= 0; i--) {
            const y = i * 20;
            const x = 0 + (pseudoRandom(i + 30) * 8); // 0% to 8%
            poly += `${x}% ${y}%${i === 0 ? '' : ', '}`;
        }
        
        poly += ")";

        // Random rotation for the placement (-1.5deg to 1.5deg) - subtle natural tilt
        const tilt = (pseudoRandom(100) * 3) - 1.5; 

        return { clipPath: poly, transform: `translateX(-50%) rotate(${tilt}deg)` };
    }, [entry.id]);

    // Sync with global mode
    useEffect(() => {
        if (isPaletteMode) {
            // Default to 'Back' view. We use +180 (CW) as standard flip.
            setRotation(180);
        } else {
            setRotation(0);
        }
    }, [isPaletteMode]);

    // Physics constants for falling animation
    const fallRotation = useRef(Math.random() * 60 - 30); 
    const fallX = useRef((Math.random() - 0.5) * 160);

    // Gesture State
    const touchStartRef = useRef<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartRef.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartRef.current === null) return;
        
        const startX = touchStartRef.current;
        const endX = e.changedTouches[0].clientX;
        const diffX = endX - startX; 
        const SWIPE_THRESHOLD = 40; 

        if (Math.abs(diffX) > SWIPE_THRESHOLD) {
             if (diffX > 0) {
                 // Left -> Right Swipe (L->R): CW (+)
                 setRotation(r => r + 180);
             } else {
                 // Right -> Left Swipe (R->L): CCW (-)
                 setRotation(r => r - 180);
             }
        }
        touchStartRef.current = null;
    };

    // Only allow drag if starting from the tape handle
    const handleDragStartInternal = (e: React.DragEvent) => {
        if (!isHandleHovered) {
            e.preventDefault();
            return;
        }
        onDragStart(e, index);
    };

    const toggleFlip = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Tap to flip: Default to CW (+)
        setRotation(r => r + 180);
    };

    return (
        <div 
            draggable={!isFalling} 
            onDragStart={handleDragStartInternal}
            onDragOver={(e) => onDragOver(e, index)}
            onDrop={(e) => onDrop(e, index)}
            className={`relative group h-fit transition-all duration-300 ${isFalling ? 'z-50' : 'z-auto'}`}
            style={{
                 transition: 'transform 0.6s ease-in, opacity 0.6s ease-in', 
                 transform: isFalling 
                    ? `translate(${fallX.current}px, 100vh) rotate(${fallRotation.current}deg)` 
                    : 'translate(0, 0) rotate(0deg)',
                 opacity: isFalling ? 0 : 1,
                 pointerEvents: isFalling ? 'none' : 'auto',
                 cursor: isHandleHovered ? 'grab' : 'default'
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <div 
                className="relative transition-transform duration-700 transform-style-3d"
                style={{ transform: `rotateY(${rotation}deg)` }}
            >
                {/* --- FRONT FACE --- */}
                <div 
                    onClick={() => entry.status === 'completed' && onSelect(entry)}
                    className={`backface-hidden bg-white p-2 pb-4 shadow-xl rounded-[2px] relative overflow-visible ${entry.status === 'completed' ? 'cursor-pointer' : 'opacity-80'}`}
                >
                    {/* Processing Overlay */}
                    {entry.status === 'pending' && (
                        <div className="absolute inset-0 z-20 bg-black/10 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2 rounded-[2px]">
                            <Loader2 size={20} className="text-slate-800 animate-spin" />
                            <span className="text-[9px] font-serif-display tracking-widest text-slate-800 uppercase bg-white/50 px-2 py-1 rounded-full">{t.developing}</span>
                        </div>
                    )}
                    
                    {/* --- Controls Layer --- */}
                    {!isFalling && (
                        <>
                            {/* Realistic Washi Tape Handle - UPDATED: w-6 (was w-24) */}
                            <div 
                                onMouseEnter={() => setIsHandleHovered(true)}
                                onMouseLeave={() => setIsHandleHovered(false)}
                                onTouchStart={() => setIsHandleHovered(true)}
                                onTouchEnd={() => setIsHandleHovered(false)}
                                className="absolute -top-4 left-1/2 z-40 w-6 h-8 flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-105 transition-transform origin-center"
                                style={{ transform: tapeVisuals.transform }}
                            >
                                <div 
                                    className="w-full h-full bg-white/30 backdrop-blur-md shadow-sm transition-opacity hover:bg-white/40"
                                    style={{ clipPath: tapeVisuals.clipPath }}
                                >
                                    {/* Subtle texture for tape */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50"></div>
                                </div>
                            </div>

                            {/* Delete Button (Top Right) */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    onDelete(entry.id);
                                }}
                                className="absolute -top-2 -right-2 z-30 p-2 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 outline-none"
                            >
                                <div className="bg-black/50 hover:bg-red-500 text-white rounded-full p-1.5 backdrop-blur-sm shadow-sm transition-colors transform scale-75">
                                    <Trash2 size={12} />
                                </div>
                            </button>
                        </>
                    )}

                    <div className="aspect-square bg-gray-100 overflow-hidden mb-2 filter contrast-110 sepia-[0.1]">
                        {entry.imageUrl && (
                            <img 
                            src={entry.imageUrl} 
                            alt={entry.scientificName || "Sky"} 
                            className="w-full h-full object-cover select-none pointer-events-none"
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

                {/* --- BACK FACE (PALETTE) --- */}
                <div 
                    onClick={toggleFlip}
                    className="absolute inset-0 backface-hidden rotate-y-180 bg-white shadow-xl rounded-[2px] overflow-hidden cursor-pointer flex flex-col justify-between p-4"
                    style={{
                            background: entry.dominantColors 
                            ? `linear-gradient(180deg, ${entry.dominantColors[0]} 0%, ${entry.dominantColors[1]} 40%, ${entry.dominantColors[2]} 100%)`
                            : '#333'
                    }}
                >   
                     <div className="flex-1"></div>
                     <div className="flex justify-between items-end">
                        <div className="flex flex-col gap-0.5">
                             {entry.dominantColors?.map((c, i) => (
                                 <span key={i} className="font-sans font-[200] text-[8px] text-white/95 uppercase tracking-[0.25em] drop-shadow-sm">{c}</span>
                             ))}
                        </div>
                        <div className="flex flex-col items-end text-right">
                             <span className="font-serif-text italic font-light text-[8px] text-white/80 tracking-widest drop-shadow-sm">
                                 {new Date(Number(entry.id)).toLocaleDateString().replace(/\//g, '.')}
                             </span>
                             <span className="font-serif-display text-[10px] text-white tracking-[0.15em] drop-shadow-sm mt-0.5">SkyStory</span>
                        </div>
                     </div>
                     {/* Overlay for softness */}
                     <div className="absolute inset-0 bg-white/5 mix-blend-soft-light pointer-events-none"></div>
                     <div className="absolute inset-0 border border-white/10 pointer-events-none"></div>
                </div>

            </div>
        </div>
    );
};

const SkyJournal: React.FC<SkyJournalProps> = ({ entries, onClose, onSelectEntry, onDeleteEntry, onReorderEntries, appLang }) => {
  const t = UI_TEXT[appLang];
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [fallingIds, setFallingIds] = useState<Set<string>>(new Set());
  const [isPaletteMode, setIsPaletteMode] = useState(false);
  
  // Filter State
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ColorCategory | null>(null);

  // Drag State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const confirmDelete = () => {
    if (deleteConfirmId) {
      setFallingIds(prev => new Set(prev).add(deleteConfirmId));
      const idToDelete = deleteConfirmId;
      setDeleteConfirmId(null);
      setTimeout(() => {
          onDeleteEntry(idToDelete);
          setFallingIds(prev => {
              const next = new Set(prev);
              next.delete(idToDelete);
              return next;
          });
      }, 600);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
      e.preventDefault(); 
      e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === dropIndex) return;

      const newEntries = [...entries];
      const [draggedItem] = newEntries.splice(draggedIndex, 1);
      newEntries.splice(dropIndex, 0, draggedItem);

      onReorderEntries(newEntries);
      setDraggedIndex(null);
  };

  // Filtered Entries Calculation
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => matchesFilter(entry, activeFilter));
  }, [entries, activeFilter]);

  return (
    <div className="fixed inset-0 z-40 bg-[#0a0a0a] overflow-y-auto overflow-x-hidden animate-in slide-in-from-bottom-10 duration-500 font-sans">
      
      {/* Header */}
      <div className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md z-40 flex flex-col border-b border-white/5 transition-all duration-300">
          <div className="px-6 py-6 flex items-center justify-between">
            <h2 className="text-xl font-serif-display text-white tracking-widest uppercase">{t.journalTitle}</h2>
            
            <div className="flex items-center gap-4">
                
                {/* Filter Toggle */}
                <button 
                    onClick={() => setShowFilter(!showFilter)}
                    className={`flex items-center justify-center w-8 h-8 rounded-full border transition-all ${
                        activeFilter || showFilter 
                        ? 'bg-white text-black border-white' 
                        : 'bg-transparent text-white/60 border-white/20 hover:border-white/50'
                    }`}
                >
                    <Filter size={14} fill={activeFilter ? "currentColor" : "none"} />
                </button>

                {/* Palette Toggle */}
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

          {/* Color Filter Drawer */}
          <div 
             className={`w-full overflow-hidden transition-all duration-500 ease-in-out ${showFilter ? 'max-h-24 opacity-100 border-t border-white/5' : 'max-h-0 opacity-0'}`}
          >
              <div className="px-6 py-4 flex gap-4 overflow-x-auto no-scrollbar items-center">
                  <span className="text-[10px] text-white/40 font-mono uppercase tracking-wider whitespace-nowrap">Filter:</span>
                  {COLOR_FILTERS.map(color => (
                      <button
                        key={color.id}
                        onClick={() => setActiveFilter(activeFilter === color.id ? null : color.id)}
                        className={`group relative flex flex-col items-center gap-1.5 min-w-[32px]`}
                      >
                         <div 
                            className={`w-6 h-6 rounded-full border transition-all duration-300 ${
                                activeFilter === color.id 
                                ? 'scale-110 border-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' 
                                : 'scale-100 border-transparent hover:scale-110 opacity-70 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: color.hex, borderColor: color.id === 'white' || color.id === 'black' ? '#ffffff30' : undefined }}
                         ></div>
                         {activeFilter === color.id && (
                             <span className="absolute -bottom-4 text-[8px] text-white/80 font-mono tracking-widest uppercase animate-in slide-in-from-top-1 fade-in">
                                 {appLang === 'CN' ? color.label[0] : color.label}
                             </span>
                         )}
                      </button>
                  ))}
                  {activeFilter && (
                      <button 
                        onClick={() => setActiveFilter(null)}
                        className="ml-2 px-3 py-1 text-[9px] border border-white/20 rounded-full text-white/50 hover:text-white hover:border-white transition-colors uppercase tracking-wider"
                      >
                          Clear
                      </button>
                  )}
              </div>
          </div>
      </div>

      {!showFilter && (
        <div className="px-6 pt-6 pb-2">
            <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-3 flex gap-3 items-start">
                <AlertCircle size={16} className="text-blue-400 mt-0.5 shrink-0" />
                <p className="text-[10px] text-blue-200/70 leading-relaxed font-serif-text">
                    {t.journalWarning}
                </p>
            </div>
        </div>
      )}

      <div className="p-4 md:p-6 pb-20 min-h-[60vh]">
        {entries.length === 0 ? (
          <div className="h-[50vh] flex flex-col items-center justify-center text-white/20">
            <Aperture size={48} strokeWidth={1} className="mb-4 opacity-50" />
            <p className="font-serif-text italic text-sm">{t.emptyJournal}</p>
          </div>
        ) : (
          <>
            {/* Filter Empty State */}
            {filteredEntries.length === 0 && activeFilter && (
                <div className="h-[30vh] flex flex-col items-center justify-center text-white/30 animate-in fade-in zoom-in-95 duration-300">
                    <Filter size={32} strokeWidth={1} className="mb-3 opacity-50" />
                    <p className="font-serif-text text-xs tracking-wider">No colors found matching <span style={{color: COLOR_FILTERS.find(c => c.id === activeFilter)?.hex}}>{activeFilter.toUpperCase()}</span></p>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 items-start">
                {filteredEntries.map((entry, index) => (
                    // We use key=entry.id to allow React to handle reordering/filtering naturally
                    <div key={entry.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
                        <JournalItem 
                            index={index}
                            entry={entry}
                            isPaletteMode={isPaletteMode}
                            isFalling={fallingIds.has(entry.id)}
                            onSelect={onSelectEntry}
                            onDelete={setDeleteConfirmId}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            t={t}
                        />
                    </div>
                ))}
            </div>
          </>
        )}
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
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
                        ? '这张天空的记忆将被永久删除...' 
                        : 'This memory will drift away forever.'}
                  </p>

                  <div className="flex gap-3 w-full mt-2">
                      <button 
                        onClick={() => setDeleteConfirmId(null)}
                        className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold tracking-wider uppercase transition"
                      >
                          {appLang === 'CN' ? '保留' : 'Keep'}
                      </button>
                      <button 
                        onClick={confirmDelete}
                        className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold tracking-wider uppercase transition shadow-lg shadow-red-500/20"
                      >
                          {appLang === 'CN' ? '丢弃' : 'Drop'}
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
