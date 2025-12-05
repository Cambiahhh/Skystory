import { GoogleGenAI, Type } from "@google/genai";
import { SkyAnalysisResult, TargetLanguage, SkyMode } from '../types';
import { GEMINI_MODEL, SYSTEM_INSTRUCTION } from '../constants';

// Obfuscated Key Strategy: Base64(Reverse(API_KEY))
// This prevents the raw key from being easily scraped from the source code.
const OBFUSCATED_KEY = "WTZ2OWFJRmNLcHNvUXlud2VyUzY5bmcwQ3lDRndQRHlTeklB";

const getApiKey = () => {
  // 1. Prioritize environment variable if set (good for local dev)
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  
  // 2. Fallback to de-obfuscating the hardcoded key
  try {
    // Decode Base64 -> Reverse String -> Original Key
    return atob(OBFUSCATED_KEY).split('').reverse().join('');
  } catch (e) {
    console.error("Failed to decode credentials");
    return '';
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const analyzeSkyImage = async (
  base64Image: string,
  language: TargetLanguage,
  mode: SkyMode
): Promise<SkyAnalysisResult> => {
  
  try {
    const modeInstruction = mode === SkyMode.CLOUD 
      ? "Focus on clouds, sunlight, and atmospheric mood." 
      : "Focus on stars, constellations, moon phases, and the darkness of the void.";

    const prompt = `
      Analyze this image of the sky. Mode: ${modeInstruction}.
      The target language is ${language}.
      Return a JSON object.
    `;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['cloud', 'constellation', 'celestial_event', 'unknown'] },
            scientificName: { type: Type.STRING, description: "Scientific name e.g., 'Cumulus Congestus' or 'Orion'" },
            translatedName: { type: Type.STRING, description: "Name in the target language" },
            poeticExpression: { type: Type.STRING, description: "A highly romantic, poetic sentence describing this specific sky in the target language." },
            proverb: { type: Type.STRING, description: "A weather proverb or short myth in the target language." },
            proverbTranslation: { type: Type.STRING, description: "English translation of the proverb/myth for reference." },
            dominantColors: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Array of 3 hex color codes representing the sky palette" 
            }
          },
          required: ['type', 'scientificName', 'translatedName', 'poeticExpression', 'proverb', 'dominantColors']
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from SkyStory");

    const data = JSON.parse(resultText) as Omit<SkyAnalysisResult, 'timestamp' | 'imageUrl' | 'language'>;
    
    return {
      ...data,
      timestamp: Date.now(),
      imageUrl: `data:image/jpeg;base64,${base64Image}`,
      language: language
    };

  } catch (error) {
    console.error("SkyStory Analysis Error:", error);
    return {
      type: 'unknown',
      scientificName: 'Mystery of the Sky',
      translatedName: 'Unknown Beauty',
      poeticExpression: 'The sky whispers secrets we cannot yet understand.',
      proverb: 'Even when the sky is silent, it is beautiful.',
      proverbTranslation: 'Nature speaks in many tongues.',
      dominantColors: ['#87CEEB', '#E0F7FA', '#FFFFFF'],
      timestamp: Date.now(),
      imageUrl: `data:image/jpeg;base64,${base64Image}`,
      language: language
    };
  }
};