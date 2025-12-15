
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

// Helper for delay
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const extractJSON = (text: string): string => {
    let cleaned = text.trim();
    // Remove code blocks if present
    cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '');
    // Find the first '{' and last '}' to handle any preamble/postscript text
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        return cleaned.substring(firstBrace, lastBrace + 1);
    }
    return cleaned;
};

// --- CORE PROMPT LOGIC ---
const LENS_AND_LAND_INSTRUCTION = `
You are "Cambia", a poetic AI curator for the app "Dew".
Your task is to analyze the image, detect its domain (SKY or LAND), and provide a romantic, cultural translation.

1. **DETECT DOMAIN**:
   - **SKY**: Clouds, Sun, Moon, Stars, Atmosphere, Lightning.
   - **LAND**: Flowers, Plants, Trees, Leaves, Succulents, Fruit, Close-up nature.
   - **OTHER**: If the image is primarily of people, animals, man-made objects, or indoors without nature focus, return domain "LAND" but category "Unknown".

2. **CATEGORIZATION**:
   - If SKY, use: ['Cumulus', 'Stratus', 'Cirrus', 'Nimbus', 'Contrail', 'Clear', 'Sunrise', 'Sunset', 'Golden Hour', 'Blue Hour', 'Crescent Moon', 'Quarter Moon', 'Gibbous Moon', 'Full Moon']
   - If LAND, use: ['Flower', 'Foliage', 'Tree', 'Succulent', 'Fruit']
   - If unsure, ambiguous, or not nature, use: 'Unknown'

3. **OUTPUT CONTENT**:
   - **Scientific Name**: Precise naming (e.g., "Altocumulus" or "Rosa rubiginosa"). If unknown, use a descriptive title.
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

  // RETRY LOGIC FOR 503/429 ERRORS
  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // Handle Overloaded (503) or Rate Limit (429) specifically
        if (response.status === 503 || response.status === 429) {
            attempt++;
            if (attempt >= MAX_RETRIES) {
                const errText = await response.text();
                throw new Error(`Gemini Server Busy (${response.status}) after retries: ${errText}`);
            }
            // Exponential backoff: 1s, 2s, 4s
            const delay = Math.pow(2, attempt) * 1000;
            console.warn(`[SkyStory] Gemini Busy (${response.status}). Retrying in ${delay}ms...`);
            await wait(delay);
            continue; // Retry loop
        }

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini API Error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!content) throw new Error("Gemini returned empty response.");
        return content;

    } catch (error: any) {
        // If it's a network error (fetch failed completely), typically we throw.
        // But if we want to be very resilient, we could retry network errors too.
        // For now, only retry logic inside the loop handles status codes.
        // If fetch throws (e.g. offline), we let it bubble up unless we want to retry that too.
        throw error;
    }
  }
  throw new Error("Gemini request failed unexpectedly.");
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

  const MAX_RETRIES = 2;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
        const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${zhipuApiKey}` 
        },
        body: JSON.stringify(payload)
        });

        if (response.status === 503 || response.status === 429) {
            attempt++;
            if (attempt >= MAX_RETRIES) {
                 const errText = await response.text();
                 throw new Error(`Zhipu Server Busy (${response.status}): ${errText}`);
            }
            await wait(1500); // Simple wait for Zhipu
            continue;
        }

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
        if (attempt >= MAX_RETRIES - 1) throw error;
        attempt++;
        await wait(1000);
    }
  }
  throw new Error("Zhipu request failed.");
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
        "category": "Strict Enum Value or Unknown",
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
    
    // Increased timeouts slightly to account for retries
    if (region === NetworkRegion.GLOBAL) {
         console.log("[SkyStory] Mode: GLOBAL (Gemini)");
         resultText = await Promise.race([
            callGeminiAI(base64Image, prompt),
            timeoutPromise(60000, "Gemini (Global)") // Increased from 30s to 60s for retries
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
    
    // --- Validation & Normalization ---
    
    let category = data.category || 'Unknown';
    let domain = data.domain || NatureDomain.LAND;
    
    // Helper to find matching enum value (case-insensitive)
    const findEnumMatch = (val: string): SkyCategory | undefined => {
        const normalized = val.toLowerCase().replace(/\s/g, '');
        for (const enumVal of Object.values(SkyCategory)) {
            if (enumVal.toLowerCase().replace(/\s/g, '') === normalized) {
                return enumVal;
            }
        }
        return undefined;
    };

    let matchedCategory = findEnumMatch(category);

    // If no exact enum match, perform fuzzy mapping or fallback
    if (!matchedCategory) {
        const lowerCat = category.toLowerCase();
        
        if (lowerCat.includes('plant') || lowerCat.includes('leaf') || lowerCat.includes('grass') || lowerCat.includes('bush')) {
            matchedCategory = SkyCategory.FOLIAGE;
        } else if (lowerCat.includes('cloud')) {
            matchedCategory = SkyCategory.CUMULUS; 
        } else if (lowerCat.includes('moon')) {
            matchedCategory = SkyCategory.FULL; 
        } else {
             // CRITICAL FIX: Do NOT default to FLOWER. Default to UNKNOWN if undefined.
             matchedCategory = SkyCategory.UNKNOWN;
        }
    }

    // Safety check: ensure matchedCategory is one of the valid SkyCategory values
    category = matchedCategory;

    return {
      ...data,
      domain: domain,
      category: category as SkyCategory,
      timestamp: Date.now(),
      imageUrl: dataUrl,
      language: language
    };

  } catch (error: any) {
    console.error("SkyStory Analysis Error:", error);
    throw error;
  }
};
