// src/services/fasterbook.ts

// API key - ensure this is set in your environment
const API_KEY = import.meta.env.VITE_FASTERBOOK_API_KEY || 'your_default_key_here';
const API_BASE_URL = 'https://fasterbook.onrender.com/api'; // Your live API base URL

// --- Interfaces (Copied from App.tsx for standalone service) ---

export interface FoodBookingResponse {
  bookingId: string;
  itemId: string;
  quantity: number;
  totalPrice: number;
  address: string;
  status: string;
  estimatedDelivery: string;
}

export interface MovieBookingResponse {
  bookingId: string;
  movieId: string;
  movieTitle: string;
  seats: string[];
  totalPrice: number;
  status: string;
}

export interface BookingsResponse {
  foodBookings: FoodBookingResponse[];
  movieBookings: MovieBookingResponse[];
}

export interface AvailableItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  category: string;
  available: boolean;
}

export interface AvailableItemsResponse {
  items: AvailableItem[];
  categories: string[];
}

// --- Service Class ---

export class FasterBookService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = API_KEY;
    this.baseUrl = API_BASE_URL;
    if (!this.apiKey) {
      console.warn('FasterBook API key is missing. Please check your .env file.');
    }
  }

  /**
   * Fetches the available food menu from the FasterBook API.
   * This is the new function to get real item data.
   */
  async getFoodMenu(): Promise<AvailableItemsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/menu`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch menu from FasterBook.');
      }

      const data: AvailableItemsResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching FasterBook menu:', error);
      throw new Error(error instanceof Error ? error.message : 'An unknown error occurred while fetching the menu.');
    }
  }

  /**
   * Attempts to book a food order.
   * This function is UPDATED to handle real server errors.
   */
  async bookFood(params: {
    itemId: string;
    quantity: number;
    address: string;
  }): Promise<FoodBookingResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/book/food`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(params),
      });

      // *** THIS IS THE CRITICAL CHANGE ***
      // It now reads the error message from your server (e.g., "Ongole" error)
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to book food order.');
      }

      const data: FoodBookingResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error in bookFood service:', error);
      // Re-throw the specific error message from the server
      throw error;
    }
  }

  /**
   * Attempts to book movie tickets.
   */
  async bookMovie(params: {
    movieId: string;
    seats: string[];
  }): Promise<MovieBookingResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/book/movie`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to book movie tickets.');
      }

      const data: MovieBookingResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error in bookMovie service:', error);
      throw error;
    }
  }

  /**
   * Fetches all past bookings.
   */
  async getBookings(): Promise<BookingsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/bookings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch bookings.');
      }

      const data: BookingsResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error in getBookings service:', error);
      throw error;
    }
  }
}
