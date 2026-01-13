import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserConfig, GeneratedData, TransitionConfig, TransitionResult } from "../types";

// Helper to encode file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const SYSTEM_INSTRUCTION = `
You are an expert Film Director and AI Prompt Engineer specialized in creating professional storyboards for advertising, anime, and film.
Your goal is to generate structured prompts for an AI Image Generator (like Midjourney or Stable Diffusion) based on user input.

You must output a JSON object strictly adhering to the schema provided.

The user will provide either a text description or an image. 
If an image is provided:
1. Analyze the image deeply.
2. Identify distinct characters (Label them Character 1, Character 2, etc.).
3. Analyze the lighting, color palette, and composition.
4. Use this analysis as the basis for the prompt generation.

The output must have two main utilities:
1. A "Grid Prompt" mode (all shots in one image).
2. A "Split Prompt" mode (individual descriptions for each shot).

The content must follow this specific styling:
- Professional film terminology (Camera Rig, Composition, Lighting Studio, Color Grade).
- Concise, high-density descriptive keywords.
- For the "shots" array, each shot content must include:
  - [Shot N Role Action]: Title
  - Camera Rig: ...
  - Composition: ...
  - Character: ... (Appearance, Action/Pose, Clothing)

Also, for each shot, provide a "shortContent" field. This should be a condensed version of the shot description (max 400 characters) that retains the most critical visual triggers (Subject, Action, Key Lighting/Camera) but removes filler words. This is for users who need shorter prompts.

Ensure the "globalParams" object extracts the common style elements (Theme, Environment, Lighting, Artist, Camera, Color) so they can be appended to individual shots later.
`;

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    shot: { type: Type.STRING, description: "Description of the grid layout (e.g., '3x3 Grid StoryboardLayout...')" },
    subjectIntro: { type: Type.STRING, description: "Overall scene introduction and character definitions." },
    shots: {
      type: Type.ARRAY,
      description: "List of individual shot details",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          title: { type: Type.STRING, description: "e.g., '[Shot 1 Role 1 meets Role 2]'" },
          content: { type: Type.STRING, description: "The detailed prompt block for this specific shot (Camera, Comp, Char)." },
          shortContent: { type: Type.STRING, description: "Condensed version of the prompt (< 400 chars)." }
        },
        required: ["id", "title", "content", "shortContent"]
      }
    },
    globalParams: {
      type: Type.OBJECT,
      description: "Global stylistic parameters",
      properties: {
        theme: { type: Type.STRING },
        environment: { type: Type.STRING },
        lighting: { type: Type.STRING },
        artistStyle: { type: Type.STRING },
        camera: { type: Type.STRING },
        colorGrade: { type: Type.STRING }
      },
      required: ["theme", "environment", "lighting", "artistStyle", "camera", "colorGrade"]
    }
  },
  required: ["shot", "subjectIntro", "shots", "globalParams"]
};

const TRANSITION_SYSTEM_INSTRUCTION = `
You are an expert Film Editor and Continuity Director. 
Your task is to analyze a provided storyboard image containing multiple shots (e.g., a 3x3 grid).
You must identify the sequential order of shots in the grid (reading left-to-right, top-to-bottom).
Then, you must generate "Transition Prompts" that fit logically BETWEEN these existing shots to create a smooth animation or narrative flow.

1. Analyze the visual style, characters, and environment of the uploaded storyboard.
2. For each gap between Shot N and Shot N+1, generate the requested number of intermediate transition prompts.
3. The transition prompts must strictly adhere to the visual style (lighting, color, aspect ratio) of the analyzed storyboard.
4. The content of the transition must logically bridge the action. For example, if Shot 1 is a punch start and Shot 2 is a hit, the transition should be the fist mid-air.

Output a JSON object.
`;

const TRANSITION_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    analysis: { type: Type.STRING, description: "Brief analysis of the storyboard style, character, and setting found in the image." },
    transitions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          fromShotIndex: { type: Type.INTEGER, description: "The index of the preceding shot (1-based)." },
          toShotIndex: { type: Type.INTEGER, description: "The index of the following shot (1-based)." },
          transitionPrompts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                order: { type: Type.INTEGER, description: "1, 2, or 3 depending on sequence" },
                content: { type: Type.STRING, description: "The full cinematic prompt for this intermediate frame." }
              },
              required: ["order", "content"]
            }
          }
        },
        required: ["fromShotIndex", "toShotIndex", "transitionPrompts"]
      }
    }
  },
  required: ["analysis", "transitions"]
};

export const generateStoryboard = async (
  config: UserConfig, 
  imageFile?: File | null,
  currentParams?: GeneratedData['globalParams']
): Promise<GeneratedData> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-3-flash-preview"; 

  const parts: any[] = [];

  if (imageFile) {
    const base64Data = await fileToGenerativePart(imageFile);
    parts.push({
      inlineData: {
        mimeType: imageFile.type,
        data: base64Data
      }
    });
    parts.push({
      text: "Analyze this reference image. Extract characters (Role 1, Role 2...), scene details, lighting, and mood."
    });
  }

  let promptText = `
    Create a ${config.shotCount}-shot storyboard script.
    Aspect Ratio: ${config.aspectRatio}.
    
    Context/Description: ${config.mainDescription}
    Additional Notes: ${config.additionalNotes}
    
    Structure the 'shot' field to describe a ${Math.ceil(Math.sqrt(config.shotCount))}x${Math.ceil(Math.sqrt(config.shotCount))} grid (or appropriate layout for ${config.shotCount} shots).
  `;

  if (currentParams) {
    promptText += `
    Refine the generation using these existing style parameters (do not change them unless necessary for the new context):
    Theme: ${currentParams.theme}
    Lighting: ${currentParams.lighting}
    Camera: ${currentParams.camera}
    Color Grade: ${currentParams.colorGrade}
    `;
  }

  parts.push({ text: promptText });

  const response = await ai.models.generateContent({
    model: modelId,
    contents: { parts },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.7, // Creativity balanced with structure
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");

  try {
    return JSON.parse(text) as GeneratedData;
  } catch (e) {
    console.error("Failed to parse JSON", text);
    throw new Error("AI response was not valid JSON");
  }
};

export const generateTransitions = async (
  config: TransitionConfig,
  imageFile: File
): Promise<TransitionResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-3-flash-preview";

  const parts: any[] = [];

  // Image is mandatory for this mode
  const base64Data = await fileToGenerativePart(imageFile);
  parts.push({
    inlineData: {
      mimeType: imageFile.type,
      data: base64Data
    }
  });

  const promptText = `
    This image is a storyboard grid. 
    1. Identify the separate panels/shots.
    2. Generate transition prompts between each consecutive panel to bridge the motion/narrative.
    
    Number of transition frames to generate between each shot: ${config.transitionCount}.
    
    Additional Context/Instructions from user: ${config.additionalNotes}
    
    Ensure strict consistency with the style found in the image.
  `;

  parts.push({ text: promptText });

  const response = await ai.models.generateContent({
    model: modelId,
    contents: { parts },
    config: {
      systemInstruction: TRANSITION_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: TRANSITION_SCHEMA,
      temperature: 0.6,
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");

  try {
    return JSON.parse(text) as TransitionResult;
  } catch (e) {
    console.error("Failed to parse JSON", text);
    throw new Error("AI response was not valid JSON");
  }
};