
import React, { useState, useEffect } from 'react';
import HomeView from './components/HomeView';
import CameraView from './components/CameraView';
import ResultCard from './components/ResultCard';
import SkyJournal from './components/SkyJournal';
import SettingsView from './components/SettingsView';
import TutorialOverlay from './components/TutorialOverlay';
import WelcomeScreen from './components/WelcomeScreen';
import NetworkErrorModal from './components/NetworkErrorModal'; 
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
  const [lastError, setLastError] = useState<string>(""); // Store the specific error message
  
  // We store the context needed to retry the failed operation
  const [retryContext, setRetryContext] = useState<{
      type: 'capture' | 'reprint',
      base64: string,
      id?: string, // for capture
      targetLang?: TargetLanguage // for reprint
  } | null>(null);

  // Init
  useEffect(() => {
    // 1. Load Journal
    const savedJournal = localStorage.getItem('skystory_journal');
    if (savedJournal) {
      try {
        setJournal(JSON.parse(savedJournal));
      } catch (e) { console.error("Failed to load journal", e); }
    }

    // 2. Load Settings
    const savedSettings = localStorage.getItem('skystory_settings');
    const hasOnboarded = localStorage.getItem('skystory_onboarded');

    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        const merged: AppSettings = {
            ...DEFAULT_SETTINGS,
            ...parsed,
            cardLanguage: parsed.cardLanguage || parsed.defaultFilmStock || DEFAULT_SETTINGS.cardLanguage,
            region: parsed.region || DEFAULT_SETTINGS.region
        };
        setSettings(merged);
      } catch (e) { console.error("Failed to load settings", e); }
    } else {
        setShowWelcome(true);
    }

    // 3. Tutorial Logic
    if (savedSettings && !hasOnboarded) {
        setShowTutorial(true);
    }
  }, []);

  const handleWelcomeComplete = (lang: AppLanguage, region: NetworkRegion) => {
      const newSettings = { ...settings, appLanguage: lang, region: region };
      setSettings(newSettings);
      localStorage.setItem('skystory_settings', JSON.stringify(newSettings));
      setShowWelcome(false);
      setShowTutorial(true);
  };

  const handleTutorialClose = () => {
      setShowTutorial(false);
      localStorage.setItem('skystory_onboarded', 'true');
      localStorage.setItem('skystory_tutorial_seen', 'true');
  };

  const handleOpenTutorial = () => {
      setShowTutorial(true);
  };

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('skystory_settings', JSON.stringify(newSettings));
  };

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

  // --- CORE ANALYSIS LOGIC ---

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

      } catch (error: any) {
        console.error("Capture Analysis failed", error);
        
        // Remove the pending entry so it doesn't get stuck
        setJournal(prev => prev.filter(e => e.id !== entryId));

        // Trigger Error Modal
        setLastError(error.message || "Unknown error");
        setRetryContext({ type: 'capture', base64: base64Data, id: entryId });
        setShowNetworkError(true);
      } 
  };

  const runReprint = async (base64Data: string, targetLang: TargetLanguage, currentSettings: AppSettings) => {
      if (!currentResult) return;
      const targetTimestamp = currentResult.timestamp;

      try {
        const newResult = await analyzeSkyImage(base64Data, targetLang, mode, currentSettings.region);
        
        const updatedResult = { ...newResult, timestamp: targetTimestamp, imageUrl: currentResult.imageUrl };
        
        setCurrentResult(updatedResult);
        setJournal(prev => {
          const updated = prev.map(entry => {
             if (entry.imageUrl === currentResult.imageUrl && entry.timestamp === targetTimestamp) {
                 return { ...entry, ...updatedResult, status: 'completed' } as JournalEntry;
             }
             return entry;
          });
          localStorage.setItem('skystory_journal', JSON.stringify(updated));
          return updated;
        });

      } catch (error: any) {
          console.error("Reprint failed", error);
          
          // Reset status to completed
          setJournal(prev => prev.map(e => e.timestamp === targetTimestamp ? { ...e, status: 'completed' } as JournalEntry : e));
          
          // Trigger Error Modal
          setLastError(error.message || "Unknown error");
          setRetryContext({ type: 'reprint', base64: base64Data, targetLang: targetLang });
          setShowNetworkError(true);
      } finally {
          setReprinting(false);
      }
  };

  // --- UI HANDLERS ---

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

      // 1. Create Pending Entry
      const pendingEntry: JournalEntry = {
          id: entryId,
          status: 'pending',
          imageUrl: imageUrl,
          timestamp: Date.now(),
          type: 'unknown',
          filter: FilterType.NATURAL 
      };

      setJournal(prev => {
          const updated = [pendingEntry, ...prev];
          localStorage.setItem('skystory_journal', JSON.stringify(updated));
          return updated;
      });

      // 2. Notification
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000); 

      // 3. Run Analysis
      await runAnalysis(base64Data, entryId, settings);
    };
  };

  const handleReprint = async (newLang: TargetLanguage) => {
    if (!currentResult || !currentResult.imageUrl) return;
    setReprinting(true);
    
    // Mark Journal Entry as Reprinting
    setJournal(prev => prev.map(entry => 
        entry.timestamp === currentResult.timestamp ? { ...entry, status: 'reprinting' } as JournalEntry : entry
    ));

    const base64Data = currentResult.imageUrl.split(',')[1];
    
    // Slight delay for UI feel
    await new Promise(r => setTimeout(r, 600));

    await runReprint(base64Data, newLang, settings);
  };

  // --- MODAL HANDLERS ---

  const handleNetworkSwitch = () => {
      const newSettings = { ...settings, region: NetworkRegion.CN };
      updateSettings(newSettings);
      setShowNetworkError(false);
      setLastError("");
      
      // Retry immediately with new settings
      if (retryContext) {
          if (retryContext.type === 'capture' && retryContext.id) {
              // Re-add pending entry visually
              const imageUrl = `data:image/jpeg;base64,${retryContext.base64}`;
              const pendingEntry: JournalEntry = {
                  id: retryContext.id,
                  status: 'pending',
                  imageUrl: imageUrl,
                  timestamp: Date.now(),
                  type: 'unknown',
                  filter: FilterType.NATURAL 
              };
              setJournal(prev => [pendingEntry, ...prev]);
              runAnalysis(retryContext.base64, retryContext.id, newSettings);
          } else if (retryContext.type === 'reprint' && retryContext.targetLang) {
              setReprinting(true);
              // Set journal status back to reprinting
              if (currentResult) {
                 setJournal(prev => prev.map(entry => 
                    entry.timestamp === currentResult.timestamp ? { ...entry, status: 'reprinting' } as JournalEntry : entry
                 ));
              }
              runReprint(retryContext.base64, retryContext.targetLang, newSettings);
          }
      }
  };

  const handleNetworkRetry = () => {
      setShowNetworkError(false);
      setLastError("");
      if (retryContext) {
          if (retryContext.type === 'capture' && retryContext.id) {
              const imageUrl = `data:image/jpeg;base64,${retryContext.base64}`;
              const pendingEntry: JournalEntry = {
                  id: retryContext.id,
                  status: 'pending',
                  imageUrl: imageUrl,
                  timestamp: Date.now(),
                  type: 'unknown',
                  filter: FilterType.NATURAL 
              };
              setJournal(prev => [pendingEntry, ...prev]);
              runAnalysis(retryContext.base64, retryContext.id, settings);
          } else if (retryContext.type === 'reprint' && retryContext.targetLang) {
              setReprinting(true);
               if (currentResult) {
                 setJournal(prev => prev.map(entry => 
                    entry.timestamp === currentResult.timestamp ? { ...entry, status: 'reprinting' } as JournalEntry : entry
                 ));
              }
              runReprint(retryContext.base64, retryContext.targetLang, settings);
          }
      }
  };

  const handleNetworkCancel = () => {
      setShowNetworkError(false);
      setLastError("");
      setRetryContext(null);
  };

  const handleDeleteEntry = (id: string) => {
    setJournal(prev => {
      const updated = prev.filter(entry => entry.id !== id);
      localStorage.setItem('skystory_journal', JSON.stringify(updated));
      return updated;
    });
  };
  
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
              errorMessage={lastError}
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
