import React, { useState, useEffect } from 'react';
import HomeView from './components/HomeView';
import CameraView from './components/CameraView';
import ResultCard from './components/ResultCard';
import SkyJournal from './components/SkyJournal';
import SettingsView from './components/SettingsView';
import { analyzeSkyImage } from './services/geminiService';
import { AppView, SkyAnalysisResult, TargetLanguage, JournalEntry, SkyMode, AppSettings } from './types';
import { MOCK_LOADING_PHRASES, DEFAULT_SETTINGS, UI_TEXT } from './constants';
import { Loader2, Bell } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [mode, setMode] = useState<SkyMode>(SkyMode.CLOUD);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  
  // Async Process State
  const [processingCount, setProcessingCount] = useState(0);
  const [latestResult, setLatestResult] = useState<SkyAnalysisResult | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  const [reprinting, setReprinting] = useState(false);
  const [flash, setFlash] = useState(false);
  const [loadingPhrase, setLoadingPhrase] = useState("");
  
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
    // Load settings
    const savedSettings = localStorage.getItem('skystory_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) { console.error("Failed to load settings", e); }
    }
  }, []);

  // Update loading phrase
  useEffect(() => {
    const phrases = MOCK_LOADING_PHRASES[settings.appLanguage];
    if (processingCount > 0) {
      // Rotate phrases
      const interval = setInterval(() => {
         const idx = Math.floor(Math.random() * phrases.length);
         setLoadingPhrase(phrases[idx]);
      }, 2000);
      setLoadingPhrase(phrases[0]);
      return () => clearInterval(interval);
    }
  }, [processingCount, settings.appLanguage]);

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
    
    // Increment processing count
    setProcessingCount(prev => prev + 1);
    
    // Don't block UI - user can continue using app
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1]; 

      try {
        const result = await analyzeSkyImage(base64Data, settings.defaultFilmStock, mode);
        
        // Add to journal immediately
        const newEntry: JournalEntry = { ...result, id: Date.now().toString() };
        
        setJournal(prev => {
          const updated = [newEntry, ...prev];
          localStorage.setItem('skystory_journal', JSON.stringify(updated));
          return updated;
        });

        // Notify
        setLatestResult(result);
        setShowNotification(true);

      } catch (error) {
        console.error(error);
        alert(UI_TEXT[settings.appLanguage].hazyError);
      } finally {
        setProcessingCount(prev => Math.max(0, prev - 1));
      }
    };
  };

  // Reprint Logic (Synchronous blocking mainly because it's an edit action)
  const handleReprint = async (newLang: TargetLanguage) => {
    if (!currentResult || !currentResult.imageUrl) return;
    
    setReprinting(true);
    const base64Data = currentResult.imageUrl.split(',')[1];

    try {
        const newResult = await analyzeSkyImage(base64Data, newLang, mode);
        
        const updatedResult = {
            ...newResult,
            timestamp: currentResult.timestamp,
            imageUrl: currentResult.imageUrl
        };
        
        setCurrentResult(updatedResult);
        
        // Update in Journal as well (Replace the entry or add new? Let's add new to preserve history)
        const newEntry: JournalEntry = { ...updatedResult, id: Date.now().toString() };
        setJournal(prev => {
          const updated = [newEntry, ...prev];
          localStorage.setItem('skystory_journal', JSON.stringify(updated));
          return updated;
        });

    } catch (error) {
        console.error("Reprint failed", error);
    } finally {
        setReprinting(false);
    }
  };

  const openLatestResult = () => {
    if (latestResult) {
      setCurrentResult(latestResult);
      setCurrentView(AppView.RESULT);
      setShowNotification(false);
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
        />
      )}

      {currentView === AppView.JOURNAL && (
        <SkyJournal 
          entries={journal} 
          onClose={handleBackToHome} 
          onSelectEntry={(entry) => {
            const { id, ...rest } = entry;
            setCurrentResult(rest);
            setCurrentView(AppView.RESULT);
          }}
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

      {/* Non-blocking Status Indicators */}
      <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none flex flex-col items-center pt-12">
        
        {/* Processing Toast */}
        {processingCount > 0 && (
          <div className="bg-black/80 backdrop-blur-md text-white/90 px-4 py-2 rounded-full border border-white/10 shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4">
             <Loader2 size={16} className="animate-spin text-blue-400" />
             <span className="text-xs font-serif-text tracking-wider">{loadingPhrase}</span>
          </div>
        )}

        {/* Success Notification (Clickable) */}
        {showNotification && processingCount === 0 && (
          <div className="mt-4 pointer-events-auto">
             <button 
                onClick={openLatestResult}
                className="bg-white/90 text-slate-900 px-5 py-3 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)] flex items-center gap-3 animate-bounce hover:scale-105 transition active:scale-95"
             >
                <div className="bg-blue-500 rounded-full p-1 text-white">
                    <Bell size={12} fill="currentColor" />
                </div>
                <span className="text-xs font-bold tracking-widest uppercase">
                    {settings.appLanguage === 'CN' ? '记忆显影完成' : 'Story Developed'}
                </span>
                <span className="text-[10px] opacity-60 ml-1">Tap to view</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowNotification(false); }}
                  className="ml-2 text-slate-400 hover:text-slate-900"
                >
                  <span className="sr-only">Dismiss</span>
                  &times;
                </button>
             </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default App;