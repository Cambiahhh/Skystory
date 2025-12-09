
import React, { useState, useEffect } from 'react';
import HomeView from './components/HomeView';
import CameraView from './components/CameraView';
import ResultCard from './components/ResultCard';
import SkyJournal from './components/SkyJournal';
import SettingsView from './components/SettingsView';
import TutorialOverlay from './components/TutorialOverlay';
import WelcomeScreen from './components/WelcomeScreen';
import NetworkErrorModal from './components/NetworkErrorModal'; // New Import
import { analyzeSkyImage } from './services/geminiService';
import { AppView, SkyAnalysisResult, TargetLanguage, JournalEntry, SkyMode, AppSettings, FilterType, AppLanguage, NetworkRegion } from './types';
import { DEFAULT_SETTINGS, UI_TEXT } from './constants';
import { Bell } from 'lucide-react';

export const App: React.FC = () => {
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

  // Onboarding State
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Network Error State
  const [showNetworkError, setShowNetworkError] = useState(false);
  const [failedImageContext, setFailedImageContext] = useState<{base64: string, id: string} | null>(null);

  // Init
  useEffect(() => {
    // 1. Load Journal
    const savedJournal = localStorage.getItem('skystory_journal');
    if (savedJournal) {
      try {
        setJournal(JSON.parse(savedJournal));
      } catch (e) { console.error("Failed to load journal", e); }
    }

    // 2. Load Settings with Migration
    const savedSettings = localStorage.getItem('skystory_settings');
    const hasOnboarded = localStorage.getItem('skystory_onboarded');

    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        // Migration: Map defaultFilmStock to cardLanguage if it exists and cardLanguage doesn't
        // Migration: Ensure region exists
        const merged: AppSettings = {
            ...DEFAULT_SETTINGS,
            ...parsed,
            cardLanguage: parsed.cardLanguage || parsed.defaultFilmStock || DEFAULT_SETTINGS.cardLanguage,
            region: parsed.region || DEFAULT_SETTINGS.region
        };
        setSettings(merged);
      } catch (e) { console.error("Failed to load settings", e); }
    } else {
        // First time load, or settings cleared -> Show Welcome
        setShowWelcome(true);
    }

    // 3. Tutorial Logic
    if (savedSettings && !hasOnboarded) {
        setShowTutorial(true);
    }
  }, []);

  const handleWelcomeComplete = (lang: AppLanguage, region: NetworkRegion) => {
      // Save initial choices
      const newSettings = { ...settings, appLanguage: lang, region: region };
      setSettings(newSettings);
      localStorage.setItem('skystory_settings', JSON.stringify(newSettings));
      
      setShowWelcome(false);
      setShowTutorial(true);
  };

  const handleTutorialClose = () => {
      setShowTutorial(false);
      localStorage.setItem('skystory_onboarded', 'true');
      localStorage.setItem('skystory_tutorial_seen', 'true'); // legacy support
  };

  const handleOpenTutorial = () => {
      setShowTutorial(true);
  };

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

  const handleBackToJournal = () => {
    setCurrentView(AppView.JOURNAL);
  };

  const handleToggleRegion = () => {
      const newRegion = settings.region === NetworkRegion.GLOBAL ? NetworkRegion.CN : NetworkRegion.GLOBAL;
      updateSettings({ ...settings, region: newRegion });
  };

  // Re-usable Analysis Function to support Retry
  const runAnalysis = async (base64Data: string, entryId: string, currentSettings: AppSettings) => {
      try {
        const result = await analyzeSkyImage(base64Data, currentSettings.cardLanguage, mode, currentSettings.region);
        
        // Success: Update Entry
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
        console.error("Analysis failed", error);
        
        // Remove pending entry on failure logic OR keep it as 'failed' status (user preference often calls for cleanup or retry)
        // Here we'll clean up for now, but save context for retry modal
        setJournal(prev => prev.filter(e => e.id !== entryId));

        setFailedImageContext({ base64: base64Data, id: entryId });
        setShowNetworkError(true);
      } 
  };

  // Analysis Logic (Async)
  const handleImageSelected = async (file: File) => {
    setFlash(true);
    setTimeout(() => setFlash(false), 300);
    
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
      setTimeout(() => setShowNotification(false), 5000); 

      // 3. Run Analysis
      await runAnalysis(base64Data, entryId, settings);
    };
  };

  // Error Modal Handlers
  const handleNetworkSwitch = () => {
      // 1. Switch Settings
      const newSettings = { ...settings, region: NetworkRegion.CN };
      updateSettings(newSettings);
      setShowNetworkError(false);
      
      // 2. Retry immediately if context exists
      if (failedImageContext) {
          // Re-create the pending entry first
          const imageUrl = `data:image/jpeg;base64,${failedImageContext.base64}`;
          const pendingEntry: JournalEntry = {
            id: failedImageContext.id,
            status: 'pending',
            imageUrl: imageUrl,
            timestamp: Date.now(),
            type: 'unknown',
            filter: FilterType.NATURAL
          };
          setJournal(prev => [pendingEntry, ...prev]);
          
          runAnalysis(failedImageContext.base64, failedImageContext.id, newSettings);
      }
  };

  const handleNetworkRetry = () => {
      setShowNetworkError(false);
      if (failedImageContext) {
          // Re-create pending
          const imageUrl = `data:image/jpeg;base64,${failedImageContext.base64}`;
          const pendingEntry: JournalEntry = {
            id: failedImageContext.id,
            status: 'pending',
            imageUrl: imageUrl,
            timestamp: Date.now(),
            type: 'unknown',
            filter: FilterType.NATURAL
          };
          setJournal(prev => [pendingEntry, ...prev]);

          runAnalysis(failedImageContext.base64, failedImageContext.id, settings);
      }
  };

  const handleNetworkCancel = () => {
      setShowNetworkError(false);
      setFailedImageContext(null);
  };

  // Reprint Logic
  const handleReprint = async (newLang: TargetLanguage) => {
    if (!currentResult || !currentResult.imageUrl) return;
    setReprinting(true);
    const targetTimestamp = currentResult.timestamp;
    
    // Mark Journal Entry as Reprinting
    setJournal(prev => prev.map(entry => 
        entry.timestamp === targetTimestamp ? { ...entry, status: 'reprinting' } as JournalEntry : entry
    ));

    const base64Data = currentResult.imageUrl.split(',')[1];

    try {
        await new Promise(r => setTimeout(r, 600));
        const newResult = await analyzeSkyImage(base64Data, newLang, mode, settings.region);
        
        const updatedResult = { ...newResult, timestamp: currentResult.timestamp, imageUrl: currentResult.imageUrl };
        
        setCurrentResult(updatedResult);
        setJournal(prev => {
          const updated = prev.map(entry => {
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
        // Show Network Error Modal for reprint failures too, but we need to handle context slightly differently
        // For simplicity in this prompt update, we alert, or we could wire up the modal. 
        // Given user request was mainly about initial capture flow:
        if (settings.region === NetworkRegion.GLOBAL) {
             // We can reuse the modal logic here if we wanted, but let's keep it simple for reprint to avoid state complexity hell
             alert(UI_TEXT[settings.appLanguage].hazyError); 
        } else {
             alert(settings.appLanguage === 'CN' ? '显影失败，请检查网络连接' : 'Developing failed. Check connection.');
        }
        setJournal(prev => prev.map(e => e.timestamp === targetTimestamp ? { ...e, status: 'completed' } as JournalEntry : e));
    } finally {
        setReprinting(false);
    }
  };

  // Delete Logic
  const handleDeleteEntry = (id: string) => {
    setJournal(prev => {
      const updated = prev.filter(entry => entry.id !== id);
      localStorage.setItem('skystory_journal', JSON.stringify(updated));
      return updated;
    });
  };
  
  // Reorder Logic
  const handleReorderEntries = (newEntries: JournalEntry[]) => {
      setJournal(newEntries);
      localStorage.setItem('skystory_journal', JSON.stringify(newEntries));
  };

  return (
    <div className="h-full w-full relative bg-black font-sans">
      
      {/* Flash Layer */}
      <div className={`absolute inset-0 z-[60] bg-white pointer-events-none transition-opacity duration-300 ${flash ? 'opacity-100' : 'opacity-0'}`}></div>

      {/* Network Error Modal */}
      {showNetworkError && (
          <NetworkErrorModal 
              lang={settings.appLanguage}
              isGlobalMode={settings.region === NetworkRegion.GLOBAL}
              onSwitch={handleNetworkSwitch}
              onRetry={handleNetworkRetry}
              onClose={handleNetworkCancel}
          />
      )}

      {/* Welcome Screen (First Launch) */}
      {showWelcome && (
          <WelcomeScreen onComplete={handleWelcomeComplete} />
      )}

      {/* Tutorial Overlay */}
      {showTutorial && !showWelcome && (
          <TutorialOverlay onClose={handleTutorialClose} lang={settings.appLanguage} />
      )}

      {/* View Routing */}
      {currentView === AppView.HOME && (
        <HomeView 
          onSelectMode={handleSelectMode}
          onOpenJournal={() => setCurrentView(AppView.JOURNAL)}
          onOpenSettings={() => setCurrentView(AppView.SETTINGS)}
          onOpenTutorial={handleOpenTutorial}
          lang={settings.appLanguage}
        />
      )}

      {currentView === AppView.CAMERA && (
        <CameraView 
          onImageSelected={handleImageSelected} 
          onBack={handleBackToHome}
          mode={mode} // Pass the mode here
        />
      )}

      {currentView === AppView.RESULT && currentResult && (
        <ResultCard 
          data={currentResult}
          entries={journal}
          onNavigate={(entry) => setCurrentResult(entry as SkyAnalysisResult)}
          onClose={handleBackToJournal} 
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
          onReorderEntries={handleReorderEntries}
          appLang={settings.appLanguage}
          currentRegion={settings.region}
          onToggleRegion={handleToggleRegion}
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
