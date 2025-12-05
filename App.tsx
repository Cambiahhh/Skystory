
import React, { useState, useEffect } from 'react';
import HomeView from './components/HomeView';
import CameraView from './components/CameraView';
import ResultCard from './components/ResultCard';
import SkyJournal from './components/SkyJournal';
import SettingsView from './components/SettingsView';
import { analyzeSkyImage } from './services/geminiService';
import { AppView, SkyAnalysisResult, TargetLanguage, JournalEntry, SkyMode, AppSettings, FilterType } from './types';
import { DEFAULT_SETTINGS, UI_TEXT } from './constants';
import { Bell } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [mode, setMode] = useState<SkyMode>(SkyMode.CLOUD);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  
  // Async Process State
  const [showNotification, setShowNotification] = useState(false);
  const [reprinting, setReprinting] = useState(false);
  const [flash, setFlash] = useState(false);
  
  const [currentResult, setCurrentResult] = useState<SkyAnalysisResult | null>(null);
  const [journal, setJournal] = useState<JournalEntry[]>([]);

  // Init
  useEffect(() => {
    // Load journal
    const savedJournal = localStorage.getItem('skystory_journal');
    if (savedJournal) {
      try {
        setJournal(JSON.parse(savedJournal));
      } catch (e) { console.error("Failed to load journal", e); }
    }
    // Load settings with migration
    const savedSettings = localStorage.getItem('skystory_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        // Migration: Map defaultFilmStock to cardLanguage if it exists and cardLanguage doesn't
        const merged: AppSettings = {
            ...DEFAULT_SETTINGS,
            ...parsed,
            cardLanguage: parsed.cardLanguage || parsed.defaultFilmStock || DEFAULT_SETTINGS.cardLanguage
        };
        setSettings(merged);
      } catch (e) { console.error("Failed to load settings", e); }
    }
  }, []);

  // Persist Settings
  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('skystory_settings', JSON.stringify(newSettings));
  };

  // Navigation Handlers
  const handleSelectMode = (selectedMode: SkyMode) => {
    setMode(selectedMode);
    setCurrentView(AppView.CAMERA);
  };

  const handleBackToHome = () => {
    setCurrentView(AppView.HOME);
  };

  // Analysis Logic (Async)
  const handleImageSelected = async (file: File) => {
    setFlash(true);
    setTimeout(() => setFlash(false), 300);
    
    // NOTE: We stay on the Camera View now. 
    // Navigation happens only if the user clicks the notification.
    
    const entryId = Date.now().toString();
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = async () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1]; 
      const imageUrl = `data:image/jpeg;base64,${base64Data}`;

      // 1. Create Pending Entry Immediately
      const pendingEntry: JournalEntry = {
          id: entryId,
          status: 'pending',
          imageUrl: imageUrl,
          timestamp: Date.now(),
          type: 'unknown',
          filter: FilterType.NATURAL // Default filter
      };

      setJournal(prev => {
          const updated = [pendingEntry, ...prev];
          localStorage.setItem('skystory_journal', JSON.stringify(updated));
          return updated;
      });

      // 2. Show "Captured" Notification once
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000); // Auto hide after 5s

      // 3. Process in background
      try {
        const result = await analyzeSkyImage(base64Data, settings.cardLanguage, mode);
        
        // 4. Update Entry to Completed
        setJournal(prev => {
          const updated = prev.map(entry => {
              if (entry.id === entryId) {
                  return { ...entry, ...result, status: 'completed' } as JournalEntry;
              }
              return entry;
          });
          localStorage.setItem('skystory_journal', JSON.stringify(updated));
          return updated;
        });

      } catch (error) {
        console.error(error);
        // Remove failed entry
        setJournal(prev => prev.filter(e => e.id !== entryId));
        alert(UI_TEXT[settings.appLanguage].hazyError);
      } 
    };
  };

  // Reprint Logic
  const handleReprint = async (newLang: TargetLanguage) => {
    if (!currentResult || !currentResult.imageUrl) return;
    
    setReprinting(true);
    const base64Data = currentResult.imageUrl.split(',')[1];

    try {
        // Force a small delay so user sees the loading state even if API is instant
        await new Promise(r => setTimeout(r, 600));

        const newResult = await analyzeSkyImage(base64Data, newLang, mode);
        
        const updatedResult = {
            ...newResult,
            timestamp: currentResult.timestamp,
            imageUrl: currentResult.imageUrl
        };
        
        // Update Current View
        setCurrentResult(updatedResult);
        
        // Update Journal Entry (Update the existing entry instead of creating new)
        setJournal(prev => {
          const updated = prev.map(entry => {
             // Basic matching by timestamp/image match since we don't have ID in result context easily
             if (entry.imageUrl === currentResult.imageUrl && entry.timestamp === currentResult.timestamp) {
                 return { ...entry, ...updatedResult, status: 'completed' } as JournalEntry;
             }
             return entry;
          });
          localStorage.setItem('skystory_journal', JSON.stringify(updated));
          return updated;
        });

    } catch (error) {
        console.error("Reprint failed", error);
        alert(settings.appLanguage === 'CN' ? '显影失败，请检查网络连接' : 'Developing failed. Check connection.');
    } finally {
        setReprinting(false);
    }
  };

  // Delete Logic
  const handleDeleteEntry = (id: string) => {
    if (confirm(settings.appLanguage === 'CN' ? '确定要删除这张记忆吗？' : 'Delete this memory?')) {
      setJournal(prev => {
        const updated = prev.filter(entry => entry.id !== id);
        localStorage.setItem('skystory_journal', JSON.stringify(updated));
        return updated;
      });
    }
  };

  return (
    <div className="h-full w-full relative bg-black font-sans">
      
      {/* Flash Layer */}
      <div className={`absolute inset-0 z-[60] bg-white pointer-events-none transition-opacity duration-300 ${flash ? 'opacity-100' : 'opacity-0'}`}></div>

      {/* View Routing */}
      {currentView === AppView.HOME && (
        <HomeView 
          onSelectMode={handleSelectMode}
          onOpenJournal={() => setCurrentView(AppView.JOURNAL)}
          onOpenSettings={() => setCurrentView(AppView.SETTINGS)}
          lang={settings.appLanguage}
        />
      )}

      {currentView === AppView.CAMERA && (
        <CameraView 
          onImageSelected={handleImageSelected} 
          onBack={handleBackToHome}
        />
      )}

      {currentView === AppView.RESULT && currentResult && (
        <ResultCard 
          data={currentResult} 
          onClose={handleBackToHome} 
          onReprint={handleReprint}
          isReprinting={reprinting}
          appLang={settings.appLanguage}
          settings={settings}
        />
      )}

      {currentView === AppView.JOURNAL && (
        <SkyJournal 
          entries={journal} 
          onClose={handleBackToHome} 
          onSelectEntry={(entry) => {
            const { id, status, filter, ...rest } = entry;
            if (rest.imageUrl && rest.poeticExpression) {
                setCurrentResult(rest as SkyAnalysisResult);
                setCurrentView(AppView.RESULT);
            }
          }}
          onDeleteEntry={handleDeleteEntry}
          appLang={settings.appLanguage}
        />
      )}

      {currentView === AppView.SETTINGS && (
        <SettingsView 
            settings={settings}
            onUpdateSettings={updateSettings}
            onClose={handleBackToHome}
        />
      )}

      {/* Captured Notification (Clickable to go to Journal) */}
      {showNotification && (
          <div className="fixed top-12 left-0 right-0 z-[70] flex justify-center animate-in slide-in-from-top-4">
             <button 
                onClick={() => { setShowNotification(false); setCurrentView(AppView.JOURNAL); }}
                className="bg-white/95 text-slate-900 px-5 py-3 rounded-full shadow-[0_0_25px_rgba(255,255,255,0.3)] flex items-center gap-4 hover:scale-105 transition active:scale-95 border border-white"
             >
                <div className="bg-slate-900 rounded-full p-1.5 text-white">
                    <Bell size={14} fill="currentColor" />
                </div>
                <div className="flex flex-col items-start">
                    <span className="text-[10px] font-bold tracking-[0.2em] uppercase leading-none mb-1">
                        {UI_TEXT[settings.appLanguage].capturedTitle}
                    </span>
                    <span className="text-[9px] opacity-60 font-serif-text leading-none">
                        {UI_TEXT[settings.appLanguage].capturedDesc}
                    </span>
                </div>
             </button>
          </div>
      )}

    </div>
  );
};

export default App;
