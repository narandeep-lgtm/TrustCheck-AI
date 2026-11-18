import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, FileText, Search } from 'lucide-react';
import type { Finding, InputMode } from '../types/analysis';
import { buildHighlightedSegments } from '../utils/evidenceHighlighter';

interface EvidenceHighlighterProps {
  sourceText?: string;
  extractedText?: string;
  unreadableRegions?: string | null;
  documentDetails?: {
    documentType?: string;
    detectedDates?: string[];
    detectedContacts?: string[];
  };
  inputMode: InputMode;
  findings: Finding[];
  explainSimply: boolean;
}

function getSeverityHighlightClasses(
  severity: Finding['severity'],
  isSelected: boolean
): string {
  const ring = isSelected ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-[#0B1221]' : '';
  switch (severity) {
    case 'critical':
      return `bg-red-500/25 text-red-100 border-b-2 border-red-400 hover:bg-red-500/35 ${ring}`;
    case 'high':
      return `bg-orange-500/20 text-orange-100 border-b-2 border-orange-400 hover:bg-orange-500/30 ${ring}`;
    case 'medium':
      return `bg-amber-500/20 text-amber-100 border-b-2 border-amber-400 hover:bg-amber-500/30 ${ring}`;
    case 'low':
      return `bg-cyan-500/15 text-cyan-100 border-b-2 border-cyan-400 hover:bg-cyan-500/25 ${ring}`;
  }
}

export const EvidenceHighlighter: React.FC<EvidenceHighlighterProps> = ({
  sourceText,
  extractedText,
  unreadableRegions,
  documentDetails,
  inputMode,
  findings,
  explainSimply,
}) => {
  const displaySource =
    inputMode === 'image' || inputMode === 'pdf'
      ? extractedText || sourceText || ''
      : sourceText || extractedText || '';

  const { segments, unmatchedFindings } = useMemo(
    () => buildHighlightedSegments(displaySource, findings),
    [displaySource, findings]
  );

  const firstMatched = segments.find((s) => s.finding)?.finding ?? null;
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(
    firstMatched?.id ?? null
  );

  const activeFinding =
    findings.find((f) => f.id === selectedFindingId) ?? firstMatched ?? null;

  return (
    <section
      aria-labelledby="evidence-highlighter-heading"
      className="rounded-xl bg-[#0F172A]/80 border border-slate-800 p-5 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3
            id="evidence-highlighter-heading"
            className="text-base font-semibold text-slate-100 flex items-center gap-2"
          >
            <Search className="w-4 h-4 text-cyan-400" aria-hidden="true" />
            <span>AI Evidence Highlighter</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {inputMode === 'image' || inputMode === 'pdf'
              ? 'Extracted readable text and evidence spans from your uploaded file. Click any highlighted phrase to inspect.'
              : 'Exact matched phrases from your submission. Click any highlighted phrase to inspect why it was flagged.'}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-400/70" aria-hidden="true" />
            Critical
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-orange-400/70" aria-hidden="true" />
            High
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400/70" aria-hidden="true" />
            Medium
          </span>
        </div>
      </div>

      {(inputMode === 'image' || inputMode === 'pdf') && documentDetails && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-lg bg-[#0B1221] border border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-400 block">Document Type</span>
            <span className="text-slate-200 font-medium mt-0.5 block">
              {documentDetails.documentType || (inputMode === 'pdf' ? 'PDF Document' : 'Image / Screenshot')}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Detected Dates</span>
            <span className="text-slate-200 font-mono mt-0.5 block">
              {documentDetails.detectedDates?.length
                ? documentDetails.detectedDates.join(', ')
                : 'None isolated'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Detected Contacts</span>
            <span className="text-slate-200 font-mono mt-0.5 block break-all">
              {documentDetails.detectedContacts?.length
                ? documentDetails.detectedContacts.join(', ')
                : 'None isolated'}
            </span>
          </div>
        </div>
      )}

      {unreadableRegions && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" aria-hidden="true" />
          <div>
            <span className="font-semibold">Uncertain or unreadable regions: </span>
            <span>{unreadableRegions}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-7 rounded-lg bg-[#070B14] border border-slate-800/90 p-4 text-sm leading-relaxed text-slate-200 whitespace-pre-wrap break-words max-h-80 overflow-y-auto">
          {displaySource ? (
            segments.map((seg, idx) =>
              seg.finding ? (
                <span
                  key={`${seg.start}-${idx}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedFindingId(seg.finding!.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedFindingId(seg.finding!.id);
                    }
                  }}
                  className={`inline px-1 py-0.5 rounded-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${getSeverityHighlightClasses(
                    seg.finding.severity,
                    activeFinding?.id === seg.finding.id
                  )}`}
                  title={`${seg.finding.type} (${seg.finding.severity})`}
                >
                  {seg.text}
                </span>
              ) : (
                <span key={`${seg.start}-${idx}`}>{seg.text}</span>
              )
            )
          ) : (
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <FileText className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>No readable verbatim text excerpt was available to highlight.</span>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 rounded-lg bg-[#0B1221] border border-slate-800 p-4">
          {activeFinding ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                <span className="uppercase tracking-wider font-mono text-cyan-400">
                  {activeFinding.category} · {activeFinding.severity}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-slate-100">
                {activeFinding.type}
              </h4>
              {activeFinding.evidenceQuote && (
                <div className="p-2.5 rounded bg-[#070B14] border border-slate-800 text-xs font-mono text-slate-300 break-words">
                  “{activeFinding.evidenceQuote}”
                </div>
              )}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-300">Reason for concern</p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {explainSimply && activeFinding.simpleExplanation
                    ? activeFinding.simpleExplanation
                    : activeFinding.explanation}
                </p>
              </div>
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <p className="text-xs font-medium text-cyan-300">
                  Suggested verification method
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeFinding.verificationMethod || activeFinding.recommendation}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-8 px-3 space-y-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" aria-hidden="true" />
              <p className="text-sm font-medium text-slate-200">
                No warning spans highlighted
              </p>
              <p className="text-xs text-slate-400">
                No suspicious phrases were matched inside this text. Review missing evidence and verification notes below.
              </p>
            </div>
          )}
        </div>
      </div>

      {unmatchedFindings.length > 0 && (
        <div className="pt-2 border-t border-slate-800/70">
          <p className="text-xs font-medium text-slate-400 mb-2">
            Additional findings observed outside exact inline text spans ({unmatchedFindings.length}):
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {unmatchedFindings.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFindingId(f.id)}
                className="text-left p-2.5 rounded-lg bg-[#0B1221] border border-slate-800 hover:border-slate-700 transition-colors text-xs"
              >
                <span className="font-semibold text-slate-200 block">{f.type}</span>
                <span className="text-slate-400 block mt-0.5">
                  {f.category} · {f.severity}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
