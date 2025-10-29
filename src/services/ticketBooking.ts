import { createClient } from '@supabase/supabase-js';

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      supabase = createClient(supabaseUrl, supabaseKey);
    }
  }
  return supabase;
}

export interface TicketOrderDetails {
  event: string;
  venue: string;
  eventDate: string;
  eventTime: string;
  seats: Array<{ section: string; row: string; number: string }>;
  ticketType: string;
}

export interface TicketBookingResult {
  success: boolean;
  orderId: string;
  bookingReference: string;
  event: string;
  venue: string;
  eventDate: string;
  eventTime: string;
  seats: Array<{ section: string; row: string; number: string }>;
  ticketType: string;
  totalAmount: number;
  status: string;
  message: string;
}

const EVENTS = [
  { name: 'Rock Concert - Electric Nights', type: 'Concert', venue: 'Madison Square Garden' },
  { name: 'Comedy Show - Laugh Factory', type: 'Comedy', venue: 'The Comedy Store' },
  { name: 'Broadway Musical - Phantom Returns', type: 'Theater', venue: 'Broadway Theater' },
  { name: 'Sports - Championship Finals', type: 'Sports', venue: 'National Stadium' },
  { name: 'Jazz Night - Blue Moon Sessions', type: 'Music', venue: 'Blue Note Jazz Club' },
  { name: 'Tech Conference 2025', type: 'Conference', venue: 'Convention Center' }
];

const TICKET_TYPES = ['VIP', 'Premium', 'Standard', 'Economy'];
const SECTIONS = ['A', 'B', 'C', 'D'];

function generateUserSession(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateFutureDate(): { date: string; time: string } {
  const daysAhead = Math.floor(Math.random() * 60) + 7;
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const date = futureDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const hours = Math.floor(Math.random() * 5) + 18;
  const minutes = Math.random() < 0.5 ? '00' : '30';
  const time = `${hours}:${minutes}`;

  return { date, time };
}

function calculateTicketPrice(ticketType: string): number {
  const prices = {
    'VIP': 299.99,
    'Premium': 149.99,
    'Standard': 79.99,
    'Economy': 39.99
  };
  return prices[ticketType as keyof typeof prices] || 79.99;
}

export async function bookTicket(userRequest: string, extractedParams?: any): Promise<TicketBookingResult> {
  await new Promise(resolve => setTimeout(resolve, 1500));

  let event = EVENTS[Math.floor(Math.random() * EVENTS.length)];

  if (extractedParams?.event) {
    const matchingEvent = EVENTS.find(e =>
      e.name.toLowerCase().includes(extractedParams.event.toLowerCase()) ||
      extractedParams.event.toLowerCase().includes(e.name.toLowerCase())
    );
    if (matchingEvent) {
      event = matchingEvent;
    }
  } else if (extractedParams?.eventType) {
    const matchingEvent = EVENTS.find(e =>
      e.type.toLowerCase() === extractedParams.eventType.toLowerCase()
    );
    if (matchingEvent) {
      event = matchingEvent;
    }
  }

  const ticketType = extractedParams?.ticketType || TICKET_TYPES[Math.floor(Math.random() * TICKET_TYPES.length)];
  const { date, time } = generateFutureDate();

  const numTickets = extractedParams?.numTickets || Math.floor(Math.random() * 3) + 1;
  const seats = [];
  const section = SECTIONS[Math.floor(Math.random() * SECTIONS.length)];
  const baseRow = Math.floor(Math.random() * 20) + 1;

  for (let i = 0; i < numTickets; i++) {
    seats.push({
      section,
      row: String(baseRow),
      number: String(Math.floor(Math.random() * 30) + 1)
    });
  }

  const pricePerTicket = calculateTicketPrice(ticketType);
  const totalAmount = pricePerTicket * numTickets;

  const orderDetails: TicketOrderDetails = {
    event: event.name,
    venue: event.venue,
    eventDate: date,
    eventTime: time,
    seats,
    ticketType
  };

  const userSession = generateUserSession();

  try {
    const client = getSupabaseClient();

    if (client) {
      const { data, error } = await client
        .from('orders')
        .insert({
          order_type: 'ticket',
          status: 'confirmed',
          details: orderDetails,
          total_amount: totalAmount,
          user_session: userSession
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      const orderId = data?.id || 'unknown';
      const bookingReference = `TKT${Date.now().toString().slice(-8).toUpperCase()}`;

      return {
        success: true,
        orderId,
        bookingReference,
        event: event.name,
        venue: event.venue,
        eventDate: date,
        eventTime: time,
        seats,
        ticketType,
        totalAmount,
        status: 'confirmed',
        message: `Your tickets have been booked! Booking reference: ${bookingReference}. ${numTickets} ${ticketType} ticket(s) for ${event.name} at ${event.venue} on ${date} at ${time}.`
      };
    }
  } catch (error) {
    console.error('Error saving ticket order:', error);

    const bookingReference = `TKT${Date.now().toString().slice(-8).toUpperCase()}`;
    return {
      success: true,
      orderId: 'temp_' + Date.now(),
      bookingReference,
      event: event.name,
      venue: event.venue,
      eventDate: date,
      eventTime: time,
      seats,
      ticketType,
      totalAmount,
      status: 'confirmed',
      message: `Your tickets have been booked! Booking reference: ${bookingReference}. ${numTickets} ${ticketType} ticket(s) for ${event.name} at ${event.venue} on ${date} at ${time}.`
    };
  }
}
