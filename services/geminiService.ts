
import { GoogleGenAI, Type } from "@google/genai";
import { SkyAnalysisResult, TargetLanguage, SkyMode } from '../types';
import { GEMINI_MODEL, SYSTEM_INSTRUCTION } from '../constants';

// Initialize the API client. 
// We use GEMINI_API_KEY as requested, but fallback to API_KEY to ensure compatibility with standard environments.
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

// Helper for timeout
const timeoutPromise = (ms: number) => new Promise<never>((_, reject) => {
  setTimeout(() => reject(new Error("Request timed out")), ms);
});

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
      IMPORTANT: For 'dominantColors', extract 3 hex codes specifically representing the sky gradient, ordered from the TOP of the sky to the HORIZON (Bottom).
    `;

    const generatePromise = ai.models.generateContent({
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
              description: "Array of 3 hex color codes representing the sky gradient from top to bottom" 
            }
          },
          required: ['type', 'scientificName', 'translatedName', 'poeticExpression', 'proverb', 'dominantColors']
        }
      }
    });

    // Race the generation against a 45s timeout to prevent infinite hanging
    const response = await Promise.race([
      generatePromise,
      timeoutPromise(45000) 
    ]) as any;

    const resultText = response.text;
    if (!resultText) throw new Error("No response from SkyStory");

    // Clean potential markdown code blocks if present
    const cleanedText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();

    const data = JSON.parse(cleanedText) as Omit<SkyAnalysisResult, 'timestamp' | 'imageUrl' | 'language'>;
    
    return {
      ...data,
      timestamp: Date.now(),
      imageUrl: `data:image/jpeg;base64,${base64Image}`,
      language: language
    };

  } catch (error) {
    console.error("SkyStory Analysis Error:", error);
    // Return a backup object so the UI doesn't crash, but logged the error.
    return {
      type: 'unknown',
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
