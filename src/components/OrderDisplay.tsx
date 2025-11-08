// src/components/OrderDisplay.tsx

import React from 'react';
import { FoodBookingResult } from '../services/foodBooking';
import { TicketBookingResult } from '../services/ticketBooking';
import {
  FoodBookingResponse,
  MovieBookingResponse,
  BookingsResponse,
  AvailableItemsResponse,
  AvailableItem
} from '../services/fasterbook';
import { ShoppingBag, Ticket, CheckCircle2, XCircle, List, History } from 'lucide-react';

type OrderData = FoodBookingResult | TicketBookingResult | FoodBookingResponse | MovieBookingResponse | BookingsResponse | AvailableItemsResponse;

// --- Type Guards to identify the data structure ---
const isLegacyFood = (data: any): data is FoodBookingResult => data.item !== undefined;
const isLegacyTicket = (data: any): data is TicketBookingResult => data.movie !== undefined;
const isFasterBookFood = (data: any): data is FoodBookingResponse => data.estimatedDelivery !== undefined;
const isFasterBookMovie = (data: any): data is MovieBookingResponse => data.movieTitle !== undefined;
const isFasterBookBookings = (data: any): data is BookingsResponse => data.foodBookings !== undefined;
const isFasterBookMenu = (data: any): data is AvailableItemsResponse => data.items !== undefined;


