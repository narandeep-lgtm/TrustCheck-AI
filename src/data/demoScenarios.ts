import type { DemoScenario, Finding } from '../types/analysis.ts';
import { analyzeDomainAndEmailSignals } from '../utils/domainIntel.ts';
import { calculateExplainableRiskScore } from '../utils/scoring.ts';

function buildOfflinePreset(params: {
  scenarioId: string;
  title: string;
  category: 'job' | 'internship' | 'scholarship' | 'other';
  claimedOrganization: string | null;
  sampleText: string;
  findings: Finding[];
  insufficientEvidence?: boolean;
  summary: string;
  simpleSummary: string;
  positiveSignals: string[];
  missingEvidence: string[];
  recommendedActions: string[];
  finalRecommendation:
    | 'proceed_ordinary_verification'
    | 'verify_carefully'
    | 'avoid_responding_until_resolved'
    | 'do_not_share_money_or_sensitive_info';
  verificationSummary: string;
}) {
  const domainIntel = analyzeDomainAndEmailSignals({
    text: params.sampleText,
    claimedOrganization: params.claimedOrganization,
  });

  const scoring = calculateExplainableRiskScore({
    findings: params.findings,
    insufficientEvidence: Boolean(params.insufficientEvidence),
    inputCharCount: params.sampleText.length,
    hasUrlOrEmail:
      domainIntel.extractedUrls.length > 0 || domainIntel.extractedEmails.length > 0,
  });

  return {
    id: `offline-${params.scenarioId}`,
    createdAt: '2026-11-18T00:00:00.000Z',
    inputMode: 'text' as const,
    language: 'en' as const,
    isOfflineDemo: true,
    demoScenarioId: params.scenarioId,
    title: params.title,
    category: params.category,
    claimedOrganization: params.claimedOrganization,
    riskScore: scoring.riskScore,
    riskLevel: scoring.riskLevel,
    assessmentBasis: 'content_only' as const,
    summary: params.summary,
    simpleSummary: params.simpleSummary,
    findings: params.findings,
    positiveSignals: params.positiveSignals,
    missingEvidence: params.missingEvidence,
    verification: {
      status: 'unavailable' as const,
      checkedAt: null,
      summary: params.verificationSummary,
      sources: [],
      groundingUsed: false,
      limitationNote:
        'Offline Demo Mode: Displayed using deterministic preset data without calling Gemini or live Google Search.',
    },
    recommendedActions: params.recommendedActions,
    finalRecommendation: params.finalRecommendation,
    limitations: [
      'This result is an Offline Demo preset for reliable demonstration and did not query Gemini or live web sources.',
      'Domain and email observations are heuristic pattern checks only.',
    ],
    scoreBreakdown: scoring.scoreBreakdown,
    scoringExplanation: scoring.scoringExplanation,
    domainIntel,
    sourceText: params.sampleText,
  };
}

const SCENARIO_A_TEXT = `OFFICIAL NOTIFICATION: Northbridge University Global Merit Scholarship 2026

Dear Candidate,
Congratulations! Following our special committee review, you have been granted GUARANTEED full tuition + $2,400 monthly living stipend under the Northbridge Global Merit Scholarship without requiring an interview.

To lock your seat before the quota closes, you must transfer a refundable registration & visa file fee of $185 within 4 hours to our Regional Coordinator's personal account:
Account Title: Tariq Mahmood (Coordinator)
Bank / Wallet: EasyPay Personal #0300-5550192

Send your payment receipt immediately to northbridge.scholarship.desk@gmail.com. Failure to pay within 4 hours will permanently cancel your award and transfer it to the next applicant. Do not share this confidential offer letter with external departments.`;

