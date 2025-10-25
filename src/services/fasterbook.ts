const FASTERBOOK_API = 'https://fasterbook.onrender.com';
const API_KEY = 'AURA-TEST-KEY-12345';

export interface FoodBookingParams {
  itemId: string;
  quantity: number;
  address: string;
}

export interface MovieBookingParams {
  movieId: string;
  seats: string[];
  showTime: string;
}

export interface FoodBookingResponse {
  success: boolean;
  bookingId?: string;
  itemId?: string;
  quantity?: number;
  address?: string;
  totalPrice?: number;
  estimatedDelivery?: string;
  message: string;
  error?: string;
}

export interface MovieBookingResponse {
  success: boolean;
  bookingId?: string;
  movieId?: string;
  seats?: string[];
  showTime?: string;
  totalPrice?: number;
  theater?: string;
  message: string;
  error?: string;
}

export interface Booking {
  id: string;
  type: 'food' | 'movie';
  details: any;
  timestamp: string;
}

export interface BookingsResponse {
  success: boolean;
  bookings?: Booking[];
  message?: string;
  error?: string;
}

export class FasterBookService {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = FASTERBOOK_API;
    this.apiKey = API_KEY;
  }

  async bookFood(params: FoodBookingParams): Promise<FoodBookingResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/api/book-food`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Failed to book food',
          error: data.error || 'Unknown error',
        };
      }

      return {
        success: true,
        ...data,
        message: data.message || 'Food order placed successfully!',
      };
    } catch (error) {
      console.error('FasterBook food booking error:', error);
      return {
        success: false,
        message: 'Failed to connect to FasterBook API',
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async bookMovie(params: MovieBookingParams): Promise<MovieBookingResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/api/book-movie`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Failed to book movie tickets',
          error: data.error || 'Unknown error',
        };
      }

      return {
        success: true,
        ...data,
        message: data.message || 'Movie tickets booked successfully!',
      };
    } catch (error) {
      console.error('FasterBook movie booking error:', error);
      return {
        success: false,
        message: 'Failed to connect to FasterBook API',
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async getBookings(): Promise<BookingsResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/api/bookings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Failed to fetch bookings',
          error: data.error || 'Unknown error',
        };
      }

      return {
        success: true,
        bookings: data.bookings || [],
        message: data.message || 'Bookings retrieved successfully',
      };
    } catch (error) {
      console.error('FasterBook get bookings error:', error);
      return {
        success: false,
        message: 'Failed to connect to FasterBook API',
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
}
