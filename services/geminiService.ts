
import { GoogleGenAI, Type } from "@google/genai";
import { SkyAnalysisResult, TargetLanguage, SkyMode, SkyCategory, NetworkRegion } from '../types';
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
// Allow custom Base URL if user uses a proxy service specifically
const geminiBaseUrl = getEnvVar('GEMINI_BASE_URL'); 

const googleAI = geminiApiKey ? new GoogleGenAI({ 
    apiKey: geminiApiKey, 
    baseUrl: geminiBaseUrl 
} as any) : null;

// 2. Zhipu AI Config
const zhipuApiKey = getEnvVar('ZHIPU_API_KEY');

// Helper: Timeout Promise
const timeoutPromise = (ms: number, name: string) => new Promise<never>((_, reject) => {
  setTimeout(() => reject(new Error(`${name} Request timed out after ${ms}ms`)), ms);
});

// --- API Implementation: Gemini ---

const callGeminiAI = async (
  base64Image: string,
  prompt: string
): Promise<string> => {
  if (!googleAI) throw new Error("Gemini API Key is missing");

  // console.log(`[SkyStory] Attempting Gemini...`);

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
  if (!zhipuApiKey) throw new Error("ZHIPU_API_KEY is missing");

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
      throw new Error(`Zhipu API Error: ${response.status} ${errText}`);
    }

    const data = await response.json();
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
  mode: SkyMode,
  region: NetworkRegion // NEW: Explicit region passed from App settings
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
        "dominantColors: ["#hex1", "#hex2", "#hex3"] (Top to bottom gradient)
      }
    `;

    const dataUrl = `data:image/jpeg;base64,${base64Image}`;
    let resultText = "";
    
    // Explicit Routing based on Region
    if (region === NetworkRegion.GLOBAL) {
         console.log("[SkyStory] Mode: GLOBAL (Gemini)");
         // 10s timeout for Gemini
         resultText = await Promise.race([
            callGeminiAI(base64Image, prompt),
            timeoutPromise(10000, "Gemini (Global)") 
        ]);
    } else {
        console.log("[SkyStory] Mode: CN (Zhipu)");
        // 45s timeout for Zhipu (Vision can be slow)
        resultText = await Promise.race([
            callZhipuAI(dataUrl, prompt),
            timeoutPromise(45000, "Zhipu (Domestic)")
        ]);
    }

    if (!resultText) throw new Error("No response from AI Service");

    // 3. Parse Result
    let cleanedText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    
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
    
    // Rethrow to let the UI handle the specific "Switch Region" logic if needed
    throw error;
  }
};
