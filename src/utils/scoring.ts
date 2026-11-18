import type {
  Finding,
  FindingSeverity,
  RiskLevel,
  ScoreBreakdownItem,
} from '../types/analysis.ts';

export const SEVERITY_WEIGHTS: Record<FindingSeverity, number> = {
  critical: 35,
  high: 22,
  medium: 12,
  low: 5,
};

export interface ScoringEvaluation {
  riskScore: number | null;
  riskLevel: RiskLevel;
  scoreBreakdown: ScoreBreakdownItem[];
  scoringExplanation: string;
  deduplicatedCount: number;
}

function normalizeDedupKey(finding: Finding): string {
  const typeNorm = finding.type.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');
  const quoteNorm = (finding.evidenceQuote ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .slice(0, 64);
  return `${typeNorm}::${quoteNorm}`;
}

export function mapScoreToRiskLevel(score: number): Exclude<RiskLevel, 'insufficient_evidence'> {
  if (score <= 24) return 'low';
  if (score <= 49) return 'caution';
  if (score <= 74) return 'elevated';
  return 'high';
}

export function getRiskLevelLabel(level: RiskLevel): string {
  switch (level) {
    case 'low':
      return 'Low concern';
    case 'caution':
      return 'Some warning signs';
    case 'elevated':
      return 'Elevated risk';
    case 'high':
      return 'High risk';
    case 'insufficient_evidence':
      return 'Insufficient evidence';
  }
}

export function calculateExplainableRiskScore(params: {
  findings: Finding[];
  insufficientEvidence: boolean;
  inputCharCount?: number;
  hasUrlOrEmail?: boolean;
}): ScoringEvaluation {
  const { findings, insufficientEvidence, inputCharCount = 200, hasUrlOrEmail = false } = params;

  // Enforce insufficient evidence when text is too brief and lacks actionable identifiers
  const tooBriefWithoutSignals =
    inputCharCount < 45 && !hasUrlOrEmail && findings.length === 0;

  if (insufficientEvidence || tooBriefWithoutSignals) {
    return {
      riskScore: null,
      riskLevel: 'insufficient_evidence',
      scoreBreakdown: [],
      scoringExplanation:
        'Insufficient reliable context is available to compute a meaningful numeric warning score. Provide the full message, sender details, or official link for deeper evaluation.',
      deduplicatedCount: 0,
    };
  }

  const seenKeys = new Set<string>();
  const seenQuotes = new Set<string>();
  const scoreBreakdown: ScoreBreakdownItem[] = [];
  let rawScore = 0;
  let countedCount = 0;

  for (const finding of findings) {
    const key = normalizeDedupKey(finding);
    const quoteKey = (finding.evidenceQuote ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');

    const isDuplicateKey = seenKeys.has(key);
    const isDuplicateQuoteCategory =
      quoteKey.length > 12 && seenQuotes.has(`${finding.category}::${quoteKey}`);

    const weight = SEVERITY_WEIGHTS[finding.severity];

    if (isDuplicateKey || isDuplicateQuoteCategory) {
      scoreBreakdown.push({
        findingId: finding.id,
        label: finding.type,
        severity: finding.severity,
        weight: 0,
        counted: false,
        reason: 'Deduplicated to avoid counting the same warning signal twice.',
      });
      continue;
    }

    seenKeys.add(key);
    if (quoteKey.length > 12) {
      seenQuotes.add(`${finding.category}::${quoteKey}`);
    }

    rawScore += weight;
    countedCount += 1;
    scoreBreakdown.push({
      findingId: finding.id,
      label: finding.type,
      severity: finding.severity,
      weight,
      counted: true,
    });
  }

  const boundedScore = Math.max(0, Math.min(100, rawScore));
  const riskLevel = mapScoreToRiskLevel(boundedScore);

  const scoringExplanation =
    countedCount === 0
      ? 'No concrete warning indicators were detected in the supplied evidence (0/100). This reflects observed content signals only, not a guarantee of legitimacy.'
      : `Score (${boundedScore}/100) sums ${countedCount} deduplicated warning weight${
          countedCount === 1 ? '' : 's'
        } (Critical=35, High=22, Medium=12, Low=5), capped at 100. It measures observed warning indicators, not a statistical probability of fraud.`;

  return {
    riskScore: boundedScore,
    riskLevel,
    scoreBreakdown,
    scoringExplanation,
    deduplicatedCount: findings.length - countedCount,
  };
}
