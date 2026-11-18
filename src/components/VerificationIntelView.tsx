import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Globe,
  HelpCircle,
  Lock,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { analyzeDomainAndEmailSignals } from '../utils/domainIntel';
import type { DomainIntelReport } from '../types/analysis';

export const VerificationIntelView: React.FC = () => {
  const [sampleInput, setSampleInput] = useState(
    'https://portal-verify.campus-onboarding.xyz/login?redirect=stipend\nContact: northbridge.scholarship.desk@gmail.com'
  );
  const [claimedOrg, setClaimedOrg] = useState('Northbridge University');
  const [report, setReport] = useState<DomainIntelReport>(() =>
    analyzeDomainAndEmailSignals({
      text: 'https://portal-verify.campus-onboarding.xyz/login?redirect=stipend\nContact: northbridge.scholarship.desk@gmail.com',
      claimedOrganization: 'Northbridge University',
    })
  );

  const handleInspect = (e: React.FormEvent) => {
    e.preventDefault();
    setReport(
      analyzeDomainAndEmailSignals({
        text: sampleInput,
        claimedOrganization: claimedOrg.trim() || null,
      })
    );
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <header>
        <h1 className="text-2xl font-bold text-slate-100">
          Verification Intelligence
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Inspect URLs, email addresses, lookalike domains, and understand how TrustCheck
          AI classifies external verification evidence.
        </p>
      </header>

      {/* Interactive Domain & Email Heuristic Inspector */}
      <section className="rounded-xl bg-[#0F172A]/85 border border-slate-800 p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" aria-hidden="true" />
            <span>Domain, URL & Email Heuristic Inspector</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Runs deterministic structural checks locally (no links are visited or opened).
          </p>
        </div>

        <form onSubmit={handleInspect} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label
                htmlFor="intel-urls-input"
                className="text-xs font-medium text-slate-300 block"
              >
                Paste URLs, Email Addresses, or Message Text
              </label>
              <textarea
                id="intel-urls-input"
                rows={3}
                value={sampleInput}
                onChange={(e) => setSampleInput(e.target.value)}
                className="w-full rounded-lg bg-[#070B14] border border-slate-800 px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                placeholder="https://... or hr@company.com"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="intel-org-input"
                className="text-xs font-medium text-slate-300 block"
              >
                Claimed Organization (Optional)
              </label>
              <input
                id="intel-org-input"
                type="text"
                value={claimedOrg}
                onChange={(e) => setClaimedOrg(e.target.value)}
                placeholder="e.g., Oxford University"
                className="w-full rounded-lg bg-[#070B14] border border-slate-800 px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors"
              >
                <Search className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Run Heuristic Inspection</span>
              </button>
            </div>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-800">
          <div className="p-3 rounded-lg bg-[#0B1221] border border-slate-800">
            <span className="text-slate-400 block">Extracted Domains</span>
            <span className="font-mono text-slate-100 mt-1 block break-all">
              {report.domainsAnalyzed.length
                ? report.domainsAnalyzed.join(', ')
                : 'None found'}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-[#0B1221] border border-slate-800">
            <span className="text-slate-400 block">Extracted Emails</span>
            <span className="font-mono text-slate-100 mt-1 block break-all">
              {report.extractedEmails.length
                ? report.extractedEmails.join(', ')
                : 'None found'}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-[#0B1221] border border-slate-800">
            <span className="text-slate-400 block">HTTPS Check</span>
            <span className="font-mono text-slate-100 mt-1 block">
              {report.httpsPresent === null
                ? 'No URLs'
                : report.httpsPresent
                ? 'HTTPS present (not proof of trust)'
                : 'Plain HTTP detected'}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-300">{report.orgDomainComparison}</p>

        {report.flags.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.flags.map((flag, i) => (
              <div
                key={`${flag.code}-${i}`}
                className="p-3.5 rounded-lg bg-[#0B1221] border border-slate-800 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-100">{flag.label}</span>
                  <span className="font-mono uppercase text-[11px] text-amber-300">
                    {flag.severity}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-slate-400 truncate">
                  {flag.target}
                </div>
                <p className="text-slate-300 leading-relaxed">{flag.detail}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3.5 rounded-lg bg-[#0B1221] border border-slate-800 text-xs text-slate-400">
            No structural anomalies flagged in the provided identifiers.
          </div>
        )}

        <p className="text-[11px] text-slate-400">{report.heuristicNotice}</p>
      </section>

      {/* Grounding Classification Guide */}
      <section className="rounded-xl bg-[#0F172A]/85 border border-slate-800 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" aria-hidden="true" />
          <h2 className="text-base font-semibold text-slate-100">
            How External Verification Statuses Work
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-[#0B1221] border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>Independently supported</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Google Search grounding returned authentic institutional or official career
              pages aligning with the claimed organization and opportunity details.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#0B1221] border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-red-400">
              <ShieldAlert className="w-4 h-4" aria-hidden="true" />
              <span>Contradicted by source evidence</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Official announcements, institutional advisories, or credible fraud alerts
              directly contradict claims in the submitted message.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#0B1221] border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-amber-400">
              <HelpCircle className="w-4 h-4" aria-hidden="true" />
              <span>Not independently confirmed</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Web search ran without confirming an official listing. Absence of search
              results is never treated automatically as proof of fraud.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#0B1221] border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-slate-300">
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
              <span>Verification unavailable</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Shown in Content-Only or Offline Demo mode, or when Search grounding could
              not run. All citations are strictly extracted from real grounding metadata.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
