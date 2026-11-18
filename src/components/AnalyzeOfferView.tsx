import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  FileText,
  Globe,
  Image as ImageIcon,
  Languages,
  Loader2,
  MessageSquareText,
  Play,
  ShieldAlert,
  Sparkles,
  Upload,
  XCircle,
} from 'lucide-react';
import type {
  AnalysisResult,
  AppSettings,
  DemoScenario,
  InputMode,
  LanguagePreference,
} from '../types/analysis';
import { DEMO_SCENARIOS } from '../data/demoScenarios';
import {
  MAX_TEXT_LENGTH,
  validateTextInput,
  validateUploadedFileMeta,
  validateUrlInput,
} from '../utils/validation';
import { ResultsDashboard } from './ResultsDashboard';

interface AnalyzeOfferViewProps {
  settings: AppSettings;
  geminiConfigured: boolean | null;
  activeResult: AnalysisResult | null;
  prefillScenario: DemoScenario | null;
  executionMode: 'live' | 'offline';
  onExecutionModeChange: (mode: 'live' | 'offline') => void;
  onLanguageChange: (lang: LanguagePreference) => void;
  onAnalysisComplete: (result: AnalysisResult) => void;
  onClearResult: () => void;
  isSavedInHistory: (id: string) => boolean;
  onSaveToHistory: (result: AnalysisResult) => void;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = result.indexOf(',');
      resolve(commaIdx !== -1 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error('Could not read selected file.'));
    reader.readAsDataURL(file);
  });
}

