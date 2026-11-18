import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  FileSearch,
  Globe,
  History,
  LayoutDashboard,
  Menu,
  Settings as SettingsIcon,
  ShieldCheck,
  X,
} from 'lucide-react';
import type {
  AnalysisResult,
  AppSettings,
  DemoScenario,
  LanguagePreference,
} from './types/analysis';
import {
  clearStoredHistory,
  loadHistory,
  loadSettings,
  saveHistory,
  saveSettings,
} from './utils/storage';
import { OverviewView } from './components/OverviewView';
import { AnalyzeOfferView } from './components/AnalyzeOfferView';
import { VerificationIntelView } from './components/VerificationIntelView';
import { HistoryView } from './components/HistoryView';
import { LearnScamsView } from './components/LearnScamsView';
import { SettingsView } from './components/SettingsView';

type NavSection =
  | 'overview'
  | 'analyze'
  | 'verification'
  | 'history'
  | 'learn'
  | 'settings';

const NAV_ITEMS: Array<{
  id: NavSection;
  label: string;
  Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
}> = [
  { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
  { id: 'analyze', label: 'Analyze Offer', Icon: FileSearch },
  { id: 'verification', label: 'Verification Intelligence', Icon: Globe },
  { id: 'history', label: 'Analysis History', Icon: History },
  { id: 'learn', label: 'Learn About Scams', Icon: BookOpen },
  { id: 'settings', label: 'Settings', Icon: SettingsIcon },
];

export default function App() {
  const [activeNav, setActiveNav] = useState<NavSection>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [history, setHistory] = useState<AnalysisResult[]>(() =>
    loadSettings().optInLocalHistory ? loadHistory() : []
  );
  const [sessionCompleted, setSessionCompleted] = useState<AnalysisResult[]>([]);

  const [activeResult, setActiveResult] = useState<AnalysisResult | null>(null);
  const [prefillScenario, setPrefillScenario] = useState<DemoScenario | null>(null);
  const [executionMode, setExecutionMode] = useState<'live' | 'offline'>('live');
  const [geminiConfigured, setGeminiConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [activeNav, activeResult?.id]);

  useEffect(() => {
    let mounted = true;
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (mounted) {
          setGeminiConfigured(Boolean(data?.geminiConfigured));
        }
      })
      .catch(() => {
        if (mounted) {
          setGeminiConfigured(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Merged unique list of completed/saved analyses for Overview & History
  const allKnownAnalyses = React.useMemo(() => {
    const map = new Map<string, AnalysisResult>();
    for (const item of sessionCompleted) map.set(item.id, item);
    for (const item of history) map.set(item.id, item);
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [sessionCompleted, history]);

  const handleUpdateSettings = (next: AppSettings) => {
    setSettings(next);
    saveSettings(next);
    if (next.optInLocalHistory && sessionCompleted.length > 0) {
      // Persist current session analyses if user opts in
      const merged = [...sessionCompleted, ...history].reduce<AnalysisResult[]>(
        (acc, item) => {
          if (!acc.some((x) => x.id === item.id)) acc.push(item);
          return acc;
        },
        []
      );
      setHistory(merged);
      saveHistory(merged);
    }
  };

  const handleLanguageChange = (lang: LanguagePreference) => {
    handleUpdateSettings({ ...settings, language: lang });
  };

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setActiveResult(result);
    setSessionCompleted((prev) => [result, ...prev.filter((x) => x.id !== result.id)]);

    if (settings.optInLocalHistory) {
      // Never persist raw document text automatically if it came from an uploaded file
      const sanitizedForStorage: AnalysisResult =
        result.inputMode === 'image' || result.inputMode === 'pdf'
          ? {
              ...result,
              sourceText: undefined,
              extractedText: undefined,
            }
          : result;
      setHistory((prev) => {
        const next = [
          sanitizedForStorage,
          ...prev.filter((x) => x.id !== sanitizedForStorage.id),
        ];
        saveHistory(next);
        return next;
      });
    }
  };

  const handleSaveToHistory = (result: AnalysisResult) => {
    setHistory((prev) => {
      if (prev.some((x) => x.id === result.id)) return prev;
      const next = [result, ...prev];
      if (settings.optInLocalHistory) {
        saveHistory(next);
      }
      return next;
    });
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => {
      const next = prev.filter((x) => x.id !== id);
      if (settings.optInLocalHistory) saveHistory(next);
      return next;
    });
    setSessionCompleted((prev) => prev.filter((x) => x.id !== id));
    if (activeResult?.id === id) {
      setActiveResult(null);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    setSessionCompleted([]);
    clearStoredHistory();
  };

  const handleRunDemoScenario = (scenario: DemoScenario, mode: 'offline' | 'live') => {
    setPrefillScenario(scenario);
    setExecutionMode(mode);
    if (mode === 'offline') {
      const presetCopy: AnalysisResult = {
        ...scenario.offlinePreset,
        id: `offline-${scenario.id}-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      handleAnalysisComplete(presetCopy);
    } else {
      setActiveResult(null);
    }
    setActiveNav('analyze');
  };

  const handleOpenAnalysis = (item: AnalysisResult) => {
    setActiveResult(item);
    setActiveNav('analyze');
  };

  const navigateTo = (section: NavSection) => {
    setActiveNav(section);
    setMobileMenuOpen(false);
  };

  const currentNavLabel =
    NAV_ITEMS.find((n) => n.id === activeNav)?.label ?? 'Overview';

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside
        aria-label="Primary navigation"
        className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-[#0B1221] border-r border-slate-800/80 no-print"
      >
        <div className="h-16 px-5 flex items-center gap-2.5 border-b border-slate-800/80">
          <ShieldCheck className="w-6 h-6 text-cyan-400 shrink-0" aria-hidden="true" />
          <span className="font-display font-bold text-base tracking-tight text-slate-50 whitespace-nowrap">
            TrustCheck AI
          </span>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const active = activeNav === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => navigateTo(id)}
                aria-current={active ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left whitespace-nowrap ${
                  active
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden={true} />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
          <div className="font-medium text-slate-300">Verify Before You Trust</div>
          <div>Automated risk intelligence. Always verify independently.</div>
        </div>
      </aside>

      {/* Mobile Top Header (compact, <= 15% mobile height) */}
      <header className="lg:hidden sticky top-0 z-30 h-14 px-4 bg-[#0B1221]/95 backdrop-blur border-b border-slate-800 flex items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" aria-hidden="true" />
          <span className="font-display font-bold text-sm text-slate-50 whitespace-nowrap">
            TrustCheck AI
          </span>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="p-2 rounded-lg text-slate-200 hover:bg-slate-800 transition-colors"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Menu className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-14 z-40 bg-[#070B14]/95 backdrop-blur-sm p-4 space-y-1.5 no-print">
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const active = activeNav === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => navigateTo(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left ${
                  active
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden={true} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Desktop Top Contextual Bar (3-zone contract) */}
        <div className="hidden lg:flex h-16 px-8 border-b border-slate-800/80 items-center justify-between gap-8 bg-[#070B14]/90 no-print">
          <div className="text-sm font-medium text-slate-300 whitespace-nowrap">
            TrustCheck AI / <span className="text-slate-100">{currentNavLabel}</span>
          </div>

          {activeNav !== 'analyze' ? (
            <button
              type="button"
              onClick={() => {
                setActiveResult(null);
                navigateTo('analyze');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
            >
              <FileSearch className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Analyze an Offer</span>
            </button>
          ) : (
            <div className="text-xs text-slate-400 whitespace-nowrap shrink-0">
              {activeResult
                ? activeResult.isOfflineDemo
                  ? 'Viewing Offline Demo Result'
                  : 'Viewing Live Gemini Assessment'
                : 'Select input mode or load a scenario'}
            </div>
          )}
        </div>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-6xl w-full mx-auto">
          {activeNav === 'overview' && (
            <OverviewView
              completedAnalyses={allKnownAnalyses}
              settings={settings}
              geminiConfigured={geminiConfigured}
              onStartAnalyze={() => {
                setActiveResult(null);
                navigateTo('analyze');
              }}
              onRunDemoScenario={handleRunDemoScenario}
              onOpenAnalysis={handleOpenAnalysis}
              onNavigateLearn={() => navigateTo('learn')}
            />
          )}

          {activeNav === 'analyze' && (
            <AnalyzeOfferView
              settings={settings}
              geminiConfigured={geminiConfigured}
              activeResult={activeResult}
              prefillScenario={prefillScenario}
              executionMode={executionMode}
              onExecutionModeChange={setExecutionMode}
              onLanguageChange={handleLanguageChange}
              onAnalysisComplete={handleAnalysisComplete}
              onClearResult={() => setActiveResult(null)}
              isSavedInHistory={(id) => history.some((h) => h.id === id)}
              onSaveToHistory={handleSaveToHistory}
            />
          )}

          {activeNav === 'verification' && <VerificationIntelView />}

          {activeNav === 'history' && (
            <HistoryView
              history={allKnownAnalyses}
              optInLocalHistory={settings.optInLocalHistory}
              onToggleOptIn={(val) =>
                handleUpdateSettings({ ...settings, optInLocalHistory: val })
              }
              onOpenAnalysis={handleOpenAnalysis}
              onDeleteItem={handleDeleteHistoryItem}
              onClearAll={handleClearHistory}
            />
          )}

          {activeNav === 'learn' && <LearnScamsView />}

          {activeNav === 'settings' && (
            <SettingsView
              settings={settings}
              geminiConfigured={geminiConfigured}
              historyCount={allKnownAnalyses.length}
              onUpdateSettings={handleUpdateSettings}
              onClearHistory={handleClearHistory}
            />
          )}
        </main>
      </div>
    </div>
  );
}
