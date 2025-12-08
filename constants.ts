
import { TargetLanguage, AppLanguage, FilterType, AspectRatio, SkyCategory } from './types';

export const GEMINI_MODEL = 'gemini-2.5-flash';
export const ZHIPU_MODEL = 'glm-4.6v-flash'; // Standard Flash Vision Model

// Updated System Instruction to force selection from the Lexicon
export const SYSTEM_INSTRUCTION = `
You are SkyStory, a poetic sky curator. 
Your task is to analyze the sky image and categorize it strictly.

1. **Categorization**: You MUST classify the image into exactly ONE of the following categories:
   - Clouds: 'Cumulus', 'Stratus', 'Cirrus', 'Nimbus', 'Contrail'
   - Atmosphere: 'Clear', 'Sunrise', 'Sunset', 'Golden Hour', 'Blue Hour'
   - Moon: 'Crescent Moon', 'Quarter Moon', 'Gibbous Moon', 'Full Moon'
   Return this as the 'category' field.

2. **Poetry**: Provide a "Poetic Expression" (max 15 words). Deep, romantic, emotional.
3. **Wisdom**: Provide a weather proverb or myth related to the specific cloud/moon/sun type.
4. **Colors**: Extract 3 hex codes for the gradient (Top to Horizon).
`;

// Mapping Categories to UI Labels (English & Chinese)
export const CATEGORY_LABELS: Record<SkyCategory, { en: string, cn: string }> = {
  [SkyCategory.CUMULUS]: { en: 'Cumulus', cn: '积云' },
  [SkyCategory.STRATUS]: { en: 'Stratus', cn: '层云' },
  [SkyCategory.CIRRUS]: { en: 'Cirrus', cn: '卷云' },
  [SkyCategory.NIMBUS]: { en: 'Nimbus', cn: '雨云' },
  [SkyCategory.CONTRAIL]: { en: 'Contrail', cn: '航迹' },
  [SkyCategory.CLEAR]: { en: 'Clear', cn: '晴空' },
  [SkyCategory.SUNRISE]: { en: 'Sunrise', cn: '日出' },
  [SkyCategory.SUNSET]: { en: 'Sunset', cn: '日落' },
  [SkyCategory.GOLDEN]: { en: 'Golden', cn: '金时刻' },
  [SkyCategory.BLUE]: { en: 'Blue Hour', cn: '蓝时刻' },
  [SkyCategory.CRESCENT]: { en: 'Crescent', cn: '蛾眉' },
  [SkyCategory.QUARTER]: { en: 'Quarter', cn: '弦月' },
  [SkyCategory.GIBBOUS]: { en: 'Gibbous', cn: '凸月' },
  [SkyCategory.FULL]: { en: 'Full Moon', cn: '满月' },
  [SkyCategory.UNKNOWN]: { en: 'Unknown', cn: '未知' },
};

export const LANGUAGES: { code: TargetLanguage; label: string; flag: string }[] = [
  { code: TargetLanguage.EN, label: 'Film: English', flag: 'EN' },
  { code: TargetLanguage.CN, label: 'Film: Classic', flag: '繁' },
  { code: TargetLanguage.CN_SIMPLE, label: 'Film: Modern', flag: '简' },
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
    subtitle: "Turn the sky into poetry",
    cloudStory: "Cloud Story",
    starStory: "Star Story", // Kept in text but hidden in UI
    journal: "Journal",
    settings: "Settings",
    appLang: "App Language",
    cardLang: "Card Language",
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
    },
    philosophy: {
      title: "To You, Looking Up",
      content: "We live in a world that rushes forward, heads down, buried in screens and schedules.\n\nBut above us, there is a canvas that changes every second, yet has watched over us for eternity.\n\nSkyStory was built not just to identify clouds, but to give you a reason to pause. To breathe. To find a moment of romance in the mundane.\n\nWe believe the sky is the world's oldest language. We just help you translate it.\n\nThank you for looking up with us.",
      contact: "Author WeChat: Cambia2214"
    },
    install: "Install App",
    tutorial: {
        welcome: "Welcome to SkyStory",
        welcomeDesc: "Swipe to learn how to read the sky.",
        step1Title: "Capture the Moment",
        step1Desc: "Point your camera at the sky. Whether it's clouds, a sunset, or the moon, AI will translate it.",
        step2Title: "Interactive Photo",
        step2Desc: "Swipe Horizontally on the photo to change Aspect Ratio. Swipe Vertically to change Filters.",
        step3Title: "The Hidden Palette",
        step3Desc: "Swipe Left on the white frame (outside the photo) to reveal the Sky Palette and exact colors.",
        step4Title: "Your Journal",
        step4Desc: "All memories are saved in your Journal. Filter them by Color or by Cloud Type.",
        done: "Start Exploring"
    },
    filterByColor: "Palette",
    filterByType: "Collection"
  },
  [AppLanguage.CN]: {
    subtitle: "把天空变成最浪漫的诗",
    cloudStory: "云的故事",
    starStory: "星的故事",
    journal: "天空手账",
    settings: "设置",
    appLang: "应用语言",
    cardLang: "卡片语言",
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
    },
    philosophy: {
      title: "致每一个抬头看天的你",
      content: "我们生活在一个匆忙的时代，\n大多数时候，我们低头赶路，\n沉浸在屏幕与日程表中。\n\n但在我们头顶，\n有一幅每秒钟都在变化的画卷，\n它沉默地注视了人类百万年。\n\nSkyStory 的诞生，\n不仅仅是为了识别云彩，\n更是为了给你一个停下来的理由。\n去呼吸，去在平凡的日常中寻找片刻的浪漫。\n\n我们相信，天空是世界上最古老的语言。\n我们只是帮你翻译了它。\n\n谢谢你，和我们一起抬头。",
      contact: "作者微信: Cambia2214"
    },
    install: "安装到桌面",
    tutorial: {
        welcome: "欢迎来到 SkyStory",
        welcomeDesc: "简单的手势，带你读懂天空。",
        step1Title: "捕捉瞬间",
        step1Desc: "将镜头对准天空——无论是云朵、落日还是月亮，AI 都会为你翻译此刻的浪漫。",
        step2Title: "照片互动",
        step2Desc: "在照片区域左右滑动切换比例；上下滑动切换胶片滤镜。",
        step3Title: "隐藏色卡",
        step3Desc: "在照片框外向左滑动，即可翻转卡片，查看专属的天空色卡与数据。",
        step4Title: "天空手账",
        step4Desc: "所有记忆都会保存在手账中。你可以通过「颜色」或「标本类型」来筛选它们。",
        done: "开始探索"
    },
    filterByColor: "色卡",
    filterByType: "标本集"
  }
};

export const DEFAULT_SETTINGS = {
  appLanguage: AppLanguage.CN,
  cardLanguage: TargetLanguage.CN_SIMPLE,
  saveToDevice: true,
  aspectRatio: '1:1' as AspectRatio
};
