import { Coffee, Ticket, Hotel, Plane, Car, Package } from 'lucide-react';

export default function ExternalServices() {
  const services = [
    {
      icon: <Coffee className="w-8 h-8" />,
      name: 'Food Delivery',
      description: 'Order from top restaurants',
      gradient: 'from-orange-500 to-red-500',
      status: 'active',
      endpoints: ['Order Food', 'View Restaurants', 'Track Order']
    },
    {
      icon: <Ticket className="w-8 h-8" />,
      name: 'Event Tickets',
      description: 'Book concert & event tickets',
      gradient: 'from-purple-500 to-pink-500',
      status: 'active',
      endpoints: ['Book Tickets', 'View Events', 'Check Availability']
    },
    {
      icon: <Hotel className="w-8 h-8" />,
      name: 'Hotel Booking',
      description: 'Reserve rooms worldwide',
      gradient: 'from-blue-500 to-cyan-500',
      status: 'active',
      endpoints: ['Book Hotel', 'Search Hotels', 'View Bookings']
    },
    {
      icon: <Plane className="w-8 h-8" />,
      name: 'Flight Booking',
      description: 'Book domestic & international flights',
      gradient: 'from-indigo-500 to-blue-500',
      status: 'active',
      endpoints: ['Book Flight', 'Search Flights', 'Check Status']
    },
    {
      icon: <Car className="w-8 h-8" />,
      name: 'Ride Booking',
      description: 'Get rides instantly',
      gradient: 'from-green-500 to-teal-500',
      status: 'active',
      endpoints: ['Book Ride', 'Estimate Fare', 'Track Driver']
    },
    {
      icon: <Package className="w-8 h-8" />,
      name: 'FasterBook',
      description: 'Integrated booking platform',
      gradient: 'from-emerald-500 to-green-500',
      status: 'active',
      endpoints: ['Food Orders', 'Movie Tickets', 'View Menu']
    }
  ];

  return (
    <div className="h-[calc(100vh-5rem)] overflow-y-auto p-6 space-y-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">External Services</h1>
          <p className="text-gray-600">Connected backend services and APIs for booking and ordering</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-green-200 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-16 h-16 bg-gradient-to-br ${service.gradient} rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}>
                  {service.icon}
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  {service.status.toUpperCase()}
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{service.description}</p>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">Available Endpoints:</p>
                <div className="space-y-2">
                  {service.endpoints.map((endpoint, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-2 text-sm text-gray-700"
                    >
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>{endpoint}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-medium text-sm">
                Test Service
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
          <h3 className="text-lg font-bold text-gray-900 mb-3">How to Use Services</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-semibold text-gray-900">Start a Conversation</p>
                <p className="text-sm text-gray-600">Simply chat with A.U.R.A in natural language</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-semibold text-gray-900">Make Your Request</p>
                <p className="text-sm text-gray-600">Example: "Book a hotel in Paris" or "Order pizza"</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-semibold text-gray-900">Provide Details</p>
                <p className="text-sm text-gray-600">A.U.R.A will ask for any missing information needed</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                4
              </div>
              <div>
                <p className="font-semibold text-gray-900">Confirm Booking</p>
                <p className="text-sm text-gray-600">Review and confirm your booking details</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
