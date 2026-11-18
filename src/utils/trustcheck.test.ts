import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateExplainableRiskScore, mapScoreToRiskLevel } from './scoring.ts';
import { analyzeDomainAndEmailSignals } from './domainIntel.ts';
import { validateTextInput, validateUrlInput, validateUploadedFileMeta } from './validation.ts';
import { buildHighlightedSegments } from './evidenceHighlighter.ts';
import { DEMO_SCENARIOS } from '../data/demoScenarios.ts';

test('scoring maps thresholds accurately and handles insufficient evidence', () => {
  assert.equal(mapScoreToRiskLevel(0), 'low');
  assert.equal(mapScoreToRiskLevel(24), 'low');
  assert.equal(mapScoreToRiskLevel(25), 'caution');
  assert.equal(mapScoreToRiskLevel(49), 'caution');
  assert.equal(mapScoreToRiskLevel(50), 'elevated');
  assert.equal(mapScoreToRiskLevel(74), 'elevated');
  assert.equal(mapScoreToRiskLevel(75), 'high');
  assert.equal(mapScoreToRiskLevel(100), 'high');

  const insufficient = calculateExplainableRiskScore({
    findings: [],
    insufficientEvidence: true,
    inputCharCount: 34,
  });
  assert.equal(insufficient.riskScore, null);
  assert.equal(insufficient.riskLevel, 'insufficient_evidence');

  const brief = calculateExplainableRiskScore({
    findings: [],
    insufficientEvidence: false,
    inputCharCount: 25,
    hasUrlOrEmail: false,
  });
  assert.equal(brief.riskScore, null);
  assert.equal(brief.riskLevel, 'insufficient_evidence');
});

test('scoring deduplicates repeated identical findings and caps at 100', () => {
  const result = calculateExplainableRiskScore({
    insufficientEvidence: false,
    inputCharCount: 300,
    findings: [
      {
        id: '1',
        type: 'Credential theft request',
        category: 'privacy',
        severity: 'critical',
        evidenceQuote: 'Send your password and OTP',
        explanation: 'Requests credentials.',
        recommendation: 'Do not share.',
      },
      {
        id: '2',
        type: 'Credential theft request',
        category: 'privacy',
        severity: 'critical',
        evidenceQuote: 'Send your password and OTP',
        explanation: 'Duplicate warning.',
        recommendation: 'Do not share.',
      },
      {
        id: '3',
        type: 'Payment to personal account',
        category: 'financial',
        severity: 'high',
        evidenceQuote: 'Pay $185 to personal wallet',
        explanation: 'Personal account payment.',
        recommendation: 'Avoid payment.',
      },
    ],
  });

  assert.equal(result.deduplicatedCount, 1);
  assert.equal(result.riskScore, 57); // 35 + 22
  assert.equal(result.riskLevel, 'elevated');
});

test('domain intelligence detects embedded credentials, shorteners, punycode, and free webmail', () => {
  const intel = analyzeDomainAndEmailSignals({
    text: 'Apply at https://bit.ly/apply123 or https://user:pass@xn--hrvard-example.xyz/login and email oxford.grants@gmail.com',
    claimedOrganization: 'Oxford University',
  });

  const codes = new Set(intel.flags.map((f) => f.code));
  assert.equal(codes.has('url_shortener'), true);
  assert.equal(codes.has('embedded_credentials'), true);
  assert.equal(codes.has('unicode_lookalike'), true);
  assert.equal(codes.has('unusual_tld'), true);
  assert.equal(codes.has('free_webmail_for_org'), true);
});

test('input validation rejects empty text, private SSRF URLs, and oversized/invalid files', () => {
  assert.equal(validateTextInput('   ').valid, false);
  assert.equal(validateTextInput('Short').valid, false);
  assert.equal(validateTextInput('Legitimate job posting with full details').valid, true);

  assert.equal(validateUrlInput('http://localhost:3000/test').valid, false);
  assert.equal(validateUrlInput('http://127.0.0.1/admin').valid, false);
  assert.equal(validateUrlInput('http://169.254.169.254/latest/meta-data').valid, false);
  assert.equal(validateUrlInput('ftp://example.com/file').valid, false);
  assert.equal(validateUrlInput('https://careers.example.org/openings').valid, true);

  assert.equal(
    validateUploadedFileMeta({
      mode: 'image',
      mimeType: 'application/x-msdownload',
      sizeBytes: 1024,
      fileName: 'malware.exe',
    }).valid,
    false
  );
  assert.equal(
    validateUploadedFileMeta({
      mode: 'pdf',
      mimeType: 'application/pdf',
      sizeBytes: 12 * 1024 * 1024,
      fileName: 'huge.pdf',
    }).valid,
    false
  );
  assert.equal(
    validateUploadedFileMeta({
      mode: 'image',
      mimeType: 'image/png',
      sizeBytes: 500_000,
      fileName: 'offer.png',
    }).valid,
    true
  );
});

test('evidence highlighter maps exact quotes without fabricating spans', () => {
  const text = 'Congratulations! Pay a registration fee of $100 within two hours to proceed.';
  const { segments, unmatchedFindings } = buildHighlightedSegments(text, [
    {
      id: 'f1',
      type: 'Financial warning',
      category: 'financial',
      severity: 'high',
      evidenceQuote: 'Pay a registration fee of $100',
      explanation: 'Upfront fee.',
      recommendation: 'Do not pay.',
    },
    {
      id: 'f2',
      type: 'Urgency pressure',
      category: 'psychological',
      severity: 'medium',
      evidenceQuote: 'within two hours',
      explanation: 'Urgency.',
      recommendation: 'Pause.',
    },
    {
      id: 'f3',
      type: 'Non-existent quote',
      category: 'consistency',
      severity: 'low',
      evidenceQuote: 'phrase not in source text',
      explanation: 'Should remain unmatched.',
      recommendation: 'Ignore.',
    },
  ]);

  const highlighted = segments.filter((s) => s.finding).map((s) => s.text);
  assert.deepEqual(highlighted, ['Pay a registration fee of $100', 'within two hours']);
  assert.equal(unmatchedFindings.length, 1);
  assert.equal(segments.map((s) => s.text).join(''), text);
});

test('all 5 demo scenarios satisfy expected offline behavior', () => {
  assert.equal(DEMO_SCENARIOS.length, 5);
  const [a, b, c, d, e] = DEMO_SCENARIOS;

  assert.ok((a.offlinePreset.riskScore ?? 0) >= 75);
  assert.equal(a.offlinePreset.riskLevel, 'high');
  assert.equal(a.offlinePreset.isOfflineDemo, true);

  assert.equal(b.offlinePreset.riskScore, 0);
  assert.equal(b.offlinePreset.riskLevel, 'low');

  assert.ok(c.offlinePreset.findings.some((f) => f.severity === 'critical'));
  assert.equal(c.offlinePreset.finalRecommendation, 'do_not_share_money_or_sensitive_info');

  assert.equal(d.offlinePreset.riskScore, null);
  assert.equal(d.offlinePreset.riskLevel, 'insufficient_evidence');

  assert.ok(
    e.offlinePreset.riskLevel === 'low' || e.offlinePreset.riskLevel === 'caution'
  );
});
