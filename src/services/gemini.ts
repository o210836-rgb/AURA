import { GoogleGenerativeAI } from '@google/generative-ai';
import { ExtractedFile, chunkText, getRelevantChunks } from '../utils/fileExtractor';
import { ImageGenerationService } from './imageGeneration';
// Legacy (Supabase) booking services. We keep them for now for general mode.
import { bookFood, FoodBookingResult } from './foodBooking';
import { bookTicket, TicketBookingResult } from './ticketBooking';
// --- FASTERBOOK: This is now the primary service ---
import {
  FasterBookService,
  FoodBookingParams,
  MovieBookingParams,
  FoodBookingResponse,
  MovieBookingResponse,
  BookingsResponse,
  AvailableItemsResponse
} from './fasterbook';
// --- MOCK APIS ARE REMOVED ---

const SYSTEM_PROMPT = `You are A.U.R.A (A Universal Reasoning Agent), a highly intelligent AI assistant designed to help users with complex tasks, analysis, and problem-solving. You were developed by a group of undergrad CSE students: Golla Santhosh Kumar, Vallepu Vijaya Lakshmi, Nuthangi Chaitanya Karthik, Karnam Hemanth Kumar, Shaik Veligandla Yasmin, and Shaik Parveen.
Key capabilities:
- Analyze and summarize documents
- Answer questions based on uploaded content
- Generate actionable insights
- Maintain context across conversations

If the user activates "FasterBook Agent Mode", your *only* role is to be a booking agent using the FasterBook API. You must not answer general questions in this mode.
`;

const genAI = new GoogleGenerativeAI('AIzaSyBsueiN62CF8-qzda3T_h3ZZU74Q2G6Juw');

