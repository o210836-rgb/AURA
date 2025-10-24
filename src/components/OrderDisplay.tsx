import React from 'react';
import { CheckCircle2, MapPin, Clock, Calendar, Ticket, UtensilsCrossed, Package } from 'lucide-react';
import { FoodBookingResult } from '../services/foodBooking';
import { TicketBookingResult } from '../services/ticketBooking';

interface OrderDisplayProps {
  orderType: 'food' | 'ticket';
  orderData: FoodBookingResult | TicketBookingResult;
}

export function OrderDisplay({ orderType, orderData }: OrderDisplayProps) {
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
