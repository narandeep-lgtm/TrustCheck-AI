import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  BookmarkCheck,
  BookmarkPlus,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  FileCheck2,
  Globe,
  HelpCircle,
  Info,
  Lock,
  Printer,
  RotateCcw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import type {
  AnalysisResult,
  FinalRecommendationKey,
  Finding,
  LanguagePreference,
  VerificationStatus,
} from '../types/analysis';
import { getRiskLevelLabel } from '../utils/scoring';
import { RiskGauge } from './RiskGauge';
import { EvidenceHighlighter } from './EvidenceHighlighter';
import { FollowUpAssistant } from './FollowUpAssistant';
import { PrintableReportModal } from './PrintableReportModal';

interface ResultsDashboardProps {
  analysis: AnalysisResult;
  language: LanguagePreference;
  defaultExplainSimply: boolean;
  isSavedInHistory: boolean;
  onSaveToHistory: (analysis: AnalysisResult) => void;
  onAnalyzeAnother: () => void;
}

function getFinalRecommendationMeta(key: FinalRecommendationKey) {
  switch (key) {
    case 'proceed_ordinary_verification':
      return {
        label: 'Proceed with ordinary verification',
        detail:
          'No severe deception flags appeared in the text, though standard independent confirmation is always prudent.',
        classes: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
        Icon: CheckCircle2,
      };
    case 'verify_carefully':
      return {
        label: 'Verify carefully before proceeding',
        detail:
          'Some questions, missing institutional details, or moderate warning signs remain unresolved.',
        classes: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
        Icon: AlertTriangle,
      };
    case 'avoid_responding_until_resolved':
      return {
        label: 'Avoid responding until major concerns are resolved',
        detail:
          'Significant contradictions or elevated risk indicators require independent institutional confirmation first.',
        classes: 'bg-orange-500/10 border-orange-500/30 text-orange-300',
        Icon: ShieldAlert,
      };
    case 'do_not_share_money_or_sensitive_info':
      return {
        label: 'Do not share money or sensitive information',
        detail:
          'High-severity financial, credential, or impersonation indicators detected. Do not transfer funds, passwords, or OTP codes.',
        classes: 'bg-red-500/10 border-red-500/35 text-red-300',
        Icon: AlertOctagon,
      };
  }
}

function getVerificationStatusMeta(status: VerificationStatus) {
  switch (status) {
    case 'supported':
      return {
        label: 'Independently supported',
        classes: 'text-emerald-400',
        Icon: CheckCircle2,
      };
    case 'contradicted':
      return {
        label: 'Contradicted by source evidence',
        classes: 'text-red-400',
        Icon: AlertOctagon,
      };
    case 'unconfirmed':
      return {
        label: 'Not independently confirmed',
        classes: 'text-amber-400',
        Icon: HelpCircle,
      };
    case 'unavailable':
      return {
        label: 'Verification unavailable',
        classes: 'text-slate-400',
        Icon: Info,
      };
  }
}

