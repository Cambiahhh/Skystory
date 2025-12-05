
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
  CN = '中文', // Traditional
  CN_SIMPLE = '简体中文', // Simplified
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

export enum FilterType {
  ORIGINAL = 'original',
  NATURAL = 'natural',
  VIVID = 'vivid',
  MONO = 'mono',
  MOON = 'moon',
  SUN = 'sun'
}

export interface JournalEntry extends Partial<SkyAnalysisResult> {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  imageUrl: string; // Image is always present
  filter?: FilterType; // Saved filter choice
}

export interface AppSettings {
  appLanguage: AppLanguage;
  cardLanguage: TargetLanguage; // Renamed from defaultFilmStock
  saveToDevice: boolean;
  aspectRatio: '1:1' | 'dynamic';
}
