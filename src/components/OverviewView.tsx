import React from 'react';
import {
  ArrowRight,
  BookOpen,
  FileSearch,
  Lock,
  Play,
  ShieldCheck,
} from 'lucide-react';
import type { AnalysisResult, AppSettings, DemoScenario } from '../types/analysis';
import { DEMO_SCENARIOS } from '../data/demoScenarios';
import { getRiskLevelLabel } from '../utils/scoring';

interface OverviewViewProps {
  completedAnalyses: AnalysisResult[];
  settings: AppSettings;
  geminiConfigured: boolean | null;
  onStartAnalyze: () => void;
  onRunDemoScenario: (scenario: DemoScenario, mode: 'offline' | 'live') => void;
  onOpenAnalysis: (item: AnalysisResult) => void;
  onNavigateLearn: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  completedAnalyses,
  settings,
  geminiConfigured,
  onStartAnalyze,
  onRunDemoScenario,
  onOpenAnalysis,
  onNavigateLearn,
}) => {
  const totalCount = completedAnalyses.length;
  const highOrElevatedCount = completedAnalyses.filter(
    (a) => a.riskLevel === 'high' || a.riskLevel === 'elevated'
  ).length;
  const cautionCount = completedAnalyses.filter(
    (a) => a.riskLevel === 'caution'
  ).length;
  const lowCount = completedAnalyses.filter((a) => a.riskLevel === 'low').length;
  const insufficientCount = completedAnalyses.filter(
    (a) => a.riskLevel === 'insufficient_evidence'
  ).length;

  // Aggregate common warning signs strictly from actual analyzed cases
  const warningFrequency = new Map<string, number>();
  for (const item of completedAnalyses) {
    for (const f of item.findings) {
      warningFrequency.set(f.type, (warningFrequency.get(f.type) ?? 0) + 1);
    }
  }
  const topWarnings = Array.from(warningFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const distributionBars = [
    { label: 'High / Elevated', count: highOrElevatedCount, color: 'bg-red-500' },
    { label: 'Caution', count: cautionCount, color: 'bg-amber-500' },
    { label: 'Low Concern', count: lowCount, color: 'bg-emerald-500' },
    { label: 'Insufficient Info', count: insufficientCount, color: 'bg-slate-500' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <section className="rounded-2xl bg-gradient-to-br from-[#0F172A] via-[#0B1221] to-[#0A192F] border border-slate-800 p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-4">
            <p className="text-xs font-mono uppercase tracking-wider text-cyan-400">
              TrustCheck AI · Verify Before You Trust
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-50 tracking-tight text-balance">
              Detect deception. Verify opportunities. Protect your future.
            </h1>
            <p className="text-sm md:text-base text-slate-300 max-w-2xl leading-relaxed">
              Evaluate job offers, internships, scholarships, recruitment messages, and
              organizational websites using evidence-grounded Gemini multimodal analysis,
              heuristic domain intelligence, and transparent risk scoring.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onStartAnalyze}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-colors"
              >
                <FileSearch className="w-4 h-4" aria-hidden="true" />
                <span>Analyze an Offer</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onNavigateLearn}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#070B14] border border-slate-700 hover:border-slate-600 text-slate-200 font-medium text-sm transition-colors"
              >
                <BookOpen className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                <span>Learn About Scams</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 rounded-xl bg-[#070B14]/90 border border-slate-800 p-4 space-y-3 text-xs">
            <div className="flex items-center gap-2 font-semibold text-slate-100">
              <Lock className="w-4 h-4 text-cyan-400 shrink-0" aria-hidden="true" />
              <span>Privacy & Verification Status</span>
            </div>
            <div className="space-y-2 text-slate-300">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">Live Gemini Engine</span>
                <span className="font-mono text-slate-100">
                  {geminiConfigured === null
                    ? 'Checking...'
                    : geminiConfigured
                    ? 'Server Ready'
                    : 'Key Not Set (Offline Available)'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">Search Grounding</span>
                <span className="font-mono text-slate-100">
                  {settings.enableSearchGrounding ? 'Enabled' : 'Content-Only'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">Local History</span>
                <span className="font-mono text-slate-100">
                  {settings.optInLocalHistory ? 'Opted In' : 'Session Only'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">API Credentials</span>
                <span className="font-mono text-emerald-400">Server-Side Only</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Session / Stored Counts (strictly from real completed analyses) */}
      <section aria-labelledby="metrics-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="metrics-heading" className="text-sm font-semibold text-slate-200">
            Completed Assessment Metrics
          </h2>
          <span className="text-xs text-slate-400">
            Counts reflect only analyses completed in this browser
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl bg-[#0F172A]/80 border border-slate-800 p-4">
            <span className="text-xs text-slate-400 block">Completed Analyses</span>
            <span className="font-mono text-2xl font-bold text-slate-100 tabular-nums mt-1 block">
              {totalCount}
            </span>
          </div>
          <div className="rounded-xl bg-[#0F172A]/80 border border-slate-800 p-4">
            <span className="text-xs text-slate-400 block">High / Elevated Risk</span>
            <span className="font-mono text-2xl font-bold text-red-400 tabular-nums mt-1 block">
              {highOrElevatedCount}
            </span>
          </div>
          <div className="rounded-xl bg-[#0F172A]/80 border border-slate-800 p-4">
            <span className="text-xs text-slate-400 block">Caution Warnings</span>
            <span className="font-mono text-2xl font-bold text-amber-400 tabular-nums mt-1 block">
              {cautionCount}
            </span>
          </div>
          <div className="rounded-xl bg-[#0F172A]/80 border border-slate-800 p-4">
            <span className="text-xs text-slate-400 block">Low Concern</span>
            <span className="font-mono text-2xl font-bold text-emerald-400 tabular-nums mt-1 block">
              {lowCount}
            </span>
          </div>
        </div>
      </section>

      {/* Recent History + Risk Distribution + Common Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 rounded-xl bg-[#0F172A]/80 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-100">
              Recent Analyses
            </h2>
            {totalCount > 0 && (
              <span className="text-xs font-mono text-slate-400 tabular-nums">
                Showing {Math.min(4, totalCount)} of {totalCount}
              </span>
            )}
          </div>

          {totalCount === 0 ? (
            <div className="rounded-lg bg-[#0B1221] border border-slate-800 p-6 text-center space-y-3">
              <ShieldCheck className="w-7 h-7 text-cyan-400 mx-auto" aria-hidden="true" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-200">
                  No analyses run yet
                </p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Paste a suspicious message, upload a screenshot or PDF offer letter, or
                  launch one of the five Demo Scenarios below to inspect the full report.
                </p>
              </div>
              <button
                type="button"
                onClick={onStartAnalyze}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors"
              >
                <span>Analyze Your First Offer</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {completedAnalyses.slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onOpenAnalysis(item)}
                  className="w-full text-left p-3.5 rounded-lg bg-[#0B1221] border border-slate-800 hover:border-cyan-500/40 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-100 truncate">
                      {item.title}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 truncate">
                      {item.isOfflineDemo ? 'Offline Demo' : 'Live Gemini'} ·{' '}
                      {item.category} · {getRiskLevelLabel(item.riskLevel)}
                    </div>
                  </div>
                  <div className="font-mono text-sm font-bold text-slate-200 tabular-nums shrink-0">
                    {item.riskScore === null ? 'N/A' : `${item.riskScore}/100`}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="lg:col-span-5 rounded-xl bg-[#0F172A]/80 border border-slate-800 p-5 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Risk Distribution & Frequent Warnings
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Derived dynamically from your completed analyses
            </p>
          </div>

          {totalCount === 0 ? (
            <div className="rounded-lg bg-[#0B1221] border border-slate-800 p-5 text-xs text-slate-400 leading-relaxed">
              Risk distribution charts and common warning patterns appear automatically once
              you run your first analysis or Offline Demo scenario.
            </div>
          ) : (
            <>
              <div className="space-y-2.5">
                {distributionBars.map((bar) => {
                  const pct = totalCount > 0 ? Math.round((bar.count / totalCount) * 100) : 0;
                  return (
                    <div key={bar.label} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>{bar.label}</span>
                        <span className="font-mono tabular-nums">
                          {bar.count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[#070B14] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${bar.color}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <h3 className="text-xs font-semibold text-slate-300">
                  Most Observed Warning Signs
                </h3>
                {topWarnings.length > 0 ? (
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {topWarnings.map(([name, count]) => (
                      <li key={name} className="flex items-center justify-between gap-2">
                        <span className="truncate">{name}</span>
                        <span className="font-mono text-slate-400 tabular-nums shrink-0">
                          {count}x
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400">
                    No warning flags recorded across completed cases yet.
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Quick Access to 5 Demo Scenarios */}
      <section aria-labelledby="demo-scenarios-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2
              id="demo-scenarios-heading"
              className="text-base font-semibold text-slate-100"
            >
              Hackathon Demonstration Scenarios (Fictional Examples)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Launch any scenario in clearly labeled Offline Demo mode (instant preset) or
              load it into Live Gemini Analysis.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {DEMO_SCENARIOS.map((sc) => (
            <div
              key={sc.id}
              className="rounded-xl bg-[#0F172A]/80 border border-slate-800 p-4 flex flex-col justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="text-xs font-mono text-cyan-400">
                  {sc.code} · {sc.category}
                </div>
                <h3 className="text-sm font-semibold text-slate-100">{sc.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{sc.subtitle}</p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => onRunDemoScenario(sc, 'offline')}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#0B1221] border border-slate-700 hover:border-amber-400/50 text-xs font-medium text-slate-200 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                  <span>Offline Demo</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRunDemoScenario(sc, 'live')}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500/15 border border-cyan-500/30 hover:bg-cyan-500/25 text-xs font-medium text-cyan-300 transition-colors"
                >
                  <span>Load in Live</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
