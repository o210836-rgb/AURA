import { UtensilsCrossed, Film, Package } from 'lucide-react';

export default function ExternalServices() {
  // Define *only* the FasterBook services
  const services = [
    {
      icon: <UtensilsCrossed className="w-8 h-8" />,
      name: 'Food Ordering',
      description: 'Strictly managed via FasterBook API',
      gradient: 'from-orange-500 to-red-500',
      status: 'active',
      endpoints: ['Order Food', 'View Menu', 'Track Order']
    },
    {
      icon: <Film className="w-8 h-8" />,
      name: 'Movie Booking',
      description: 'Strictly managed via FasterBook API',
      gradient: 'from-purple-500 to-pink-500',
      status: 'active',
      endpoints: ['Book Tickets', 'View Showtimes', 'Check Seats']
    },
    {
      icon: <Package className="w-8 h-8" />,
      name: 'FasterBook Platform',
      description: 'Centralized booking service API',
      gradient: 'from-emerald-500 to-green-500',
      status: 'active',
      endpoints: ['Food Orders', 'Movie Tickets', 'View All Bookings']
    }
  ];

  return (
    <div className="h-[calc(100vh-5rem)] overflow-y-auto p-6 space-y-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Connected Services</h1>
          <p className="text-gray-600">A.U.R.A utilizes the dedicated FasterBook API for all ordering and booking services.</p>
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
                <p className="text-xs font-semibold text-gray-500 mb-2">Available Actions:</p>
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
            </div>
          ))}
        </div>

        <div className="mt-8 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
          <h3 className="text-lg font-bold text-gray-900 mb-3">How to Use Agent Mode</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-semibold text-gray-900">Activate Mode</p>
                <p className="text-sm text-gray-600">Toggle the switch in the chat input bar to enter 'FasterBook Agent Mode'.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-semibold text-gray-900">State Intent Clearly</p>
                <p className="text-sm text-gray-600">Example: "Order 2 chicken biryani" or "Show movie showtimes"</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-semibold text-gray-900">A.U.R.A Takes Action</p>
                <p className="text-sm text-gray-600">The agent will instantly call the FasterBook API, ask for details, or complete the order.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
