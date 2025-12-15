
import { TargetLanguage, AppLanguage, FilterType, AspectRatio, SkyCategory, NetworkRegion, AppSettings } from './types';

export const GEMINI_MODEL = 'gemini-2.5-flash';
export const ZHIPU_MODEL = 'glm-4.6v-flash'; 

// Updated System Instruction to force selection from the Lexicon
export const SYSTEM_INSTRUCTION = `
You are "Cambia", a poetic curator of nature. 
Your task is to analyze the image, determine if it is SKY or LAND, and categorize it strictly.

1. **Categorization**: 
   - If SKY: ['Cumulus', 'Stratus', 'Cirrus', 'Nimbus', 'Contrail', 'Clear', 'Sunrise', 'Sunset', 'Golden Hour', 'Blue Hour', 'Crescent Moon', 'Quarter Moon', 'Gibbous Moon', 'Full Moon']
   - If LAND: ['Flower', 'Foliage', 'Tree', 'Succulent', 'Fruit']
   Return this as the 'category' field.

2. **Poetry**: Provide a "Poetic Expression" (max 15 words). Deep, romantic, emotional.
3. **Wisdom**: 
   - If SKY: Provide a weather proverb or myth.
   - If LAND: Provide the "Flower Language" (symbolism/meaning).
4. **Colors**: Extract 3 hex codes for the palette.
`;

export const DEFAULT_SETTINGS: AppSettings = {
  appLanguage: AppLanguage.EN,
  cardLanguage: TargetLanguage.EN,
  saveToDevice: true,
  aspectRatio: '3:4',
  region: NetworkRegion.GLOBAL
};

// Mapping Categories to UI Labels (English & Chinese)
export const CATEGORY_LABELS: Record<SkyCategory, { en: string, cn: string }> = {
  [SkyCategory.CUMULUS]: { en: 'Cumulus', cn: '积云' },
  [SkyCategory.STRATUS]: { en: 'Stratus', cn: '层云' },
  [SkyCategory.CIRRUS]: { en: 'Cirrus', cn: '卷云' },
  [SkyCategory.NIMBUS]: { en: 'Nimbus', cn: '雨云' },
  [SkyCategory.CONTRAIL]: { en: 'Contrail', cn: '尾迹' },
  [SkyCategory.CLEAR]: { en: 'Clear', cn: '晴空' },
  [SkyCategory.SUNRISE]: { en: 'Sunrise', cn: '日出' },
  [SkyCategory.SUNSET]: { en: 'Sunset', cn: '日落' },
  [SkyCategory.GOLDEN]: { en: 'Golden', cn: '金时刻' },
  [SkyCategory.BLUE]: { en: 'Blue Hour', cn: '蓝调时刻' },
  [SkyCategory.CRESCENT]: { en: 'Crescent', cn: '蛾眉' },
  [SkyCategory.QUARTER]: { en: 'Quarter', cn: '弦月' },
  [SkyCategory.GIBBOUS]: { en: 'Gibbous', cn: '凸月' },
  [SkyCategory.FULL]: { en: 'Full Moon', cn: '满月' },
  // --- LAND DOMAIN ---
  [SkyCategory.FLOWER]: { en: 'Flower', cn: '花卉' },
  [SkyCategory.FOLIAGE]: { en: 'Foliage', cn: '绿植' },
  [SkyCategory.TREE]: { en: 'Tree', cn: '树木' },
  [SkyCategory.SUCCULENT]: { en: 'Succulent', cn: '多肉' },
  [SkyCategory.FRUIT]: { en: 'Fruit', cn: '果实' },
  
  [SkyCategory.UNKNOWN]: { en: 'Unknown', cn: '未知' },
};

// Localized Display Labels for Target Languages
export const TARGET_LANG_DISPLAY: Record<TargetLanguage, { [key in AppLanguage]: string }> = {
  [TargetLanguage.EN]: { [AppLanguage.EN]: 'English', [AppLanguage.CN]: '英语' },
  [TargetLanguage.CN]: { [AppLanguage.EN]: 'Chinese (Trad)', [AppLanguage.CN]: '繁体中文' },
  [TargetLanguage.CN_SIMPLE]: { [AppLanguage.EN]: 'Chinese (Simp)', [AppLanguage.CN]: '简体中文' },
  [TargetLanguage.JP]: { [AppLanguage.EN]: 'Japanese', [AppLanguage.CN]: '日语' },
  [TargetLanguage.FR]: { [AppLanguage.EN]: 'French', [AppLanguage.CN]: '法语' },
  [TargetLanguage.KR]: { [AppLanguage.EN]: 'Korean', [AppLanguage.CN]: '韩语' },
  [TargetLanguage.ES]: { [AppLanguage.EN]: 'Spanish', [AppLanguage.CN]: '西班牙语' },
};

