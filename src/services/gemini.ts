const SYSTEM_PROMPT = `You are A.U.R.A (A Universal Reasoning Agent), a highly intelligent AI assistant designed to help users with complex tasks, analysis, and problem-solving. You have access to uploaded documents and can provide contextual responses based on their content. 
NOTE:-you were devoloped by the group of undergrad cse  students thier names are Golla Santhosh Kumar	
Shaik Parveen
Nuthangi Chaitanya Karthik	
Vallepu Vijaya Lakshmi
Karnam  Hemanth Kumar	
Shaik Veligandla Yasmin	

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
  BookingsResponse,
  AvailableItemsResponse
} from './fasterbook';
import { mockRestaurantApi, mockHotelApi, mockFlightApi, mockRideApi, RestaurantOrder, HotelBooking, FlightBooking, RideBooking } from './mockApis';

const genAI = new GoogleGenerativeAI('AIzaSyBsueiN62CF8-qzda3T_h3ZZU74Q2G6Juw');

export type AgenticAction =
  | { type: 'food_booking'; result: FoodBookingResult }
  | { type: 'ticket_booking'; result: TicketBookingResult }
  | { type: 'fasterbook_food'; result: FoodBookingResponse }
  | { type: 'fasterbook_movie'; result: MovieBookingResponse }
  | { type: 'fasterbook_bookings'; result: BookingsResponse }
  | { type: 'fasterbook_menu'; result: AvailableItemsResponse }
  | { type: 'restaurant_order'; result: RestaurantOrder }
  | { type: 'hotel_booking'; result: HotelBooking }
  | { type: 'flight_booking'; result: FlightBooking }
  | { type: 'ride_booking'; result: RideBooking }
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

  // --- NEW LOGIC: DEDICATED FASTERBOOK MODE DETECTION ---
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
    
    // Catch general food requests last
    if (foodKeywords.some(keyword => lowerMessage.includes(keyword))) {
        return 'fasterbook_food';
    }
    
    return null;
  }
  
  sendMessage = async (message: string, isFasterBookMode: boolean = false): Promise<string> => {
    try {
      // 1. Prioritized Logic for FasterBook Mode (STRICTLY AGENTIC)
      if (isFasterBookMode) {
        const actionType = this.detectFasterBookActionType(message);
        
        if (actionType) {
            if (actionType === 'fasterbook_food') return 'FASTERBOOK_FOOD_REQUEST';
            if (actionType === 'fasterbook_movie') return 'FASTERBOOK_MOVIE_REQUEST';
            if (actionType === 'fasterbook_bookings') return 'FASTERBOOK_BOOKINGS_REQUEST';
            if (actionType === 'fasterbook_menu') return 'FASTERBOOK_MENU_REQUEST';
        }
        
        // Fallback LLM prompt for clarification when mode is ON (Forces Agent Response)
        const clarificationPrompt = `The user has enabled FasterBook Agent Mode. Their request is: "${message}". You must respond as a dedicated booking agent and strictly use the FasterBook API as your source. 
        - If the request is for food or a movie, ask for the required missing details (e.g., item, quantity, address, or seats, time, movie).
        - If the request is for the menu or bookings history, confirm and state you are retrieving the data.
        - If the request is unclear or non-booking related, guide the user on how to format their FasterBook order (e.g., "Order 2 Chicken Biryani to Room 12").`;

        this.history.push({ role: 'user', parts: [{ text: clarificationPrompt }] });
        const result = await this.chat.sendMessage(clarificationPrompt);
        const responseText = await result.response.text();
        this.history.push({ role: 'model', parts: [{ text: responseText }] });
        return responseText;
      }

      // 2. Normal Agentic Flow (Runs if isFasterBookMode is FALSE)
      const detectedAction = this.detectAgenticAction(message);

      if (detectedAction) {
        if (detectedAction.type === 'image_generation') {
          return `IMAGE_GENERATION:${detectedAction.prompt}`;
        } else if (detectedAction.type === 'food_booking') {
          return 'FOOD_BOOKING_REQUEST';
        } else if (detectedAction.type === 'ticket_booking') {
          return 'TICKET_BOOKING_REQUEST';
        } else if (detectedAction.type === 'restaurant_order') {
          return 'RESTAURANT_ORDER_REQUEST';
        } else if (detectedAction.type === 'hotel_booking') {
          return 'HOTEL_BOOKING_REQUEST';
        } else if (detectedAction.type === 'flight_booking') {
          return 'FLIGHT_BOOKING_REQUEST';
        } else if (detectedAction.type === 'ride_booking') {
          return 'RIDE_BOOKING_REQUEST';
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

    // --- CLEAN UP CONFLICTING LOGIC (MODE IS OFF) ---

    // Generic Supabase Food Booking (Fallback/Legacy)
    const genericFoodKeywords = ['order food', 'book food', 'get food', 'order pizza', 'order burger', 'food delivery', 'hungry', 'food order'];
    const isGenericFoodRequest = genericFoodKeywords.some(keyword => lowerMessage.includes(keyword));

    if (isGenericFoodRequest && !lowerMessage.includes('fasterbook')) {
      return { type: 'food_booking', result: {} as FoodBookingResult };
    }

    // Generic Supabase Ticket Booking (Fallback/Legacy)
    const ticketKeywords = ['book ticket', 'buy ticket', 'get ticket', 'book seats', 'concert ticket', 'event ticket', 'reserve ticket'];
    const isTicketRequest = ticketKeywords.some(keyword => lowerMessage.includes(keyword));

    if (isTicketRequest && !lowerMessage.includes('fasterbook')) {
      return { type: 'ticket_booking', result: {} as TicketBookingResult };
    }

    // NOTE: All previous explicit fasterbook_... checks are removed from here.

    const restaurantKeywords = ['order restaurant', 'food delivery', 'order pizza', 'order burger', 'get me food', 'delivery food', 'restaurant order'];
    const isRestaurant = restaurantKeywords.some(keyword => lowerMessage.includes(keyword)) && !lowerMessage.includes('fasterbook');

    if (isRestaurant) {
      return { type: 'restaurant_order', result: {} as RestaurantOrder };
    }

    const hotelKeywords = ['book hotel', 'reserve hotel', 'hotel booking', 'book room', 'hotel reservation', 'stay at hotel'];
    const isHotel = hotelKeywords.some(keyword => lowerMessage.includes(keyword));

    if (isHotel) {
      return { type: 'hotel_booking', result: {} as HotelBooking };
    }

    const flightKeywords = ['book flight', 'flight booking', 'buy flight ticket', 'reserve flight', 'fly to', 'flight reservation'];
    const isFlight = flightKeywords.some(keyword => lowerMessage.includes(keyword));

    if (isFlight) {
      return { type: 'flight_booking', result: {} as FlightBooking };
    }

    const rideKeywords = ['book ride', 'get cab', 'order taxi', 'ride to', 'uber', 'lyft', 'book car'];
    const isRide = rideKeywords.some(keyword => lowerMessage.includes(keyword));

    if (isRide) {
      return { type: 'ride_booking', result: {} as RideBooking };
    }

    return null;
  };

  executeAgenticAction = async (message: string): Promise<AgenticAction> => {
    // This is simplified now as the main routing is done in sendMessage
    const detectedAction = this.detectAgenticAction(message);

    // If we are in FasterBook mode, re-detect the specific FasterBook action type
    // This handles the calls originating from the new mode logic in sendMessage.
    let finalActionType = detectedAction?.type;

    if (message.includes('FASTERBOOK_FOOD_REQUEST') || message.includes('FASTERBOOK_MOVIE_REQUEST') || message.includes('FASTERBOOK_BOOKINGS_REQUEST') || message.includes('FASTERBOOK_MENU_REQUEST')) {
      // This is a crude way to pass the request type from the conditional LLM path
      const modeAction = this.detectFasterBookActionType(message.split(':').pop() || '');
      if (modeAction) finalActionType = modeAction as any;
    }
    
    if (!finalActionType) return null;

    if (finalActionType === 'food_booking') {
      const params = await this.extractGenericFoodParams(message);
      const result = await bookFood(message, params);
      return { type: 'food_booking', result };
    } else if (finalActionType === 'ticket_booking') {
      const params = await this.extractGenericTicketParams(message);
      const result = await bookTicket(message, params);
      return { type: 'ticket_booking', result };
    } else if (finalActionType === 'fasterbook_food') {
      const params = await this.extractFoodParams(message);
      const result = await this.fasterBookService.bookFood(params);
      return { type: 'fasterbook_food', result };
    } else if (finalActionType === 'fasterbook_movie') {
      const params = await this.extractMovieParams(message);
      const result = await this.fasterBookService.bookMovie(params);
      return { type: 'fasterbook_movie', result };
    } else if (finalActionType === 'fasterbook_bookings') {
      const result = await this.fasterBookService.getBookings();
      return { type: 'fasterbook_bookings', result };
    } else if (finalActionType === 'fasterbook_menu') {
      const result = await this.fasterBookService.getAvailableItems();
      return { type: 'fasterbook_menu', result };
    } else if (finalActionType === 'restaurant_order') {
      const params = await this.extractRestaurantParams(message);
      const result = await mockRestaurantApi.placeOrder(params);
      return { type: 'restaurant_order', result };
    } else if (finalActionType === 'hotel_booking') {
      const params = await this.extractHotelParams(message);
      const result = await mockHotelApi.bookHotel(params);
      return { type: 'hotel_booking', result };
    } else if (finalActionType === 'flight_booking') {
      const params = await this.extractFlightParams(message);
      const result = await mockFlightApi.bookFlight(params);
      return { type: 'flight_booking', result };
    } else if (finalActionType === 'ride_booking') {
      const params = await this.extractRideParams(message);
      const result = await mockRideApi.bookRide(params);
      return { type: 'ride_booking', result };
    } else if (finalActionType === 'image_generation') {
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

  private async extractRestaurantParams(message: string): Promise<any> {
    const extractionPrompt = `Extract restaurant order details from this message: "${message}"

