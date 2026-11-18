import React, { useState } from 'react';
import { ExternalLink, Globe, Loader2, MessageSquare, Send } from 'lucide-react';
import type {
  AnalysisResult,
  FollowUpMessage,
  LanguagePreference,
} from '../types/analysis';

interface FollowUpAssistantProps {
  analysis: AnalysisResult;
  language: LanguagePreference;
  explainSimply: boolean;
}

const SUGGESTED_QUESTIONS = [
  'Why is this offer suspicious?',
  'Is any requested fee normal?',
  'How can I verify this opportunity?',
  'What should I ask the recruiter?',
  'Which warning sign matters most?',
  'Explain this in Roman Urdu',
];

function buildOfflineFollowUpAnswer(
  analysis: AnalysisResult,
  question: string
): string {
  const q = question.toLowerCase();
  if (q.includes('roman urdu')) {
    const top = analysis.findings[0];
    return `Offline Demo Roman Urdu Summary: "${analysis.title}" ke liye risk level "${analysis.riskLevel}" hai. ${
      top
        ? `Sab se ahem warning sign yeh hai: ${top.type} — ${top.simpleExplanation || top.explanation}`
        : 'Is text mein koi direct scam warning nahi mili, lekin official website se khud tasdeeq zaroor karein.'
    } Kabhi bhi baghair tasdeeq ke paise, password ya OTP share na karein.`;
  }
  if (q.includes('most') || q.includes('suspicious') || q.includes('why')) {
    if (analysis.findings.length === 0) {
      return `In this Offline Demo preset, no specific warning flags were detected (${
        analysis.riskScore ?? 'N/A'
      }/100). However, ${
        analysis.missingEvidence[0] || 'independent official verification is still required.'
      }`;
    }
    const sorted = [...analysis.findings].sort((a, b) => {
      const rank = { critical: 4, high: 3, medium: 2, low: 1 };
      return rank[b.severity] - rank[a.severity];
    });
    const top = sorted[0];
    return `Based on the completed Offline Demo assessment, the highest-priority warning is "${top.type}" (${top.severity} severity). ${
      top.whySuspicious || top.explanation
    } Recommended step: ${top.recommendation}`;
  }
  if (q.includes('fee') || q.includes('money') || q.includes('pay')) {
    const fin = analysis.findings.find((f) => f.category === 'financial');
    return fin
      ? `Financial analysis note: ${fin.explanation} ${fin.recommendation}`
      : 'No upfront fee was flagged in this specific submission, though you should never transfer money to personal accounts or pay before independent verification.';
  }
  if (q.includes('ask') || q.includes('recruiter')) {
    return 'Ask for: (1) an email sent from their verified institutional domain, (2) a direct link to the listing on their official careers or scholarship portal, and (3) a formal written offer document without upfront fee or credential demands.';
  }
  return `Offline Demo contextual answer: ${analysis.summary} Top recommended action: ${
    analysis.recommendedActions[0] || 'Verify independently via the official website.'
  } (Switch to Live Gemini Analysis to ask open-ended live questions or trigger Google Search verification.)`;
}

export const FollowUpAssistant: React.FC<FollowUpAssistantProps> = ({
  analysis,
  language,
  explainSimply,
}) => {
  const [messages, setMessages] = useState<FollowUpMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyWeb, setVerifyWeb] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendQuestion = async (rawQuestion: string) => {
    const q = rawQuestion.trim();
    if (!q || loading) return;

    setError(null);
    const userMsg: FollowUpMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: q,
      createdAt: new Date().toISOString(),
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');

    if (analysis.isOfflineDemo) {
      const offlineReply: FollowUpMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: buildOfflineFollowUpAnswer(analysis, q),
        createdAt: new Date().toISOString(),
      };
      setMessages([...nextHistory, offlineReply]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis,
          question: q,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          language,
          explainSimply,
          triggerFreshVerification: verifyWeb,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not retrieve follow-up answer.');
        setLoading(false);
        return;
      }
      const assistantMsg: FollowUpMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        sources: data.sources ?? [],
        usedFreshVerification: Boolean(data.usedFreshVerification),
        createdAt: new Date().toISOString(),
      };
      setMessages([...nextHistory, assistantMsg]);
    } catch {
      setError('Network error while contacting follow-up assistant.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      aria-labelledby="followup-heading"
      className="rounded-xl bg-[#0F172A]/80 border border-slate-800 p-5 space-y-4 no-print"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3
            id="followup-heading"
            className="text-base font-semibold text-slate-100 flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4 text-cyan-400" aria-hidden="true" />
            <span>Interactive Follow-Up Assistant</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {analysis.isOfflineDemo
              ? 'Offline Demo contextual Q&A (uses preset analysis context only).'
              : 'Ask questions grounded strictly in this completed analysis (never invents citations).'}
          </p>
        </div>

        {!analysis.isOfflineDemo && (
          <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={verifyWeb}
              onChange={(e) => setVerifyWeb(e.target.checked)}
              className="rounded border-slate-700 bg-[#070B14] text-cyan-500 focus:ring-cyan-500"
            />
            <Globe className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
            <span>Trigger Google Search verification on next question</span>
          </label>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            disabled={loading}
            onClick={() => sendQuestion(q)}
            className="px-3 py-1.5 rounded-lg bg-[#0B1221] border border-slate-800 hover:border-cyan-500/40 hover:text-cyan-300 text-xs text-slate-300 transition-colors disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {messages.length > 0 && (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-3.5 rounded-lg border text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-cyan-500/10 border-cyan-500/25 text-slate-100 ml-6'
                  : 'bg-[#0B1221] border-slate-800 text-slate-200 mr-6'
              }`}
            >
              <div className="text-[11px] font-mono text-slate-400 mb-1">
                {msg.role === 'user' ? 'You' : 'TrustCheck AI'}
                {msg.usedFreshVerification ? ' · Fresh Web Search Grounded' : ''}
              </div>
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 space-y-1">
                  <span className="text-[11px] text-slate-400 block">
                    Verified grounding sources:
                  </span>
                  {msg.sources.map((src) => (
                    <a
                      key={src.url}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-cyan-400 hover:underline truncate"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
                      <span className="truncate">{src.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendQuestion(input);
        }}
        className="flex items-center gap-2"
      >
        <label htmlFor="followup-input" className="sr-only">
          Ask a follow-up question
        </label>
        <input
          id="followup-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a follow-up question about this offer..."
          disabled={loading}
          className="flex-1 bg-[#070B14] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="w-4 h-4" aria-hidden="true" />
          )}
          <span>Ask</span>
        </button>
      </form>
    </section>
  );
};
