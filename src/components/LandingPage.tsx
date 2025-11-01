import { useEffect, useState } from 'react';
import { SignInButton, useUser } from '@clerk/clerk-react';
import { Sparkles, Zap, Brain, ArrowRight, Loader, UtensilsCrossed, Film } from 'lucide-react';
import { FasterBookService, AvailableItemsResponse } from '../services/fasterbook';

export default function LandingPage() {
  const { isSignedIn } = useUser();
  const [availableItems, setAvailableItems] = useState<AvailableItemsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 5
    }));
    setParticles(newParticles);

    const fasterBookService = new FasterBookService();
    fasterBookService.getAvailableItems().then(items => {
      setAvailableItems(items);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  if (isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-blue-400/20 animate-float"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${8 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/30 rounded-full filter blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/30 rounded-full filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl flex items-center justify-center backdrop-blur-xl">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">A.U.R.A</span>
          </div>
          <SignInButton mode="modal">
            <button className="px-6 py-2.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white hover:bg-white/20 transition-all duration-300">
              Sign In
            </button>
          </SignInButton>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-block px-4 py-2 bg-blue-500/20 backdrop-blur-xl border border-blue-400/30 rounded-full text-blue-300 text-sm font-medium">
                  Your smart help for any request
                </div>
                <h1 className="text-6xl lg:text-7xl font-bold text-white leading-tight">
                  Create, explore,
                  <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    be inspired
                  </span>
                </h1>
                <p className="text-xl text-slate-300 leading-relaxed">
                  Experience the next generation of AI assistance with A.U.R.A. Natural intelligence meets organic design for seamless interaction.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <SignInButton mode="modal">
                  <button className="group px-8 py-4 bg-white text-slate-900 rounded-full font-semibold text-lg hover:scale-105 transition-all duration-300 shadow-2xl shadow-blue-500/50 flex items-center justify-center space-x-2">
                    <span>Try AURA for free</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </SignInButton>
              </div>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-3">
                <div className="px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-white text-sm flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-blue-400" />
                  <span>AI-Powered</span>
                </div>
                <div className="px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-white text-sm flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span>Real-time Booking</span>
                </div>
                <div className="px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-white text-sm flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  <span>Smart Tasks</span>
                </div>
              </div>
            </div>

            {/* Right Content - API Items Display */}
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
                  <Sparkles className="w-6 h-6 text-blue-400" />
                  <span>Available Services</span>
                </h3>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader className="w-8 h-8 text-blue-400 animate-spin" />
                  </div>
                ) : availableItems?.success ? (
                  <div className="space-y-6">
                    {/* Food Items */}
                    {availableItems.food && availableItems.food.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-white font-semibold">
                          <UtensilsCrossed className="w-5 h-5 text-orange-400" />
                          <span>Food Delivery</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                          {availableItems.food.slice(0, 5).map((item) => (
                            <div
                              key={item.id}
                              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300 hover:scale-105 cursor-pointer"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-white font-medium">{item.name}</span>
                                <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded-full">
                                  Available
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Movie Items */}
                    {availableItems.movies && availableItems.movies.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-white font-semibold">
                          <Film className="w-5 h-5 text-purple-400" />
                          <span>Movie Bookings</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                          {availableItems.movies.slice(0, 5).map((movie) => (
                            <div
                              key={movie.id}
                              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300 hover:scale-105 cursor-pointer"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-white font-medium">{movie.name}</span>
                                <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-1 rounded-full">
                                  Now Showing
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 text-xs text-slate-400">
                                <span>{movie.showTimes.length} showtimes</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <p>Services loading...</p>
                  </div>
                )}
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 text-center">
                  <div className="text-3xl font-bold text-white">100+</div>
                  <div className="text-sm text-slate-400 mt-1">AI Tasks</div>
                </div>
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 text-center">
                  <div className="text-3xl font-bold text-white">500+</div>
                  <div className="text-sm text-slate-400 mt-1">Users</div>
                </div>
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 text-center">
                  <div className="text-3xl font-bold text-white">24/7</div>
                  <div className="text-sm text-slate-400 mt-1">Available</div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center text-slate-400 text-sm border-t border-white/5">
          <p>Developed by CSE Undergrads | Powered by Advanced AI Technology</p>
        </footer>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}
