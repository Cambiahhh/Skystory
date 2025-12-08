
import { GoogleGenAI, Type } from "@google/genai";
import { SkyAnalysisResult, TargetLanguage, SkyMode, SkyCategory } from '../types';
import { GEMINI_MODEL, ZHIPU_MODEL, SYSTEM_INSTRUCTION } from '../constants';

// --- Configuration ---

// Helper to safely get env vars in various environments (Vite, CRA, Next.js)
const getEnvVar = (key: string): string | undefined => {
  // 1. Standard process.env
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  // 2. Vite (import.meta.env)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[`VITE_${key}`]) {
    // @ts-ignore
    return import.meta.env[`VITE_${key}`];
  }
  // 3. React Scripts (CRA)
  if (typeof process !== 'undefined' && process.env && process.env[`REACT_APP_${key}`]) {
    return process.env[`REACT_APP_${key}`];
  }
  return undefined;
};

// 1. Google Gemini Config
const geminiApiKey = getEnvVar('GEMINI_API_KEY') || getEnvVar('API_KEY');
// Initialize conditionally to avoid errors if key is missing but we intend to use Zhipu
const googleAI = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

// 2. Zhipu AI Config
const zhipuApiKey = getEnvVar('ZHIPU_API_KEY');

// Helper: Timeout Promise
const timeoutPromise = (ms: number) => new Promise<never>((_, reject) => {
  setTimeout(() => reject(new Error("Request timed out")), ms);
});

// Helper: Detect if user is likely in China based on Timezone
const isLikelyChina = (): boolean => {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timeZone) return false;
    return timeZone === 'Asia/Shanghai' || 
           timeZone === 'Asia/Urumqi' || 
           timeZone === 'Asia/Chongqing' || 
           timeZone === 'Asia/Harbin' ||
           timeZone === 'PRC'; // Legacy
  } catch (e) {
    return false;
  }
};

// --- API Implementation: Gemini ---

const callGeminiAI = async (
  base64Image: string,
  prompt: string
): Promise<string> => {
  if (!googleAI) throw new Error("Gemini API Key is missing");

  const response = await googleAI.models.generateContent({
    model: GEMINI_MODEL,
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        { text: prompt }
      ]
    },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: { 
            type: Type.STRING, 
            enum: Object.values(SkyCategory)
          },
          scientificName: { type: Type.STRING },
          translatedName: { type: Type.STRING },
          poeticExpression: { type: Type.STRING },
          proverb: { type: Type.STRING },
          proverbTranslation: { type: Type.STRING },
          dominantColors: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING }
          }
        },
        required: ['category', 'scientificName', 'translatedName', 'poeticExpression', 'proverb', 'dominantColors']
      }
    }
  });

  return response.text || "";
};

// --- API Implementation: Zhipu (GLM-4V) ---

