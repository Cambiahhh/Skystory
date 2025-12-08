
import { GoogleGenAI, Type } from "@google/genai";
import { SkyAnalysisResult, TargetLanguage, SkyMode, SkyCategory } from '../types';
import { GEMINI_MODEL, ZHIPU_MODEL, SYSTEM_INSTRUCTION } from '../constants';

// --- Configuration ---

// 1. Google Gemini Config
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
const googleAI = new GoogleGenAI({ apiKey: geminiApiKey });

// 2. Zhipu AI Config
const zhipuApiKey = process.env.ZHIPU_API_KEY;

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
  if (!geminiApiKey) throw new Error("Gemini API Key is missing");

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
        content: SYSTEM_INSTRUCTION + "\n\nIMPORTANT: Return ONLY raw JSON without markdown formatting. Do not wrap in ```json."
      },
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: base64Image } } 
        ]
      }
    ],
    temperature: 0.5, // Lower temperature for more stable JSON
    top_p: 0.9,
    max_tokens: 1024,
    stream: false
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${zhipuApiKey}` // V4 supports direct API Key in Bearer
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
    const hasGemini = !!geminiApiKey;
    const hasZhipu = !!zhipuApiKey;

    // Logic: Use Zhipu if in China OR if Gemini is missing but Zhipu exists.
    const useZhipu = (inChina && hasZhipu) || (!hasGemini && hasZhipu);

    console.log(`[SkyStory] Strategy: ${useZhipu ? 'Zhipu AI' : 'Gemini AI'} (China: ${inChina}, HasGemini: ${hasGemini})`);

    let resultText = "";
    
    // Zhipu requires full Data URL
    const dataUrl = `data:image/jpeg;base64,${base64Image}`;

    if (useZhipu) {
      resultText = await Promise.race([
        callZhipuAI(dataUrl, prompt),
        timeoutPromise(60000) // 60s timeout for Zhipu
      ]);
    } else {
      resultText = await Promise.race([
        callGeminiAI(base64Image, prompt),
        timeoutPromise(45000)
      ]);
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
    
    // Ensure category is a valid enum, fallback to UNKNOWN if model hallucinates
    let category = data.category as SkyCategory;
    // Simple validation
    const validCategories = Object.values(SkyCategory);
    // Try to fuzzy match if exact match fails (e.g. model returns "Cumulus Clouds" instead of "Cumulus")
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

  } catch (error) {
    console.error("SkyStory Analysis Error:", error);
    // Return a backup object so the UI doesn't crash
    return {
      category: SkyCategory.UNKNOWN,
      scientificName: 'Analysis Failed',
      translatedName: 'Connection Error',
      poeticExpression: 'The clouds are thick today, obstructing our view.',
      proverb: 'Please check your connection or API key.',
      proverbTranslation: 'Network error.',
      dominantColors: ['#333333', '#555555', '#777777'], 
      timestamp: Date.now(),
      imageUrl: `data:image/jpeg;base64,${base64Image}`,
      language: language
    };
  }
};
