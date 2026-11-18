import React, { useMemo, useState } from 'react';
import {
  Columns2,
  ExternalLink,
  History,
  Info,
  Search,
  Trash2,
} from 'lucide-react';
import type { AnalysisResult, RiskLevel } from '../types/analysis';
import { getRiskLevelLabel } from '../utils/scoring';

interface HistoryViewProps {
  history: AnalysisResult[];
  optInLocalHistory: boolean;
  onToggleOptIn: (val: boolean) => void;
  onOpenAnalysis: (item: AnalysisResult) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  optInLocalHistory,
  onToggleOptIn,
  onOpenAnalysis,
  onDeleteItem,
  onClearAll,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | RiskLevel>('all');
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return history.filter((item) => {
      if (riskFilter !== 'all' && item.riskLevel !== riskFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        (item.claimedOrganization ?? '').toLowerCase().includes(q)
      );
    });
  }, [history, searchQuery, riskFilter]);

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const comparePair = compareIds
    .map((id) => history.find((h) => h.id === id))
    .filter((x): x is AnalysisResult => Boolean(x));

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Analysis History</h1>
          <p className="text-sm text-slate-400 mt-1">
            Review, filter, reopen, or compare completed assessments.
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0B1221] border border-red-500/30 hover:bg-red-500/10 text-xs font-medium text-red-300 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Clear All History</span>
          </button>
        )}
      </header>

      {/* Opt-in Local Storage Consent Banner */}
      <section className="rounded-xl bg-[#0F172A]/85 border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-2.5 max-w-2xl">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-0.5">
            <span className="font-semibold text-slate-200 block">
              Opt-In Browser Storage Notice
            </span>
            <p className="text-slate-400 leading-relaxed">
              By default, TrustCheck AI keeps assessments in temporary session state only.
              If you enable local history, saved assessments remain in this browser’s
              storage until you delete them. Uploaded files are not automatically saved.
            </p>
          </div>
        </div>

        <label className="inline-flex items-center gap-2.5 cursor-pointer select-none font-medium text-slate-200 shrink-0">
          <input
            type="checkbox"
            checked={optInLocalHistory}
            onChange={(e) => onToggleOptIn(e.target.checked)}
            className="rounded border-slate-700 bg-[#070B14] text-cyan-500 focus:ring-cyan-500"
          />
          <span>Auto-save analyses locally</span>
        </label>
      </section>

      {/* Side-by-Side Comparison Panel */}
      {comparePair.length === 2 && (
        <section className="rounded-xl bg-[#0F172A]/90 border border-cyan-500/30 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-cyan-300 flex items-center gap-2">
              <Columns2 className="w-4 h-4" aria-hidden="true" />
              <span>Side-by-Side Assessment Comparison</span>
            </h2>
            <button
              type="button"
              onClick={() => setCompareIds([])}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Clear comparison
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {comparePair.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-lg bg-[#0B1221] border border-slate-800 space-y-2.5"
              >
                <div className="font-semibold text-sm text-slate-100">{item.title}</div>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>
                    <span className="text-slate-400 block">Score</span>
                    <span className="font-mono font-bold tabular-nums">
                      {item.riskScore === null ? 'N/A' : `${item.riskScore}/100`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Risk Level</span>
                    <span>{getRiskLevelLabel(item.riskLevel)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Claimed Org</span>
                    <span>{item.claimedOrganization || 'None stated'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Warnings / Verification</span>
                    <span>
                      {item.findings.length} flags · {item.verification.status}
                    </span>
                  </div>
                </div>
                <p className="text-slate-400 leading-relaxed">{item.summary}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Search & Risk Filter Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <label htmlFor="history-search" className="sr-only">
            Search history by title or organization
          </label>
          <input
            id="history-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by opportunity title or organization..."
            className="w-full rounded-lg bg-[#0B1221] border border-slate-800 pl-9 pr-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#0B1221] border border-slate-800">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'high', label: 'High' },
              { id: 'elevated', label: 'Elevated' },
              { id: 'caution', label: 'Caution' },
              { id: 'low', label: 'Low' },
              { id: 'insufficient_evidence', label: 'Insufficient' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setRiskFilter(f.id)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                riskFilter === f.id
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Records List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl bg-[#0F172A]/80 border border-slate-800 p-10 text-center space-y-2">
          <History className="w-7 h-7 text-slate-500 mx-auto" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-200">
            {history.length === 0
              ? 'No saved or session analyses yet'
              : 'No analyses match your search filter'}
          </p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {history.length === 0
              ? 'Run an offer analysis or Offline Demo scenario and save it to view, search, or compare assessments here.'
              : 'Try clearing the search query or selecting "All" risk levels.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const selectedForCompare = compareIds.includes(item.id);
            return (
              <div
                key={item.id}
                className="rounded-xl bg-[#0F172A]/85 border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="font-mono">
                      {item.isOfflineDemo ? 'Offline Demo' : 'Live Gemini'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">{item.category}</span>
                    {item.claimedOrganization && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{item.claimedOrganization}</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100 truncate">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-1">{item.summary}</p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="text-right mr-2">
                    <div className="font-mono text-sm font-bold text-slate-100 tabular-nums">
                      {item.riskScore === null ? 'N/A' : `${item.riskScore}/100`}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {getRiskLevelLabel(item.riskLevel)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleCompare(item.id)}
                    aria-pressed={selectedForCompare}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      selectedForCompare
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                        : 'bg-[#0B1221] border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {selectedForCompare ? 'Comparing' : 'Compare'}
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenAnalysis(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteItem(item.id)}
                    aria-label={`Delete ${item.title}`}
                    className="p-1.5 rounded-lg bg-[#0B1221] border border-slate-800 hover:border-red-500/40 text-slate-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