const SCENARIO_A_FINDINGS: Finding[] = [
  {
    id: 'a-1',
    type: 'Payment to personal account',
    category: 'financial',
    severity: 'high',
    evidenceQuote:
      "transfer a refundable registration & visa file fee of $185 within 4 hours to our Regional Coordinator's personal account",
    explanation:
      'Legitimate university scholarships do not collect registration or visa processing fees into an individual coordinator’s personal bank or mobile wallet account.',
    simpleExplanation:
      'Real universities never ask you to send scholarship fees to someone’s personal mobile wallet or bank account.',
    whySuspicious:
      'Payments to personal accounts cannot be traced to an accredited university bursar and are rarely recoverable.',
    recommendation:
      'Do not send any money. Contact the official university admissions or financial aid office via their verified website.',
    verificationMethod:
      'Look up Northbridge University independently via official academic directories and check their scholarship fee policies.',
  },
  {
    id: 'a-2',
    type: 'Free webmail domain for institutional claim',
    category: 'identity',
    severity: 'high',
    evidenceQuote: 'northbridge.scholarship.desk@gmail.com',
    explanation:
      'The message claims to represent an official university scholarship committee but directs replies to a free @gmail.com address rather than an institutional .edu or university domain.',
    simpleExplanation:
      'A real university office sends replies to an official school email address, not a free Gmail account.',
    whySuspicious:
      'Anyone can register a free Gmail address with an institution’s name in the prefix.',
    recommendation:
      'Verify whether the university publishes official scholarship contact emails on its verified website.',
    verificationMethod:
      'Search for the official university domain and compare the contact email domain.',
  },
  {
    id: 'a-3',
    type: 'Artificial urgency and threat of forfeiture',
    category: 'psychological',
    severity: 'medium',
    evidenceQuote:
      'Failure to pay within 4 hours will permanently cancel your award',
    explanation:
      'Extreme 4-hour deadlines paired with threats of permanent cancellation are designed to stop applicants from verifying the claim.',
    simpleExplanation:
      'Scammers rush you with tiny deadlines so you panic and pay before checking with anyone.',
    whySuspicious:
      'Authentic merit scholarships provide days or weeks to accept an offer and never tie seat retention to a 4-hour payment.',
    recommendation:
      'Ignore arbitrary countdowns and take time to verify through official channels.',
    verificationMethod:
      'Check published academic calendar and scholarship acceptance deadlines.',
  },
  {
    id: 'a-4',
    type: 'Guaranteed selection without interview or application match',
    category: 'psychological',
    severity: 'medium',
    evidenceQuote:
      'you have been granted GUARANTEED full tuition + $2,400 monthly living stipend under the Northbridge Global Merit Scholarship without requiring an interview',
    explanation:
      'Promising guaranteed high-value funding without a formal interview or transparent selection trail is a classic lure.',
    simpleExplanation:
      'Promising guaranteed free money and tuition with zero interview is a major warning sign.',
    whySuspicious:
      'Full-tuition fellowships are competitive and follow documented admission steps.',
    recommendation:
      'Confirm whether you actually applied to this program and verify selection status on an official portal.',
    verificationMethod:
      'Sign in directly to the institution’s official admissions portal (by typing the URL yourself).',
  },
  {
    id: 'a-5',
    type: 'Secrecy request discouraging independent checks',
    category: 'psychological',
    severity: 'medium',
    evidenceQuote:
      'Do not share this confidential offer letter with external departments.',
    explanation:
      'Asking applicants to hide an offer letter from external university departments prevents them from checking its authenticity.',
    simpleExplanation:
      'Telling you to keep the offer secret from other university offices is meant to stop you from fact-checking it.',
    whySuspicious:
      'Genuine scholarship offices collaborate openly with registrar, international, and financial aid departments.',
    recommendation:
      'Forward the notice to the institution’s official student admissions or security office to verify.',
    verificationMethod:
      'Contact the university registrar or international office directly.',
  },
];

const SCENARIO_B_TEXT = `Kestrel Systems Engineering — Summer 2027 Software Engineering Intern

Role Overview:
Kestrel Systems is hiring Summer 2027 Software Engineering Interns (12 weeks, hybrid in Austin, TX or remote within region).

Requirements:
- Currently enrolled in a B.S. or M.S. program in Computer Science, Software Engineering, or related field.
- Familiarity with TypeScript, Python, or Go, and basic automated testing.
- Availability for a 30-minute technical phone screen and two 45-minute engineering interviews.

Compensation & Process:
- Hourly stipend: $34/hour, paid bi-weekly via standard payroll.
- No application, background check, or equipment fee is ever charged to candidates.
- Apply via our official portal at https://careers.kestrelsyst.example/internships-2027 or email university-recruiting@kestrelsyst.example with your resume and GitHub link.
- Application window closes January 31, 2027.`;

const SCENARIO_C_TEXT = `URGENT: Campus Placement & Internship Stipend Activation

Hello Student,
Your internship placement with Meridian Tech Partners has been pre-approved. However, our HR verification gateway detected an incomplete payroll token.

To receive your $1,200 onboarding stipend today, verify your student portal credentials immediately at:
https://portal-verify.campus-onboarding.xyz/login?redirect=stipend

You must enter your University Email Password and reply to this message with the 6-digit SMS OTP code sent to your phone within 15 minutes so our agent can finalize your bank link.`;

