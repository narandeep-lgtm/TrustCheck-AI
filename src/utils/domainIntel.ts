import type { DomainFlag, DomainIntelReport } from '../types/analysis.ts';

const URL_SHORTENERS = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'goo.gl',
  'ow.ly',
  'is.gd',
  'buff.ly',
  'rb.gy',
  'cutt.ly',
  'shorturl.at',
  'rebrand.ly',
  'tiny.cc',
  'lnkd.in',
  'surl.li',
]);

const FREE_WEBMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'aol.com',
  'icloud.com',
  'proton.me',
  'protonmail.com',
  'yandex.com',
  'mail.com',
  'gmx.com',
]);

const HIGH_ABUSE_TLDS = new Set([
  'xyz',
  'top',
  'click',
  'loan',
  'work',
  'gq',
  'tk',
  'ml',
  'cf',
  'ga',
  'buzz',
  'icu',
  'cam',
  'rest',
]);

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'of',
  'in',
  'inc',
  'llc',
  'ltd',
  'corp',
  'corporation',
  'university',
  'institute',
  'college',
  'foundation',
  'program',
  'scholarship',
  'fellowship',
  'global',
  'international',
  'group',
  'org',
]);

export function extractUrls(text: string): string[] {
  const regex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
  const matches = text.match(regex) ?? [];
  const cleaned = matches.map((u) => u.replace(/[),.;:!?]+$/, ''));
  return Array.from(new Set(cleaned));
}

export function extractEmails(text: string): string[] {
  const regex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  const matches = text.match(regex) ?? [];
  return Array.from(new Set(matches.map((e) => e.toLowerCase())));
}

function hasMixedOrNonAsciiScript(host: string): boolean {
  // Detect non-ASCII characters or punycode labels (xn--)
  if (/[^\x00-\x7F]/.test(host)) return true;
  if (host.split('.').some((label) => label.toLowerCase().startsWith('xn--'))) {
    return true;
  }
  return false;
}

function isIpLiteralHost(hostname: string): boolean {
  const clean = hostname.replace(/^\[|\]$/g, '');
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(clean)) return true;
  if (clean.includes(':')) return true;
  return false;
}

function getOrgTokens(orgName: string | null): string[] {
  if (!orgName) return [];
  return orgName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((tok) => tok.length >= 3 && !STOP_WORDS.has(tok));
}

