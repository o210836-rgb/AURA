const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface RestaurantOrder {
  orderId: string;
  restaurant: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
  deliveryAddress: string;
  estimatedDelivery: string;
  status: 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered';
}

export interface HotelBooking {
  bookingId: string;
  hotelName: string;
  location: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  guests: number;
  roomType: string;
  totalAmount: number;
  status: 'confirmed' | 'checked_in' | 'checked_out';
}

export interface FlightBooking {
  bookingId: string;
  airline: string;
  flightNumber: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  passengers: number;
  class: string;
  totalAmount: number;
  status: 'confirmed' | 'boarding' | 'in_flight' | 'landed';
}

export interface RideBooking {
  rideId: string;
  driverName: string;
  vehicleType: string;
  vehicleNumber: string;
  pickup: string;
  dropoff: string;
  estimatedArrival: string;
  fare: number;
  status: 'confirmed' | 'driver_arriving' | 'in_progress' | 'completed';
}

export const mockRestaurantApi = {
  async placeOrder(orderDetails: any): Promise<RestaurantOrder> {
    await delay(1500);

    const orderId = `REST${Math.floor(Math.random() * 100000)}`;
    const now = new Date();
    const deliveryTime = new Date(now.getTime() + 45 * 60000);

    return {
      orderId,
      restaurant: orderDetails.restaurant || 'Delicious Bites',
      items: orderDetails.items || [
        { name: 'Margherita Pizza', quantity: 1, price: 12.99 },
        { name: 'Caesar Salad', quantity: 1, price: 8.99 },
      ],
      totalAmount: orderDetails.totalAmount || 21.98,
      deliveryAddress: orderDetails.address || '123 Main St, City',
      estimatedDelivery: deliveryTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'confirmed',
    };
  },

  async trackOrder(orderId: string): Promise<RestaurantOrder> {
    await delay(500);
    throw new Error('Order tracking simulation');
  },
};

export const mockHotelApi = {
  async bookHotel(bookingDetails: any): Promise<HotelBooking> {
    await delay(2000);

    const bookingId = `HTL${Math.floor(Math.random() * 100000)}`;

    return {
      bookingId,
      hotelName: bookingDetails.hotelName || 'Grand Plaza Hotel',
      location: bookingDetails.location || 'Downtown City Center',
      checkIn: bookingDetails.checkIn || new Date(Date.now() + 86400000).toLocaleDateString(),
      checkOut: bookingDetails.checkOut || new Date(Date.now() + 259200000).toLocaleDateString(),
      rooms: bookingDetails.rooms || 1,
      guests: bookingDetails.guests || 2,
      roomType: bookingDetails.roomType || 'Deluxe King',
      totalAmount: bookingDetails.totalAmount || 450,
      status: 'confirmed',
    };
  },

  async cancelBooking(bookingId: string): Promise<boolean> {
    await delay(1000);
    return true;
  },
};

export const mockFlightApi = {
  async bookFlight(flightDetails: any): Promise<FlightBooking> {
    await delay(2500);

    const bookingId = `FLT${Math.floor(Math.random() * 100000)}`;

    return {
      bookingId,
      airline: flightDetails.airline || 'SkyWings Airlines',
      flightNumber: `SW${Math.floor(Math.random() * 9000) + 1000}`,
      from: flightDetails.from || 'New York (JFK)',
      to: flightDetails.to || 'Los Angeles (LAX)',
      departureTime: flightDetails.departureTime || '10:30 AM',
      arrivalTime: flightDetails.arrivalTime || '2:45 PM',
      passengers: flightDetails.passengers || 1,
      class: flightDetails.class || 'Economy',
      totalAmount: flightDetails.totalAmount || 350,
      status: 'confirmed',
    };
  },

  async checkFlightStatus(bookingId: string): Promise<FlightBooking> {
    await delay(500);
    throw new Error('Flight status check simulation');
  },
};

export const mockRideApi = {
  async bookRide(rideDetails: any): Promise<RideBooking> {
    await delay(1000);

    const rideId = `RIDE${Math.floor(Math.random() * 100000)}`;
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + 5 * 60000);

    const drivers = ['James Wilson', 'Sarah Chen', 'Michael Brown', 'Emily Davis'];
    const vehicles = ['Sedan', 'SUV', 'Premium Sedan', 'Electric'];

    return {
      rideId,
      driverName: drivers[Math.floor(Math.random() * drivers.length)],
      vehicleType: rideDetails.vehicleType || vehicles[Math.floor(Math.random() * vehicles.length)],
      vehicleNumber: `ABC${Math.floor(Math.random() * 9000) + 1000}`,
      pickup: rideDetails.pickup || '123 Main Street',
      dropoff: rideDetails.dropoff || '456 Oak Avenue',
      estimatedArrival: arrivalTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      fare: rideDetails.fare || 15.50,
      status: 'confirmed',
    };
  },

  async cancelRide(rideId: string): Promise<boolean> {
    await delay(500);
    return true;
  },
};

export const mockEcommerceApi = {
  async placeOrder(orderDetails: any): Promise<any> {
    await delay(1800);

    const orderId = `ECOM${Math.floor(Math.random() * 100000)}`;
    const now = new Date();
    const deliveryDate = new Date(now.getTime() + 3 * 86400000);

    return {
      orderId,
      items: orderDetails.items || [
        { name: 'Wireless Headphones', quantity: 1, price: 89.99 },
      ],
      totalAmount: orderDetails.totalAmount || 89.99,
      shippingAddress: orderDetails.address || '123 Main St, City',
      estimatedDelivery: deliveryDate.toLocaleDateString(),
      status: 'confirmed',
      trackingNumber: `TRK${Math.floor(Math.random() * 1000000)}`,
    };
  },

  async trackOrder(orderId: string): Promise<any> {
    await delay(500);
    throw new Error('E-commerce tracking simulation');
  },
};