const SCENARIO_C_FINDINGS: Finding[] = [
  {
    id: 'c-1',
    type: 'Credential and OTP theft request',
    category: 'privacy',
    severity: 'critical',
    evidenceQuote:
      'enter your University Email Password and reply to this message with the 6-digit SMS OTP code sent to your phone within 15 minutes',
    explanation:
      'Asking for a password and a one-time verification code (OTP) is an active account takeover attempt. No legitimate employer or placement office ever needs your password or OTP.',
    simpleExplanation:
      'Anyone asking for your email password and SMS verification code is trying to steal your account.',
    whySuspicious:
      'An attacker with your password and OTP can hijack your email, university portal, and linked financial accounts.',
    recommendation:
      'Do not enter your password or share any OTP code. If you already interacted with the link, change your password immediately and contact campus IT.',
    verificationMethod:
      'Contact your university IT helpdesk and official career center directly.',
  },
  {
    id: 'c-2',
    type: 'Deceptive subdomain and unusual domain extension',
    category: 'identity',
    severity: 'high',
    evidenceQuote:
      'https://portal-verify.campus-onboarding.xyz/login?redirect=stipend',
    explanation:
      'The URL places "portal-verify" on an unverified .xyz domain rather than an official university (.edu) or employer domain.',
    simpleExplanation:
      'The login link goes to a strange ".xyz" website instead of your university’s real website.',
    whySuspicious:
      'Phishing kits frequently use lookalike subdomains on low-cost .xyz domains to mimic institutional login pages.',
    recommendation:
      'Never sign in through links received in unexpected messages. Navigate to your official portal manually.',
    verificationMethod:
      'Compare the root domain against your institution’s published domain.',
  },
  {
    id: 'c-3',
    type: 'Artificial 15-minute urgency tied to stipend payout',
    category: 'psychological',
    severity: 'medium',
    evidenceQuote:
      'To receive your $1,200 onboarding stipend today, verify your student portal credentials immediately',
    explanation:
      'Combining an instant $1,200 payout promise with a 15-minute countdown pressures victims into bypassing caution.',
    simpleExplanation:
      'Promising quick cash today while rushing you with a 15-minute timer is a classic phishing trick.',
    whySuspicious:
      'Payroll onboarding follows formal HR verification and never expires in 15 minutes.',
    recommendation:
      'Verify any internship placement directly through your university career portal.',
    verificationMethod:
      'Check your official career services office.',
  },
];

const SCENARIO_D_TEXT = `Congratulations, you are selected.`;

const SCENARIO_E_TEXT = `Call for Fellows — Meridian Policy Research Fellowship (Spring Cohort)

We are inviting early-career graduates and final-year students to apply for the Spring Meridian Policy Research Fellowship. Selected fellows work remotely on comparative public policy briefs for 10 weeks and receive a modest research stipend upon completion.

Eligibility:
- Strong academic writing sample (1,000 words)
- Updated CV and brief statement of interest

To apply, submit your details using the intake form here: https://bit.ly/meridian-apply-2026 before the cohort review begins next month.`;

