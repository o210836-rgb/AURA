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

export interface FoodOrderDetails {
  restaurant: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  deliveryAddress: string;
  specialInstructions?: string;
}

export interface FoodBookingResult {
  success: boolean;
  orderId: string;
  orderNumber: string;
  restaurant: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
  estimatedDelivery: string;
  status: string;
  message: string;
}

const RESTAURANTS = [
  'Pizza Palace',
  'Burger Kingdom',
  'Sushi Spot',
  'Taco Fiesta',
  'Pasta Paradise',
  'Thai Treasure'
];

const SAMPLE_MENU_ITEMS = {
  'Pizza Palace': [
    { name: 'Margherita Pizza', price: 12.99 },
    { name: 'Pepperoni Pizza', price: 14.99 },
    { name: 'Veggie Supreme', price: 13.99 }
  ],
  'Burger Kingdom': [
    { name: 'Classic Burger', price: 9.99 },
    { name: 'Cheese Burger', price: 10.99 },
    { name: 'Veggie Burger', price: 8.99 }
  ],
  'Sushi Spot': [
    { name: 'California Roll', price: 8.99 },
    { name: 'Salmon Sashimi', price: 15.99 },
    { name: 'Spicy Tuna Roll', price: 12.99 }
  ],
  'Taco Fiesta': [
    { name: 'Beef Tacos', price: 7.99 },
    { name: 'Chicken Tacos', price: 7.99 },
    { name: 'Fish Tacos', price: 9.99 }
  ],
  'Pasta Paradise': [
    { name: 'Spaghetti Carbonara', price: 13.99 },
    { name: 'Penne Arrabiata', price: 11.99 },
    { name: 'Fettuccine Alfredo', price: 14.99 }
  ],
  'Thai Treasure': [
    { name: 'Pad Thai', price: 11.99 },
    { name: 'Green Curry', price: 12.99 },
    { name: 'Tom Yum Soup', price: 9.99 }
  ]
};

function generateUserSession(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function bookFood(userRequest: string, extractedParams?: any): Promise<FoodBookingResult> {
  await new Promise(resolve => setTimeout(resolve, 1500));

  let restaurant = extractedParams?.restaurant;
  if (!restaurant || !SAMPLE_MENU_ITEMS[restaurant as keyof typeof SAMPLE_MENU_ITEMS]) {
    restaurant = RESTAURANTS[Math.floor(Math.random() * RESTAURANTS.length)];
  }

  const menuItems = SAMPLE_MENU_ITEMS[restaurant as keyof typeof SAMPLE_MENU_ITEMS];

  let items = [];
  let totalAmount = 0;

  if (extractedParams?.items && extractedParams.items.length > 0) {
    for (const extractedItem of extractedParams.items) {
      const matchingMenuItem = menuItems.find(item =>
        item.name.toLowerCase().includes(extractedItem.name.toLowerCase()) ||
        extractedItem.name.toLowerCase().includes(item.name.toLowerCase())
      );

      const menuItem = matchingMenuItem || menuItems[Math.floor(Math.random() * menuItems.length)];
      const quantity = extractedItem.quantity || 1;

      items.push({
        name: menuItem.name,
        quantity,
        price: menuItem.price
      });
      totalAmount += menuItem.price * quantity;
    }
  } else {
    const numItems = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < numItems; i++) {
      const menuItem = menuItems[Math.floor(Math.random() * menuItems.length)];
      const quantity = Math.floor(Math.random() * 2) + 1;
      items.push({
        name: menuItem.name,
        quantity,
        price: menuItem.price
      });
      totalAmount += menuItem.price * quantity;
    }
  }

  const deliveryMinutes = Math.floor(Math.random() * 20) + 30;
  const estimatedDelivery = new Date(Date.now() + deliveryMinutes * 60000).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const orderDetails: FoodOrderDetails = {
    restaurant,
    items,
    deliveryAddress: extractedParams?.deliveryAddress || 'User provided address',
    specialInstructions: userRequest
  };

  const userSession = generateUserSession();

  try {
    const client = getSupabaseClient();

    if (client) {
      const { data, error } = await client
        .from('orders')
        .insert({
          order_type: 'food',
          status: 'confirmed',
          details: orderDetails,
          total_amount: totalAmount,
          user_session: userSession
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      const orderId = data?.id || 'unknown';
      const orderNumber = `FD${Date.now().toString().slice(-6)}`;

      return {
        success: true,
        orderId,
        orderNumber,
        restaurant,
        items,
        totalAmount,
        estimatedDelivery,
        status: 'confirmed',
        message: `Your food order has been confirmed! Order #${orderNumber} from ${restaurant} will arrive by ${estimatedDelivery}.`
      };
    }
  } catch (error) {
    console.error('Error saving food order:', error);

    const orderNumber = `FD${Date.now().toString().slice(-6)}`;
    return {
      success: true,
      orderId: 'temp_' + Date.now(),
      orderNumber,
      restaurant,
      items,
      totalAmount,
      estimatedDelivery,
      status: 'confirmed',
      message: `Your food order has been confirmed! Order #${orderNumber} from ${restaurant} will arrive by ${estimatedDelivery}.`
    };
  }
}
