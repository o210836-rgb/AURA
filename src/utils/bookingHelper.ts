import { tasksService, TaskType } from '../services/tasks';
import { authService } from '../services/auth';

export interface BookingResult {
  message: string;
  orderType: string;
  orderData: any;
}

export async function handleBookingWithTask(
  agenticAction: any,
  userInput: string
): Promise<BookingResult | null> {
  if (!agenticAction) return null;

  const currentUser = await authService.getCurrentUser();
  let taskType: TaskType = 'general';
  let title = '';
  let description = '';
  let message = '';
  let orderType = '';

  switch (agenticAction.type) {
    case 'restaurant_order':
      taskType = 'restaurant';
      title = `Food Order: ${agenticAction.result.restaurant}`;
      description = `Order placed at ${agenticAction.result.restaurant}`;
      message = `I've placed your food order! It will be delivered to ${agenticAction.result.deliveryAddress}.`;
      orderType = 'restaurant';
      break;

    case 'hotel_booking':
      taskType = 'hotel';
      title = `Hotel Booking: ${agenticAction.result.hotelName}`;
      description = `Booking at ${agenticAction.result.hotelName}, ${agenticAction.result.location}`;
      message = `Your hotel booking is confirmed! Check-in: ${agenticAction.result.checkIn}`;
      orderType = 'hotel';
      break;

    case 'flight_booking':
      taskType = 'flight';
      title = `Flight Booking: ${agenticAction.result.from} → ${agenticAction.result.to}`;
      description = `${agenticAction.result.airline} flight ${agenticAction.result.flightNumber}`;
      message = `Your flight is booked! Departure: ${agenticAction.result.departureTime}`;
      orderType = 'flight';
      break;

    case 'ride_booking':
      taskType = 'ride';
      title = `Ride Booking: ${agenticAction.result.pickup} → ${agenticAction.result.dropoff}`;
      description = `${agenticAction.result.vehicleType} with ${agenticAction.result.driverName}`;
      message = `Your ride is confirmed! Driver will arrive at ${agenticAction.result.estimatedArrival}`;
      orderType = 'ride';
      break;

    case 'fasterbook_food':
      taskType = 'restaurant';
      title = 'FasterBook Food Order';
      description = 'Order placed via FasterBook';
      message = 'I\'ve processed your FasterBook food order! Here are the details:';
      orderType = 'fasterbook_food';
      break;

    case 'fasterbook_movie':
      taskType = 'ecommerce';
      title = 'FasterBook Movie Booking';
      description = 'Movie tickets booked via FasterBook';
      message = 'I\'ve processed your FasterBook movie booking! Here are the details:';
      orderType = 'fasterbook_movie';
      break;

    case 'food_booking':
      taskType = 'restaurant';
      title = 'Food Order';
      description = 'Generic food order';
      message = 'I\'ve processed your food order! Here are the details:';
      orderType = 'food';
      break;

    case 'ticket_booking':
      taskType = 'ecommerce';
      title = 'Ticket Booking';
      description = 'Event tickets booked';
      message = 'I\'ve booked your tickets! Here are the details:';
      orderType = 'ticket';
      break;

    default:
      return null;
  }

  try {
    await tasksService.createTask({
      user_id: currentUser?.id,
      task_type: taskType,
      status: 'completed',
      title,
      description,
      order_details: { userInput },
      api_response: agenticAction.result,
      completed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating task:', error);
  }

  return {
    message,
    orderType,
    orderData: agenticAction.result,
  };
}
