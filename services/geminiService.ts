
import { SkyAnalysisResult, TargetLanguage, SkyMode, SkyCategory, NetworkRegion, NatureDomain } from '../types';
import { GEMINI_MODEL, ZHIPU_MODEL, SYSTEM_INSTRUCTION as BASE_INSTRUCTION } from '../constants';

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

const geminiApiKey = getEnvVar('GEMINI_API_KEY') || getEnvVar('API_KEY');
const geminiBaseUrl = getEnvVar('GEMINI_BASE_URL') || "https://generativelanguage.googleapis.com/v1beta";
const zhipuApiKey = getEnvVar('ZHIPU_API_KEY');

const timeoutPromise = (ms: number, name: string) => new Promise<never>((_, reject) => {
  setTimeout(() => reject(new Error(`${name} Request timed out after ${ms/1000}s`)), ms);
});

const extractJSON = (text: string): string => {
    let cleaned = text.trim();
    cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '');
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        return cleaned.substring(firstBrace, lastBrace + 1);
    }
    return cleaned;
};

// --- CORE PROMPT LOGIC ---
const LENS_AND_LAND_INSTRUCTION = `
You are "Dew", a poetic AI curator for nature.
Your task is to analyze the image, detect its domain (SKY or LAND), and provide a romantic, cultural translation.

1. **DETECT DOMAIN**:
   - **SKY**: Clouds, Sun, Moon, Stars, Atmosphere, Lightning.
   - **LAND**: Flowers, Plants, Trees, Leaves, Succulents, Fruit, Close-up nature.

2. **CATEGORIZATION**:
   - If SKY, strictly use: ['Cumulus', 'Stratus', 'Cirrus', 'Nimbus', 'Contrail', 'Clear', 'Sunrise', 'Sunset', 'Golden Hour', 'Blue Hour', 'Crescent Moon', 'Quarter Moon', 'Gibbous Moon', 'Full Moon'].
   - If LAND, strictly use: ['Flower', 'Foliage', 'Tree', 'Succulent', 'Fruit'].

3. **OUTPUT CONTENT**:
   - **Scientific Name**: Precise naming (e.g., "Altocumulus" or "Rosa rubiginosa").
   - **Poetic Expression**: Max 15 words. Romantic, emotional, deep.
   - **Cultural Context (proverb)**: 
     - For SKY: Provide a weather proverb, myth, or folklore.
     - For LAND: Provide the "Flower Language" (Hanakotoba) or symbolic meaning. NOT biological facts.

4. **COLORS**: Extract 3 hex codes.
`;

const callGeminiAI = async (
  base64Image: string,
  prompt: string
): Promise<string> => {
  if (!geminiApiKey) throw new Error("GEMINI_API_KEY not found in environment variables.");

  console.log("[SkyStory] Calling Gemini via REST...");
  
  const url = `${geminiBaseUrl}/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`;

  const payload = {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: "image/jpeg", data: base64Image } }
      ]
    }],
    generationConfig: {
        response_mime_type: "application/json",
        response_schema: {
            type: "OBJECT",
            properties: {
                domain: { type: "STRING", enum: ["SKY", "LAND"] },
                category: { type: "STRING" },
                scientificName: { type: "STRING" },
                translatedName: { type: "STRING" },
                poeticExpression: { type: "STRING" },
                proverb: { type: "STRING" },
                proverbTranslation: { type: "STRING" },
                dominantColors: { type: "ARRAY", items: { type: "STRING" } }
            },
            required: ['domain', 'category', 'scientificName', 'translatedName', 'poeticExpression', 'proverb', 'dominantColors']
        }
    },
    system_instruction: {
        parts: [{ text: LENS_AND_LAND_INSTRUCTION }]
    }
  };

  try {
      const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });
      if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Gemini API Error (${response.status}): ${errText}`);
      }
      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) throw new Error("Gemini returned empty response.");
      return content;
  } catch (error: any) {
      console.error("[SkyStory] Gemini Network Error:", error);
      throw error;
  }
};

const callZhipuAI = async (
  base64Image: string,
  prompt: string
): Promise<string> => {
  if (!zhipuApiKey) throw new Error("ZHIPU_API_KEY not found in environment variables.");

  console.log("[SkyStory] Calling Zhipu AI...");
  const url = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
  
  const payload = {
    model: ZHIPU_MODEL,
    messages: [
      {
        role: "system",
        content: `
        ${LENS_AND_LAND_INSTRUCTION}
        
        CRITICAL OUTPUT RULES:
        1. You must output VALID JSON only. 
        2. Do not include any markdown formatting.
        3. Ensure all fields (translatedName, poeticExpression, proverb) are translated into the requested Target Language.
        4. The keys of the JSON must remain in English.
        5. For 'proverb', if it is LAND domain, return the Flower Language/Symbolism.
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

export const analyzeSkyImage = async (
  base64Image: string,
  language: TargetLanguage,
  mode: SkyMode, 
  region: NetworkRegion
): Promise<SkyAnalysisResult> => {
  
  try {
    const prompt = `
      Task: Analyze this image. Determine if it's SKY or LAND.
      Target Language: ${language}.
      
      Return JSON:
      {
        "domain": "SKY" or "LAND",
        "category": "Strict Enum Value",
        "scientificName": "Scientific name",
        "translatedName": "Common name",
        "poeticExpression": "Short poem (15 words)",
        "proverb": "Weather Myth (Sky) OR Flower Language (Land)",
        "proverbTranslation": "English translation",
        "dominantColors": ["#hex1", "#hex2", "#hex3"]
      }
    `;

    const dataUrl = `data:image/jpeg;base64,${base64Image}`;
    let resultText = "";
    
    if (region === NetworkRegion.GLOBAL) {
         console.log("[SkyStory] Mode: GLOBAL (Gemini)");
         resultText = await Promise.race([
            callGeminiAI(base64Image, prompt),
            timeoutPromise(30000, "Gemini (Global)") 
        ]);
    } else {
        console.log("[SkyStory] Mode: CN (Zhipu)");
        resultText = await Promise.race([
            callZhipuAI(dataUrl, prompt),
            timeoutPromise(60000, "Zhipu (Domestic)")
        ]);
    }

    if (!resultText) throw new Error("No response from AI Service");
    const cleanedText = extractJSON(resultText);
    
    let data;
    try {
        data = JSON.parse(cleanedText) as Omit<SkyAnalysisResult, 'timestamp' | 'imageUrl' | 'language'>;
    } catch (parseError) {
        console.error("JSON Parse Error. Raw Text:", resultText);
        throw new Error("Failed to parse AI response. " + parseError);
    }
    
    // Validation
    let category = data.category as SkyCategory;
    const validCategories = Object.values(SkyCategory);
    if (!validCategories.includes(category)) {
        if (data.domain === NatureDomain.LAND) category = SkyCategory.FLOWER;
        else category = SkyCategory.UNKNOWN;
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
