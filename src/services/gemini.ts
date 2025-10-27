
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
import { bookFood, FoodBookingResult } from './foodBooking';
import { bookTicket, TicketBookingResult } from './ticketBooking';
import {
  FasterBookService,
  FoodBookingParams,
  MovieBookingParams,
  FoodBookingResponse,
  MovieBookingResponse,
  BookingsResponse
} from './fasterbook';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyBsueiN62CF8-qzda3T_h3ZZU74Q2G6Juw');

export type AgenticAction =
  | { type: 'food_booking'; result: FoodBookingResult }
  | { type: 'ticket_booking'; result: TicketBookingResult }
  | { type: 'fasterbook_food'; result: FoodBookingResponse }
  | { type: 'fasterbook_movie'; result: MovieBookingResponse }
  | { type: 'fasterbook_bookings'; result: BookingsResponse }
  | { type: 'fasterbook_menu'; result: AvailableItemsResponse }
  | { type: 'image_generation'; prompt: string }
  | null;

export class GeminiService {
  private model;
  private chat;
  private history: any[] = [];
  private uploadedFiles: ExtractedFile[] = [];
  private fileChunks: Map<string, string[]> = new Map();
  private imageService: ImageGenerationService;
  private fasterBookService: FasterBookService;

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
    this.fasterBookService = new FasterBookService();
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
      const detectedAction = this.detectAgenticAction(message);

      if (detectedAction) {
        if (detectedAction.type === 'image_generation') {
          return `IMAGE_GENERATION:${detectedAction.prompt}`;
        } else if (detectedAction.type === 'food_booking') {
          return 'FOOD_BOOKING_REQUEST';
        } else if (detectedAction.type === 'ticket_booking') {
          return 'TICKET_BOOKING_REQUEST';
        } else if (detectedAction.type === 'fasterbook_food') {
          return 'FASTERBOOK_FOOD_REQUEST';
        } else if (detectedAction.type === 'fasterbook_movie') {
          return 'FASTERBOOK_MOVIE_REQUEST';
        } else if (detectedAction.type === 'fasterbook_bookings') {
          return 'FASTERBOOK_BOOKINGS_REQUEST';
        } else if (detectedAction.type === 'fasterbook_menu') {
          return 'FASTERBOOK_MENU_REQUEST';
        }
      }

      const context = this.getRelevantContext(message);
      const finalMessage = context + message;

      this.history.push({
        role: 'user',
        parts: [{ text: finalMessage }],
      });

      const result = await this.chat.sendMessage(finalMessage);
      const responseText = await result.response.text();

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

  detectAgenticAction = (message: string): AgenticAction => {
    const lowerMessage = message.toLowerCase();

    const imageKeywords = ['generate image', 'create image', 'draw', 'picture of', 'image of', 'show me'];
    const isImageRequest = imageKeywords.some(keyword => lowerMessage.includes(keyword));

    if (isImageRequest) {
      let imagePrompt = message;
      imageKeywords.forEach(keyword => {
        const regex = new RegExp(`.*${keyword}\\s*:?\\s*`, 'i');
        imagePrompt = imagePrompt.replace(regex, '').trim();
      });

      if (!imagePrompt) {
        imagePrompt = message;
      }

      return { type: 'image_generation', prompt: imagePrompt };
    }

    const foodKeywords = ['order food', 'book food', 'get food', 'food delivery', 'order pizza', 'order burger', 'hungry', 'food order'];
    const isFoodRequest = foodKeywords.some(keyword => lowerMessage.includes(keyword));

    if (isFoodRequest) {
      return { type: 'food_booking', result: {} as FoodBookingResult };
    }

    const ticketKeywords = ['book ticket', 'buy ticket', 'get ticket', 'book seats', 'concert ticket', 'event ticket', 'reserve ticket'];
    const isTicketRequest = ticketKeywords.some(keyword => lowerMessage.includes(keyword));

    if (isTicketRequest) {
      return { type: 'ticket_booking', result: {} as TicketBookingResult };
    }

    const fasterBookFoodKeywords = ['fasterbook food', 'order from fasterbook', 'fasterbook delivery', 'use fasterbook for food'];
    const isFasterBookFood = fasterBookFoodKeywords.some(keyword => lowerMessage.includes(keyword));

    if (isFasterBookFood) {
      return { type: 'fasterbook_food', result: {} as FoodBookingResponse };
    }

    const fasterBookMovieKeywords = ['fasterbook movie', 'book movie on fasterbook', 'fasterbook cinema', 'use fasterbook for movie'];
    const isFasterBookMovie = fasterBookMovieKeywords.some(keyword => lowerMessage.includes(keyword));

    if (isFasterBookMovie) {
      return { type: 'fasterbook_movie', result: {} as MovieBookingResponse };
    }

    const showBookingsKeywords = ['show bookings', 'my bookings', 'view bookings', 'list bookings', 'get my orders'];
    const isShowBookings = showBookingsKeywords.some(keyword => lowerMessage.includes(keyword));

    if (isShowBookings) {
      return { type: 'fasterbook_bookings', result: {} as BookingsResponse };
    }

    const showMenuKeywords = ['show menu', 'view menu', 'what food', 'what movies', 'available items', 'fasterbook menu', 'list menu'];
    const isShowMenu = showMenuKeywords.some(keyword => lowerMessage.includes(keyword));

    if (isShowMenu) {
      return { type: 'fasterbook_menu', result: {} as AvailableItemsResponse };
    }

    return null;
  };

