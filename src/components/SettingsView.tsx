import React from 'react';
import { Globe, Languages, Lock, ShieldCheck, Trash2 } from 'lucide-react';
import type { AppSettings, LanguagePreference } from '../types/analysis';

interface SettingsViewProps {
  settings: AppSettings;
  geminiConfigured: boolean | null;
  historyCount: number;
  onUpdateSettings: (next: AppSettings) => void;
  onClearHistory: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  geminiConfigured,
  historyCount,
  onUpdateSettings,
  onClearHistory,
}) => {
  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-bold text-slate-100">Settings & Privacy</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure explanation language, verification behavior, and local storage
          preferences.
        </p>
      </header>

      {/* Language & Accessibility */}
      <section className="rounded-xl bg-[#0F172A]/85 border border-slate-800 p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <Languages className="w-4 h-4 text-cyan-400" aria-hidden="true" />
          <span>Multilingual AI Assistance</span>
        </h2>

        <div className="space-y-2">
          <label
            htmlFor="settings-language"
            className="text-xs font-medium text-slate-300 block"
          >
            Preferred Explanation Language
          </label>
          <select
            id="settings-language"
            value={settings.language}
            onChange={(e) =>
              onUpdateSettings({
                ...settings,
                language: e.target.value as LanguagePreference,
              })
            }
            className="w-full sm:w-72 rounded-lg bg-[#070B14] border border-slate-700 px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
          >
            <option value="en">English</option>
            <option value="ur">Urdu (اردو)</option>
            <option value="roman_ur">Roman Urdu</option>
          </select>
          <p className="text-xs text-slate-400">
            Evidence quotes always remain in their original wording. Language selection
            never changes underlying risk scores.
          </p>
        </div>

        <label className="flex items-start gap-3 pt-2 border-t border-slate-800 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.explainSimplyByDefault}
            onChange={(e) =>
              onUpdateSettings({
                ...settings,
                explainSimplyByDefault: e.target.checked,
              })
            }
            className="mt-0.5 rounded border-slate-700 bg-[#070B14] text-cyan-500 focus:ring-cyan-500"
          />
          <span className="text-xs space-y-0.5">
            <span className="font-semibold text-slate-200 block">
              Enable “Explain Simply” by default
            </span>
            <span className="text-slate-400 block">
              Presents technical cybersecurity findings in everyday non-technical language.
            </span>
          </span>
        </label>
      </section>

      {/* Verification & Grounding */}
      <section className="rounded-xl bg-[#0F172A]/85 border border-slate-800 p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" aria-hidden="true" />
          <span>External Source Verification</span>
        </h2>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enableSearchGrounding}
            onChange={(e) =>
              onUpdateSettings({
                ...settings,
                enableSearchGrounding: e.target.checked,
              })
            }
            className="mt-0.5 rounded border-slate-700 bg-[#070B14] text-cyan-500 focus:ring-cyan-500"
          />
          <span className="text-xs space-y-0.5">
            <span className="font-semibold text-slate-200 block">
              Enable Google Search Grounding for Live Analysis
            </span>
            <span className="text-slate-400 block">
              Cross-checks claimed organizations and opportunities against public web
              results and attaches real grounding source links.
            </span>
          </span>
        </label>

        <div className="p-3 rounded-lg bg-[#0B1221] border border-slate-800 text-xs flex items-center justify-between gap-3">
          <span className="text-slate-400">Server Gemini Integration</span>
          <span className="font-mono text-slate-200">
            {geminiConfigured === null
              ? 'Checking...'
              : geminiConfigured
              ? 'Configured via Server Secrets'
              : 'Not Configured (Offline Demo Available)'}
          </span>
        </div>
      </section>

      {/* Local Storage Privacy */}
      <section className="rounded-xl bg-[#0F172A]/85 border border-slate-800 p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <Lock className="w-4 h-4 text-cyan-400" aria-hidden="true" />
          <span>Data Privacy & Local History</span>
        </h2>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.optInLocalHistory}
            onChange={(e) =>
              onUpdateSettings({
                ...settings,
                optInLocalHistory: e.target.checked,
              })
            }
            className="mt-0.5 rounded border-slate-700 bg-[#070B14] text-cyan-500 focus:ring-cyan-500"
          />
          <span className="text-xs space-y-0.5">
            <span className="font-semibold text-slate-200 block">
              Automatically save completed assessments to browser local storage
            </span>
            <span className="text-slate-400 block">
              Stored browser data remains on this device until deleted. Keep this off on
              shared computers. Uploaded images and PDFs are never persisted automatically.
            </span>
          </span>
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            Currently stored/session records: {historyCount}
          </span>
          <button
            type="button"
            disabled={historyCount === 0}
            onClick={onClearHistory}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B1221] border border-red-500/30 hover:bg-red-500/10 text-xs font-medium text-red-300 transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Clear All Local History</span>
          </button>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="rounded-xl bg-[#0B1221] border border-slate-800 p-5 space-y-2 text-xs text-slate-400">
        <div className="flex items-center gap-2 font-semibold text-slate-200">
          <ShieldCheck className="w-4 h-4 text-cyan-400" aria-hidden="true" />
          <span>Safety Safeguards & Disclaimer</span>
        </div>
        <p className="leading-relaxed">
          TrustCheck AI treats all uploaded documents, text, and website snippets as
          untrusted data, strips executable HTML, blocks private-network URL lookups, and
          never exposes server API credentials to the browser.
        </p>
        <p className="leading-relaxed text-slate-300">
          TrustCheck AI provides automated, evidence-based risk assessments. It cannot
          guarantee whether an opportunity is genuine or fraudulent. Always independently
          verify important decisions.
        </p>
      </section>
    </div>
  );
};
