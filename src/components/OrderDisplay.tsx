import React from 'react';
import { CheckCircle2, MapPin, Clock, Calendar, Ticket, UtensilsCrossed, Package, Film, List } from 'lucide-react';
import { FoodBookingResult } from '../services/foodBooking';
import { TicketBookingResult } from '../services/ticketBooking';
import {
  FoodBookingResponse,
  MovieBookingResponse,
  BookingsResponse,
  Booking
} from '../services/fasterbook';

interface OrderDisplayProps {
  orderType: 'food' | 'ticket' | 'fasterbook_food' | 'fasterbook_movie' | 'fasterbook_bookings';
  orderData: FoodBookingResult | TicketBookingResult | FoodBookingResponse | MovieBookingResponse | BookingsResponse;
}

export function OrderDisplay({ orderType, orderData }: OrderDisplayProps) {
  if (orderType === 'fasterbook_food') {
    const fasterbookOrder = orderData as FoodBookingResponse;

    return (
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200 shadow-lg animate-slideIn">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
            {fasterbookOrder.success ? <CheckCircle2 className="w-6 h-6 text-white" /> : <UtensilsCrossed className="w-6 h-6 text-white" />}
          </div>
          <div>
            <h3 className="font-bold text-lg text-orange-900">
              {fasterbookOrder.success ? 'FasterBook Order Placed!' : 'Order Failed'}
            </h3>
            {fasterbookOrder.bookingId && (
              <p className="text-sm text-orange-700">Booking ID: {fasterbookOrder.bookingId}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {fasterbookOrder.success && (
            <>
              <div className="flex items-start space-x-3">
                <UtensilsCrossed className="w-5 h-5 text-orange-600 mt-1" />
                <div className="flex-1">
                  <p className="font-semibold text-orange-900 capitalize">{fasterbookOrder.itemId?.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-orange-700 mt-1">Quantity: {fasterbookOrder.quantity}</p>
                </div>
              </div>

              {fasterbookOrder.address && (
                <div className="flex items-center space-x-3 pt-3 border-t border-orange-200">
                  <MapPin className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-orange-700">Delivery Address</p>
                    <p className="font-semibold text-orange-900">{fasterbookOrder.address}</p>
                  </div>
                </div>
              )}

              {fasterbookOrder.estimatedDelivery && (
                <div className="flex items-center space-x-3 pt-3 border-t border-orange-200">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-orange-700">Estimated Delivery</p>
                    <p className="font-semibold text-orange-900">{fasterbookOrder.estimatedDelivery}</p>
                  </div>
                </div>
              )}

              {fasterbookOrder.totalPrice && (
                <div className="flex items-center justify-between pt-3 border-t border-orange-200">
                  <span className="font-bold text-lg text-orange-900">Total Amount</span>
                  <span className="font-bold text-2xl text-orange-600">
                    ${fasterbookOrder.totalPrice.toFixed(2)}
                  </span>
                </div>
              )}
            </>
          )}

          <div className={`${fasterbookOrder.success ? 'bg-orange-100' : 'bg-red-100'} rounded-lg p-3 mt-4`}>
            <p className={`text-sm ${fasterbookOrder.success ? 'text-orange-800' : 'text-red-800'} text-center`}>
              {fasterbookOrder.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (orderType === 'fasterbook_movie') {
    const movieOrder = orderData as MovieBookingResponse;

    return (
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200 shadow-lg animate-slideIn">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
            {movieOrder.success ? <CheckCircle2 className="w-6 h-6 text-white" /> : <Film className="w-6 h-6 text-white" />}
          </div>
          <div>
            <h3 className="font-bold text-lg text-purple-900">
              {movieOrder.success ? 'FasterBook Movie Booked!' : 'Booking Failed'}
            </h3>
            {movieOrder.bookingId && (
              <p className="text-sm text-purple-700">Booking ID: {movieOrder.bookingId}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {movieOrder.success && (
            <>
              <div className="flex items-start space-x-3">
                <Film className="w-5 h-5 text-purple-600 mt-1" />
                <div className="flex-1">
                  <p className="font-bold text-purple-900 capitalize">{movieOrder.movieId?.replace(/_/g, ' ')}</p>
                  {movieOrder.theater && (
                    <p className="text-sm text-purple-700 mt-1">{movieOrder.theater}</p>
                  )}
                </div>
              </div>

              {movieOrder.showTime && (
                <div className="flex items-center space-x-3 pt-3 border-t border-purple-200">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-purple-700">Show Time</p>
                    <p className="font-semibold text-purple-900">
                      {new Date(movieOrder.showTime).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {movieOrder.seats && movieOrder.seats.length > 0 && (
                <div className="pt-3 border-t border-purple-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Package className="w-5 h-5 text-purple-600" />
                    <p className="font-semibold text-purple-900">Seats</p>
                  </div>
                  <div className="space-y-1">
                    {movieOrder.seats.map((seat, index) => (
                      <div key={index} className="text-sm text-purple-800 bg-purple-100 rounded px-3 py-1 inline-block mr-2">
                        {seat}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {movieOrder.totalPrice && (
                <div className="flex items-center justify-between pt-3 border-t border-purple-200">
                  <span className="font-bold text-lg text-purple-900">Total Amount</span>
                  <span className="font-bold text-2xl text-purple-600">
                    ${movieOrder.totalPrice.toFixed(2)}
                  </span>
                </div>
              )}
            </>
          )}

          <div className={`${movieOrder.success ? 'bg-purple-100' : 'bg-red-100'} rounded-lg p-3 mt-4`}>
            <p className={`text-sm ${movieOrder.success ? 'text-purple-800' : 'text-red-800'} text-center`}>
              {movieOrder.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (orderType === 'fasterbook_bookings') {
    const bookingsData = orderData as BookingsResponse;

    return (
      <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 border-2 border-slate-200 shadow-lg animate-slideIn">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-slate-500 rounded-full flex items-center justify-center">
            <List className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900">Your FasterBook Bookings</h3>
            <p className="text-sm text-slate-700">
              {bookingsData.success && bookingsData.bookings ? `${bookingsData.bookings.length} booking(s) found` : 'No bookings available'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {bookingsData.success && bookingsData.bookings && bookingsData.bookings.length > 0 ? (
            bookingsData.bookings.map((booking: Booking) => (
              <div key={booking.id} className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-900 capitalize">{booking.type}</span>
                  <span className="text-xs text-slate-600">{new Date(booking.timestamp).toLocaleString()}</span>
                </div>
                <div className="text-sm text-slate-700">
                  <p>Booking ID: {booking.id}</p>
                  {booking.details && (
                    <pre className="mt-2 bg-slate-50 p-2 rounded text-xs overflow-auto">
                      {JSON.stringify(booking.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-slate-100 rounded-lg p-4 text-center text-slate-600">
              {bookingsData.message || 'No bookings found'}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (orderType === 'food') {
    const foodOrder = orderData as FoodBookingResult;

    return (
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border-2 border-emerald-200 shadow-lg animate-slideIn">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-emerald-900">Food Order Confirmed!</h3>
            <p className="text-sm text-emerald-700">Order #{foodOrder.orderNumber}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <UtensilsCrossed className="w-5 h-5 text-emerald-600 mt-1" />
            <div>
              <p className="font-semibold text-emerald-900">{foodOrder.restaurant}</p>
              <div className="mt-2 space-y-1">
                {foodOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-emerald-800">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-medium text-emerald-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-3 border-t border-emerald-200">
            <Clock className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-sm text-emerald-700">Estimated Delivery</p>
              <p className="font-semibold text-emerald-900">{foodOrder.estimatedDelivery}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-emerald-200">
            <span className="font-bold text-lg text-emerald-900">Total Amount</span>
            <span className="font-bold text-2xl text-emerald-600">
              ${foodOrder.totalAmount.toFixed(2)}
            </span>
          </div>

          <div className="bg-emerald-100 rounded-lg p-3 mt-4">
            <p className="text-sm text-emerald-800 text-center">
              {foodOrder.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (orderType === 'ticket') {
    const ticketOrder = orderData as TicketBookingResult;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl p-6 border-2 border-blue-200 shadow-lg animate-slideIn">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-blue-900">Tickets Booked!</h3>
          <p className="text-sm text-blue-700">Booking #{ticketOrder.bookingReference}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Ticket className="w-5 h-5 text-blue-600 mt-1" />
          <div className="flex-1">
            <p className="font-bold text-blue-900">{ticketOrder.event}</p>
            <p className="text-sm text-blue-700 mt-1">{ticketOrder.venue}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-blue-200">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs text-blue-700">Date</p>
              <p className="font-semibold text-sm text-blue-900">{ticketOrder.eventDate}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs text-blue-700">Time</p>
              <p className="font-semibold text-sm text-blue-900">{ticketOrder.eventTime}</p>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <Package className="w-5 h-5 text-blue-600" />
            <p className="font-semibold text-blue-900">{ticketOrder.ticketType} Tickets</p>
          </div>
          <div className="space-y-1">
            {ticketOrder.seats.map((seat, index) => (
              <div key={index} className="text-sm text-blue-800 bg-blue-100 rounded px-3 py-1 inline-block mr-2">
                Section {seat.section} - Row {seat.row} - Seat {seat.number}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-blue-200">
          <span className="font-bold text-lg text-blue-900">Total Amount</span>
          <span className="font-bold text-2xl text-blue-600">
            ${ticketOrder.totalAmount.toFixed(2)}
          </span>
        </div>

        <div className="bg-blue-100 rounded-lg p-3 mt-4">
          <p className="text-sm text-blue-800 text-center">
            {ticketOrder.message}
          </p>
        </div>
      </div>
    </div>
  );
  }

  return null;
}