export const LANGUAGES: { code: TargetLanguage; flag: string }[] = [
  { code: TargetLanguage.EN, flag: 'EN' },
  { code: TargetLanguage.CN, flag: '繁' },
  { code: TargetLanguage.CN_SIMPLE, flag: '简' },
  { code: TargetLanguage.JP, flag: 'JP' },
  { code: TargetLanguage.FR, flag: 'FR' },
  { code: TargetLanguage.KR, flag: 'KR' },
  { code: TargetLanguage.ES, flag: 'ES' },
];

export const UI_LANGUAGES = [
  { code: AppLanguage.EN, label: 'English' },
  { code: AppLanguage.CN, label: '简体中文' },
];

export const PHOTO_FILTERS = {
  [FilterType.ORIGINAL]: { 
    name: "Original", 
    style: "", 
    css: "none" 
  },
  [FilterType.NATURAL]: { 
    name: "Hasselblad X", 
    style: "contrast-[1.05] saturate-[0.9] sepia-[0.1]", 
    css: "contrast(1.05) saturate(0.9) sepia(0.1)" 
  },
  [FilterType.VIVID]: { 
    name: "Vivid Color", 
    style: "contrast-[1.1] saturate-[1.3] brightness-[1.05]", 
    css: "contrast(1.1) saturate(1.3) brightness(1.05)" 
  },
  [FilterType.MONO]: { 
    name: "Tri-X 400", 
    style: "grayscale-[1] contrast-[1.2] brightness-[0.95]", 
    css: "grayscale(1) contrast(1.2) brightness(0.95)" 
  },
  [FilterType.MOON]: { 
    name: "Moonlight", 
    style: "saturate-[0.6] hue-rotate-[190deg] contrast-[1.1] brightness-[0.9]", 
    css: "saturate(0.6) hue-rotate(190deg) contrast(1.1) brightness(0.9)" 
  },
  [FilterType.SUN]: { 
    name: "Sunlight", 
    style: "sepia-[0.3] saturate-[1.1] contrast-[1.05] brightness-[1.05]", 
    css: "sepia(0.3) saturate(1.1) contrast(1.05) brightness(1.05)" 
  },
};