function getRegistrableBase(hostname: string): string {
  const parts = hostname.toLowerCase().split('.').filter(Boolean);
  if (parts.length <= 2) return hostname.toLowerCase();
  // Handle common 2-level ccTLD suffixes like .co.uk, .edu.pk, .ac.uk
  const lastTwo = parts.slice(-2).join('.');
  const twoPartSuffixes = new Set([
    'co.uk',
    'ac.uk',
    'org.uk',
    'edu.pk',
    'gov.pk',
    'edu.au',
    'com.au',
    'co.in',
    'ac.in',
    'edu.sg',
  ]);
  if (twoPartSuffixes.has(lastTwo) && parts.length >= 3) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

export function analyzeDomainAndEmailSignals(params: {
  text?: string;
  submittedUrl?: string;
  claimedOrganization?: string | null;
}): DomainIntelReport {
  const { text = '', submittedUrl, claimedOrganization = null } = params;

  const urlSet = new Set(extractUrls(text));
  if (submittedUrl && submittedUrl.trim()) {
    urlSet.add(submittedUrl.trim());
  }
  const extractedUrls = Array.from(urlSet);
  const extractedEmails = extractEmails(text);

  const domainsSet = new Set<string>();
  const flags: DomainFlag[] = [];
  let httpsPresent: boolean | null = null;

  for (const rawUrl of extractedUrls) {
    try {
      const parsed = new URL(rawUrl);
      const hostname = parsed.hostname.toLowerCase();
      domainsSet.add(hostname);

      if (parsed.protocol === 'https:') {
        if (httpsPresent === null) httpsPresent = true;
      } else if (parsed.protocol === 'http:') {
        httpsPresent = false;
        flags.push({
          code: 'no_https',
          severity: 'medium',
          label: 'Unencrypted HTTP link',
          detail:
            'This URL uses unencrypted HTTP rather than HTTPS. Note that HTTPS alone does not prove legitimacy, but plain HTTP exposes submitted data.',
          target: rawUrl,
        });
      }

      if (parsed.username || parsed.password) {
        flags.push({
          code: 'embedded_credentials',
          severity: 'critical',
          label: 'Credentials or "@" trick embedded in URL',
          detail:
            'The URL embeds a username/password prefix before "@", a classic technique used to disguise the real destination host.',
          target: rawUrl,
        });
      }

      if (isIpLiteralHost(hostname)) {
        flags.push({
          code: 'ip_literal_host',
          severity: 'high',
          label: 'Direct IP address used instead of domain',
          detail:
            'Legitimate recruitment and university portals almost always use an organizational domain name rather than a raw IP address.',
          target: rawUrl,
        });
      }

      if (hasMixedOrNonAsciiScript(hostname)) {
        flags.push({
          code: 'unicode_lookalike',
          severity: 'high',
          label: 'Unicode / punycode lookalike domain pattern',
          detail:
            'The hostname contains non-ASCII or punycode ("xn--") characters, which can be used for homoglyph domain spoofing.',
          target: hostname,
        });
      }

      const baseDomain = getRegistrableBase(hostname);
      if (URL_SHORTENERS.has(baseDomain) || URL_SHORTENERS.has(hostname)) {
        flags.push({
          code: 'url_shortener',
          severity: 'medium',
          label: 'Shortened URL hides final destination',
          detail:
            'Shortened links conceal the actual landing domain until clicked. Verify the resolved destination before entering any personal data.',
          target: rawUrl,
        });
      }

      const labels = hostname.split('.');
      const tld = labels[labels.length - 1] ?? '';
      if (HIGH_ABUSE_TLDS.has(tld)) {
        flags.push({
          code: 'unusual_tld',
          severity: 'low',
          label: `Low-cost or frequently abused top-level domain (.${tld})`,
          detail:
            `While not proof of fraud on its own, .${tld} domains are uncommon for established universities and major employers.`,
          target: hostname,
        });
      }

      if (labels.length >= 4) {
        const subdomainPart = labels.slice(0, labels.length - 2).join('.');
        const orgTokens = getOrgTokens(claimedOrganization);
        const matchesBrandInSubdomain = orgTokens.some((tok) =>
          subdomainPart.includes(tok)
        );
        const matchesBrandInBase = orgTokens.some((tok) =>
          baseDomain.includes(tok)
        );

        if (matchesBrandInSubdomain && !matchesBrandInBase) {
          flags.push({
            code: 'deceptive_subdomain',
            severity: 'high',
            label: 'Organization name placed in subdomain of unrelated domain',
            detail:
              `The claimed organization name appears in the subdomain ("${subdomainPart}"), while the actual controlling domain is "${baseDomain}".`,
            target: hostname,
          });
        } else if (labels.length >= 5) {
          flags.push({
            code: 'excessive_subdomains',
            severity: 'low',
            label: 'Unusually deep subdomain structure',
            detail:
              'Deeply nested subdomains can obscure the controlling root domain.',
            target: hostname,
          });
        }
      }

      if (rawUrl.length > 180) {
        flags.push({
          code: 'long_obfuscated_url',
          severity: 'low',
          label: 'Unusually long URL structure',
          detail:
            'Long URLs with extensive parameters can obscure redirection targets or tracking tokens.',
          target: rawUrl.slice(0, 80) + '...',
        });
      }
    } catch {
      flags.push({
        code: 'malformed_url',
        severity: 'medium',
        label: 'Malformed URL syntax',
        detail: 'A URL in the submission does not follow standard web URL formatting.',
        target: rawUrl,
      });
    }
  }

  for (const email of extractedEmails) {
    const [, domain = ''] = email.split('@');
    if (!domain) continue;
    domainsSet.add(domain);

    if (hasMixedOrNonAsciiScript(domain)) {
      flags.push({
        code: 'email_unicode_lookalike',
        severity: 'high',
        label: 'Unicode / punycode characters in email domain',
        detail:
          'The sender email domain contains non-ASCII or punycode characters that may impersonate an official domain.',
        target: email,
      });
    }

    if (claimedOrganization && FREE_WEBMAIL_DOMAINS.has(domain)) {
      flags.push({
        code: 'free_webmail_for_org',
        severity: 'high',
        label: `Free webmail domain (${domain}) used for organizational claim`,
        detail:
          `The message references "${claimedOrganization}" but uses a public webmail address (${email}) rather than an official institutional domain.`,
        target: email,
      });
    }
  }

  const domainsAnalyzed = Array.from(domainsSet);
  let orgDomainComparison = 'No organization or domain comparison could be performed.';

  if (claimedOrganization && domainsAnalyzed.length > 0) {
    const tokens = getOrgTokens(claimedOrganization);
    const matchingDomains = domainsAnalyzed.filter((d) =>
      tokens.some((tok) => getRegistrableBase(d).includes(tok))
    );
    const nonFreeDomains = domainsAnalyzed.filter((d) => !FREE_WEBMAIL_DOMAINS.has(d));

    if (matchingDomains.length > 0) {
      orgDomainComparison = `Domain token alignment found: "${matchingDomains.join(
        ', '
      )}" shares naming elements with "${claimedOrganization}". Still confirm the official domain independently.`;
    } else if (nonFreeDomains.length > 0) {
      orgDomainComparison = `Potential mismatch: analyzed domain(s) (${nonFreeDomains.join(
        ', '
      )}) do not visibly match the claimed organization "${claimedOrganization}".`;
      flags.push({
        code: 'org_domain_mismatch',
        severity: 'medium',
        label: 'Claimed organization differs from extracted domain',
        detail: `None of the extracted domains (${nonFreeDomains.join(
          ', '
        )}) visibly match "${claimedOrganization}". Confirm whether an authorized third-party portal is used.`,
        target: nonFreeDomains[0],
      });
    } else {
      orgDomainComparison = `Only public webmail domains (${domainsAnalyzed.join(
        ', '
      )}) were found alongside claimed organization "${claimedOrganization}".`;
    }
  } else if (domainsAnalyzed.length > 0) {
    orgDomainComparison = `Extracted ${domainsAnalyzed.length} domain(s) (${domainsAnalyzed.join(
      ', '
    )}); no claimed organization name was isolated for comparison.`;
  }

  return {
    extractedUrls,
    extractedEmails,
    domainsAnalyzed,
    httpsPresent,
    flags,
    orgDomainComparison,
    heuristicNotice:
      'Heuristic pattern analysis only. TrustCheck AI does not query live WHOIS registration, DNS records, or external malware feeds, and HTTPS alone does not prove legitimacy.',
  };
}