// --- Main Component ---
export const OrderDisplay: React.FC<{ orderType: string; orderData: OrderData }> = ({ orderType, orderData }) => {

  // --- 1. FASTERBOOK: Food Booking Confirmation ---
  if (orderType === 'fasterbook_food' && isFasterBookFood(orderData)) {
    const data = orderData;
    // --- THIS IS THE FIX ---
    // We check the status in lowercase to avoid case-sensitivity bugs
    const isFailed = !data.bookingId || data.status.toLowerCase() !== 'confirmed';
    // --- END FIX ---

    return (
      <div className={`p-4 rounded-lg border ${isFailed ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
        <div className="flex items-center space-x-3">
          {isFailed ? <XCircle className="w-6 h-6 text-red-600" /> : <CheckCircle2 className="w-6 h-6 text-green-600" />}
          <h4 className={`font-semibold text-lg ${isFailed ? 'text-red-700' : 'text-green-700'}`}>
            {isFailed ? 'Order Failed' : 'Order Confirmed'}
          </h4>
        </div>
        <div className="mt-3 pl-9 text-sm space-y-2">
          {data.bookingId && (
            <p className="text-gray-700">
              <strong>Booking ID:</strong> <span className="font-mono">{data.bookingId}</span>
            </p>
          )}
          {data.itemName && (
             <p className="text-gray-700">
              <strong>Item:</strong> {data.itemName} (x{data.quantity})
            </p>
          )}
          <p className="text-gray-700">
            <strong>Total:</strong> ₹{data.totalPrice}
          </p>
          <p className="text-gray-700">
            <strong>Address:</strong> {data.address}
          </p>
          {!isFailed && (
            <p className="text-gray-700">
              <strong>Delivery:</strong> {data.estimatedDelivery}
            </p>
          )}
          {isFailed && data.bookingId && (
            <p className="text-red-600">There was an issue with your order. Please contact support.</p>
          )}
        </div>
      </div>
    );
  }

  // --- 2. FASTERBOOK: Movie Booking Confirmation ---
  if (orderType === 'fasterbook_movie' && isFasterBookMovie(orderData)) {
    const data = orderData;
    const isFailed = !data.bookingId || data.status.toLowerCase() !== 'confirmed';

    return (
      <div className={`p-4 rounded-lg border ${isFailed ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
        <div className="flex items-center space-x-3">
          {isFailed ? <XCircle className="w-6 h-6 text-red-600" /> : <Ticket className="w-6 h-6 text-blue-600" />}
          <h4 className={`font-semibold text-lg ${isFailed ? 'text-red-700' : 'text-blue-700'}`}>
            {isFailed ? 'Booking Failed' : 'Tickets Confirmed'}
          </h4>
        </div>
        <div className="mt-3 pl-9 text-sm space-y-2">
          {data.bookingId && (
            <p className="text-gray-700">
              <strong>Booking ID:</strong> <span className="font-mono">{data.bookingId}</span>
            </p>
          )}
          <p className="text-gray-700">
            <strong>Movie:</strong> {data.movieTitle}
          </p>
          <p className="text-gray-700">
            <strong>Seats:</strong> {data.seats.join(', ')}
          </p>
          <p className="text-gray-700">
            <strong>Total:</strong> ₹{data.totalPrice}
          </p>
        </div>
      </div>
    );
  }

  // --- 3. FASTERBOOK: Menu Display ---
  if (orderType === 'fasterbook_menu' && isFasterBookMenu(orderData)) {
    const data = orderData;
    return (
      <div className="p-4 rounded-lg border bg-gray-50 border-gray-200">
        <div className="flex items-center space-x-3">
          <List className="w-6 h-6 text-gray-600" />
          <h4 className="font-semibold text-lg text-gray-700">FasterBook Menu</h4>
        </div>
        <div className="mt-3 pl-9 text-sm space-y-4">
          {data.items.length > 0 ? data.items.map((item: AvailableItem) => (
            <div key={item.id}>
              <p className="text-gray-800 font-semibold">{item.name} - <span className="font-normal">₹{item.price}</span></p>
              {item.description && <p className="text-gray-600">{item.description}</p>}
            </div>
          )) : (
            <p className="text-gray-600">The menu is currently empty.</p>
          )}
        </div>
      </div>
    );
  }
  
  // --- 4. FASTERBOOK: Bookings History ---
  if (orderType === 'fasterbook_bookings' && isFasterBookBookings(orderData)) {
    const data = orderData;
    const totalBookings = data.foodBookings.length + data.movieBookings.length;
    return (
      <div className="p-4 rounded-lg border bg-gray-50 border-gray-200">
        <div className="flex items-center space-x-3">
          <History className="w-6 h-6 text-gray-600" />
          <h4 className="font-semibold text-lg text-gray-700">Your Bookings ({totalBookings})</h4>
        </div>
        <div className="mt-3 pl-9 text-sm space-y-4">
          {totalBookings === 0 ? (
            <p className="text-gray-600">You have no past bookings.</p>
          ) : (
            <>
              {data.foodBookings.map((booking) => (
                <div key={booking.bookingId} className="border-b pb-2">
                  <p className="text-gray-800 font-semibold">Food: {booking.itemName} (x{booking.quantity})</p>
                  <p className="text-gray-600">To: {booking.address}</p>
                  <p className="text-gray-500 text-xs font-mono">ID: {booking.bookingId}</p>
                </div>
              ))}
              {data.movieBookings.map((booking) => (
                <div key={booking.bookingId} className="border-b pb-2">
                  <p className="text-gray-800 font-semibold">Movie: {booking.movieTitle}</p>
                  <p className="text-gray-600">Seats: {booking.seats.join(', ')}</p>
                  <p className="text-gray-500 text-xs font-mono">ID: {booking.bookingId}</p>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    );
  }

  // --- 5. LEGACY: Mock Food/Ticket Bookings ---
  if (orderType === 'food_booking' && isLegacyFood(orderData)) {
    return (
      <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
        <h4 className="font-semibold text-yellow-800">Mock Food Order ({orderData.status})</h4>
        <p className="text-sm text-yellow-700">Item: {orderData.item} (x{orderData.quantity})</p>
        <p className="text-sm text-yellow-700">Total: ${orderData.totalPrice.toFixed(2)}</p>
        <p className="text-xs text-yellow-600 font-mono">ID: {orderData.bookingId}</p>
      </div>
    );
  }

  if (orderType === 'ticket_booking' && isLegacyTicket(orderData)) {
    return (
      <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200">
        <h4 className="font-semibold text-indigo-800">Mock Ticket Order ({orderData.status})</h4>
        <p className="text-sm text-indigo-700">Movie: {orderData.movie}</p>
        <p className="text-sm text-indigo-700">Seats: {orderData.seats}</p>
        <p className="text-sm text-indigo-700">Total: ${orderData.totalPrice.toFixed(2)}</p>
        <p className="text-xs text-indigo-600 font-mono">ID: {orderData.bookingId}</p>
      </div>
    );
  }

  return <div className="text-red-500">[Error: Unknown order data]</div>;
};
