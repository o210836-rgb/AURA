import { HfInference } from '@huggingface/inference';

export class ImageGenerationService {
  private hf: HfInference;

  constructor() {
    this.hf = new HfInference('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');
  }

  async generateImage(prompt: string): Promise<string> {
    try {
      const response = await this.hf.textToImage({
        model: 'black-forest-labs/FLUX.1-dev',
        inputs: prompt,
      });

      // Convert blob to base64 data URL
      const arrayBuffer = await response.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const dataUrl = `data:image/png;base64,${base64}`;
      
      return dataUrl;
    } catch (error) {
      console.error('Error generating image with Hugging Face:', error);
      throw new Error('Failed to generate image. Please try again with a different prompt.');
    }
  }
}