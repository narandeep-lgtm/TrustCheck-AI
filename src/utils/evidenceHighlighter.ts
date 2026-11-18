import type { Finding } from '../types/analysis.ts';

export interface TextHighlightSegment {
  text: string;
  finding?: Finding;
  start: number;
  end: number;
}

interface SpanCandidate {
  start: number;
  end: number;
  finding: Finding;
}

function findQuoteRange(source: string, quote: string): [number, number] | null {
  const cleanQuote = quote.trim();
  if (cleanQuote.length < 4) return null;

  // 1. Exact substring match
  const exactIdx = source.indexOf(cleanQuote);
  if (exactIdx !== -1) {
    return [exactIdx, exactIdx + cleanQuote.length];
  }

  // 2. Case-insensitive substring match
  const lowerSource = source.toLowerCase();
  const lowerQuote = cleanQuote.toLowerCase();
  const ciIdx = lowerSource.indexOf(lowerQuote);
  if (ciIdx !== -1) {
    return [ciIdx, ciIdx + cleanQuote.length];
  }

  return null;
}

export function buildHighlightedSegments(
  sourceText: string,
  findings: Finding[]
): { segments: TextHighlightSegment[]; unmatchedFindings: Finding[] } {
  if (!sourceText) {
    return { segments: [], unmatchedFindings: findings };
  }

  const candidates: SpanCandidate[] = [];
  const unmatchedFindings: Finding[] = [];

  for (const finding of findings) {
    if (!finding.evidenceQuote) {
      unmatchedFindings.push(finding);
      continue;
    }
    const range = findQuoteRange(sourceText, finding.evidenceQuote);
    if (!range) {
      unmatchedFindings.push(finding);
      continue;
    }
    candidates.push({
      start: range[0],
      end: range[1],
      finding,
    });
  }

  // Sort by start index, then prefer higher severity / longer span on ties
  const severityRank = { critical: 4, high: 3, medium: 2, low: 1 };
  candidates.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    const sevDiff = severityRank[b.finding.severity] - severityRank[a.finding.severity];
    if (sevDiff !== 0) return sevDiff;
    return b.end - b.start - (a.end - a.start);
  });

  // Resolve overlaps cleanly without fabricating spans
  const nonOverlapping: SpanCandidate[] = [];
  let cursor = 0;
  for (const cand of candidates) {
    if (cand.start >= cursor) {
      nonOverlapping.push(cand);
      cursor = cand.end;
    }
  }

  const segments: TextHighlightSegment[] = [];
  let pos = 0;

  for (const span of nonOverlapping) {
    if (span.start > pos) {
      segments.push({
        text: sourceText.slice(pos, span.start),
        start: pos,
        end: span.start,
      });
    }
    segments.push({
      text: sourceText.slice(span.start, span.end),
      finding: span.finding,
      start: span.start,
      end: span.end,
    });
    pos = span.end;
  }

  if (pos < sourceText.length) {
    segments.push({
      text: sourceText.slice(pos),
      start: pos,
      end: sourceText.length,
    });
  }

  return { segments, unmatchedFindings };
}
