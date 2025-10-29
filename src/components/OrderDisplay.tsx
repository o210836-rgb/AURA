import React from 'react';
import { CheckCircle2, MapPin, Clock, Calendar, Ticket, UtensilsCrossed, Package, Film, List, Hotel, Plane, Car } from 'lucide-react';
import { FoodBookingResult } from '../services/foodBooking';
import { TicketBookingResult } from '../services/ticketBooking';
import { RestaurantOrder, HotelBooking, FlightBooking, RideBooking } from '../services/mockApis';
import {
  FoodBookingResponse,
  MovieBookingResponse,
  BookingsResponse,
  AvailableItemsResponse,
  Booking,
  FoodItem,
  Movie
} from '../services/fasterbook';

interface OrderDisplayProps {
  orderType: 'food' | 'ticket' | 'fasterbook_food' | 'fasterbook_movie' | 'fasterbook_bookings' | 'fasterbook_menu' | 'restaurant' | 'hotel' | 'flight' | 'ride';
  orderData: FoodBookingResult | TicketBookingResult | FoodBookingResponse | MovieBookingResponse | BookingsResponse | AvailableItemsResponse | RestaurantOrder | HotelBooking | FlightBooking | RideBooking;
}

export function OrderDisplay({ orderType, orderData }: OrderDisplayProps) {
  if (orderType === 'restaurant') {
    const order = orderData as RestaurantOrder;

    return (
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200 shadow-lg animate-slideIn">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
            <UtensilsCrossed className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-orange-900">Restaurant Order Confirmed</h3>
            <p className="text-sm text-orange-700">
              Order ID: {order.orderId}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-orange-600" />
            <span className="font-semibold text-orange-900">Restaurant:</span>
            <span className="text-orange-800">{order.restaurant}</span>
          </div>

          <div className="bg-white rounded-lg p-3 border border-orange-200">
            <p className="text-sm font-semibold text-orange-900 mb-2">Order Items:</p>
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-orange-800">{item.quantity}x {item.name}</span>
                <span className="font-semibold text-orange-900">${item.price}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-orange-600" />
            <span className="font-semibold text-orange-900">Delivery Address:</span>
            <span className="text-orange-800">{order.deliveryAddress}</span>
          </div>

          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <span className="font-semibold text-orange-900">Estimated Delivery:</span>
            <span className="text-orange-800">{order.estimatedDelivery}</span>
          </div>

          <div className="flex items-center space-x-2 pt-2 border-t border-orange-200">
            <span className="font-bold text-orange-900">Total Amount:</span>
            <span className="text-xl font-bold text-orange-600">${order.totalAmount}</span>
          </div>
        </div>
      </div>
    );
  }

  if (orderType === 'hotel') {
    const booking = orderData as HotelBooking;

    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 shadow-lg animate-slideIn">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
            <Hotel className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-blue-900">Hotel Booking Confirmed</h3>
            <p className="text-sm text-blue-700">
              Booking ID: {booking.bookingId}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Hotel className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-900">Hotel:</span>
            <span className="text-blue-800">{booking.hotelName}</span>
          </div>

          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-900">Location:</span>
            <span className="text-blue-800">{booking.location}</span>
          </div>

          <div className="bg-white rounded-lg p-3 border border-blue-200 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-blue-800">Check-in:</span>
              <span className="font-semibold text-blue-900">{booking.checkIn}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-800">Check-out:</span>
              <span className="font-semibold text-blue-900">{booking.checkOut}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-800">Room Type:</span>
              <span className="font-semibold text-blue-900">{booking.roomType}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-800">Guests:</span>
              <span className="font-semibold text-blue-900">{booking.guests}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2 border-t border-blue-200">
            <span className="font-bold text-blue-900">Total Amount:</span>
            <span className="text-xl font-bold text-blue-600">${booking.totalAmount}</span>
          </div>
        </div>
      </div>
    );
  }

  if (orderType === 'flight') {
    const booking = orderData as FlightBooking;

    return (
      <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-2xl p-6 border-2 border-sky-200 shadow-lg animate-slideIn">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-sky-500 rounded-full flex items-center justify-center">
            <Plane className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-sky-900">Flight Booking Confirmed</h3>
            <p className="text-sm text-sky-700">
              Booking ID: {booking.bookingId}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Plane className="w-5 h-5 text-sky-600" />
            <span className="font-semibold text-sky-900">Flight:</span>
            <span className="text-sky-800">{booking.airline} {booking.flightNumber}</span>
          </div>

          <div className="bg-white rounded-lg p-3 border border-sky-200 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-sky-800">From:</span>
              <span className="font-semibold text-sky-900">{booking.from}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-sky-800">To:</span>
              <span className="font-semibold text-sky-900">{booking.to}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-sky-800">Departure:</span>
              <span className="font-semibold text-sky-900">{booking.departureTime}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-sky-800">Arrival:</span>
              <span className="font-semibold text-sky-900">{booking.arrivalTime}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-sky-800">Class:</span>
              <span className="font-semibold text-sky-900">{booking.class}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-sky-800">Passengers:</span>
              <span className="font-semibold text-sky-900">{booking.passengers}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2 border-t border-sky-200">
            <span className="font-bold text-sky-900">Total Amount:</span>
            <span className="text-xl font-bold text-sky-600">${booking.totalAmount}</span>
          </div>
        </div>
      </div>
    );
  }

  if (orderType === 'ride') {
    const booking = orderData as RideBooking;

    return (
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border-2 border-emerald-200 shadow-lg animate-slideIn">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
            <Car className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-emerald-900">Ride Booking Confirmed</h3>
            <p className="text-sm text-emerald-700">
              Ride ID: {booking.rideId}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Car className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-emerald-900">Driver:</span>
            <span className="text-emerald-800">{booking.driverName}</span>
          </div>

          <div className="bg-white rounded-lg p-3 border border-emerald-200 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-emerald-800">Vehicle:</span>
              <span className="font-semibold text-emerald-900">{booking.vehicleType}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-emerald-800">Plate:</span>
              <span className="font-semibold text-emerald-900">{booking.vehicleNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-emerald-800">Pickup:</span>
              <span className="font-semibold text-emerald-900">{booking.pickup}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-emerald-800">Dropoff:</span>
              <span className="font-semibold text-emerald-900">{booking.dropoff}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-emerald-800">Estimated Arrival:</span>
              <span className="font-semibold text-emerald-900">{booking.estimatedArrival}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2 border-t border-emerald-200">
            <span className="font-bold text-emerald-900">Fare:</span>
            <span className="text-xl font-bold text-emerald-600">${booking.fare}</span>
          </div>
        </div>
      </div>
    );
  }

  if (orderType === 'fasterbook_menu') {
    const menuData = orderData as AvailableItemsResponse;

    return (
      <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 border-2 border-teal-200 shadow-lg animate-slideIn">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center">
            <List className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-teal-900">FasterBook Menu</h3>
            <p className="text-sm text-teal-700">
              Available items from FasterBook API
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {menuData.success && menuData.food && menuData.food.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <UtensilsCrossed className="w-5 h-5 text-teal-600" />
                <h4 className="font-bold text-teal-900">Available Food Items</h4>
              </div>
              <div className="space-y-2">
                {menuData.food.map((item: FoodItem) => (
                  <div key={item.id} className="bg-white rounded-lg p-3 border border-teal-200">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-teal-900">{item.name}</span>
                      <span className="text-xs font-mono text-teal-600 bg-teal-100 px-2 py-1 rounded">
                        {item.id}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {menuData.success && menuData.movies && menuData.movies.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center space-x-2 mb-3">
                <Film className="w-5 h-5 text-teal-600" />
                <h4 className="font-bold text-teal-900">Available Movies</h4>
              </div>
              <div className="space-y-2">
                {menuData.movies.map((movie: Movie) => (
                  <div key={movie.id} className="bg-white rounded-lg p-3 border border-teal-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-teal-900">{movie.name}</span>
                      <span className="text-xs font-mono text-teal-600 bg-teal-100 px-2 py-1 rounded">
                        {movie.id}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-teal-500" />
                      <div className="flex flex-wrap gap-2">
                        {movie.showTimes.map((time, idx) => (
                          <span key={idx} className="text-xs text-teal-700 bg-teal-50 px-2 py-1 rounded">
                            {new Date(time).toLocaleString()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!menuData.success && (
            <div className="bg-red-100 rounded-lg p-4 text-center text-red-800">
              {menuData.message || 'Failed to load menu items'}
            </div>
          )}
        </div>
      </div>
    );
  }

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