  executeAgenticAction = async (message: string): Promise<AgenticAction> => {
    const detectedAction = this.detectAgenticAction(message);

    if (!detectedAction) return null;

    if (detectedAction.type === 'food_booking') {
      const result = await bookFood(message);
      return { type: 'food_booking', result };
    } else if (detectedAction.type === 'ticket_booking') {
      const result = await bookTicket(message);
      return { type: 'ticket_booking', result };
    } else if (detectedAction.type === 'fasterbook_food') {
      const params = await this.extractFoodParams(message);
      const result = await this.fasterBookService.bookFood(params);
      return { type: 'fasterbook_food', result };
    } else if (detectedAction.type === 'fasterbook_movie') {
      const params = await this.extractMovieParams(message);
      const result = await this.fasterBookService.bookMovie(params);
      return { type: 'fasterbook_movie', result };
    } else if (detectedAction.type === 'fasterbook_bookings') {
      const result = await this.fasterBookService.getBookings();
      return { type: 'fasterbook_bookings', result };
    } else if (detectedAction.type === 'fasterbook_menu') {
      const result = await this.fasterBookService.getAvailableItems();
      return { type: 'fasterbook_menu', result };
    } else if (detectedAction.type === 'image_generation') {
      return detectedAction;
    }

    return null;
  };

  private async extractFoodParams(message: string): Promise<FoodBookingParams> {
    const availableItems = await this.fasterBookService.getAvailableItemsCached();

    let availableItemsList = '';
    if (availableItems.success && availableItems.food) {
      availableItemsList = availableItems.food.map(item => `- ${item.id}: ${item.name}`).join('\n');
    }

    const extractionPrompt = `Extract food booking details from this message: "${message}"

AVAILABLE FOOD ITEMS (use ONLY these IDs):
${availableItemsList || 'No available items listed'}

Return ONLY a valid JSON object with these exact fields:
{
  "itemId": "<food_item_id_from_available_list>",
  "quantity": <number>,
  "address": "<delivery_address>"
}

IMPORTANT: The itemId MUST match one of the IDs from the available items list above.

Examples:
- "Order 2 chicken biryani to Dorm A Room 12" → {"itemId":"biryani_chicken","quantity":2,"address":"Dorm A Room 12"}
- "Get me 3 pizzas at Building B, Floor 3" → {"itemId":"pizza_margherita","quantity":3,"address":"Building B, Floor 3"}

If any field is missing:
- itemId: match to closest available item from the list
- quantity: default to 1 if not specified
- address: use "Default delivery location" if not specified

Return ONLY the JSON object, no explanations.`;

    try {
      const result = await this.model.generateContent(extractionPrompt);
      const responseText = await result.response.text();

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        let itemId = parsed.itemId || 'pizza_margherita';
        if (availableItems.success && availableItems.food) {
          const validItem = availableItems.food.find(item => item.id === itemId);
          if (!validItem && availableItems.food.length > 0) {
            itemId = availableItems.food[0].id;
          }
        }

        return {
          itemId,
          quantity: parsed.quantity || 1,
          address: parsed.address || 'Default delivery location'
        };
      }

      throw new Error('Failed to parse extraction result');
    } catch (error) {
      console.error('Error extracting food params:', error);
      return {
        itemId: 'pizza_margherita',
        quantity: 1,
        address: 'Default delivery location'
      };
    }
  }

  private async extractMovieParams(message: string): Promise<MovieBookingParams> {
    const availableItems = await this.fasterBookService.getAvailableItemsCached();

    let availableMoviesList = '';
    if (availableItems.success && availableItems.movies) {
      availableMoviesList = availableItems.movies.map(movie =>
        `- ${movie.id}: ${movie.name} (Showtimes: ${movie.showTimes.join(', ')})`
      ).join('\n');
    }

    const extractionPrompt = `Extract movie booking details from this message: "${message}"

AVAILABLE MOVIES (use ONLY these IDs and showtimes):
${availableMoviesList || 'No available movies listed'}

Return ONLY a valid JSON object with these exact fields:
{
  "movieId": "<movie_id_from_available_list>",
  "seats": ["<seat1>", "<seat2>"],
  "showTime": "<ISO_8601_datetime_from_available_showtimes>"
}

IMPORTANT:
- The movieId MUST match one of the IDs from the available movies list above
- The showTime should match one of the available showtimes for that movie

Examples:
- "Book 2 seats for Space Adventures at 7:30 PM" → {"movieId":"mov_101","seats":["A1","A2"],"showTime":"2025-10-30T19:30:00"}
- "Get me 3 tickets for Action Blast, seats B5, B6, B7" → {"movieId":"mov_303","seats":["B5","B6","B7"],"showTime":"2025-10-30T21:00:00"}

If any field is missing:
- movieId: match to closest available movie from the list
- seats: generate array like ["A1", "A2"] based on number of tickets mentioned
- showTime: use the first available showtime for the selected movie

Return ONLY the JSON object, no explanations.`;

    try {
      const result = await this.model.generateContent(extractionPrompt);
      const responseText = await result.response.text();

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        let movieId = parsed.movieId || 'mov_101';
        let showTime = parsed.showTime;

        if (availableItems.success && availableItems.movies) {
          const validMovie = availableItems.movies.find(movie => movie.id === movieId);
          if (!validMovie && availableItems.movies.length > 0) {
            movieId = availableItems.movies[0].id;
            showTime = availableItems.movies[0].showTimes[0];
          } else if (validMovie && !showTime) {
            showTime = validMovie.showTimes[0];
          }
        }

        return {
          movieId,
          seats: parsed.seats || ['A1', 'A2'],
          showTime: showTime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
      }

      throw new Error('Failed to parse extraction result');
    } catch (error) {
      console.error('Error extracting movie params:', error);
      return {
        movieId: 'mov_101',
        seats: ['A1', 'A2'],
        showTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
    }
  }
  
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
