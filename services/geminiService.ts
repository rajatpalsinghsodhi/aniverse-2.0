
import { GoogleGenAI, Type } from "@google/genai";
import { AnimeSummary } from "../types";

export const geminiService = {
  /**
   * Provides expert anime commentary and viewer guide.
   */
  async getAnimeSummary(title: string, synopsis: string): Promise<AnimeSummary> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an anime expert. Provide a "Viewer's Guide" for the anime "${title}". Synopsis: ${synopsis}.
      Give a persuasive "whyWatch" paragraph, 3 main "themes", and one "trivia" fact.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            whyWatch: { type: Type.STRING },
            themes: { type: Type.ARRAY, items: { type: Type.STRING } },
            trivia: { type: Type.STRING }
          },
          required: ["whyWatch", "themes", "trivia"]
        }
      }
    });
    return JSON.parse(response.text.trim());
  }
};
