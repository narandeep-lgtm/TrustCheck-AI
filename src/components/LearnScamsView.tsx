import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { RED_FLAG_QUIZ, SCAM_EDUCATION_GUIDES } from '../data/scamEducation';

export const LearnScamsView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const categories = ['All', 'Scholarship', 'Recruitment', 'Impersonation', 'Phishing', 'Messaging'];

  const filteredGuides =
    selectedCategory === 'All'
      ? SCAM_EDUCATION_GUIDES
      : SCAM_EDUCATION_GUIDES.filter((g) => g.category === selectedCategory);

  const answeredCount = Object.keys(answers).length;
  const correctCount = RED_FLAG_QUIZ.filter((q) => {
    const picked = answers[q.id];
    return q.options.find((o) => o.id === picked)?.isCorrect;
  }).length;

  return (
    <div className="space-y-8 max-w-5xl">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-100">
          Educational Scam Intelligence Center
        </h1>
        <p className="text-sm text-slate-400">
          Learn common fraud tactics targeting students and job seekers. All examples
          below are fictional educational illustrations, not allegations against real
          organizations.
        </p>
      </header>

      {/* Interactive Spot the Red Flag Mini-Quiz */}
      <section
        aria-labelledby="quiz-heading"
        className="rounded-2xl bg-[#0F172A]/90 border border-slate-800 p-6 space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              id="quiz-heading"
              className="text-lg font-semibold text-slate-100 flex items-center gap-2"
            >
              <HelpCircle className="w-5 h-5 text-cyan-400" aria-hidden="true" />
              <span>Interactive Challenge: Spot the Red Flag</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Deterministic training scenarios to sharpen your verification instincts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-cyan-300 tabular-nums">
              Score: {correctCount} / {RED_FLAG_QUIZ.length} ({answeredCount} answered)
            </span>
            {answeredCount > 0 && (
              <button
                type="button"
                onClick={() => setAnswers({})}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1221] border border-slate-700 hover:border-slate-600 text-xs text-slate-200"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reset Quiz</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {RED_FLAG_QUIZ.map((q, idx) => {
            const pickedId = answers[q.id];
            const pickedOption = q.options.find((o) => o.id === pickedId);

            return (
              <div
                key={q.id}
                className="rounded-xl bg-[#0B1221] border border-slate-800 p-4 space-y-3"
              >
                <div className="text-xs font-mono text-cyan-400">
                  Scenario {idx + 1} · {q.scenarioTitle}
                </div>
                <div className="p-3 rounded-lg bg-[#070B14] border border-slate-800 text-xs font-mono text-slate-200 leading-relaxed">
                  {q.snippet}
                </div>
                <p className="text-sm font-medium text-slate-100">{q.question}</p>

                <div className="space-y-2">
                  {q.options.map((opt) => {
                    const isPicked = pickedId === opt.id;
                    let btnClass =
                      'bg-[#070B14] border-slate-800 text-slate-300 hover:border-slate-600';
                    if (isPicked) {
                      btnClass = opt.isCorrect
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                        : 'bg-red-500/15 border-red-500/40 text-red-200';
                    }

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))
                        }
                        className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs transition-colors flex items-center justify-between gap-2 ${btnClass}`}
                      >
                        <span>{opt.label}</span>
                        {isPicked &&
                          (opt.isCorrect ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400 shrink-0" aria-hidden="true" />
                          ))}
                      </button>
                    );
                  })}
                </div>

                {pickedOption && (
                  <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-700 text-xs space-y-1">
                    <p
                      className={
                        pickedOption.isCorrect
                          ? 'text-emerald-300 font-medium'
                          : 'text-amber-300 font-medium'
                      }
                    >
                      {pickedOption.feedback}
                    </p>
                    <p className="text-slate-400">Key takeaway: {q.takeaway}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Scam Pattern Dossiers */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" aria-hidden="true" />
            <span>Common Scam Archetypes</span>
          </h2>

          <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-[#0B1221] border border-slate-800">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-cyan-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGuides.map((guide) => (
            <article
              key={guide.id}
              className="rounded-xl bg-[#0F172A]/85 border border-slate-800 p-5 space-y-3"
            >
              <div className="text-xs font-mono text-cyan-400">{guide.category}</div>
              <h3 className="text-base font-semibold text-slate-100">{guide.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{guide.summary}</p>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-amber-300 block">
                  Warning Signs
                </span>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                  {guide.redFlags.map((rf, i) => (
                    <li key={i}>{rf}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-emerald-300 block">
                  How to Verify
                </span>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                  {guide.verificationSteps.map((vs, i) => (
                    <li key={i}>{vs}</li>
                  ))}
                </ul>
              </div>

              <div className="p-2.5 rounded-lg bg-[#070B14] border border-slate-800 text-[11px] font-mono text-slate-400">
                {guide.educationalExample}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
