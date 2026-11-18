export const MAX_TEXT_LENGTH = 25000;
export const MAX_IMAGE_BYTES = 6 * 1024 * 1024; // 6 MB
export const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]);

export const ALLOWED_PDF_MIME_TYPES = new Set(['application/pdf']);

export interface ValidationResult {
  valid: boolean;
  error?: string;
  normalized?: string;
}

export function validateTextInput(raw: string): ValidationResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: 'Please paste an offer, message, or announcement before running an analysis.',
    };
  }
  if (trimmed.length < 10) {
    return {
      valid: false,
      error: 'Input is too short (minimum 10 characters). Provide the full message or notice.',
    };
  }
  if (trimmed.length > MAX_TEXT_LENGTH) {
    return {
      valid: false,
      error: `Input exceeds the ${MAX_TEXT_LENGTH.toLocaleString()} character limit.`,
    };
  }
  return { valid: true, normalized: trimmed };
}

function isPrivateOrDisallowedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');

  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.localhost')
  ) {
    return true;
  }

  // IPv4 private / loopback / link-local / CGNAT checks
  const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const octets = ipv4Match.slice(1).map(Number);
    if (octets.some((o) => o < 0 || o > 255)) return true;
    const [a, b] = octets;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
  }

  // IPv6 private ranges (fc00::/7, fe80::/10)
  if (host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:')) {
    return true;
  }

  return false;
}

export function validateUrlInput(raw: string): ValidationResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      valid: false,
      error: 'Please enter a publicly accessible http:// or https:// website URL.',
    };
  }
  if (trimmed.length > 2048) {
    return {
      valid: false,
      error: 'URL exceeds maximum allowed length (2,048 characters).',
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      valid: false,
      error: 'Invalid URL format. Include the full protocol (e.g., https://example.org/careers).',
    };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      valid: false,
      error: 'Only public http:// and https:// URLs are supported.',
    };
  }

  if (isPrivateOrDisallowedHost(parsed.hostname)) {
    return {
      valid: false,
      error: 'Private, loopback, and internal network addresses are blocked for security.',
    };
  }

  return { valid: true, normalized: parsed.toString() };
}

export function validateUploadedFileMeta(params: {
  mode: 'image' | 'pdf';
  mimeType: string;
  sizeBytes: number;
  fileName?: string;
}): ValidationResult {
  const { mode, mimeType, sizeBytes, fileName = '' } = params;
  const lowerMime = mimeType.toLowerCase();
  const lowerName = fileName.toLowerCase();

  if (sizeBytes <= 0) {
    return { valid: false, error: 'Uploaded file appears to be empty.' };
  }

  if (mode === 'image') {
    const extOk = /\.(png|jpe?g|webp)$/.test(lowerName);
    if (!ALLOWED_IMAGE_MIME_TYPES.has(lowerMime) && !extOk) {
      return {
        valid: false,
        error: 'Unsupported image format. Upload PNG, JPG, JPEG, or WEBP.',
      };
    }
    if (sizeBytes > MAX_IMAGE_BYTES) {
      return {
        valid: false,
        error: 'Image exceeds the 6 MB upload limit.',
      };
    }
    return { valid: true };
  }

  const pdfExtOk = lowerName.endsWith('.pdf');
  if (!ALLOWED_PDF_MIME_TYPES.has(lowerMime) && !pdfExtOk) {
    return {
      valid: false,
      error: 'Unsupported document format. Please upload a PDF (.pdf) file.',
    };
  }
  if (sizeBytes > MAX_PDF_BYTES) {
    return {
      valid: false,
      error: 'PDF document exceeds the 10 MB upload limit.',
    };
  }
  return { valid: true };
}
