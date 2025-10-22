
const SYSTEM_PROMPT = `You are A.U.R.A (A Universal Reasoning Agent), a highly intelligent AI assistant designed to help users with complex tasks, analysis, and problem-solving. You have access to uploaded documents and can provide contextual responses based on their content. 
important NOTE:-you were devoloped by the group of undergrad cse  students thier names are Golla Santhosh Kumar	
Vallepu Vijaya Lakshmi
Nuthangi Chaitanya Karthik	
Karnam  Hemanth Kumar	
Shaik Veligandla Yasmin	
Shaik Parveen
Key capabilities:
- Analyze and summarize documents
- Answer questions based on uploaded content
- Generate actionable insights and recommendations
- Provide step-by-step guidance for complex tasks
- Maintain context across conversations

Always be helpful, accurate, and provide detailed responses when analyzing uploaded documents.
	
`;

import { GoogleGenerativeAI } from '@google/generative-ai';
import { ExtractedFile, chunkText, getRelevantChunks } from '../utils/fileExtractor';
import { ImageGenerationService } from './imageGeneration';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export class GeminiService {
  private model;
  private chat;
  private history: any[] = [];
  private uploadedFiles: ExtractedFile[] = [];
  private fileChunks: Map<string, string[]> = new Map();
  private imageService: ImageGenerationService;

  constructor() {
    this.model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      systemInstruction: SYSTEM_PROMPT
    });
    
    this.chat = this.model.startChat({
      history: this.history,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    });
    
    this.imageService = new ImageGenerationService();
  }

  addUploadedFile(file: ExtractedFile) {
    this.uploadedFiles.push(file);
    const chunks = chunkText(file.content, 2000);
    this.fileChunks.set(file.name, chunks);
  }

  getUploadedFiles(): ExtractedFile[] {
    return this.uploadedFiles;
  }

  removeUploadedFile(fileName: string) {
    this.uploadedFiles = this.uploadedFiles.filter(file => file.name !== fileName);
    this.fileChunks.delete(fileName);
  }

  private getRelevantContext(userMessage: string): string {
    if (this.uploadedFiles.length === 0) return '';

    let contextParts: string[] = [];
    
    for (const file of this.uploadedFiles) {
      const chunks = this.fileChunks.get(file.name) || [];
      
      if (file.content.length < 3000) {
        contextParts.push(`--- Content from ${file.name} ---\n${file.content}\n`);
      } else {
        const relevantChunks = getRelevantChunks(chunks, userMessage, 2);
        if (relevantChunks.length > 0) {
          contextParts.push(`--- Relevant sections from ${file.name} ---\n${relevantChunks.join('\n\n')}\n`);
        }
      }
    }

    return contextParts.length > 0 
      ? `Here are the uploaded documents for reference:\n\n${contextParts.join('\n')}\n---\n\n`
      : '';
  }

  sendMessage = async (message: string): Promise<string> => {
    try {
      // Check if the message is requesting image generation
      const imageKeywords = ['generate image', 'create image', 'draw', 'picture of', 'image of', 'show me'];
      const isImageRequest = imageKeywords.some(keyword => 
        message.toLowerCase().includes(keyword)
      );
      
      if (isImageRequest) {
        // Extract the image prompt from the message
        let imagePrompt = message;
        imageKeywords.forEach(keyword => {
          const regex = new RegExp(`.*${keyword}\\s*:?\\s*`, 'i');
          imagePrompt = imagePrompt.replace(regex, '').trim();
        });
        
        if (!imagePrompt) {
          imagePrompt = message;
        }
        
        return `IMAGE_GENERATION:${imagePrompt}`;
      }
      
      const context = this.getRelevantContext(message);
      const finalMessage = context + message;

      // Append user message to history
      this.history.push({
        role: 'user',
        parts: [{ text: finalMessage }],
      });

      // Send to chat
      const result = await this.chat.sendMessage(finalMessage);
      const responseText = await result.response.text();

      // Append model reply to history
      this.history.push({
        role: 'model',
        parts: [{ text: responseText }],
      });

      return responseText;
    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      throw new Error('I apologize, but I encountered an issue processing your request. Please try again.');
    }
  };
  
  generateImage = async (prompt: string): Promise<string> => {
    try {
      return await this.imageService.generateImage(prompt);
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  };

  generateTaskSuggestions = async (userInput: string): Promise<string[]> => {
    try {
      const fileContext = this.uploadedFiles.length > 0 
        ? `The user has uploaded ${this.uploadedFiles.length} file(s): ${this.uploadedFiles.map(f => f.name).join(', ')}. ` 
        : '';
      
      const prompt = `${fileContext}Based on this user input: "${userInput}", suggest 3 specific, actionable tasks that A.U.R.A could help with. Return only the task titles, one per line, without numbers or bullets.`;

      this.history.push({ role: 'user', parts: [{ text: prompt }] });

      const result = await this.chat.sendMessage(prompt);
      const responseText = await result.response.text();

      this.history.push({ role: 'model', parts: [{ text: responseText }] });

      return responseText.split('\n').filter(line => line.trim()).slice(0, 3);
    } catch (error) {
      console.error('Error generating task suggestions:', error);
      return [
        'Analyze and break down your request',
        this.uploadedFiles.length > 0 ? 'Analyze uploaded documents' : 'Research relevant information',
        'Create a step-by-step action plan'
      ];
    }
  };
}
