export enum AppView {
  HOME = 'HOME',
  CAMERA = 'CAMERA',
  RESULT = 'RESULT',
  JOURNAL = 'JOURNAL',
  SETTINGS = 'SETTINGS'
}

export enum SkyMode {
  CLOUD = 'CLOUD',
  STAR = 'STAR'
}

// Language for the Generated Content (Poetry)
export enum TargetLanguage {
  EN = 'English',
  CN = '中文',
  JP = '日本語',
  FR = 'Français',
  KR = '한국어',
  ES = 'Español'
}

// Language for the UI
export enum AppLanguage {
  EN = 'EN',
  CN = 'CN'
}

export interface SkyAnalysisResult {
  type: 'cloud' | 'constellation' | 'celestial_event' | 'unknown';
  scientificName: string;
  translatedName: string; // In target language
  poeticExpression: string; // In target language
  proverb: string; // Weather wisdom or myth
  proverbTranslation: string; // In English/Native for reference
  dominantColors: string[];
  timestamp: number;
  imageUrl?: string;
  language: TargetLanguage; // Track the language of this specific result
}

export interface JournalEntry extends SkyAnalysisResult {
  id: string;
}

export interface AppSettings {
  appLanguage: AppLanguage;
  defaultFilmStock: TargetLanguage;
  saveToDevice: boolean;
}