const callZhipuAI = async (
  base64Image: string,
  prompt: string
): Promise<string> => {
  // Final check before call
  if (!zhipuApiKey) {
      throw new Error("Configuration Error: ZHIPU_API_KEY is missing. Please set this variable to use the app in China.");
  }

  console.log("[SkyStory] Calling Zhipu AI...");
  const url = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
  
  const payload = {
    model: ZHIPU_MODEL,
    messages: [
      {
        role: "system",
        content: SYSTEM_INSTRUCTION + "\n\nIMPORTANT: Return ONLY raw JSON. Do not use Markdown code blocks."
      },
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: base64Image } } 
        ]
      }
    ],
    temperature: 0.5,
    top_p: 0.9,
    max_tokens: 1024,
    stream: false
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${zhipuApiKey}` 
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[SkyStory] Zhipu API Error (${response.status}):`, errText);
      throw new Error(`Zhipu API Error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    console.log("[SkyStory] Zhipu Response Received", data);

    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response from Zhipu");
    
    return content;
  } catch (error) {
    console.error("[SkyStory] Zhipu Network/Parsing Error:", error);
    throw error;
  }
};


// --- Main Analysis Function ---

export const analyzeSkyImage = async (
  base64Image: string,
  language: TargetLanguage,
  mode: SkyMode
): Promise<SkyAnalysisResult> => {
  
  try {
    const prompt = `
      Analyze this image of the sky. 
      Identify if it contains clouds, sun events (sunrise/sunset), or moon phases.
      The target language is ${language}.
      Return a valid JSON object matching the schema:
      {
        "category": "One of [Cumulus, Stratus, Cirrus, Nimbus, Contrail, Clear, Sunrise, Sunset, Golden Hour, Blue Hour, Crescent Moon, Quarter Moon, Gibbous Moon, Full Moon]",
        "scientificName": "Scientific name string",
        "translatedName": "Name in target language",
        "poeticExpression": "Max 15 words poetic description in target language",
        "proverb": "Weather proverb/myth in target language",
        "proverbTranslation": "English translation of proverb",
        "dominantColors": ["#hex1", "#hex2", "#hex3"] (Top to bottom gradient)
      }
    `;

    // 1. Detect Strategy
    const inChina = isLikelyChina();
    
    // Zhipu requires full Data URL
    const dataUrl = `data:image/jpeg;base64,${base64Image}`;
    
    let resultText = "";

    console.log(`[SkyStory] Location: ${inChina ? 'China' : 'Global'}`);
    console.log(`[SkyStory] Keys Present - Gemini: ${!!geminiApiKey}, Zhipu: ${!!zhipuApiKey}`);

    // LOGIC:
    // 1. If in China -> MUST use Zhipu. If no key, fail loudly (don't try Gemini, it will timeout).
    // 2. If Global -> Use Gemini if available. If not, try Zhipu.
    
    if (inChina) {
        console.log("[SkyStory] Strategy: Forced Zhipu AI (China Region)");
        if (!zhipuApiKey) {
            // Throwing specific error to be caught by UI
            throw new Error("检测到中国地区，但未配置 ZHIPU_API_KEY。无法访问 Google 服务，请配置智谱 Key。");
        }
        resultText = await Promise.race([
            callZhipuAI(dataUrl, prompt),
            timeoutPromise(60000)
        ]);
    } else {
        // Global
        if (googleAI) {
            console.log("[SkyStory] Strategy: Gemini AI");
            resultText = await Promise.race([
                callGeminiAI(base64Image, prompt),
                timeoutPromise(45000)
            ]);
        } else if (zhipuApiKey) {
            console.log("[SkyStory] Strategy: Fallback Zhipu AI (No Gemini Key)");
            resultText = await Promise.race([
                callZhipuAI(dataUrl, prompt),
                timeoutPromise(60000)
            ]);
        } else {
            throw new Error("No API Keys configured (Gemini or Zhipu).");
        }
    }

    if (!resultText) throw new Error("No response from AI Service");

    // 3. Parse Result
    // Clean potential markdown code blocks if present (Common in LLM outputs)
    let cleanedText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Sometimes models return text before the JSON
    const firstBrace = cleanedText.indexOf('{');
    const lastBrace = cleanedText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
    }

    const data = JSON.parse(cleanedText) as Omit<SkyAnalysisResult, 'timestamp' | 'imageUrl' | 'language'>;
    
    // Ensure category is a valid enum
    let category = data.category as SkyCategory;
    const validCategories = Object.values(SkyCategory);
    if (!validCategories.includes(category)) {
        const fuzzyMatch = validCategories.find(c => category.includes(c));
        category = fuzzyMatch || SkyCategory.UNKNOWN;
    }

    return {
      ...data,
      category,
      timestamp: Date.now(),
      imageUrl: dataUrl,
      language: language
    };

  } catch (error: any) {
    console.error("SkyStory Analysis Error:", error);
    
    // If it's a configuration error, we might want to show it in the UI logic via alert
    if (error.message.includes("ZHIPU_API_KEY")) {
         // Re-throw critical config errors so the UI doesn't just show "Hazy sky"
         // (The caller in App.tsx currently catches everything, but at least we see it in console)
    }

    // Return a backup object so the UI doesn't crash completely,
    // but typically we want the user to know it failed.
    // For now, standard behavior:
    return {
      category: SkyCategory.UNKNOWN,
      scientificName: 'Connection Error',
      translatedName: '连接错误',
      poeticExpression: 'The signal is lost in the clouds.',
      proverb: error.message || 'Please check API Key.',
      proverbTranslation: 'Check settings.',
      dominantColors: ['#000000', '#333333', '#666666'], 
      timestamp: Date.now(),
      imageUrl: `data:image/jpeg;base64,${base64Image}`,
      language: language
    };
  }
};