Return ONLY a valid JSON object with these fields:
{
  "restaurant": "<restaurant_name or 'Delicious Bites'>",
  "items": [{"name": "<item_name>", "quantity": <number>, "price": <estimated_price>}],
  "address": "<delivery_address>",
  "totalAmount": <total_price>
}

Examples:
- "Order 2 pizzas from Pizza Palace" → {"restaurant":"Pizza Palace","items":[{"name":"Pizza","quantity":2,"price":12.99}],"address":"Default address","totalAmount":25.98}

Return ONLY the JSON object, no explanations.`;

    try {
      const result = await this.model.generateContent(extractionPrompt);
      const responseText = await result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error extracting restaurant params:', error);
    }

    return {
      restaurant: 'Delicious Bites',
      items: [{ name: 'Margherita Pizza', quantity: 1, price: 12.99 }],
      address: '123 Main St',
      totalAmount: 12.99
    };
  }

  private async extractHotelParams(message: string): Promise<any> {
    const extractionPrompt = `Extract hotel booking details from this message: "${message}"

Return ONLY a valid JSON object with these fields:
{
  "hotelName": "<hotel_name or null>",
  "location": "<city_or_location or null>",
  "checkIn": "<date or null>",
  "checkOut": "<date or null>",
  "rooms": <number or null>,
  "guests": <number or null>,
  "roomType": "<room_type or null>"
}