// Updated Action types to remove mock APIs
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
      model: "gemini-1.5-pro-latest", // Using latest model
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
      if (file.content.length < 3000) {
        contextParts.push(`--- Content from ${file.name} ---\n${file.content}\n`);
      } else {
        const chunks = this.fileChunks.get(file.name) || [];
        const relevantChunks = getRelevantChunks(chunks, userMessage, 2);
        if (relevantChunks.length > 0) {
          contextParts.push(`--- Relevant sections from ${file.name} ---\n${relevantChunks.join('\n\n')}\n`);
        }
      }
    }
    return contextParts.length > 0 ? `Here are the uploaded documents for reference:\n\n${contextParts.join('\n')}\n---\n\n` : '';
  }

  // --- STRICT FASTERBOOK DETECTION (ONLY FOR AGENT MODE) ---
  private detectFasterBookActionType = (message: string): string | null => {
    const lowerMessage = message.toLowerCase();
    const foodKeywords = ['order', 'food', 'biryani', 'pizza', 'burger', 'delivery', 'get me', 'i want', 'eat'];
    const movieKeywords = ['movie', 'tickets', 'cinema', 'showtime', 'seats', 'film'];
    const bookingsKeywords = ['show bookings', 'my orders', 'view bookings', 'list bookings', 'history', 'my reservations'];
    const menuKeywords = ['show menu', 'view menu', 'available items', 'menu', 'what you have', 'list of items'];

    if (menuKeywords.some(keyword => lowerMessage.includes(keyword))) {
        return 'fasterbook_menu';
    }
    if (bookingsKeywords.some(keyword => lowerMessage.includes(keyword))) {
        return 'fasterbook_bookings';
    }
    if (movieKeywords.some(keyword => lowerMessage.includes(keyword))) {
        return 'fasterbook_movie';
    }
    if (foodKeywords.some(keyword => lowerMessage.includes(keyword))) {
        return 'fasterbook_food';
    }
    return null;
  }
  
  // --- MODIFIED sendMessage ---
  sendMessage = async (message: string, isFasterBookMode: boolean = false): Promise<string> => {
    try {
      // 1. === FASTERBOOK AGENT MODE IS ON ===
      if (isFasterBookMode) {
        const actionType = this.detectFasterBookActionType(message);
        
        // If intent is clear, return the action string immediately
        if (actionType === 'fasterbook_food') return 'FASTERBOOK_FOOD_REQUEST';
        if (actionType === 'fasterbook_movie') return 'FASTERBOOK_MOVIE_REQUEST';
        if (actionType === 'fasterbook_bookings') return 'FASTERBOOK_BOOKINGS_REQUEST';
        if (actionType === 'fasterbook_menu') return 'FASTERBOOK_MENU_REQUEST';
        
        // If intent is unclear, force an agentic, non-LLM clarification
        const clarificationPrompt = `The user has enabled FasterBook Agent Mode. Their request is: "${message}". You *must* respond as a dedicated booking agent and strictly use the FasterBook API as your source. 
        - If the request is for food or a movie, ask for the required missing details (e.g., item, quantity, address, or seats, time, movie).
        - If the request is for the menu or bookings history, confirm and state you are retrieving the data.
        - If the request is unclear or non-booking related, politely guide the user on how to format their FasterBook order (e.g., "I'm ready to take your order. Please specify what you'd like, such as 'Order 2 Chicken Biryani to Room 12'").
        - DO NOT answer general questions.`;

        this.history.push({ role: 'user', parts: [{ text: clarificationPrompt }] });
        const result = await this.chat.sendMessage(clarificationPrompt);
        const responseText = await result.response.text();
        this.history.push({ role: 'model', parts: [{ text: responseText }] });
        return responseText;
      }

      // 2. === GENERAL LLM MODE IS ON (MODE IS OFF) ===
      const detectedAction = this.detectAgenticAction(message);

      if (detectedAction) {
        if (detectedAction.type === 'image_generation') {
          return `IMAGE_GENERATION:${detectedAction.prompt}`;
        }
        // Handle legacy actions if needed
        if (detectedAction.type === 'food_booking') {
          return 'FOOD_BOOKING_REQUEST';
        }
        if (detectedAction.type === 'ticket_booking') {
          return 'TICKET_BOOKING_REQUEST';
        }
      }

      // 3. === DEFAULT GENERAL RESPONSE (MODE IS OFF) ===
      const context = this.getRelevantContext(message);
      const finalMessage = context + message;

      this.history.push({ role: 'user', parts: [{ text: finalMessage }] });
      const result = await this.chat.sendMessage(finalMessage);
      const responseText = await result.response.text();
      this.history.push({ role: 'model', parts: [{ text: responseText }] });
      return responseText;

    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      throw new Error('I apologize, but I encountered an issue processing your request.');
    }
  };

  // --- MODIFIED detectAgenticAction (REMOVED MOCK APIS) ---
  detectAgenticAction = (message: string): AgenticAction => {
    const lowerMessage = message.toLowerCase();

    // 1. Image Generation
    const imageKeywords = ['generate image', 'create image', 'draw', 'picture of', 'image of', 'show me'];
    if (imageKeywords.some(keyword => lowerMessage.includes(keyword))) {
      let imagePrompt = message;
      imageKeywords.forEach(keyword => {
        const regex = new RegExp(`.*${keyword}\\s*:?\\s*`, 'i');
        imagePrompt = imagePrompt.replace(regex, '').trim();
      });
      return { type: 'image_generation', prompt: imagePrompt || message };
    }

    // 2. Legacy Food Booking (Supabase)
    const genericFoodKeywords = ['order food', 'book food', 'get food'];
    if (genericFoodKeywords.some(keyword => lowerMessage.includes(keyword)) && !lowerMessage.includes('fasterbook')) {
      return { type: 'food_booking', result: {} as FoodBookingResult };
    }

    // 3. Legacy Ticket Booking (Supabase)
    const ticketKeywords = ['book ticket', 'buy ticket', 'get ticket'];
    if (ticketKeywords.some(keyword => lowerMessage.includes(keyword)) && !lowerMessage.includes('fasterbook')) {
      return { type: 'ticket_booking', result: {} as TicketBookingResult };
    }
    
    // ALL MOCK API (restaurant, hotel, flight, ride) LOGIC IS REMOVED

    return null;
  };

  // --- MODIFIED executeAgenticAction (HANDLES NEW STRINGS & REMOVED MOCKS) ---
  executeAgenticAction = async (message: string, aiResponseString: string): Promise<AgenticAction> => {
    
    // Determine action type from the string response
    let actionType: string | null = null;
    if (aiResponseString === 'FASTERBOOK_FOOD_REQUEST') actionType = 'fasterbook_food';
    if (aiResponseString === 'FASTERBOOK_MOVIE_REQUEST') actionType = 'fasterbook_movie';
    if (aiResponseString === 'FASTERBOOK_BOOKINGS_REQUEST') actionType = 'fasterbook_bookings';
    if (aiResponseString === 'FASTERBOOK_MENU_REQUEST') actionType = 'fasterbook_menu';
    if (aiResponseString === 'FOOD_BOOKING_REQUEST') actionType = 'food_booking';
    if (aiResponseString === 'TICKET_BOOKING_REQUEST') actionType = 'ticket_booking';
    
    // This is for image gen, which is handled differently, but we check anyway
    const detectedAction = this.detectAgenticAction(message);
    if (detectedAction?.type === 'image_generation') return detectedAction;

    if (!actionType) return null;

    try {
      if (actionType === 'fasterbook_food') {
        const params = await this.extractFoodParams(message);
        const result = await this.fasterBookService.bookFood(params);
        return { type: 'fasterbook_food', result };
      }
      if (actionType === 'fasterbook_movie') {
        const params = await this.extractMovieParams(message);
        const result = await this.fasterBookService.bookMovie(params);
        return { type: 'fasterbook_movie', result };
      }
      if (actionType === 'fasterbook_bookings') {
        const result = await this.fasterBookService.getBookings();
        return { type: 'fasterbook_bookings', result };
      }
      if (actionType === 'fasterbook_menu') {
        const result = await this.fasterBookService.getAvailableItems();
        return { type: 'fasterbook_menu', result };
      }
      if (actionType === 'food_booking') {
        const params = await this.extractGenericFoodParams(message);
        const result = await bookFood(message, params);
        return { type: 'food_booking', result };
      }
      if (actionType === 'ticket_booking') {
        const params = await this.extractGenericTicketParams(message);
        const result = await bookTicket(message, params);
        return { type: 'ticket_booking', result };
      }
    } catch (error) {
        console.error(`Error executing agentic action ${actionType}:`, error);
        if (error instanceof Error && error.message.startsWith('MISSING_DETAILS:')) {
            throw error; // Re-throw missing details errors to be shown to user
        }
        throw new Error(`I apologize, but I encountered an issue processing your ${actionType.replace('_', ' ')}.`);
    }

    return null;
  };

  // --- PARAMETER EXTRACTION (FASTERBOOK) ---
  private async extractFoodParams(message: string): Promise<FoodBookingParams> {
    const availableItems = await this.fasterBookService.getAvailableItemsCached();
    let availableItemsList = '';
    if (availableItems.success && availableItems.food) {
      availableItemsList = availableItems.food.map(item => `- ${item.id}: ${item.name}`).join('\n');
    }

    const extractionPrompt = `You are an agent processing a food order. Extract details from this message: "${message}"
AVAILABLE FOOD ITEMS (use ONLY these IDs):
${availableItemsList || 'No available items listed'}

Return ONLY a valid JSON object with these fields:
{
  "itemId": "<food_item_id_from_available_list>",
  "quantity": <number>,
  "address": "<delivery_address>"
}
RULES:
- itemId MUST match one of the IDs from the available items list.
- If quantity is missing, default to 1.
- If address is missing, use "User's location".
- If no item is mentioned or matches, use "null".

Examples:
- "Order 2 chicken biryani to Dorm A Room 12" → {"itemId":"biryani_chicken","quantity":2,"address":"Dorm A Room 12"}
- "Get me 3 pizzas" → {"itemId":"pizza_margherita","quantity":3,"address":"User's location"}
- "I want food" → {"itemId":null,"quantity":1,"address":"User's location"}

Return ONLY the JSON.`;

    const result = await this.model.generateContent(extractionPrompt);
    const responseText = result.response.text().replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(responseText);

    if (!parsed.itemId) {
      throw new Error('MISSING_DETAILS: I can certainly help with that. What item from the menu would you like to order?');
    }
    if (!parsed.address || parsed.address === "User's location") {
       throw new Error('MISSING_DETAILS: I have the item. Where should I deliver this order?');
    }

    return {
      itemId: parsed.itemId,
      quantity: parsed.quantity || 1,
      address: parsed.address
    };
  }

  private async extractMovieParams(message: string): Promise<MovieBookingParams> {
    const availableItems = await this.fasterBookService.getAvailableItemsCached();
    let availableMoviesList = '';
    if (availableItems.success && availableItems.movies) {
      availableMoviesList = availableItems.movies.map(movie =>
        `- ${movie.id}: ${movie.name} (Showtimes: ${movie.showTimes.map(t => new Date(t).toLocaleTimeString()).join(', ')})`
      ).join('\n');
    }

    const extractionPrompt = `You are an agent processing a movie booking. Extract details from this message: "${message}"
AVAILABLE MOVIES (use ONLY these IDs and showtimes):
${availableMoviesList || 'No available movies listed'}

Return ONLY a valid JSON object with these fields:
{
  "movieId": "<movie_id_from_available_list or null>",
  "seats": ["<seat1>", "<seat2>"],
  "showTime": "<ISO_8601_datetime_from_available_showtimes or null>"
}
RULES:
- movieId MUST match one of the IDs from the list. If not mentioned, use "null".
- showTime MUST match one of the showtimes for that movie. If not mentioned, use "null".
- If seats are not mentioned, default to ["A1"].

Examples:
- "Book 2 seats for Space Adventures" → {"movieId":"mov_101","seats":["A1", "A2"],"showTime":null}
- "I want to see a movie" → {"movieId":null,"seats":["A1"],"showTime":null}

Return ONLY the JSON.`;
    
    const result = await this.model.generateContent(extractionPrompt);
    const responseText = result.response.text().replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(responseText);

    const missingFields = [];
    if (!parsed.movieId) missingFields.push('movie');
    if (!parsed.showTime) missingFields.push('showtime');
    
    if (missingFields.length > 0) {
        throw new Error(`MISSING_DETAILS: I can help with that. Please let me know the ${missingFields.join(' and ')} you'd like to book.`);
    }

    return {
      movieId: parsed.movieId,
      seats: parsed.seats || ['A1'],
      showTime: parsed.showTime
    };
  }

  // --- PARAMETER EXTRACTION (LEGACY) ---
  private async extractGenericFoodParams(message: string): Promise<any> {
    // This logic is for the old Supabase integration
    return {
      restaurant: "Legacy Eatery",
      items: [{ name: "Generic Food", quantity: 1, price: 9.99 }],
      deliveryAddress: "123 Old St"
    };
  }

  private async extractGenericTicketParams(message: string): Promise<any> {
    // This logic is for the old Supabase integration
    return {
      event: "Legacy Event",
      numTickets: 2,
      ticketType: "Standard"
    };
  }

  // --- OTHER FUNCTIONS ---
  generateImage = async (prompt: string): Promise<string> => {
    try {
      return await this.imageService.generateImage(prompt);
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  };

  generateTaskSuggestions = async (userInput: string): Promise<string[]> => {
    // This logic remains the same
    try {
      const fileContext = this.uploadedFiles.length > 0 ? `The user has uploaded ${this.uploadedFiles.length} file(s): ${this.uploadedFiles.map(f => f.name).join(', ')}. ` : '';
      const prompt = `${fileContext}Based on this user input: "${userInput}", suggest 3 specific, actionable tasks that A.U.R.A could help with. Return only the task titles, one per line, without numbers or bullets.`;
      this.history.push({ role: 'user', parts: [{ text: prompt }] });
      const result = await this.chat.sendMessage(prompt);
      const responseText = await result.response.text();
      this.history.push({ role: 'model', parts: [{ text: responseText }] });
      return responseText.split('\n').filter(line => line.trim()).slice(0, 3);
    } catch (error) {
      console.error('Error generating task suggestions:', error);
      return [];
    }
  };
}
