import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { SoilDataPoint } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeSoilDataWithGemini = async (data: SoilDataPoint[]) => {
    if (!data || data.length === 0) return null;
    try {
        const prompt = `
            You are an expert agricultural AI. Analyze the following soil dataset and:
            1. Predict the most likely crop diseases and risks (with probability and explanation).
            2. Give a clear, actionable summary for the farmer.
            3. Predict yield (tons/acre) and profit (USD).
            4. Use only the data provided. Be accurate and practical.
            Dataset: ${JSON.stringify(data.slice(0, 20))}
            Respond in this JSON format:
            {
              "yield": number, // predicted yield in tons/acre
              "profit": number, // predicted profit in USD
              "diseases": [ { "name": string, "probability": number, "explanation": string } ],
              "risks": [ { "name": string, "probability": number, "explanation": string } ],
              "summary": string // clear summary and recommendations
            }
        `;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        yield: { type: Type.NUMBER, description: "Predicted yield in tons/acre" },
                        profit: { type: Type.NUMBER, description: "Predicted profit in USD" },
                        diseases: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    probability: { type: Type.NUMBER },
                                    explanation: { type: Type.STRING }
                                }
                            }
                        },
                        risks: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    probability: { type: Type.NUMBER },
                                    explanation: { type: Type.STRING }
                                }
                            }
                        },
                        summary: { type: Type.STRING, description: "A brief summary of trends and recommendations" }
                    }
                }
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Gemini soil data analysis error:", error);
        return {
            yield: 8.5,
            profit: 12000,
            diseases: [
                { name: "Mock Blight", probability: 0.2, explanation: "Mock: Slightly high humidity detected." }
            ],
            risks: [
                { name: "Mock Drought", probability: 0.1, explanation: "Mock: Low moisture in some records." }
            ],
            summary: "Mock Data: Soil moisture is stable, but fertility shows a slight decline. Consider adding nitrogen-rich fertilizer for optimal yield."
        };
    }
};

export const analyzeLandImageWithGemini = async (base64Image: string, mimeType: string) => {
    try {
        const imagePart = { inlineData: { data: base64Image, mimeType } };
        const textPart = { text: `
            Analyze this agricultural land image. 
            1. Determine if it is a drone/hyperspectral image or a normal photo.
            2. If drone/hyperspectral, estimate NDVI/NDRE values.
            3. If a normal photo, analyze plant health based on color, texture, and vegetation cover.
            4. Create a health map estimation as percentages (healthy, mediumStress, highStress).
            5. Provide a brief summary.
        `};

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                       isDroneImage: { type: Type.BOOLEAN },
                       ndvi: { type: Type.NUMBER, description: "Normalized Difference Vegetation Index, if applicable" },
                       ndre: { type: Type.NUMBER, description: "Normalized Difference Red Edge Index, if applicable" },
                       healthMap: {
                           type: Type.OBJECT,
                           properties: {
                               healthy: { type: Type.NUMBER, description: "Percentage of healthy area" },
                               mediumStress: { type: Type.NUMBER, description: "Percentage of medium stress area" },
                               highStress: { type: Type.NUMBER, description: "Percentage of high stress area" },
                           }
                       },
                       summary: { type: Type.STRING, description: "Brief analysis summary" }
                    }
                }
            }
        });

        return JSON.parse(response.text);

    } catch (error) {
        console.error("Gemini land image analysis error:", error);
        return { isDroneImage: false, healthMap: { healthy: 60, mediumStress: 25, highStress: 15 }, summary: "Mock Data: The field appears mostly healthy, with some patches of stress likely due to uneven water distribution." };
    }
};


export const detectPlantDiseaseWithGemini = async (base64Image: string, mimeType: string) => {
     try {
        const imagePart = { inlineData: { data: base64Image, mimeType } };
        const textPart = { text: `
            Analyze this plant image to detect disease. Identify the disease, provide a confidence percentage, and list brief treatment steps.
        `};

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
             config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        diseaseName: { type: Type.STRING },
                        confidence: { type: Type.NUMBER, description: "Confidence score from 0 to 100" },
                        treatmentSteps: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    }
                }
            }
        });

        return JSON.parse(response.text);
    } catch (error) {
        console.error("Gemini disease detection error:", error);
        return { diseaseName: "Mock Data: Tomato Late Blight", confidence: 85, treatmentSteps: ["Remove and destroy infected leaves.", "Apply copper-based fungicide.", "Ensure good air circulation."] };
    }
};

export const getChatbotResponse = async (history: { role: string, parts: { text: string }[] }[], message: string, soilData?: SoilDataPoint[]) => {
    try {
        let context = "You are an AI farm advisor with decades of experience. Be encouraging and provide practical, profit-focused advice.";
        if (soilData && soilData.length > 0) {
            context += ` The user's most recent farm soil data is: ${JSON.stringify(soilData.slice(-5))}. Use this data to provide specific, profit-focused advice.`;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [...history, { role: 'user', parts: [{ text: message }] }],
            config: {
                systemInstruction: `${context} First, detect the language of the user's question. Then, provide a direct and helpful answer in that same language. Finally, provide the BCP-47 language code for your response.`,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        response: { type: Type.STRING, description: "The answer to the user's question in the detected language." },
                        languageCode: { type: Type.STRING, description: "The BCP-47 language code of the response (e.g., 'en-US', 'ta-IN', 'fr-FR')." }
                    },
                    required: ["response", "languageCode"]
                }
            }
        });
        
        const parsedResponse = JSON.parse(response.text);
        return {
            responseText: parsedResponse.response,
            languageCode: parsedResponse.languageCode
        };

    } catch (error) {
        console.error("Gemini chatbot error:", error);
        return { responseText: "I'm sorry, I couldn't process that request right now. Please try again.", languageCode: "en-US" };
    }
};

export const generateImageWithGemini = async (prompt: string) => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
            },
        });

        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    } catch (error) {
        console.error("Gemini image generation error:", error);
        return "https://picsum.photos/512"; // Fallback image
    }
};