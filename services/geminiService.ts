
import { GoogleGenAI, Type } from "@google/genai";
import { SkyAnalysisResult, TargetLanguage, SkyMode, SkyCategory, NetworkRegion } from '../types';
import { GEMINI_MODEL, ZHIPU_MODEL, SYSTEM_INSTRUCTION } from '../constants';

// --- Configuration ---

const getEnvVar = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[`VITE_${key}`]) {
    // @ts-ignore
    return import.meta.env[`VITE_${key}`];
  }
  if (typeof process !== 'undefined' && process.env && process.env[`REACT_APP_${key}`]) {
    return process.env[`REACT_APP_${key}`];
  }
  return undefined;
};

// 1. Google Gemini Config
const geminiApiKey = getEnvVar('GEMINI_API_KEY') || getEnvVar('API_KEY');
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

// Helper: Clean JSON
const extractJSON = (text: string): string => {
    let cleaned = text.trim();
    // Remove Markdown code blocks if present
    cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '');
    
    // Find the first '{' and last '}'
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
        return cleaned.substring(firstBrace, lastBrace + 1);
    }
    return cleaned;
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
  if (!zhipuApiKey) throw new Error("ZHIPU_API_KEY is missing");

  console.log("[SkyStory] Calling Zhipu AI...");
  const url = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
  
  const payload = {
    model: ZHIPU_MODEL,
    messages: [
      {
        role: "system",
        content: `
        ${SYSTEM_INSTRUCTION}
        
        CRITICAL OUTPUT RULES:
        1. You must output VALID JSON only. 
        2. Do not include any markdown formatting, backticks, or conversational text.
        3. Ensure all fields (translatedName, poeticExpression, proverb) are translated into the requested Target Language.
        4. The keys of the JSON must remain in English.
        `
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
  region: NetworkRegion
): Promise<SkyAnalysisResult> => {
  
  try {
    const prompt = `
      Task: Analyze this sky image.
      Target Language: ${language}.
      
      Required JSON Structure:
      {
        "category": "One of [Cumulus, Stratus, Cirrus, Nimbus, Contrail, Clear, Sunrise, Sunset, Golden Hour, Blue Hour, Crescent Moon, Quarter Moon, Gibbous Moon, Full Moon]",
        "scientificName": "Scientific name (in English)",
        "translatedName": "Name (in ${language})",
        "poeticExpression": "A romantic, emotional, short poem about this sky (in ${language}, max 15 words)",
        "proverb": "A weather proverb or myth (in ${language})",
        "proverbTranslation": "English translation of the proverb",
        "dominantColors": ["#hex1", "#hex2", "#hex3"]
      }
    `;

    const dataUrl = `data:image/jpeg;base64,${base64Image}`;
    let resultText = "";
    
    // Explicit Routing based on Region
    if (region === NetworkRegion.GLOBAL) {
         console.log("[SkyStory] Mode: GLOBAL (Gemini)");
         // 30s timeout
         resultText = await Promise.race([
            callGeminiAI(base64Image, prompt),
            timeoutPromise(30000, "Gemini (Global)") 
        ]);
    } else {
        console.log("[SkyStory] Mode: CN (Zhipu)");
        // 60s timeout
        resultText = await Promise.race([
            callZhipuAI(dataUrl, prompt),
            timeoutPromise(60000, "Zhipu (Domestic)")
        ]);
    }

    if (!resultText) throw new Error("No response from AI Service");

    // 3. Parse Result (Robust)
    const cleanedText = extractJSON(resultText);
    
    let data;
    try {
        data = JSON.parse(cleanedText) as Omit<SkyAnalysisResult, 'timestamp' | 'imageUrl' | 'language'>;
    } catch (parseError) {
        console.error("JSON Parse Error. Raw Text:", resultText);
        throw new Error("Failed to parse AI response. " + parseError);
    }
    
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
    throw error;
  }
};