Return ONLY the JSON object, no explanations.`;

    try {
      const result = await this.model.generateContent(extractionPrompt);
      const responseText = await result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const params = JSON.parse(jsonMatch[0]);

        const missingFields = [];
        if (!params.location) missingFields.push('**location** (city or area)');
        if (!params.checkIn) missingFields.push('**check-in date**');
        if (!params.checkOut) missingFields.push('**check-out date**');

        if (missingFields.length > 0) {
          throw new Error(`MISSING_DETAILS: I need the ${missingFields.join(', ')} to book your hotel. Could you provide these details?`);
        }

        return params;
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('MISSING_DETAILS:')) {
        throw error;
      }
      console.error('Error extracting hotel params:', error);
    }

    throw new Error('MISSING_DETAILS: I need the **location**, **check-in date**, and **check-out date** to book your hotel. Could you provide these details?');
  }

  private async extractFlightParams(message: string): Promise<any> {
    const extractionPrompt = `Extract flight booking details from this message: "${message}"

Return ONLY a valid JSON object with these fields:
{
  "from": "<departure_city or null>",
  "to": "<destination_city or null>",
  "passengers": <number or null>,
  "class": "<Economy/Business/First or null>"
}

Return ONLY the JSON object, no explanations.`;

    try {
      const result = await this.model.generateContent(extractionPrompt);
      const responseText = await result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const params = JSON.parse(jsonMatch[0]);

        const missingFields = [];
        if (!params.from) missingFields.push('**departure city**');
        if (!params.to) missingFields.push('**destination city**');

        if (missingFields.length > 0) {
          throw new Error(`MISSING_DETAILS: I need the ${missingFields.join(' and ')} to book your flight. Where are you flying from and to?`);
        }

        return params;
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('MISSING_DETAILS:')) {
        throw error;
      }
      console.error('Error extracting flight params:', error);
    }

    throw new Error('MISSING_DETAILS: I need the **departure city** and **destination city** to book your flight. Where are you flying from and to?');
  }

  private async extractRideParams(message: string): Promise<any> {
    const extractionPrompt = `Extract ride booking details from this message: "${message}"