const SCENARIO_E_FINDINGS: Finding[] = [
  {
    id: 'e-1',
    type: 'Shortened application URL hides destination',
    category: 'consistency',
    severity: 'medium',
    evidenceQuote: 'https://bit.ly/meridian-apply-2026',
    explanation:
      'The announcement relies on a shortened bit.ly link instead of linking transparently to an institutional domain, making it impossible to confirm the host organization from the text alone.',
    simpleExplanation:
      'The application link is shortened with bit.ly, so you cannot see which website it actually opens.',
    whySuspicious:
      'While legitimate small programs occasionally use short links, they also hide whether a form is hosted on an official site or an anonymous page.',
    recommendation:
      'Verify the sponsoring organization independently before submitting personal documents or writing samples.',
    verificationMethod:
      'Search for "Meridian Policy Research Fellowship" separately to locate an official organization website.',
  },
  {
    id: 'e-2',
    type: 'Missing organizational contact details and legal identity',
    category: 'identity',
    severity: 'low',
    evidenceQuote: 'Meridian Policy Research Fellowship',
    explanation:
      'The post uses professional language and makes no payment or credential requests, yet omits an official website, physical address, named program directors, or institutional email.',
    simpleExplanation:
      'The post sounds professional and asks for no money, but it leaves out an official website, email, or organization address.',
    whySuspicious:
      'Without verifiable institutional details, you cannot tell whether this is a newly formed legitimate initiative or an unverified data-collection form.',
    recommendation:
      'Look up the organization’s leadership, past cohorts, and official domain before sharing detailed personal records.',
    verificationMethod:
      'Search public fellowship listings, LinkedIn company pages, and academic partner announcements.',
  },
];

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'scenario-a',
    code: 'Scenario A',
    title: 'Suspicious Scholarship Offer',
    subtitle: 'Guaranteed full tuition + urgent $185 fee to a personal wallet',
    category: 'scholarship',
    inputMode: 'text',
    sampleText: SCENARIO_A_TEXT,
    expectedHighlights: [
      'fee of $185',
      'within 4 hours',
      'personal account',
      'gmail.com',
    ],
    offlinePreset: buildOfflinePreset({
      scenarioId: 'scenario-a',
      title: 'Northbridge Global Merit Scholarship Notice',
      category: 'scholarship',
      claimedOrganization: 'Northbridge University',
      sampleText: SCENARIO_A_TEXT,
      findings: SCENARIO_A_FINDINGS,
      summary:
        'Multiple high-severity warning indicators detected: the notice demands an urgent $185 payment to an individual’s personal account, uses a free Gmail address for an institutional claim, guarantees selection without an interview, and asks the recipient to keep the letter secret.',
      simpleSummary:
        'This scholarship message shows strong scam warning signs. It rushes you to pay $185 within 4 hours into a personal account and uses a free Gmail address instead of an official university email.',
      positiveSignals: [],
      missingEvidence: [
        'Official university (.edu or institutional) domain email or portal link',
        'Verifiable admissions application reference number',
      ],
      recommendedActions: [
        'Do not transfer any money to the listed personal bank or wallet account.',
        'Contact Northbridge University’s official financial aid or admissions office using contact details found independently.',
        'Report the suspicious message to your local cybercrime or university security desk if you received it unexpectedly.',
      ],
      finalRecommendation: 'do_not_share_money_or_sensitive_info',
      verificationSummary:
        'Independent search verification was not performed in Offline Demo mode.',
    }),
  },
  {
    id: 'scenario-b',
    code: 'Scenario B',
    title: 'Legitimate-Looking Internship',
    subtitle: 'Consistent domain, transparent interview steps, zero fee requests',
    category: 'internship',
    inputMode: 'text',
    sampleText: SCENARIO_B_TEXT,
    expectedHighlights: [],
    offlinePreset: buildOfflinePreset({
      scenarioId: 'scenario-b',
      title: 'Kestrel Systems Summer 2027 SWE Internship',
      category: 'internship',
      claimedOrganization: 'Kestrel Systems Engineering',
      sampleText: SCENARIO_B_TEXT,
      findings: [],
      summary:
        'No deceptive financial, credential, or urgency warning signs were observed in the submitted text. The posting uses a consistent domain, describes realistic interview stages, and explicitly states no fees are charged. Independent verification is still recommended before applying.',
      simpleSummary:
        'No warning signs appeared in this internship post. It lists clear requirements, real interview steps, and asks for no money—though you should still double-check the company website yourself.',
      positiveSignals: [
        'Clear technical eligibility criteria and structured multi-stage interview process',
        'Matching corporate domain in both application URL and recruiting email',
        'Realistic compensation terms paid via standard payroll with zero candidate fees',
      ],
      missingEvidence: [
        'Independent live confirmation that kestrelsyst.example is an active registered employer',
      ],
      recommendedActions: [
        'Confirm the role is listed directly on the employer’s official careers page.',
        'Proceed with ordinary application precautions—avoid sharing bank details or national ID numbers until a formal HR offer is verified.',
      ],
      finalRecommendation: 'proceed_ordinary_verification',
      verificationSummary:
        'Content-only assessment in Offline Demo mode. Opportunity was not independently verified against live web sources.',
    }),
  },
  {
    id: 'scenario-c',
    code: 'Scenario C',
    title: 'Credential Phishing Alert',
    subtitle: 'Asks for student email password and SMS OTP on a .xyz subdomain',
    category: 'internship',
    inputMode: 'text',
    sampleText: SCENARIO_C_TEXT,
    expectedHighlights: ['Password', 'OTP code', 'within 15 minutes', '.xyz'],
    offlinePreset: buildOfflinePreset({
      scenarioId: 'scenario-c',
      title: 'Campus Placement Stipend Verification Phishing',
      category: 'internship',
      claimedOrganization: 'Meridian Tech Partners',
      sampleText: SCENARIO_C_TEXT,
      findings: SCENARIO_C_FINDINGS,
      summary:
        'Critical security risk detected: the message explicitly requests your university email password and an SMS one-time verification code (OTP) through a deceptive .xyz subdomain under a 15-minute deadline.',
      simpleSummary:
        'Danger: this message is trying to steal your password and SMS verification code using a fake login link and a 15-minute rush.',
      positiveSignals: [],
      missingEvidence: [
        'Official university career portal link (.edu or institutional domain)',
      ],
      recommendedActions: [
        'Do not click the link, enter your password, or share any SMS OTP code with anyone.',
        'If you already entered credentials on that page, change your university password immediately and enable/review 2FA.',
        'Report the phishing message to your university IT security team.',
      ],
      finalRecommendation: 'do_not_share_money_or_sensitive_info',
      verificationSummary:
        'Independent search verification was not performed in Offline Demo mode.',
    }),
  },
  {
    id: 'scenario-d',
    code: 'Scenario D',
    title: 'Insufficient Information',
    subtitle: 'Single-line snippet lacking organization, link, or context',
    category: 'other',
    inputMode: 'text',
    sampleText: SCENARIO_D_TEXT,
    expectedHighlights: [],
    offlinePreset: buildOfflinePreset({
      scenarioId: 'scenario-d',
      title: 'Uncontextualized Selection Snippet',
      category: 'other',
      claimedOrganization: null,
      sampleText: SCENARIO_D_TEXT,
      findings: [],
      insufficientEvidence: true,
      summary:
        'Insufficient evidence to score: a four-word phrase ("Congratulations, you are selected.") does not contain an organization name, sender address, link, financial request, or context needed to evaluate risk.',
      simpleSummary:
        'There is not enough information here to judge whether this is safe or risky. Please paste the full message, sender email, or website link.',
      positiveSignals: [],
      missingEvidence: [
        'Sender email address, phone number, or platform context',
        'Name of the organization, program, or job title',
        'Application link, deadline, or requested next steps',
      ],
      recommendedActions: [
        'Paste the complete message, screenshot, or PDF notice so TrustCheck AI can evaluate sender identity and terms.',
        'Do not reply with personal details until you confirm which organization sent the message.',
      ],
      finalRecommendation: 'verify_carefully',
      verificationSummary:
        'Cannot perform external verification without an organization name or URL.',
    }),
  },
  {
    id: 'scenario-e',
    code: 'Scenario E',
    title: 'Realistic Ambiguous Offer',
    subtitle: 'Professional tone, no fees, but shortened link and sparse org proof',
    category: 'scholarship',
    inputMode: 'text',
    sampleText: SCENARIO_E_TEXT,
    expectedHighlights: ['bit.ly/meridian-apply-2026'],
    offlinePreset: buildOfflinePreset({
      scenarioId: 'scenario-e',
      title: 'Meridian Policy Research Fellowship Call',
      category: 'scholarship',
      claimedOrganization: 'Meridian Policy Research',
      sampleText: SCENARIO_E_TEXT,
      findings: SCENARIO_E_FINDINGS,
      summary:
        'Mixed/ambiguous signals: the fellowship call uses realistic academic expectations and requests no fees or sensitive credentials, but relies on a shortened bit.ly URL and omits an official domain or institutional contact details.',
      simpleSummary:
        'This announcement looks reasonable and does not ask for money, but it uses a hidden bit.ly link and leaves out an official website. Check who runs it before sharing personal info.',
      positiveSignals: [
        'Requests standard academic materials (writing sample, CV) rather than fees or bank credentials',
        'Reasonable timeline ("next month") without artificial countdown pressure',
      ],
      missingEvidence: [
        'Official institutional website or organizational domain',
        'Named faculty advisors, physical address, or verifiable contact email',
      ],
      recommendedActions: [
        'Search independently for the organization’s official website and past fellowship cohorts before opening the shortened link.',
        'Avoid including national ID numbers, home addresses, or financial info in your initial CV submission.',
      ],
      finalRecommendation: 'verify_carefully',
      verificationSummary:
        'Absence of web confirmation in Offline Demo mode is not proof of fraud; independent lookup is recommended.',
    }),
  },
];
