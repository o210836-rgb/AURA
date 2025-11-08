// src/services/imageGeneration.ts

import { HfInference } from '@huggingface/inference';

const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;
const hf = new HfInference(HF_TOKEN);

const DEFAULT_MODEL = 'stabilityai/stable-diffusion-xl-base-1.0';

// --- THIS IS THE FIX ---
// Add the "export" keyword to this line:
export async function generateImage(prompt: string): Promise<string> {
  try {
    const blob = await hf.textToImage({
      model: DEFAULT_MODEL,
      inputs: prompt,
      parameters: {
        negative_prompt: 'blurry, ugly, deformed',
      },
    });

    // Convert blob to a data URL to be easily displayed
    return URL.createObjectURL(blob);

  } catch (error) {
    console.error('Error generating image:', error);
    throw new Error('Failed to generate image');
  }
}
