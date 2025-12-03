
import { GoogleGenAI, Type, Modality, GenerateVideosOperationResponse, GenerateVideosRequest, GetVideosOperationRequest } from "@google/genai";
// FIX: Import `GroundingSource` to use for strong typing.
import type { GroundingSource } from '../types';

let ai: GoogleGenAI | null = null;
const getAI = () => {
    if (!ai) {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
};

export const getWordInfo = async (text: string, targetLanguage: 'Thai' | 'English'): Promise<{ translation: string; exampleSentences: string[]; imagePrompt: string; ipa: string | null; thaiReading: string | null; } | null> => {
    const sourceLanguage = targetLanguage === 'Thai' ? 'English' : 'Thai';
    const ipaInstruction = sourceLanguage === 'English' 
        ? "4. 'ipa': The IPA (International Phonetic Alphabet) pronunciation for the English text, enclosed in slashes (e.g., /prəˌnʌnsiˈeɪʃn/). If not applicable, return null." 
        : '';
    
    const thaiReadingInstruction = targetLanguage === 'Thai'
        ? "5. 'thaiReading': The phonetic reading of the English text written in Thai script (e.g., 'เฮล-โล'). If not applicable, return null."
        : '';

    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `For the following text in ${sourceLanguage}: "${text}", please provide a JSON object with:
        1. 'translation': The translation in ${targetLanguage}.
        2. 'exampleSentences': An array of 2 to 3 simple example sentences in ${sourceLanguage} that use the original text.
        3. 'imagePrompt': A simple, descriptive prompt for an image generator to visually represent the original text.
        ${ipaInstruction}
        ${thaiReadingInstruction}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              translation: { type: Type.STRING, description: `The translation of the text into ${targetLanguage}.` },
              exampleSentences: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: `An array of 2 to 3 example sentences in ${sourceLanguage}.`
              },
              imagePrompt: { type: Type.STRING, description: "A simple prompt for an image generator." },
              ipa: { type: Type.STRING, description: "The IPA pronunciation. Can be null." },
              thaiReading: { type: Type.STRING, description: "The phonetic reading in Thai. Can be null." }
            },
            required: ["translation", "exampleSentences", "imagePrompt"],
          },
        },
      });
      
      const jsonText = response.text;
      const data = JSON.parse(jsonText);
      return { ...data, ipa: data.ipa || null, thaiReading: data.thaiReading || null };
  
    } catch (error) {
      console.error(`Error getting word info:`, error);
      return null;
    }
  };

export const translateContent = async (text: string, fromLang: string, toLang: string): Promise<string | null> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Translate the following ${fromLang} text to ${toLang}. Return ONLY the translated text without any introductory phrases or markdown.\n\nText: "${text}"`,
        });
        return response.text ? response.text.trim() : null;
    } catch (error) {
        console.error("Error translating content:", error);
        return null;
    }
};

export const translateImage = async (imageBase64: string, mimeType: string, targetLanguage: 'Thai' | 'English'): Promise<string | null> => {
    try {
        const ai = getAI();
        const prompt = targetLanguage === 'Thai' 
            ? "Identify the text in this image and translate it into Thai. Return only the translated text."
            : "Identify the text in this image and translate it into English. Return only the translated text.";

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: imageBase64
                        }
                    },
                    {
                        text: prompt
                    }
                ]
            }
        });
        return response.text ? response.text.trim() : null;
    } catch (error) {
        console.error("Error translating image:", error);
        return null;
    }
};

// FIX: Added explicit return type and strongly typed the sources processing to resolve type errors.
export const getQnAResponse = async (prompt: string, history: { role: string; parts: { text: string }[] }[]): Promise<{ text: string, sources: GroundingSource[] }> => {
    try {
        const ai = getAI();
        const chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            history,
            config: {
                tools: [{googleSearch: {}}],
            }
        });

        const response = await chat.sendMessage({ message: prompt });
        
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const sources: GroundingSource[] = groundingChunks?.map((chunk: any) => ({
            uri: chunk.web?.uri,
            title: chunk.web?.title,
        })).filter((source: any): source is GroundingSource => source.uri && source.title) || [];
        
        // Remove duplicates
        const uniqueSources: GroundingSource[] = Array.from(new Map(sources.map((item: GroundingSource) => [item.uri, item])).values());

        return { text: response.text, sources: uniqueSources };

    } catch (error) {
        console.error("Error getting Q&A response:", error);
        throw new Error("Failed to get response from AI.");
    }
};

