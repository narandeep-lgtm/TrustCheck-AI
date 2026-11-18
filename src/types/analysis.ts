import { z } from 'zod';

export const INPUT_MODES = ['text', 'image', 'pdf', 'url'] as const;
export type InputMode = (typeof INPUT_MODES)[number];

export const LANGUAGES = ['en', 'ur', 'roman_ur'] as const;
export type LanguagePreference = (typeof LANGUAGES)[number];

export const RISK_LEVELS = [
  'low',
  'caution',
  'elevated',
  'high',
  'insufficient_evidence',
] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
export type FindingSeverity = (typeof SEVERITIES)[number];

export const FINDING_CATEGORIES = [
  'identity',
  'financial',
  'psychological',
  'privacy',
  'consistency',
] as const;
export type FindingCategory = (typeof FINDING_CATEGORIES)[number];

export const VERIFICATION_STATUSES = [
  'supported',
  'contradicted',
  'unconfirmed',
  'unavailable',
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const FINAL_RECOMMENDATIONS = [
  'proceed_ordinary_verification',
  'verify_carefully',
  'avoid_responding_until_resolved',
  'do_not_share_money_or_sensitive_info',
] as const;
export type FinalRecommendationKey = (typeof FINAL_RECOMMENDATIONS)[number];

export const VerificationSourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  finding: z.string().default('External reference returned by Google Search grounding.'),
  sourceType: z.enum(['official', 'third_party']).default('third_party'),
});
export type VerificationSource = z.infer<typeof VerificationSourceSchema>;

export const FindingSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  category: z.enum(FINDING_CATEGORIES).default('consistency'),
  severity: z.enum(SEVERITIES),
  evidenceQuote: z.string().nullable(),
  explanation: z.string().min(1),
  simpleExplanation: z.string().optional(),
  whySuspicious: z.string().optional(),
  recommendation: z.string().min(1),
  verificationMethod: z.string().optional(),
});
export type Finding = z.infer<typeof FindingSchema>;

export const ScoreBreakdownItemSchema = z.object({
  findingId: z.string(),
  label: z.string(),
  severity: z.enum(SEVERITIES),
  weight: z.number(),
  counted: z.boolean(),
  reason: z.string().optional(),
});
export type ScoreBreakdownItem = z.infer<typeof ScoreBreakdownItemSchema>;

export const DomainFlagSchema = z.object({
  code: z.string(),
  severity: z.enum(SEVERITIES),
  label: z.string(),
  detail: z.string(),
  target: z.string(),
});
export type DomainFlag = z.infer<typeof DomainFlagSchema>;

export const DomainIntelReportSchema = z.object({
  extractedUrls: z.array(z.string()),
  extractedEmails: z.array(z.string()),
  domainsAnalyzed: z.array(z.string()),
  httpsPresent: z.boolean().nullable(),
  flags: z.array(DomainFlagSchema),
  orgDomainComparison: z.string(),
  heuristicNotice: z.string(),
});
export type DomainIntelReport = z.infer<typeof DomainIntelReportSchema>;

export const GeminiRawAnalysisSchema = z.object({
  title: z.string().min(1).default('Opportunity Risk Assessment'),
  category: z.enum(['job', 'internship', 'scholarship', 'other']).default('other'),
  claimedOrganization: z.string().nullable().default(null),
  insufficientEvidence: z.boolean().default(false),
  insufficientEvidenceReason: z.string().nullable().optional(),
  riskScore: z.number().min(0).max(100).nullable().optional(),
  riskLevel: z.enum(RISK_LEVELS).optional(),
  summary: z.string().min(1),
  simpleSummary: z.string().optional(),
  findings: z.array(FindingSchema).default([]),
  positiveSignals: z.array(z.string()).default([]),
  missingEvidence: z.array(z.string()).default([]),
  verificationSummary: z.string().optional(),
  verificationStatusHint: z.enum(VERIFICATION_STATUSES).optional(),
  recommendedActions: z.array(z.string()).default([]),
  finalRecommendation: z
    .enum(FINAL_RECOMMENDATIONS)
    .default('verify_carefully'),
  limitations: z.array(z.string()).default([]),
  extractedText: z.string().optional(),
  unreadableRegions: z.string().nullable().optional(),
  documentDetails: z
    .object({
      documentType: z.string().optional(),
      detectedDates: z.array(z.string()).optional(),
      detectedContacts: z.array(z.string()).optional(),
    })
    .optional(),
});
export type GeminiRawAnalysis = z.infer<typeof GeminiRawAnalysisSchema>;

export const AnalysisResultSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  inputMode: z.enum(INPUT_MODES),
  language: z.enum(LANGUAGES),
  isOfflineDemo: z.boolean().default(false),
  demoScenarioId: z.string().optional(),
  title: z.string(),
  category: z.enum(['job', 'internship', 'scholarship', 'other']),
  claimedOrganization: z.string().nullable(),
  riskScore: z.number().min(0).max(100).nullable(),
  riskLevel: z.enum(RISK_LEVELS),
  assessmentBasis: z.enum(['content_only', 'content_and_external_sources']),
  summary: z.string(),
  simpleSummary: z.string(),
  findings: z.array(FindingSchema),
  positiveSignals: z.array(z.string()),
  missingEvidence: z.array(z.string()),
  verification: z.object({
    status: z.enum(VERIFICATION_STATUSES),
    checkedAt: z.string().nullable(),
    summary: z.string(),
    sources: z.array(VerificationSourceSchema),
    groundingUsed: z.boolean(),
    limitationNote: z.string(),
  }),
  recommendedActions: z.array(z.string()),
  finalRecommendation: z.enum(FINAL_RECOMMENDATIONS),
  limitations: z.array(z.string()),
  scoreBreakdown: z.array(ScoreBreakdownItemSchema),
  scoringExplanation: z.string(),
  domainIntel: DomainIntelReportSchema,
  sourceText: z.string().optional(),
  extractedText: z.string().optional(),
  unreadableRegions: z.string().nullable().optional(),
  documentDetails: z
    .object({
      documentType: z.string().optional(),
      detectedDates: z.array(z.string()).optional(),
      detectedContacts: z.array(z.string()).optional(),
    })
    .optional(),
});
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

export interface FollowUpMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: VerificationSource[];
  usedFreshVerification?: boolean;
  createdAt: string;
}

export interface DemoScenario {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  category: 'job' | 'internship' | 'scholarship' | 'other';
  inputMode: InputMode;
  sampleText: string;
  sampleUrl?: string;
  expectedHighlights: string[];
  offlinePreset: AnalysisResult;
}

export interface AppSettings {
  language: LanguagePreference;
  enableSearchGrounding: boolean;
  explainSimplyByDefault: boolean;
  optInLocalHistory: boolean;
}
