import { GoogleGenAI, Type, Chat } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// --- World Generation Services ---

export const generateWorldLore = async (userPrompt: string, style: string): Promise<{ title: string; description: string; visualPrompt: string }> => {
  if (!apiKey) throw new Error("API Key not found");

  const model = 'gemini-2.5-flash';
  
  const systemInstruction = `You are a creative world-builder and sci-fi/fantasy author. 
  Your task is to take a short user idea and expand it into a concept for a "World".
  Output JSON with:
  - title: A creative name for the world.
  - description: A 2-3 sentence captivating lore description (in Chinese).
  - visualPrompt: A highly detailed English image generation prompt optimized for AI art generators, describing the landscape, lighting, colors, and mood based on the user's idea and selected style.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `User Idea: ${userPrompt}\nStyle: ${style}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            visualPrompt: { type: Type.STRING },
          },
          required: ["title", "description", "visualPrompt"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No text returned from lore generation");
    return JSON.parse(text);
  } catch (error) {
    console.error("Lore Generation Error:", error);
    throw error;
  }
};

export const generateWorldImage = async (visualPrompt: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key not found");

  const model = 'gemini-2.5-flash-image';

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [{ text: visualPrompt }],
      },
      config: {
        imageConfig: {
           aspectRatio: "4:3",
        }
      }
    });

    let imageUrl = '';
    
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageUrl) throw new Error("No image generated");
    return imageUrl;
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
};

export const enhanceWorldPrompt = async (currentInput: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key not found");

  const model = 'gemini-2.5-flash';
  const isRandom = !currentInput || currentInput.trim().length === 0;

  const systemInstruction = isRandom
    ? `You are a creative muse for a world-building application. 
       Generate a SINGLE, intriguing, and creative sentence concept for a sci-fi, fantasy, or surreal world (in Chinese). 
       It should be visual and inspiring.`
    : `You are a professional editor and creative writer. 
       Rewrite the user's rough idea into a more descriptive, evocative, and polished short paragraph (in Chinese). 
       Keep the original core idea but make it sound poetic and visually rich. 
       Keep it under 3 sentences.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: isRandom ? "Generate a random world concept." : currentInput,
      config: {
        systemInstruction,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No text returned from enhancement");
    return text.trim();
  } catch (error) {
    console.error("Prompt Enhancement Error:", error);
    throw error;
  }
};

// --- World Architect Chat Services ---

export interface Suggestion {
  label: string;
  prompt: string;
}

const VALID_STYLES = [
  "Cinematic Realistic", "Cyberpunk", "Studio Ghibli Style", "Oil Painting", 
  "Abstract", "Isometric 3D", "Dark Fantasy", "Solarpunk", "Watercolor", "Pixel Art"
];

export const createArchitectChat = (): Chat => {
  if (!apiKey) throw new Error("API Key not found");
  
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `
        You are the "World Architect", an advanced creative assistant helping a user design a fictional world.
        
        GOAL: Help the user iteratively refine their prompt to be vivid, creative, and ready for image generation.
        
        PROTOCOL:
        1. Conversation: Ask probing questions about lighting, atmosphere, inhabitants to flesh out details.
        2. Draft Proposal: When you have a solid concept or the user accepts a suggestion, generate a "World Draft".
           You MUST wrap the draft in a special code block like this:
           
           \`\`\`json_draft
           {
             "title": "Short Title",
             "description": "The full, detailed prompt for image generation (Chinese)",
             "style": "One of the valid styles",
             "reasoning": "A very short explanation of why this matches the user's desire"
           }
           \`\`\`
        
        3. Valid Styles: ${VALID_STYLES.join(', ')}.
        
        Always reply in Chinese (except for the JSON keys). Be encouraging and imaginative.
      `,
    },
  });
};

export const getArchitectSuggestions = async (currentContext: string): Promise<Suggestion[]> => {
    // Return static suggestions if context is empty, otherwise could be dynamic
    if (!currentContext.trim()) {
        return [
            { label: "赛博朋克城市", prompt: "一座被霓虹灯覆盖的雨夜城市，高耸入云的摩天大楼。" },
            { label: "魔法森林", prompt: "发光的蘑菇和漂浮的岛屿组成的古老森林。" },
            { label: "火星基地", prompt: "红色荒原上的巨型玻璃穹顶殖民地。" }
        ];
    }
    
    // Quick dynamic suggestions based on context (lightweight call)
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Based on this world description: "${currentContext}", provide 3 short, creative follow-up directions to make it more detailed. 
            Return ONLY a JSON array of objects with 'label' (max 6 chars) and 'prompt' (instruction to the AI editor).
            Example: [{"label": "增加天气", "prompt": "详细描述这里的天气和气候特征"}]`,
            config: { responseMimeType: "application/json" }
        });
        const text = response.text;
        if (!text) return [];
        return JSON.parse(text) as Suggestion[];
    } catch (e) {
        return [
            { label: "增加细节", prompt: "请帮我增加更多视觉细节" },
            { label: "描述光影", prompt: "描述一下这里的光影效果" },
            { label: "添加生物", prompt: "这里生活着什么样的生物？" }
        ];
    }
}