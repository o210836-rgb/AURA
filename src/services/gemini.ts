// src/services/gemini.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import { ExtractedFile } from '../utils/fileExtractor';
import { generateImage } from './imageGeneration';
import {
  FasterBookService,
  AvailableItemsResponse,
  FoodBookingResponse,
  MovieBookingResponse,
  BookingsResponse
} from './fasterbook';
import { bookFoodLegacy, FoodBookingResult } from './foodBooking';
import { bookTicketsLegacy, TicketBookingResult } from './ticketBooking';

// --- NEW: Custom Error for follow-up questions ---
/**
 * A custom error to indicate that the agent needs more information
 * from the user to complete an action.
 */
export class MissingDetailsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MissingDetailsError';
  }
}
// --- END NEW ---

// Define action types
type ActionType =
  | 'IMAGE_GENERATION'
  | 'FOOD_BOOKING_REQUEST'
  | 'TICKET_BOOKING_REQUEST'
  | 'FASTERBOOK_FOOD_REQUEST'
  | 'FASTERBOOK_MOVIE_REQUEST'
  | 'FASTERBOOK_MENU_REQUEST'
  | 'FASTERBOOK_BOOKINGS_REQUEST'
  | 'GENERAL_CHAT';

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any; 
  private uploadedFiles: ExtractedFile[] = [];
  private fasterBookService: FasterBookService;

  private foodMenuCache: AvailableItemsResponse | null = null;
  private menuCacheTimestamp: number = 0;

  constructor() {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    if (!API_KEY) {
      throw new Error('VITE_GEMINI_API_KEY is not defined in .env');
    }
    this.genAI = new GoogleGenerativeAI(API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    this.fasterBookService = new FasterBookService();
  }

  private async getCachedFoodMenu(): Promise<AvailableItemsResponse> {
    const now = Date.now();
    if (this.foodMenuCache && (now - this.menuCacheTimestamp < CACHE_DURATION_MS)) {
      console.log('Using cached FasterBook menu.');
      return this.foodMenuCache;
    }

    console.log('Fetching new FasterBook menu...');
    try {
      const menu = await this.fasterBookService.getFoodMenu(); 
      this.foodMenuCache = menu;
      this.menuCacheTimestamp = now;
      return menu;
    } catch (error) {
      console.error('Failed to fetch and cache menu:', error);
      throw error;
    }
  }

  addUploadedFile(file: ExtractedFile) {
    this.uploadedFiles.push(file);
  }

  removeUploadedFile(fileName: string) {
    this.uploadedFiles = this.uploadedFiles.filter(f => f.name !== fileName);
  }

  getUploadedFiles() {
    return this.uploadedFiles;
  }

  async generateImage(prompt: string): Promise<string> {
    return generateImage(prompt);
  }

  async sendMessage(message: string, isFasterBookMode: boolean): Promise<string> {
    try {
      if (isFasterBookMode) {
        const actionType = this.detectFasterBookActionType(message);

        if (actionType === 'GENERAL_CHAT') {
          const clarificationPrompt = `
            You are "FasterBook Agent", a specialized AI for booking food and movies.
            The user said: "${message}".
            This is not a clear command to 'order food', 'book movie', 'show menu', or 'show bookings'.
            Respond by politely clarifying your ONLY purpose.
            Example: "I am the FasterBook agent, ready to help you order food or book movie tickets. What would you like to do?"
          `;
          const result = await this.model.generateContent(clarificationPrompt);
          return result.response.text();
        }
        return actionType; 
      }

      const actionType = this.detectActionType(message);

      if (actionType !== 'GENERAL_CHAT') {
        return actionType; 
      }

      let prompt = `You are A.U.R.A, a helpful assistant.
      User's message: "${message}"`;

      if (this.uploadedFiles.length > 0) {
        prompt += '\n\nThe user has uploaded the following files. Use their content to answer the query:';
      this.uploadedFiles.forEach(file => {
        prompt += `\n\n--- FILE: ${file.name} ---\n${file.content.substring(0, 2000)}...`;
      });
      }

      const result = await this.model.generateContent(prompt);
      return result.response.text();

    } catch (error) {
      console.error('Error in sendMessage:', error);
      return 'I apologize, but I encountered an error while processing your request.';
    }
  }

  private detectFasterBookActionType(message: string): ActionType | 'GENERAL_CHAT' {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('order') || lowerMessage.includes('book') || lowerMessage.includes('get') || lowerMessage.includes('want')) {
      if (lowerMessage.includes('food') || lowerMessage.includes('biryani') || lowerMessage.includes('meal') || lowerMessage.includes('eat')) {
        return 'FASTERBOOK_FOOD_REQUEST';
      }
      if (lowerMessage.includes('movie') || lowerMessage.includes('ticket') || lowerMessage.includes('show')) {
        return 'FASTERBOOK_MOVIE_REQUEST';
      }
    }
    if (lowerMessage.includes('menu') || lowerMessage.includes('what food')) {
      return 'FASTERBOOK_MENU_REQUEST';
    }
    if (lowerMessage.includes('my bookings') || lowerMessage.includes('past orders')) {
      return 'FASTERBOOK_BOOKINGS_REQUEST';
    }
    return 'GENERAL_CHAT';
  }

  private detectActionType(message: string): ActionType | 'GENERAL_CHAT' {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.startsWith('generate image:') || lowerMessage.startsWith('create image:')) {
      return 'IMAGE_GENERATION';
    }
    if (lowerMessage.includes('legacy book food')) {
      return 'FOOD_BOOKING_REQUEST';
    }
    if (lowerMessage.includes('legacy book ticket')) {
      return 'TICKET_BOOKING_REQUEST';
    }
    return 'GENERAL_CHAT';
  }

  public async executeAgenticAction(
    message: string,
    action: string
  ): Promise<{ type: string; result: any } | null> {
    
    switch (action) {
      case 'FASTERBOOK_FOOD_REQUEST':
        console.log('Executing FasterBook Food Request...');
        const params = await this.extractFoodParams(message);
        if (params.error) throw new Error(params.error);
        const foodResult = await this.fasterBookService.bookFood(params);
        return { type: 'fasterbook_food', result: foodResult };

      case 'FASTERBOOK_MOVIE_REQUEST':
        console.log('Executing FasterBook Movie Request...');
        const movieParams = await this.extractMovieParams(message); 
        const movieResult = await this.fasterBookService.bookMovie(movieParams);
        return { type: 'fasterbook_movie', result: movieResult };

      case 'FASTERBOOK_MENU_REQUEST':
        console.log('Executing FasterBook Menu Request...');
        const menuResult = await this.getCachedFoodMenu();
        return { type: 'fasterbook_menu', result: menuResult };

      case 'FASTERBOOK_BOOKINGS_REQUEST':
        console.log('Executing FasterBook Bookings Request...');
        const bookingsResult = await this.fasterBookService.getBookings();
        return { type: 'fasterbook_bookings', result: bookingsResult };

      case 'FOOD_BOOKING_REQUEST':
        console.log('Executing Legacy Food Request...');
        const legacyFoodResult = bookFoodLegacy(message);
        return { type: 'food_booking', result: legacyFoodResult };

      case 'TICKET_BOOKING_REQUEST':
        console.log('Executing Legacy Ticket Request...');
        const legacyTicketResult = bookTicketsLegacy(message);
        return { type: 'ticket_booking', result: legacyTicketResult };

      default:
        console.warn(`Unknown action type: ${action}`);
        return null;
    }
  }

  /**
   * Extracts food booking parameters using AI, now with the REAL menu.
   */
  private async extractFoodParams(message: string): Promise<any> {
    const menu = await this.getCachedFoodMenu(); 
    
    if (!menu || menu.items.length === 0) {
      throw new Error("I'm sorry, the food menu is currently empty. Please try again later.");
    }
    
    const availableItems = JSON.stringify(menu.items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price
    })));

    const prompt = `
      You are a JSON extractor for a food booking system.
      The user wants to order food. User's message: "${message}"

      You MUST use this list of available items:
      ${availableItems}

      Your task is to extract:
      1.  "itemId": The ID of the item from the list that matches the user's request.
      2.  "quantity": The number of items (default to 1 if not specified).
      3.  "address": The delivery address.

      RULES:
      -   If the user asks for an item NOT in the list (e.g., "pizza" when only "biryani" is available), you MUST respond with ONLY this JSON:
          {"error": "Sorry, that item is not on our menu."}
      -   If the 'address' is missing, respond with ONLY this JSON:
          {"error": "MISSING_DETAILS: Where should I deliver this order?"}
      -   If the 'itemId' is clear but 'quantity' or 'address' is missing, extract what you can and set missing fields to null. (e.g., {"itemId": "1", "quantity": 2, "address": null})
      -   If successful, return the full JSON: {"itemId": "1", "quantity": 1, "address": "123 Main St, Ongole"}

      Respond with ONLY the JSON object.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      const params = JSON.parse(responseText);

      if (params.error) {
        // --- MODIFIED: Use the new custom error ---
        if (params.error.startsWith('MISSING_DETAILS:')) {
          throw new MissingDetailsError(params.error.replace('MISSING_DETAILS:', ''));
        }
        // --- END MODIFICATION ---
        throw new Error(params.error);
      }

      // --- MODIFIED: Use the new custom error ---
      if (!params.address) {
        throw new MissingDetailsError('Where should I deliver this order?');
      }
      // --- END MODIFICATION ---

      if (!params.itemId) {
         throw new Error("I'm sorry, I couldn't find that item on the menu. Please specify an available item.");
      }

      return {
        itemId: params.itemId,
        quantity: params.quantity || 1, 
        address: params.address
      };

    } catch (e) {
      console.error('Error in extractFoodParams:', e);
      if (e instanceof Error) {
        throw e;
      }
      throw new Error('I had trouble understanding your order. Could you please rephrase it?');
    }
  }

  private async extractMovieParams(message: string): Promise<any> {
    console.warn('extractMovieParams is not fully implemented. Using mock data.');
    if (message.toLowerCase().includes('leo')) {
      return {
        movieId: 'm1',
        seats: ['A1', 'A2']
      };
    }
    // This should also use MissingDetailsError if, e.g., seats are missing
    throw new Error('I could not find that movie. Please try again.');
  }
}
