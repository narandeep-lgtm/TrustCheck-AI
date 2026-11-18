import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import type { RiskLevel } from '../types/analysis';
import { getRiskLevelLabel } from '../utils/scoring';

interface RiskGaugeProps {
  score: number | null;
  level: RiskLevel;
}

export function getRiskPalette(level: RiskLevel) {
  switch (level) {
    case 'low':
      return {
        stroke: '#10B981',
        textClass: 'text-emerald-400',
        borderClass: 'border-emerald-500/30',
        bgClass: 'bg-emerald-500/10',
        Icon: CheckCircle2,
      };
    case 'caution':
      return {
        stroke: '#F59E0B',
        textClass: 'text-amber-400',
        borderClass: 'border-amber-500/30',
        bgClass: 'bg-amber-500/10',
        Icon: AlertTriangle,
      };
    case 'elevated':
      return {
        stroke: '#F97316',
        textClass: 'text-orange-400',
        borderClass: 'border-orange-500/30',
        bgClass: 'bg-orange-500/10',
        Icon: ShieldAlert,
      };
    case 'high':
      return {
        stroke: '#EF4444',
        textClass: 'text-red-400',
        borderClass: 'border-red-500/30',
        bgClass: 'bg-red-500/10',
        Icon: AlertOctagon,
      };
    case 'insufficient_evidence':
      return {
        stroke: '#64748B',
        textClass: 'text-slate-300',
        borderClass: 'border-slate-600/40',
        bgClass: 'bg-slate-800/60',
        Icon: HelpCircle,
      };
  }
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score, level }) => {
  const palette = getRiskPalette(level);
  const { Icon } = palette;
  const label = getRiskLevelLabel(level);

  const radius = 54;
  const circumference = Math.PI * radius; // semicircle arc length
  const normalized = score === null ? 0 : Math.max(0, Math.min(100, score));
  const dashOffset = circumference - (normalized / 100) * circumference;

  return (
    <div
      className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#0B1221] border border-slate-800/80"
      data-testid="risk-gauge"
      data-risk-level={level}
    >
      <div className="relative w-40 h-24 flex items-end justify-center">
        <svg
          viewBox="0 0 140 80"
          className="w-40 h-24 overflow-visible"
          aria-hidden="true"
        >
          <path
            d="M 16 70 A 54 54 0 0 1 124 70"
            fill="none"
            stroke="#1E293B"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {score !== null && (
            <path
              d="M 16 70 A 54 54 0 0 1 124 70"
              fill="none"
              stroke={palette.stroke}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 450ms cubic-bezier(0.16, 1, 0.3, 1)' }}
            />
          )}
        </svg>
        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
          {score === null ? (
            <span className="font-mono text-lg font-semibold text-slate-300 tabular-nums">
              N/A
            </span>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className={`font-mono text-3xl font-bold tabular-nums ${palette.textClass}`}>
                {score}
              </span>
              <span className="font-mono text-xs text-slate-400 tabular-nums">/100</span>
            </div>
          )}
        </div>
      </div>

      <div
        className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${palette.bgClass} ${palette.borderClass} ${palette.textClass}`}
      >
        <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </div>
      <p className="mt-2 text-[11px] text-slate-400 text-center leading-relaxed">
        {score === null
          ? 'Not enough context for a numeric indicator'
          : 'Observed warning indicator (not a probability)'}
      </p>
    </div>
  );
};
