
import { GoogleGenAI, Type } from "@google/genai";
import { SmileValidationResult } from "../types";

export const validateSmile = async (base64Image: string): Promise<SmileValidationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image.split(',')[1] || base64Image,
          },
        },
        {
          text: "Analyze this image. Does it contain exactly one human face with a clear, visible smile? Return JSON with boolean 'isValid' and string 'reason'. If invalid, specify if it is due to multiple faces, no smile, or low quality.",
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isValid: {
            type: Type.BOOLEAN,
            description: "True if the image contains exactly one smiling face.",
          },
          reason: {
            type: Type.STRING,
            description: "A short explanation of the validation result.",
          },
        },
        required: ["isValid", "reason"],
      },
    },
  });

  try {
    const data = JSON.parse(response.text);
    return data as SmileValidationResult;
  } catch (error) {
    console.error("Failed to parse Gemini response", error);
    return { isValid: false, reason: "Analysis failed. Please try a clearer photo." };
  }
};