export const generateImage = async (prompt: string): Promise<string | null> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `An educational, clear, and high-quality image representing the concept: "${prompt}"`,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        return null;
    } catch (error) {
        console.error("Error generating image:", error);
        return null;
    }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        // A versatile voice suitable for multiple languages
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            return base64Audio;
        }
        return null;
    } catch (error) {
        console.error("Error generating speech:", error);
        return null;
    }
};

// FIX: Add missing functions for video lesson generation to resolve errors in VideoLessons.tsx.
export const generateVideoScriptAndPrompt = async (difficulty: 'Beginner' | 'Intermediate' | 'Advanced'): Promise<{ story: string; vocabulary: { word: string; definition: string; }[]; videoPrompt: string; } | null> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Create an English lesson for a ${difficulty} level learner. The lesson should be a short, engaging story. Provide a JSON object with:
            1. 'story': A simple story of 3-4 sentences.
            2. 'vocabulary': An array of 2-3 key vocabulary words from the story, each with a simple definition.
            3. 'videoPrompt': A concise, descriptive prompt for a video generation model to create a short, animated video that visually represents the story. The prompt should be in English and focus on visual elements.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        story: { type: Type.STRING, description: "A short story for the lesson." },
                        vocabulary: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    word: { type: Type.STRING },
                                    definition: { type: Type.STRING }
                                },
                                required: ["word", "definition"]
                            },
                            description: "An array of key vocabulary words and their definitions."
                        },
                        videoPrompt: { type: Type.STRING, description: "A prompt for a video generator." }
                    },
                    required: ["story", "vocabulary", "videoPrompt"],
                },
            },
        });

        const jsonText = response.text;
        const data = JSON.parse(jsonText);
        return data;

    } catch (error) {
        console.error(`Error generating video script:`, error);
        return null;
    }
};

export const generateVideoFromPrompt = async (
    prompt: string,
    aspectRatio: '16:9' | '1:1' | '9:16'
): Promise<GenerateVideosOperationResponse> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const request: GenerateVideosRequest = {
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio
        }
    };
    return await ai.models.generateVideos(request);
};

export const generateVideoFromImage = async (
    imageBase64: string,
    mimeType: string,
    prompt: string,
    aspectRatio: '16:9' | '9:16'
): Promise<GenerateVideosOperationResponse> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const request: GenerateVideosRequest = {
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        image: {
            imageBytes: imageBase64,
            mimeType: mimeType,
        },
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio
        }
    };
    return await ai.models.generateVideos(request);
};


export const getVideosOperation = async (operation: GenerateVideosOperationResponse): Promise<GenerateVideosOperationResponse> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const request: GetVideosOperationRequest = { operation };
    return await ai.operations.getVideosOperation(request);
};

// FIX: Added analyzeHomework function to support HomeworkHelper.tsx
export const analyzeHomework = async (imageBase64: string | null, mimeType: string | null, textPrompt: string | null): Promise<string | null> => {
    try {
        const ai = getAI();
        const parts: any[] = [];

        if (imageBase64 && mimeType) {
            parts.push({
                inlineData: {
                    mimeType: mimeType,
                    data: imageBase64
                }
            });
        }

        let prompt = "You are a friendly and helpful English tutor. Help the student with their homework.";
        
        if (textPrompt) {
            prompt += `\n\nStudent's question/instruction: ${textPrompt}`;
        } else {
            prompt += "\n\nAnalyze the image and explain the English homework or question present in it clearly.";
        }

        parts.push({ text: prompt });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts }
        });

        return response.text ? response.text.trim() : null;
    } catch (error) {
        console.error("Error analyzing homework:", error);
        return null;
    }
};
