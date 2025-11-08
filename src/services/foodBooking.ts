// src/services/foodBooking.ts

// This interface is already exported, which is good.
export interface FoodBookingResult {
  bookingId: string;
  item: string;
  quantity: number;
  totalPrice: number;
  status: string;
}

// Mock database
const mockMenu: { [key: string]: number } = {
  burger: 8.99,
  pizza: 12.99,
  salad: 6.99,
};

// --- THIS IS THE FIX ---
// Add the "export" keyword to this line:
export function bookFoodLegacy(message: string): FoodBookingResult {
  let item = 'unknown';
  let quantity = 1;

  const lowerMessage = message.toLowerCase();
  for (const menuItem in mockMenu) {
    if (lowerMessage.includes(menuItem)) {
      item = menuItem;
      break;
    }
  }

  const quantityMatch = lowerMessage.match(/(\d+)/);
  if (quantityMatch) {
    quantity = parseInt(quantityMatch[1], 10);
  }

  if (item === 'unknown') {
    throw new Error('Sorry, we could not find that item on our mock menu.');
  }

  const totalPrice = mockMenu[item] * quantity;

  return {
    bookingId: `mock_${Date.now()}`,
    item: item,
    quantity: quantity,
    totalPrice: totalPrice,
    status: 'confirmed',
  };
}