export const AnalyzeOfferView: React.FC<AnalyzeOfferViewProps> = ({
  settings,
  geminiConfigured,
  activeResult,
  prefillScenario,
  executionMode,
  onExecutionModeChange,
  onLanguageChange,
  onAnalysisComplete,
  onClearResult,
  isSavedInHistory,
  onSaveToHistory,
}) => {
  const [inputMode, setInputMode] = useState<InputMode>(
    prefillScenario?.inputMode ?? 'text'
  );
  const [textInput, setTextInput] = useState(prefillScenario?.sampleText ?? '');
  const [urlInput, setUrlInput] = useState(prefillScenario?.sampleUrl ?? '');
  const [urlNotes, setUrlNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [fileNotes, setFileNotes] = useState('');
  const [selectedDemoId, setSelectedDemoId] = useState<string>(
    prefillScenario?.id ?? 'scenario-a'
  );
  const [searchGrounding, setSearchGrounding] = useState<boolean>(
    settings.enableSearchGrounding
  );
  const [isPending, setIsPending] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync prefill scenario when user navigates from Overview
  React.useEffect(() => {
    if (prefillScenario) {
      setInputMode(prefillScenario.inputMode);
      setTextInput(prefillScenario.sampleText);
      setSelectedDemoId(prefillScenario.id);
      setValidationError(null);
      setApiError(null);
    }
  }, [prefillScenario]);

  const handleLoadScenario = (sc: DemoScenario) => {
    setSelectedDemoId(sc.id);
    setInputMode(sc.inputMode);
    setTextInput(sc.sampleText);
    setValidationError(null);
    setApiError(null);
    onClearResult();
  };

  const handleRunOfflinePreset = (sc: DemoScenario) => {
    setValidationError(null);
    setApiError(null);
    onAnalysisComplete({
      ...sc.offlinePreset,
      id: `offline-${sc.id}-${Date.now()}`,
      createdAt: new Date().toISOString(),
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null);
    setApiError(null);
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setSelectedFile(null);
      setFilePreviewUrl(null);
      return;
    }

    const modeForCheck = inputMode === 'pdf' ? 'pdf' : 'image';
    const check = validateUploadedFileMeta({
      mode: modeForCheck,
      mimeType: file.type,
      sizeBytes: file.size,
      fileName: file.name,
    });

    if (!check.valid) {
      setValidationError(check.error || 'Invalid file.');
      setSelectedFile(null);
      setFilePreviewUrl(null);
      return;
    }

    setSelectedFile(file);
    if (modeForCheck === 'image') {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }
  };

  const handleCancelRequest = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsPending(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;

    setValidationError(null);
    setApiError(null);

    if (executionMode === 'offline') {
      const scenario =
        DEMO_SCENARIOS.find((s) => s.id === selectedDemoId) ?? DEMO_SCENARIOS[0];
      handleRunOfflinePreset(scenario);
      return;
    }

    // Live Gemini Analysis validation
    let fileBase64: string | undefined;
    let fileMimeType: string | undefined;
    let fileName: string | undefined;

    if (inputMode === 'text') {
      const check = validateTextInput(textInput);
      if (!check.valid) {
        setValidationError(check.error ?? 'Invalid message input.');
        return;
      }
    } else if (inputMode === 'url') {
      const check = validateUrlInput(urlInput);
      if (!check.valid) {
        setValidationError(check.error ?? 'Invalid URL input.');
        return;
      }
    } else {
      if (!selectedFile) {
        setValidationError(
          inputMode === 'image'
            ? 'Please upload a PNG, JPG, JPEG, or WEBP screenshot.'
            : 'Please upload a PDF document (.pdf).'
        );
        return;
      }
      const fileCheck = validateUploadedFileMeta({
        mode: inputMode,
        mimeType: selectedFile.type,
        sizeBytes: selectedFile.size,
        fileName: selectedFile.name,
      });
      if (!fileCheck.valid) {
        setValidationError(fileCheck.error ?? 'Invalid file.');
        return;
      }
      try {
        fileBase64 = await fileToBase64(selectedFile);
        fileMimeType =
          selectedFile.type ||
          (inputMode === 'pdf' ? 'application/pdf' : 'image/png');
        fileName = selectedFile.name;
      } catch {
        setValidationError('Could not read the selected file.');
        return;
      }
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsPending(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          inputMode,
          text:
            inputMode === 'text'
              ? textInput
              : inputMode === 'url'
              ? urlNotes
              : fileNotes,
          url: inputMode === 'url' ? urlInput : undefined,
          fileDataBase64: fileBase64,
          fileMimeType,
          fileName,
          language: settings.language,
          enableSearchGrounding: searchGrounding,
          explainSimply: settings.explainSimplyByDefault,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.result) {
        setApiError(
          payload.error ||
            'Live Gemini analysis failed. You can retry or switch to Offline Demo mode.'
        );
        return;
      }

      onAnalysisComplete(payload.result as AnalysisResult);
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        setApiError('Analysis cancelled by user.');
      } else {
        setApiError(
          'Unable to reach the TrustCheck analysis server. Check your connection or try Offline Demo mode.'
        );
      }
    } finally {
      abortRef.current = null;
      setIsPending(false);
    }
  };

  if (activeResult) {
    return (
      <ResultsDashboard
        analysis={activeResult}
        language={settings.language}
        defaultExplainSimply={settings.explainSimplyByDefault}
        isSavedInHistory={isSavedInHistory(activeResult.id)}
        onSaveToHistory={onSaveToHistory}
        onAnalyzeAnother={() => {
          onClearResult();
          setApiError(null);
          setValidationError(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Analyze Offer</h1>
          <p className="text-sm text-slate-400 mt-1">
            Submit a recruitment message, screenshot, PDF letter, or public URL for
            evidence-grounded risk evaluation.
          </p>
        </div>

        {/* Clearly Separated Live vs Offline Mode Selector */}
        <div
          className="inline-flex items-center p-1 rounded-xl bg-[#0B1221] border border-slate-800"
          role="group"
          aria-label="Analysis execution mode"
        >
          <button
            type="button"
            onClick={() => {
              onExecutionModeChange('live');
              setApiError(null);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 ${
              executionMode === 'live'
                ? 'bg-cyan-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Live Gemini Analysis</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onExecutionModeChange('offline');
              setApiError(null);
              setValidationError(null);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 ${
              executionMode === 'offline'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Offline Demo</span>
          </button>
        </div>
      </header>

      {executionMode === 'live' && geminiConfigured === false && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" aria-hidden="true" />
            <div>
              <span className="font-semibold block">
                Server Gemini API Key Not Detected
              </span>
              <span>
                Live Gemini requests require a configured GEMINI_API_KEY in AI Studio
                Settings &gt; Secrets. You can switch to Offline Demo to inspect the 5
                deterministic preset scenarios immediately.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onExecutionModeChange('offline')}
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-semibold whitespace-nowrap shrink-0"
          >
            Use Offline Demo
          </button>
        </div>
      )}

      {/* Demo Scenarios Quick Loader */}
      <section className="rounded-xl bg-[#0F172A]/80 border border-slate-800 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-200">
            Quick-Load Fictional Hackathon Demo Scenarios
          </span>
          <span className="text-[11px] text-slate-400">
            {executionMode === 'offline'
              ? 'Offline mode displays clearly labeled preset results without calling Gemini'
              : 'Clicking loads sample text into the live analyzer'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {DEMO_SCENARIOS.map((sc) => {
            const isSelected = selectedDemoId === sc.id;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => {
                  if (executionMode === 'offline') {
                    setSelectedDemoId(sc.id);
                    handleRunOfflinePreset(sc);
                  } else {
                    handleLoadScenario(sc);
                  }
                }}
                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors text-left ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200'
                    : 'bg-[#0B1221] border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="font-mono text-cyan-400 mr-1.5">{sc.code}:</span>
                <span>{sc.title}</span>
              </button>
            );
          })}
        </div>
      </section>

      {executionMode === 'offline' ? (
        <section className="rounded-xl bg-[#0F172A]/90 border border-amber-500/30 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Play className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-slate-100">
                Offline Demo Mode (Preset Results Only)
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Offline Demo uses deterministic pre-built outputs for Scenarios A–E and
                never pretends to connect to Gemini or live web search. Select any scenario
                above or click below to view the selected preset report.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#070B14] border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
            {(
              DEMO_SCENARIOS.find((s) => s.id === selectedDemoId) ??
              DEMO_SCENARIOS[0]
            ).sampleText}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                const sc =
                  DEMO_SCENARIOS.find((s) => s.id === selectedDemoId) ??
                  DEMO_SCENARIOS[0];
                handleRunOfflinePreset(sc);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-colors"
            >
              <Play className="w-4 h-4" aria-hidden="true" />
              <span>View Offline Demo Assessment</span>
            </button>
          </div>
        </section>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl bg-[#0F172A]/90 border border-slate-800 p-6 space-y-5"
        >
          {/* 4 Input Method Tabs */}
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 rounded-xl bg-[#070B14] border border-slate-800"
            role="tablist"
            aria-label="Offer input mode"
          >
            {(
              [
                { id: 'text', label: 'Paste Message', Icon: MessageSquareText },
                { id: 'image', label: 'Screenshot / Image', Icon: ImageIcon },
                { id: 'pdf', label: 'Upload PDF', Icon: FileText },
                { id: 'url', label: 'Website URL', Icon: Globe },
              ] as const
            ).map(({ id, label, Icon }) => {
              const active = inputMode === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setInputMode(id);
                    setValidationError(null);
                    setApiError(null);
                    setSelectedFile(null);
                    setFilePreviewUrl(null);
                  }}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#152038] text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Input Panel per Mode */}
          {inputMode === 'text' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="offer-text-input"
                  className="text-xs font-semibold text-slate-200"
                >
                  Paste Email, WhatsApp, LinkedIn, Telegram, SMS, or Scholarship Text
                </label>
                <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                  {textInput.length.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()}
                </span>
              </div>
              <textarea
                id="offer-text-input"
                rows={8}
                value={textInput}
                onChange={(e) => {
                  setTextInput(e.target.value);
                  setValidationError(null);
                }}
                placeholder="Paste the full job offer, scholarship notice, or recruiter message including sender email or links..."
                className="w-full rounded-xl bg-[#070B14] border border-slate-800 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed"
              />
            </div>
          )}

          {(inputMode === 'image' || inputMode === 'pdf') && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="offer-file-upload"
                  className="text-xs font-semibold text-slate-200 block"
                >
                  {inputMode === 'image'
                    ? 'Upload Screenshot or Photo (PNG, JPG, JPEG, WEBP — max 6 MB)'
                    : 'Upload Offer Letter or Document (PDF — max 10 MB)'}
                </label>

                <div className="rounded-xl border border-dashed border-slate-700 bg-[#070B14] p-6 text-center space-y-3">
                  <Upload className="w-7 h-7 text-cyan-400 mx-auto" aria-hidden="true" />
                  <div className="space-y-1">
                    <p className="text-xs text-slate-300">
                      {selectedFile
                        ? `Selected: ${selectedFile.name} (${(
                            selectedFile.size / 1024
                          ).toFixed(1)} KB)`
                        : inputMode === 'image'
                        ? 'Choose a screenshot of a WhatsApp chat, email, or social post'
                        : 'Choose a single or multi-page PDF offer letter or scholarship notice'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Files are analyzed in memory and never executed or permanently stored on the server.
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    id="offer-file-upload"
                    type="file"
                    accept={
                      inputMode === 'image'
                        ? 'image/png,image/jpeg,image/webp'
                        : 'application/pdf,.pdf'
                    }
                    onChange={handleFileChange}
                    className="block w-full max-w-xs mx-auto text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-500 file:text-slate-950 hover:file:bg-cyan-400 cursor-pointer"
                  />

                  {filePreviewUrl && (
                    <img
                      src={filePreviewUrl}
                      alt="Uploaded offer screenshot preview"
                      className="mt-3 max-h-48 mx-auto rounded-lg border border-slate-800 object-contain"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="file-extra-notes"
                  className="text-xs font-medium text-slate-300 block"
                >
                  Optional Context (e.g., how you received it or sender email)
                </label>
                <input
                  id="file-extra-notes"
                  type="text"
                  value={fileNotes}
                  onChange={(e) => setFileNotes(e.target.value)}
                  placeholder="Optional: Received via WhatsApp from an unknown number..."
                  className="w-full rounded-lg bg-[#070B14] border border-slate-800 px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          {inputMode === 'url' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="offer-url-input"
                  className="text-xs font-semibold text-slate-200 block"
                >
                  Public Opportunity or Organizational Website URL
                </label>
                <input
                  id="offer-url-input"
                  type="url"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    setValidationError(null);
                  }}
                  placeholder="https://example.org/careers/internship"
                  className="w-full rounded-lg bg-[#070B14] border border-slate-800 px-3.5 py-2.5 text-sm font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[11px] text-slate-400">
                  Evaluated safely via Gemini URL Context and structural domain heuristics. Private/local network addresses are blocked and executable downloads are never opened.
                </p>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="url-extra-notes"
                  className="text-xs font-medium text-slate-300 block"
                >
                  Optional Message Context Associated With This Link
                </label>
                <textarea
                  id="url-extra-notes"
                  rows={3}
                  value={urlNotes}
                  onChange={(e) => setUrlNotes(e.target.value)}
                  placeholder="Optional: Paste the message that sent you this link..."
                  className="w-full rounded-lg bg-[#070B14] border border-slate-800 px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          {/* Options Row: Language + Search Grounding + Privacy Reminder */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                <label htmlFor="analyze-lang-select" className="text-xs text-slate-300">
                  Explanation Language:
                </label>
                <select
                  id="analyze-lang-select"
                  value={settings.language}
                  onChange={(e) =>
                    onLanguageChange(e.target.value as LanguagePreference)
                  }
                  className="rounded-lg bg-[#070B14] border border-slate-700 px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="en">English</option>
                  <option value="ur">Urdu (اردو)</option>
                  <option value="roman_ur">Roman Urdu</option>
                </select>
              </div>

              <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={searchGrounding}
                  onChange={(e) => setSearchGrounding(e.target.checked)}
                  className="rounded border-slate-700 bg-[#070B14] text-cyan-500 focus:ring-cyan-500"
                />
                <span>Google Search Verification Grounding</span>
              </label>
            </div>

            <span className="text-[11px] text-slate-400">
              Tip: Redact passwords, national IDs, and bank numbers before uploading.
            </span>
          </div>

          {validationError && (
            <div
              role="alert"
              className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-400" aria-hidden="true" />
              <span>{validationError}</span>
            </div>
          )}

          {apiError && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-200 space-y-2.5"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" aria-hidden="true" />
                <span>{apiError}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onExecutionModeChange('offline')}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold transition-colors"
                >
                  Switch to Offline Demo
                </button>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-slate-400">
              TrustCheck AI provides evidence-based risk assessments and cannot guarantee
              legitimacy or fraud.
            </p>

            <div className="flex items-center gap-2.5">
              {isPending && (
                <button
                  type="button"
                  onClick={handleCancelRequest}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#0B1221] border border-slate-700 hover:border-red-500/50 text-xs font-medium text-slate-200 transition-colors"
                >
                  <XCircle className="w-4 h-4 text-red-400" aria-hidden="true" />
                  <span>Cancel</span>
                </button>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Analyzing with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" aria-hidden="true" />
                    <span>Analyze Offer</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {isPending && (
            <div
              className="rounded-xl bg-[#070B14] border border-slate-800 p-5 space-y-3"
              aria-live="polite"
            >
              <div className="flex items-center gap-2 text-xs text-cyan-300 font-medium">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>
                  Running server-side Gemini multimodal analysis
                  {searchGrounding ? ' and Google Search grounding...' : '...'}
                </span>
              </div>
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-slate-800/80 rounded w-1/3" />
                <div className="h-3 bg-slate-800/60 rounded w-5/6" />
                <div className="h-3 bg-slate-800/60 rounded w-2/3" />
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
};
