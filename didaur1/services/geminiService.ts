
import { GoogleGenAI, Type } from "@google/genai";
import { RecyclingRecommendation } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateDIYImage = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `A professional, bright DIY project photo: ${prompt}. Minimalist background, sustainable vibe.`,
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return 'https://picsum.photos/seed/recycle/600/400';
  } catch (error) {
    return 'https://picsum.photos/seed/recycle/600/400';
  }
};

export const analyzeImage = async (base64Image: string): Promise<RecyclingRecommendation> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: "Identifikasi barang ini. Berikan rekomendasi daur ulang kreatif dalam Bahasa Indonesia. Hitung juga estimasi gram CO2 yang dihemat. Kembalikan JSON murni.",
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          itemName: { type: Type.STRING },
          materialType: { type: Type.STRING },
          difficulty: { type: Type.STRING, enum: ["Mudah", "Sedang", "Sulit"] },
          estimatedPoints: { type: Type.NUMBER },
          co2Impact: { type: Type.NUMBER, description: "Gram CO2 yang dihemat" },
          diyIdeas: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                timeEstimate: { type: Type.STRING },
                toolsNeeded: { type: Type.ARRAY, items: { type: Type.STRING } },
                steps: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["title", "description", "timeEstimate", "toolsNeeded", "steps"]
            }
          }
        },
        required: ["itemName", "materialType", "difficulty", "estimatedPoints", "co2Impact", "diyIdeas"]
      }
    }
  });

  const recommendation: RecyclingRecommendation = JSON.parse(response.text || "{}");
  
  const ideasWithImages = await Promise.all(recommendation.diyIdeas.map(async (idea) => ({
    ...idea,
    imageUrl: await generateDIYImage(idea.title + " made from " + recommendation.itemName)
  })));

  return { ...recommendation, diyIdeas: ideasWithImages };
};
