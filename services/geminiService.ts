
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

  const url = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
  
  // Zhipu doesn't support "systemInstruction" field in the same way as Gemini SDK, 
  // so we prepend system instruction to messages.
  // Zhipu requires JSON mode enforcement via prompt or response_format if supported by model,
  // but for V4 Flash, good prompting is key.
  
  const payload = {
    model: ZHIPU_MODEL,
    messages: [
      {
        role: "system",
        content: SYSTEM_INSTRUCTION + "\n\nIMPORTANT: Return ONLY raw JSON without markdown formatting."
      },
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: base64Image } } // Zhipu accepts base64 data URLs here
        ]
      }
    ],
    temperature: 0.7,
    top_p: 0.95,
    max_tokens: 1024,
    stream: false
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${zhipuApiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Zhipu API Error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from Zhipu");
  
  return content;
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
      Return a JSON object matching the schema.
      IMPORTANT: For 'dominantColors', extract 3 hex codes specifically representing the sky gradient, ordered from the TOP of the sky to the HORIZON (Bottom).
      IMPORTANT: For 'category', you MUST select exactly one value from the provided list that best matches the image.
    `;

    // 1. Detect Location
    const inChina = isLikelyChina();
    console.log(`[SkyStory] Location detection: ${inChina ? 'China (Switching to Zhipu)' : 'Global (Using Gemini)'}`);

    let resultText = "";

    // 2. Route Request
    if (inChina && zhipuApiKey) {
      // Zhipu requires full data URL
      const dataUrl = `data:image/jpeg;base64,${base64Image}`;
      // Race Zhipu call
      resultText = await Promise.race([
        callZhipuAI(dataUrl, prompt),
        timeoutPromise(45000)
      ]);
    } else {
      // Standard Gemini call
      resultText = await Promise.race([
        callGeminiAI(base64Image, prompt),
        timeoutPromise(45000)
      ]);
    }

    if (!resultText) throw new Error("No response from AI Service");

    // 3. Parse Result
    // Clean potential markdown code blocks if present (Common in LLM outputs)
    const cleanedText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();

    const data = JSON.parse(cleanedText) as Omit<SkyAnalysisResult, 'timestamp' | 'imageUrl' | 'language'>;
    
    // Ensure category is a valid enum, fallback to UNKNOWN if model hallucinates
    let category = data.category as SkyCategory;
    if (!Object.values(SkyCategory).includes(category)) {
      category = SkyCategory.UNKNOWN;
    }

    return {
      ...data,
      category,
      timestamp: Date.now(),
      imageUrl: `data:image/jpeg;base64,${base64Image}`,
      language: language
    };

  } catch (error) {
    console.error("SkyStory Analysis Error:", error);
    // Return a backup object so the UI doesn't crash
    return {
      category: SkyCategory.UNKNOWN,
      scientificName: 'Mystery of the Sky',
      translatedName: 'Unknown Beauty',
      poeticExpression: 'The sky whispers secrets we cannot yet understand.',
      proverb: 'Even when the sky is silent, it is beautiful.',
      proverbTranslation: 'Nature speaks in many tongues.',
      dominantColors: ['#1e3a8a', '#60a5fa', '#fcd34d'], // Default gradient
      timestamp: Date.now(),
      imageUrl: `data:image/jpeg;base64,${base64Image}`,
      language: language
    };
  }
};
