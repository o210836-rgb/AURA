// src/services/ticketBooking.ts

// This interface is already exported
export interface TicketBookingResult {
  bookingId: string;
  movie: string;
  seats: number;
  totalPrice: number;
  status: string;
}

const TICKET_PRICE = 15.0;

// --- THIS IS THE FIX ---
// Add the "export" keyword to this line:
export function bookTicketsLegacy(message: string): TicketBookingResult {
  let movie = 'unknown';
  let seats = 1;

  const lowerMessage = message.toLowerCase();
  
  // Simple movie extractor
  if (lowerMessage.includes('dune')) {
    movie = 'Dune: Part Two';
  } else if (lowerMessage.includes('incredibles')) {
    movie = 'The Incredibles';
  } else if (lowerMessage.includes('matrix')) {
    movie = 'The Matrix';
  }

  const seatsMatch = lowerMessage.match(/(\d+)\s+(seats|tickets)/);
  if (seatsMatch) {
    seats = parseInt(seatsMatch[1], 10);
  }

  if (movie === 'unknown') {
    throw new Error('Sorry, we could not find that movie in our mock database.');
  }

  const totalPrice = TICKET_PRICE * seats;

  return {
    bookingId: `mock_tkt_${Date.now()}`,
    movie: movie,
    seats: seats,
    totalPrice: totalPrice,
    status: 'confirmed',
  };
}
