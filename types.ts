
export enum AppView {
  HOME = 'HOME',
  CAMERA = 'CAMERA',
  RESULT = 'RESULT',
  JOURNAL = 'JOURNAL',
  SETTINGS = 'SETTINGS'
}

// Deprecated: SkyMode is replaced by NatureDomain for logic, 
// but we keep it to not break existing imports temporarily if needed.
// In this refactor, we primarily use NatureDomain.
export enum SkyMode {
  CLOUD = 'CLOUD',
  STAR = 'STAR' 
}

export enum NatureDomain {
  SKY = 'SKY',
  LAND = 'LAND'
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

// Expanded Lexicon for Sky AND Land
export enum SkyCategory {
  // --- SKY DOMAIN ---
  CUMULUS = 'Cumulus', // 积云
  STRATUS = 'Stratus', // 层云
  CIRRUS = 'Cirrus',   // 卷云
  NIMBUS = 'Nimbus',   // 雨云
  CONTRAIL = 'Contrail', // 飞机云
  CLEAR = 'Clear',     // 晴空
  SUNRISE = 'Sunrise', // 日出
  SUNSET = 'Sunset',   // 日落
  GOLDEN = 'Golden Hour', // 金时刻
  BLUE = 'Blue Hour',     // 蓝时刻
  CRESCENT = 'Crescent Moon', // 蛾眉月
  QUARTER = 'Quarter Moon',   // 上/下弦月
  GIBBOUS = 'Gibbous Moon',   // 凸月
  FULL = 'Full Moon',         // 满月
  
  // --- LAND DOMAIN (New) ---
  FLOWER = 'Flower',       // 花卉
  FOLIAGE = 'Foliage',     // 叶/绿植
  TREE = 'Tree',           // 树木
  SUCCULENT = 'Succulent', // 多肉
  FRUIT = 'Fruit',         // 果实
  
  UNKNOWN = 'Unknown'
}

export interface NatureAnalysisResult {
  domain: NatureDomain; 
  category: SkyCategory; 
  scientificName: string; 
  translatedName: string; 
  poeticExpression: string; 
  // For Sky: Weather Myth/Proverb
  // For Land: Flower Language (Hanakotoba)
  proverb: string; 
  proverbTranslation: string; 
  dominantColors: string[];
  timestamp: number;
  imageUrl?: string;
  language: TargetLanguage; 
}

// Alias for backward compatibility
export type SkyAnalysisResult = NatureAnalysisResult;

export enum FilterType {
  ORIGINAL = 'original',
  NATURAL = 'natural',
  VIVID = 'vivid',
  MONO = 'mono',
  MOON = 'moon',
  SUN = 'sun'
}

export interface JournalEntry extends Partial<NatureAnalysisResult> {
  id: string;
  status: 'pending' | 'completed' | 'failed' | 'reprinting'; 
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
