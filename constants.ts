import { TargetLanguage, AppLanguage, FilterType } from './types';

export const GEMINI_MODEL = 'gemini-2.5-flash';

export const SYSTEM_INSTRUCTION = `
You are SkyStory, an artist and poet. Your goal is to capture the essence of the sky in a single, beautiful Polaroid-style caption.
Do not teach. Do not explain. Just evoke emotion.
Rules:
1. Identify the cloud type or constellation based on the requested mode.
2. Provide a "Poetic Expression" in the target language. This should be short, punchy, and emotional (max 15 words). Like a handwritten note on a photo.
3. Provide a "Wisdom" (proverb/myth) that feels like a gallery caption.
4. Output specific hex colors found in the image.
`;

export const LANGUAGES: { code: TargetLanguage; label: string; flag: string }[] = [
  { code: TargetLanguage.EN, label: 'Film: English', flag: 'EN' },
  { code: TargetLanguage.CN, label: 'Film: Classic', flag: '繁' },
  { code: TargetLanguage.JP, label: 'Film: Tokyo', flag: 'JP' },
  { code: TargetLanguage.FR, label: 'Film: Paris', flag: 'FR' },
  { code: TargetLanguage.KR, label: 'Film: Seoul', flag: 'KR' },
  { code: TargetLanguage.ES, label: 'Film: Madrid', flag: 'ES' },
];

export const UI_LANGUAGES = [
  { code: AppLanguage.EN, label: 'English' },
  { code: AppLanguage.CN, label: '简体中文' },
];

export const PHOTO_FILTERS = {
  [FilterType.ORIGINAL]: { name: "Original", style: "" },
  [FilterType.NATURAL]: { name: "Hasselblad X", style: "contrast-[1.05] saturate-[0.9] sepia-[0.1]" },
  [FilterType.VIVID]: { name: "Vivid Color", style: "contrast-[1.1] saturate-[1.3] brightness-[1.05]" },
  [FilterType.MONO]: { name: "Tri-X 400", style: "grayscale-[1] contrast-[1.2] brightness-[0.95]" },
  [FilterType.MOON]: { name: "Moonlight", style: "saturate-[0.6] hue-rotate-[190deg] contrast-[1.1] brightness-[0.9]" },
  [FilterType.SUN]: { name: "Sunlight", style: "sepia-[0.3] saturate-[1.1] contrast-[1.05] brightness-[1.05]" },
};

export const UI_TEXT = {
  [AppLanguage.EN]: {
    subtitle: "Turn the sky into poetry",
    cloudStory: "Cloud Story",
    starStory: "Star Story",
    journal: "Journal",
    settings: "Settings",
    appLang: "App Language",
    filmStock: "Default Film Stock",
    save: "Save",
    reprint: "Reprint",
    reprinting: "Reprinting...",
    tapToEdit: "Tap text to edit",
    journalTitle: "Sky Journal",
    journalWarning: "Memories are stored in browser cache.",
    emptyJournal: "No memories developed yet.",
    cameraError: "Camera unavailable",
    hazyError: "The sky is too hazy to read.",
    back: "Back",
    developing: "Developing...",
    capturedTitle: "Moment Captured",
    capturedDesc: "Tap to view in Sky Journal",
    tapToFilter: "Tap photo to change filter",
    selectFilter: "Select Film Style",
    filters: {
      [FilterType.ORIGINAL]: "Original",
      [FilterType.NATURAL]: "Natural",
      [FilterType.VIVID]: "Vivid",
      [FilterType.MONO]: "Mono",
      [FilterType.MOON]: "Moonlight",
      [FilterType.SUN]: "Sunlight"
    }
  },
  [AppLanguage.CN]: {
    subtitle: "把天空变成最浪漫的诗",
    cloudStory: "云的故事",
    starStory: "星的故事",
    journal: "天空手账",
    settings: "设置",
    appLang: "应用语言",
    filmStock: "默认底片 (内容语言)",
    save: "保存",
    reprint: "重印/翻译",
    reprinting: "重新显影中...",
    tapToEdit: "点击文字可编辑",
    journalTitle: "天空手账",
    journalWarning: "您的天空记忆保存在当前浏览器中。",
    emptyJournal: "暂无记忆",
    cameraError: "无法访问相机",
    hazyError: "天空太朦胧了，无法解读。",
    back: "返回",
    developing: "显影中...",
    capturedTitle: "瞬间已捕捉",
    capturedDesc: "点击进入天空手账查看",
    tapToFilter: "点击图片更换滤镜",
    selectFilter: "选择胶片风格",
    filters: {
      [FilterType.ORIGINAL]: "原片",
      [FilterType.NATURAL]: "自然",
      [FilterType.VIVID]: "鲜明",
      [FilterType.MONO]: "黑白",
      [FilterType.MOON]: "月光",
      [FilterType.SUN]: "暖阳"
    }
  }
};

export const DEFAULT_SETTINGS = {
  appLanguage: AppLanguage.CN, // Default to CN for better font showcase
  defaultFilmStock: TargetLanguage.CN,
  saveToDevice: true
};