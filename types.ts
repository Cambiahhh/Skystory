
export enum AppView {
  HOME = 'HOME',
  CAMERA = 'CAMERA',
  RESULT = 'RESULT',
  JOURNAL = 'JOURNAL',
  SETTINGS = 'SETTINGS'
}

export enum SkyMode {
  CLOUD = 'CLOUD',
  // STAR mode is deprecated/hidden for now as per request
  STAR = 'STAR' 
}

export enum NetworkRegion {
  GLOBAL = 'GLOBAL', // Uses Gemini (Needs VPN)
  CN = 'CN'          // Uses Zhipu (Domestic)
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

// The Strict Lexicon for Sky Classification
export enum SkyCategory {
  // Clouds
  CUMULUS = 'Cumulus', // 积云 (Heap)
  STRATUS = 'Stratus', // 层云 (Layer)
  CIRRUS = 'Cirrus',   // 卷云 (Curl)
  NIMBUS = 'Nimbus',   // 雨云 (Rain)
  CONTRAIL = 'Contrail', // 飞机云
  
  // Sun / Atmosphere
  CLEAR = 'Clear',     // 晴空
  SUNRISE = 'Sunrise', // 日出
  SUNSET = 'Sunset',   // 日落
  GOLDEN = 'Golden Hour', // 金时刻
  BLUE = 'Blue Hour',     // 蓝时刻
  
  // Moon (Added as requested)
  CRESCENT = 'Crescent Moon', // 蛾眉月/残月
  QUARTER = 'Quarter Moon',   // 上/下弦月
  GIBBOUS = 'Gibbous Moon',   // 凸月
  FULL = 'Full Moon',         // 满月
  
  UNKNOWN = 'Unknown'
}

export interface SkyAnalysisResult {
  category: SkyCategory; // Strict category from Lexicon
  scientificName: string; // Specific name (e.g., Altocumulus)
  translatedName: string; 
  poeticExpression: string; 
  proverb: string; 
  proverbTranslation: string; 
  dominantColors: string[];
  timestamp: number;
  imageUrl?: string;
  language: TargetLanguage; 
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
  status: 'pending' | 'completed' | 'failed' | 'reprinting'; // Added 'reprinting'
  imageUrl: string; 
  filter?: FilterType; 
  type?: string;
}

export type AspectRatio = '2:3' | '3:4' | '1:1' | '4:3' | '3:2';

export interface AppSettings {
  appLanguage: AppLanguage;
  cardLanguage: TargetLanguage; 
  saveToDevice: boolean;
  aspectRatio: AspectRatio;
  region: NetworkRegion;
}
