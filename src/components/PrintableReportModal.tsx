import React from 'react';
import { Printer, ShieldCheck, X } from 'lucide-react';
import type { AnalysisResult } from '../types/analysis';
import { getRiskLevelLabel } from '../utils/scoring';

interface PrintableReportModalProps {
  analysis: AnalysisResult;
  onClose: () => void;
}

export const PrintableReportModal: React.FC<PrintableReportModalProps> = ({
  analysis,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="printable-report-title"
    >
      <div className="w-full max-w-3xl bg-white text-slate-900 rounded-xl border border-slate-300 shadow-2xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white no-print">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-cyan-400" aria-hidden="true" />
            <span className="font-semibold text-sm">
              TrustCheck AI — Printable Assessment Report
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close report preview"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-6 text-sm leading-relaxed max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible">
          <header className="border-b border-slate-200 pb-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">
                TrustCheck AI — Verify Before You Trust
              </p>
              <h2 id="printable-report-title" className="text-2xl font-bold text-slate-900 mt-1">
                {analysis.title}
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Assessed: {new Date(analysis.createdAt).toLocaleString()} · Category:{' '}
                {analysis.category} · Mode:{' '}
                {analysis.isOfflineDemo ? 'Offline Demo Preset' : 'Live Gemini Analysis'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Estimated Risk</div>
              <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                {analysis.riskScore === null ? 'N/A' : `${analysis.riskScore}/100`}
              </div>
              <div className="text-xs font-semibold text-slate-700">
                {getRiskLevelLabel(analysis.riskLevel)}
              </div>
            </div>
          </header>

          <section>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-1.5">
              Executive Summary
            </h3>
            <p className="text-slate-700">{analysis.summary}</p>
            <p className="text-xs text-slate-500 mt-2">{analysis.scoringExplanation}</p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">
              Key Warning Evidence ({analysis.findings.length})
            </h3>
            {analysis.findings.length === 0 ? (
              <p className="text-slate-600 text-xs">
                No concrete warning findings were flagged in the supplied material.
              </p>
            ) : (
              <ul className="space-y-3">
                {analysis.findings.map((f) => (
                  <li
                    key={f.id}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50"
                  >
                    <div className="font-semibold text-slate-900">
                      [{f.severity.toUpperCase()}] {f.type} ({f.category})
                    </div>
                    {f.evidenceQuote && (
                      <div className="mt-1 text-xs font-mono text-slate-700 bg-white p-2 rounded border border-slate-200">
                        “{f.evidenceQuote}”
                      </div>
                    )}
                    <p className="mt-1.5 text-xs text-slate-700">{f.explanation}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-1.5">
              Source Verification & Domain Checks
            </h3>
            <p className="text-xs text-slate-700">
              Status: <strong>{analysis.verification.status}</strong> —{' '}
              {analysis.verification.summary}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              {analysis.domainIntel.orgDomainComparison}
            </p>
            {analysis.verification.sources.length > 0 && (
              <ul className="mt-2 list-disc list-inside text-xs text-slate-700 space-y-1">
                {analysis.verification.sources.map((s) => (
                  <li key={s.url}>
                    {s.title} ({s.url})
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-1.5">
              Recommended Safety Measures
            </h3>
            <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
              {analysis.recommendedActions.map((act, i) => (
                <li key={i}>{act}</li>
              ))}
            </ul>
          </section>

          <footer className="border-t border-slate-200 pt-4 text-[11px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">Disclaimer & Limitations</p>
            <p>
              TrustCheck AI provides automated, evidence-based risk assessments. It cannot
              guarantee whether an opportunity is genuine or fraudulent. Always independently
              verify important decisions.
            </p>
            {analysis.limitations.map((lim, idx) => (
              <p key={idx}>• {lim}</p>
            ))}
          </footer>
        </div>
      </div>
    </div>
  );
};
