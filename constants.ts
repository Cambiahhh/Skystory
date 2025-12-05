import { TargetLanguage, AppLanguage } from './types';

export const GEMINI_MODEL = 'gemini-2.5-flash';

export const SYSTEM_INSTRUCTION = `
You are SkyStory, an artist and poet. Your goal is to capture the essence of the sky in a single, beautiful Polaroid-style caption.
Do not teach. Do not explain. Just evoke emotion.
Rules:
1. Identify the cloud type or constellation based on the requested mode.
2. Provide a "Poetic Expression" in the target language. This should be short, punchy, and emotional (max 15 words). Like a handwritten note on a photo.
3. Provide a "Wisdom" (proverb/myth) that feels like a caption for a gallery exhibition.
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

export const MOCK_LOADING_PHRASES = {
  [AppLanguage.EN]: [
    "Capturing light...",
    "Developing...",
    "Applying filters...",
    "Fixing shadows...",
    "Printing memory..."
  ],
  [AppLanguage.CN]: [
    "正在捕捉光影...",
    "显影中...",
    "添加滤镜...",
    "调整色调...",
    "生成记忆..."
  ]
};

export const UI_TEXT = {
  [AppLanguage.EN]: {
    subtitle: "Turn the sky into poetry",
    cloudStory: "Cloud Story",
    starStory: "Star Story",
    journal: "Journal",
    settings: "Settings",
    appLang: "App Language",
    filmStock: "Default Film Stock (Content)",
    save: "Save",
    reprint: "Reprint",
    reprinting: "Reprinting...",
    tapToEdit: "Tap text to edit",
    journalTitle: "Sky Journal",
    journalWarning: "Your SkyStory memories are stored in this browser. Please do not clear your browser cache.",
    emptyJournal: "No memories developed yet.",
    cameraError: "Camera unavailable",
    hazyError: "The sky is too hazy to read right now.",
    back: "Back"
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
    journalWarning: "您的天空记忆保存在当前浏览器中，请勿清理缓存，否则记忆将随风而去。",
    emptyJournal: "暂无记忆",
    cameraError: "无法访问相机",
    hazyError: "天空太朦胧了，无法解读。",
    back: "返回"
  }
};

export const DEFAULT_SETTINGS = {
  appLanguage: AppLanguage.EN,
  defaultFilmStock: TargetLanguage.EN,
  saveToDevice: true
};