Return ONLY a valid JSON object with these fields:
{
  "pickup": "<pickup_location or null>",
  "dropoff": "<destination_location or null>",
  "vehicleType": "<Sedan/SUV/Premium or null>"
}

Return ONLY the JSON object, no explanations.`;

    try {
      const result = await this.model.generateContent(extractionPrompt);
      const responseText = await result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const params = JSON.parse(jsonMatch[0]);

        const missingFields = [];
        if (!params.pickup) missingFields.push('**pickup location**');
        if (!params.dropoff) missingFields.push('**dropoff location**');

        if (missingFields.length > 0) {
          throw new Error(`MISSING_DETAILS: I need both the ${missingFields.join(' and ')} for your ride. Where should I pick you up and where are you going?`);
        }

        return params;
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('MISSING_DETAILS:')) {
        throw error;
      }
      console.error('Error extracting ride params:', error);
    }

    throw new Error('MISSING_DETAILS: I need both the **pickup location** and **dropoff location** for your ride. Where should I pick you up and where are you going?');
  }

  private async extractGenericFoodParams(message: string): Promise<any> {
    const extractionPrompt = `Extract food order details from this message: "${message}"

Return ONLY a valid JSON object with these fields:
{
  "restaurant": "<restaurant_name or null if not specified>",
  "items": [{"name": "<item_name>", "quantity": <number>, "price": <estimated_price>}],
  "deliveryAddress": "<address or null if not specified>"
}

Examples:
- "Order 2 pizzas from Pizza Palace" → {"restaurant":"Pizza Palace","items":[{"name":"Pizza","quantity":2,"price":12.99}],"deliveryAddress":null}
- "Get me biryani to 123 Main St" → {"restaurant":null,"items":[{"name":"Biryani","quantity":1,"price":10.99}],"deliveryAddress":"123 Main St"}

Return ONLY the JSON object, no explanations.`;

    try {
      const result = await this.model.generateContent(extractionPrompt);
      const responseText = await result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error extracting generic food params:', error);
    }

    return null;
  }

  private async extractGenericTicketParams(message: string): Promise<any> {
    const extractionPrompt = `Extract ticket booking details from this message: "${message}"

Return ONLY a valid JSON object with these fields:
{
  "event": "<event_name or null if not specified>",
  "eventType": "<Concert/Comedy/Theater/Sports/Music/Conference or null>",
  "numTickets": <number or null>,
  "ticketType": "<VIP/Premium/Standard/Economy or null>",
  "date": "<preferred_date or null>"
}

Examples:
- "Book tickets for a rock concert" → {"event":null,"eventType":"Concert","numTickets":null,"ticketType":null,"date":null}
- "Get me 2 VIP tickets for Broadway show" → {"event":null,"eventType":"Theater","numTickets":2,"ticketType":"VIP","date":null}
- "Book 3 tickets for Electric Nights next week" → {"event":"Electric Nights","eventType":null,"numTickets":3,"ticketType":null,"date":"next week"}

Return ONLY the JSON object, no explanations.`;

    try {
      const result = await this.model.generateContent(extractionPrompt);
      const responseText = await result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error extracting generic ticket params:', error);
    }

    return null;
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