function getSeverityBadgeClasses(severity: Finding['severity']) {
  switch (severity) {
    case 'critical':
      return 'bg-red-500/15 text-red-300 border-red-500/30';
    case 'high':
      return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
    case 'medium':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    case 'low':
      return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
  }
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  analysis,
  language,
  defaultExplainSimply,
  isSavedInHistory,
  onSaveToHistory,
  onAnalyzeAnother,
}) => {
  const [explainSimply, setExplainSimply] = useState(defaultExplainSimply);
  const [expandedFindings, setExpandedFindings] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    analysis.findings.slice(0, 2).forEach((f) => {
      init[f.id] = true;
    });
    return init;
  });
  const [copied, setCopied] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const finalMeta = getFinalRecommendationMeta(analysis.finalRecommendation);
  const verifMeta = getVerificationStatusMeta(analysis.verification.status);
  const FinalIcon = finalMeta.Icon;
  const VerifIcon = verifMeta.Icon;

  const toggleFinding = (id: string) => {
    setExpandedFindings((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopySummary = async () => {
    const text = [
      `TrustCheck AI Assessment — ${analysis.title}`,
      `Mode: ${analysis.isOfflineDemo ? 'Offline Demo Preset' : 'Live Gemini Analysis'}`,
      `Risk Level: ${getRiskLevelLabel(analysis.riskLevel)} (${
        analysis.riskScore === null ? 'N/A' : `${analysis.riskScore}/100`
      })`,
      `Recommendation: ${finalMeta.label}`,
      '',
      `Summary: ${explainSimply ? analysis.simpleSummary : analysis.summary}`,
      '',
      `Findings (${analysis.findings.length}):`,
      ...analysis.findings.map(
        (f) => `- [${f.severity.toUpperCase()}] ${f.type}: ${f.explanation}`
      ),
      '',
      'Disclaimer: TrustCheck AI provides automated, evidence-based risk assessments and cannot guarantee whether an opportunity is genuine or fraudulent.',
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard blocked in some contexts
    }
  };

  const languageLabel =
    analysis.language === 'ur'
      ? 'Urdu (اردو)'
      : analysis.language === 'roman_ur'
      ? 'Roman Urdu'
      : 'English';

  return (
    <div className="space-y-6" data-testid="results-dashboard">
      {/* Unmistakable Mode & Basis Banner */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs ${
          analysis.isOfflineDemo
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Info className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="font-semibold">
            {analysis.isOfflineDemo
              ? 'OFFLINE DEMO PRESET'
              : 'LIVE GEMINI ANALYSIS'}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {analysis.assessmentBasis === 'content_and_external_sources'
              ? 'Content + External Grounded Sources'
              : 'Content-Based Assessment Only'}
          </span>
          <span aria-hidden="true">·</span>
          <span>Explanation Language: {languageLabel}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 no-print">
          <button
            type="button"
            onClick={() => setExplainSimply((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              explainSimply
                ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                : 'bg-[#0B1221] text-slate-200 border-slate-700 hover:border-slate-600'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{explainSimply ? 'Simple Mode: On' : 'Explain Simply'}</span>
          </button>
        </div>
      </div>

      {/* Top Overall Result + Gauge + Final Recommendation */}
      <section className="rounded-xl bg-[#0F172A]/90 border border-slate-800 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4">
            <RiskGauge score={analysis.riskScore} level={analysis.riskLevel} />
          </div>

          <div className="lg:col-span-8 space-y-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="capitalize">{analysis.category}</span>
                {analysis.claimedOrganization && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-300 font-medium">
                      Claimed org: {analysis.claimedOrganization}
                    </span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {new Date(analysis.createdAt).toLocaleString()}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-100 leading-tight">
                {analysis.title}
              </h2>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed">
              {explainSimply ? analysis.simpleSummary : analysis.summary}
            </p>

            {/* Prominent Final Recommendation */}
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${finalMeta.classes}`}
            >
              <FinalIcon className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wider font-mono opacity-80">
                  Final Recommendation
                </div>
                <div className="text-sm font-semibold">{finalMeta.label}</div>
                <p className="text-xs opacity-90 leading-relaxed">{finalMeta.detail}</p>
              </div>
            </div>

            {/* Primary Action Toolbar */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 no-print">
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Export / Print Report</span>
              </button>

              <button
                type="button"
                onClick={handleCopySummary}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0B1221] border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-medium transition-colors"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                ) : (
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>{copied ? 'Summary Copied' : 'Copy Summary'}</span>
              </button>

              <button
                type="button"
                onClick={() => onSaveToHistory(analysis)}
                disabled={isSavedInHistory}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0B1221] border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-medium transition-colors disabled:opacity-60"
              >
                {isSavedInHistory ? (
                  <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                ) : (
                  <BookmarkPlus className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>{isSavedInHistory ? 'Saved in History' : 'Save to History'}</span>
              </button>

              <button
                type="button"
                onClick={onAnalyzeAnother}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0B1221] border border-slate-700 hover:border-cyan-500/40 text-slate-200 text-xs font-medium transition-colors ml-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Analyze Another Offer</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* AI Evidence Highlighter */}
      <EvidenceHighlighter
        sourceText={analysis.sourceText}
        extractedText={analysis.extractedText}
        unreadableRegions={analysis.unreadableRegions}
        documentDetails={analysis.documentDetails}
        inputMode={analysis.inputMode}
        findings={analysis.findings}
        explainSimply={explainSimply}
      />

      {/* Warning Signs (Expandable Finding Cards) */}
      <section
        aria-labelledby="findings-heading"
        className="rounded-xl bg-[#0F172A]/80 border border-slate-800 p-5 space-y-4"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 id="findings-heading" className="text-base font-semibold text-slate-100">
              Warning Signs & Evidence ({analysis.findings.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Each finding cites direct evidence and explains why it matters.
            </p>
          </div>
        </div>

        {analysis.findings.length === 0 ? (
          <div className="p-4 rounded-lg bg-[#0B1221] border border-slate-800 text-xs text-slate-300">
            {analysis.riskLevel === 'insufficient_evidence'
              ? 'No specific warning indicators could be evaluated because the input lacks organizational, contact, or offer context.'
              : 'No explicit deception, payment, or credential-theft warning signs were detected in the provided evidence.'}
          </div>
        ) : (
          <div className="space-y-3">
            {analysis.findings.map((finding) => {
              const isOpen = Boolean(expandedFindings[finding.id]);
              return (
                <div
                  key={finding.id}
                  className="rounded-lg bg-[#0B1221] border border-slate-800 overflow-hidden"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => toggleFinding(finding.id)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                      <span
                        className={`px-2 py-0.5 rounded border text-[11px] font-mono uppercase shrink-0 ${getSeverityBadgeClasses(
                          finding.severity
                        )}`}
                      >
                        {finding.severity}
                      </span>
                      <span className="text-sm font-semibold text-slate-100 truncate">
                        {finding.type}
                      </span>
                      <span className="text-xs text-slate-400 capitalize">
                        · {finding.category}
                      </span>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-800/70 text-xs leading-relaxed">
                      {finding.evidenceQuote && (
                        <div className="p-2.5 rounded bg-[#070B14] border border-slate-800 font-mono text-slate-300 break-words">
                          Evidence: “{finding.evidenceQuote}”
                        </div>
                      )}
                      <div>
                        <span className="text-slate-400 font-medium block mb-0.5">
                          {explainSimply ? 'Plain-language explanation' : 'Analysis explanation'}
                        </span>
                        <p className="text-slate-200">
                          {explainSimply && finding.simpleExplanation
                            ? finding.simpleExplanation
                            : finding.explanation}
                        </p>
                      </div>
                      {finding.whySuspicious && (
                        <div>
                          <span className="text-amber-300 font-medium block mb-0.5">
                            Why is this suspicious?
                          </span>
                          <p className="text-slate-300">{finding.whySuspicious}</p>
                        </div>
                      )}
                      <div className="pt-1">
                        <span className="text-cyan-300 font-medium block mb-0.5">
                          Recommended verification / action
                        </span>
                        <p className="text-slate-300">
                          {finding.recommendation}
                          {finding.verificationMethod ? ` (${finding.verificationMethod})` : ''}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Verification & Source Intelligence + Domain & Email Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section
          aria-labelledby="verification-heading"
          className="rounded-xl bg-[#0F172A]/80 border border-slate-800 p-5 space-y-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3
                id="verification-heading"
                className="text-base font-semibold text-slate-100 flex items-center gap-2"
              >
                <Globe className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                <span>Verification & Source Intelligence</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {analysis.verification.checkedAt
                  ? `Checked ${new Date(analysis.verification.checkedAt).toLocaleString()}`
                  : 'External web verification not executed'}
              </p>
            </div>
            <div className={`inline-flex items-center gap-1.5 text-xs font-semibold ${verifMeta.classes}`}>
              <VerifIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{verifMeta.label}</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {analysis.verification.summary}
          </p>

          {analysis.verification.sources.length > 0 ? (
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-400 block">
                Grounding Citations ({analysis.verification.sources.length})
              </span>
              <div className="space-y-2">
                {analysis.verification.sources.map((src) => (
                  <a
                    key={src.url}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 rounded-lg bg-[#0B1221] border border-slate-800 hover:border-cyan-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-cyan-300 truncate">
                        {src.title}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                      {src.sourceType === 'official'
                        ? 'Official domain candidate'
                        : 'Third-party web reference'}{' '}
                      · {src.url}
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{src.finding}</p>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-[#0B1221] border border-slate-800 text-xs text-slate-400">
              {analysis.verification.limitationNote}
            </div>
          )}
        </section>

        <section
          aria-labelledby="domain-intel-heading"
          className="rounded-xl bg-[#0F172A]/80 border border-slate-800 p-5 space-y-4"
        >
          <div>
            <h3
              id="domain-intel-heading"
              className="text-base font-semibold text-slate-100 flex items-center gap-2"
            >
              <Lock className="w-4 h-4 text-cyan-400" aria-hidden="true" />
              <span>Domain & Email Heuristic Intelligence</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated extraction and structural pattern analysis
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-[#0B1221] border border-slate-800">
              <span className="text-slate-400 block">Domains Extracted</span>
              <span className="font-mono text-slate-100 mt-0.5 block break-all">
                {analysis.domainIntel.domainsAnalyzed.length > 0
                  ? analysis.domainIntel.domainsAnalyzed.join(', ')
                  : 'None detected'}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[#0B1221] border border-slate-800">
              <span className="text-slate-400 block">HTTPS Transport</span>
              <span className="font-mono text-slate-100 mt-0.5 block">
                {analysis.domainIntel.httpsPresent === null
                  ? 'No URLs present'
                  : analysis.domainIntel.httpsPresent
                  ? 'HTTPS present (not proof of trust)'
                  : 'Insecure HTTP detected'}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {analysis.domainIntel.orgDomainComparison}
          </p>

          {analysis.domainIntel.flags.length > 0 ? (
            <div className="space-y-2">
              {analysis.domainIntel.flags.map((flag, i) => (
                <div
                  key={`${flag.code}-${i}`}
                  className="p-3 rounded-lg bg-[#0B1221] border border-slate-800 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-100">{flag.label}</span>
                    <span className="font-mono uppercase text-[11px] text-amber-300">
                      {flag.severity}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-400 truncate mt-0.5">
                    {flag.target}
                  </div>
                  <p className="text-slate-300 mt-1 leading-relaxed">{flag.detail}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-[#0B1221] border border-slate-800 text-xs text-slate-400">
              No deceptive URL, lookalike character, or email pattern anomalies detected in extracted identifiers.
            </div>
          )}

          <p className="text-[11px] text-slate-400 leading-relaxed">
            {analysis.domainIntel.heuristicNotice}
          </p>
        </section>
      </div>

      {/* Explainable Score Breakdown + Positive/Missing Signals + Safety Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-6 rounded-xl bg-[#0F172A]/80 border border-slate-800 p-5 space-y-3">
          <h3 className="text-base font-semibold text-slate-100">
            Explainable Risk Score Logic
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {analysis.scoringExplanation}
          </p>

          {analysis.scoreBreakdown.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 pr-3 font-medium">Warning Signal</th>
                    <th className="py-2 px-3 font-medium">Severity</th>
                    <th className="py-2 pl-3 font-medium text-right">Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {analysis.scoreBreakdown.map((row) => (
                    <tr key={row.findingId} className="text-slate-200">
                      <td className="py-2 pr-3">
                        {row.label}
                        {!row.counted && (
                          <span className="block text-[11px] text-slate-400">
                            {row.reason}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono uppercase text-[11px]">
                        {row.severity}
                      </td>
                      <td className="py-2 pl-3 font-mono text-right tabular-nums">
                        {row.counted ? `+${row.weight}` : '0 (dedup)'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="lg:col-span-6 rounded-xl bg-[#0F172A]/80 border border-slate-800 p-5 space-y-4">
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-cyan-400" aria-hidden="true" />
            <span>Prioritized Safety Checklist</span>
          </h3>
          <ul className="space-y-2 text-xs text-slate-200">
            {analysis.recommendedActions.map((act, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#0B1221] border border-slate-800"
              >
                <span className="font-mono text-cyan-400 font-semibold shrink-0">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="leading-relaxed">{act}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Positive Signals & Missing Evidence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="rounded-xl bg-[#0F172A]/80 border border-slate-800 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-emerald-300">
            Positive Legitimacy Indicators ({analysis.positiveSignals.length})
          </h3>
          {analysis.positiveSignals.length > 0 ? (
            <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside">
              {analysis.positiveSignals.map((sig, i) => (
                <li key={i}>{sig}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400">
              No clear institutional legitimacy indicators were confirmed in this submission.
            </p>
          )}
        </section>

        <section className="rounded-xl bg-[#0F172A]/80 border border-slate-800 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-amber-300">
            Uncertainties & Missing Evidence ({analysis.missingEvidence.length})
          </h3>
          {analysis.missingEvidence.length > 0 ? (
            <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside">
              {analysis.missingEvidence.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400">
              No major missing contextual elements flagged, though independent verification remains essential.
            </p>
          )}
        </section>
      </div>

      {/* Follow-Up Assistant */}
      <FollowUpAssistant
        analysis={analysis}
        language={language}
        explainSimply={explainSimply}
      />

      {/* Limitations & Official Disclaimer */}
      <footer className="rounded-xl bg-[#0B1221] border border-slate-800 p-4 text-xs text-slate-400 space-y-1.5">
        <p className="font-semibold text-slate-300">
          TrustCheck AI Assessment Disclaimer & Limitations
        </p>
        <p>
          TrustCheck AI provides automated, evidence-based risk assessments. It cannot
          guarantee whether an opportunity is genuine or fraudulent. Always independently
          verify important decisions.
        </p>
        {analysis.limitations.map((lim, i) => (
          <p key={i}>• {lim}</p>
        ))}
      </footer>

      {showPrintModal && (
        <PrintableReportModal
          analysis={analysis}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};