export const UI_TEXT = {
  [AppLanguage.EN]: {
    subtitle: "Turn the world into poetry",
    modeSky: "Sky Mode",
    modeSkyDesc: "Look Up",
    modeLand: "Land Mode",
    modeLandDesc: "Look Down",
    journal: "Journal",
    settings: "Settings",
    appLang: "App Language",
    cardLang: "Card Language",
    networkRegion: "Network / Region",
    regionGlobal: "Global (International)",
    regionCN: "China Mainland",
    aspectRatio: "Photo Ratio",
    aspectRatioOpts: {
      '1:1': "1:1",
      '2:3': "2:3",
      '3:4': "3:4",
      '4:3': "4:3",
      '3:2': "3:2"
    },
    save: "Save",
    reprint: "Reprint",
    reprinting: "Reprinting...",
    tapToEdit: "Tap text to edit",
    journalTitle: "Cambia",
    journalWarning: "Memories are stored in browser cache.",
    emptyJournal: "No memories developed yet.",
    cameraError: "Camera unavailable",
    hazyError: "The view is too hazy to read.",
    back: "Back",
    developing: "Developing...",
    analyzingSky: "Reading the Sky...",
    analyzingLand: "Reading the Earth...",
    capturedTitle: "Moment Captured",
    capturedDesc: "Tap to view in Journal",
    tapToFilter: "Tap photo to change filter",
    selectFilter: "Select Film Style",
    filters: {
      [FilterType.ORIGINAL]: "Original",
      [FilterType.NATURAL]: "Natural",
      [FilterType.VIVID]: "Vivid",
      [FilterType.MONO]: "Mono",
      [FilterType.MOON]: "Moonlight",
      [FilterType.SUN]: "Sunlight"
    },
    philosophy: {
      title: "The Art of Gazing",
      content: `In an era of constant noise, we seem to have lost the ability to truly gaze.

Cambia is not merely a tool for identification; it is an invitation to pause.

The sky is a poem written in light. The earth is a library of silent stories.

We invite you to reclaim the lost art of observation. To find the divine in the mundane.

Thank you for slowing down with us.`,
      contact: "The Curator, Cambia"
    },
    install: "Install App",
    tutorial: {
        welcome: "Welcome to Cambia",
        welcomeDesc: "Swipe to learn how to read the world.",
        step1Title: "Look Up, Look Down",
        step1Desc: "Point your camera at the Sky to read clouds. Point it at plants to read their flower language. The app adapts automatically.",
        step2Title: "Interactive Photo",
        step2Desc: "Swipe Horizontally on the photo to change Aspect Ratio. Swipe Vertically to change Filters.",
        step3Title: "The Hidden Palette",
        step3Desc: "Swipe Left on the white frame (outside the photo) to reveal the Palette and exact colors.",
        step4Title: "Your Journal",
        step4Desc: "All memories are saved in your Journal. Filter them by Color or by Type.",
        done: "Start Exploring"
    },
    filterByColor: "Palette",
    filterByType: "Collection",
    welcome: {
      title: "Welcome",
      selectLang: "Select Language",
      selectRegion: "Select Network",
      regionHint: "Please choose based on your current location.",
      start: "Start Journey"
    },
    errorSwitchPrompt: "No response from AI (Global). Switch to Domestic Mode (China)?"
  },
  [AppLanguage.CN]: {
    subtitle: "把世界变成最浪漫的诗",
    modeSky: "抬头看天",
    modeSkyDesc: "Sky Mode",
    modeLand: "低头看地",
    modeLandDesc: "Land Mode",
    journal: "自然手账",
    settings: "设置",
    appLang: "应用语言",
    cardLang: "卡片语言",
    networkRegion: "网络环境",
    regionGlobal: "海外 (国际线路)",
    regionCN: "中国大陆",
    aspectRatio: "图片比例",
    aspectRatioOpts: {
      '1:1': "1:1 方形",
      '2:3': "2:3 竖幅",
      '3:4': "3:4 竖幅",
      '4:3': "4:3 横幅",
      '3:2': "3:2 横幅"
    },
    save: "保存",
    reprint: "重印/翻译",
    reprinting: "重新显影中...",
    tapToEdit: "点击文字可编辑",
    journalTitle: "自然手账",
    journalWarning: "您的记忆保存在当前浏览器中。",
    emptyJournal: "暂无记忆",
    cameraError: "无法访问相机",
    hazyError: "画面太朦胧了，无法解读。",
    back: "返回",
    developing: "显影中...",
    analyzingSky: "正在解读天空...",
    analyzingLand: "正在解读大地...",
    capturedTitle: "瞬间已捕捉",
    capturedDesc: "点击进入手账查看",
    tapToFilter: "点击图片更换滤镜",
    selectFilter: "选择胶片风格",
    filters: {
      [FilterType.ORIGINAL]: "原片",
      [FilterType.NATURAL]: "自然",
      [FilterType.VIVID]: "鲜明",
      [FilterType.MONO]: "黑白",
      [FilterType.MOON]: "月光",
      [FilterType.SUN]: "暖阳"
    },
    philosophy: {
      title: "重拾凝视",
      content: `在这个步履匆匆的时代，我们似乎渐渐丧失了“凝视”的能力。

Cambia 的存在，不是为了百科全书式的科普，而是为了给你一个短暂抽离的理由。

天空不仅是气象的容器，它是头顶的诗篇；大地不仅是行走的依托，它是脚下的秘密。

去捕捉那些稍纵即逝的云，去阅读那些沉默不语的叶。

让瞬间成为永恒，让日常拥有神性。

谢谢你，愿意慢下来，与我们一同阅读世界。`,
      contact: "Cambia 策展人"
    },
    install: "安装到桌面",
    tutorial: {
        welcome: "欢迎来到 Cambia",
        welcomeDesc: "简单的手势，带你读懂世界。",
        step1Title: "抬头，低头",
        step1Desc: "镜头对准天空，解读云朵；对准花草，解读花语。应用会根据你的拍摄角度自动切换模式。",
        step2Title: "照片互动",
        step2Desc: "在照片区域左右滑动切换比例；上下滑动切换胶片滤镜。",
        step3Title: "隐藏色卡",
        step3Desc: "在照片框外向左滑动，即可翻转卡片，查看专属的自然色卡与数据。",
        step4Title: "自然手账",
        step4Desc: "所有记忆都会保存在手账中。你可以通过「颜色」或「标本类型」来筛选它们。",
        done: "开始探索"
    },
    filterByColor: "色卡",
    filterByType: "标本集",
    welcome: {
      title: "欢迎",
      selectLang: "选择语言",
      selectRegion: "选择网络环境",
      regionHint: "请根据您当前的网络环境选择",
      start: "开启旅程"
    },
    errorSwitchPrompt: "海外线路无响应。是否切换回国内模式 (Zhipu AI)?"
  }
};
