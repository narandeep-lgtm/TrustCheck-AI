import type { AnalysisResult, AppSettings } from '../types/analysis.ts';

const SETTINGS_KEY = 'trustcheck_settings_v1';
const HISTORY_KEY = 'trustcheck_history_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  enableSearchGrounding: true,
  explainSimplyByDefault: false,
  optInLocalHistory: false,
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      language:
        parsed.language === 'ur' || parsed.language === 'roman_ur'
          ? parsed.language
          : 'en',
      enableSearchGrounding:
        typeof parsed.enableSearchGrounding === 'boolean'
          ? parsed.enableSearchGrounding
          : true,
      explainSimplyByDefault:
        typeof parsed.explainSimplyByDefault === 'boolean'
          ? parsed.explainSimplyByDefault
          : false,
      optInLocalHistory:
        typeof parsed.optInLocalHistory === 'boolean'
          ? parsed.optInLocalHistory
          : false,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadHistory(): AnalysisResult[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as AnalysisResult[];
  } catch {
    return [];
  }
}

export function saveHistory(items: AnalysisResult[]): void {
  try {
    // Store at most 40 recent analyses to avoid exceeding browser localStorage limits
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 40)));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearStoredHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // Ignore errors
  }
}
