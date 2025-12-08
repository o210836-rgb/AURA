import { SignIn, SignUp } from '@clerk/clerk-react';
import { Sparkles, Zap, Brain, Shield, Globe, ArrowRight, X } from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState<'signin' | 'signup' | null>(null);

  // Authentication Modal with Warm Glass Style
  if (showAuth) {
    return (
      <div className="min-h-screen bg-stone-50/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 fixed inset-0">
        <div className="w-full max-w-md relative">
          <button
            onClick={() => setShowAuth(null)}
            className="absolute -top-12 right-0 text-stone-500 hover:text-stone-800 transition-colors p-2 bg-white/50 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="bg-[#fafaf9] rounded-3xl shadow-2xl border border-stone-200 p-8 relative overflow-hidden">
            {/* Decorative background blob for modal */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-vintage-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
            
            <div className="relative z-10">
              {showAuth === 'signin' ? (
                <SignIn
                  appearance={{
                    elements: {
                      rootBox: 'w-full',
                      card: 'shadow-none bg-transparent p-0',
                      headerTitle: 'text-2xl font-bold text-stone-800 font-sans',
                      headerSubtitle: 'text-stone-500',
                      socialButtonsBlockButton: 'border border-stone-200 hover:bg-stone-50 text-stone-600',
                      formButtonPrimary: 'bg-vintage-600 hover:bg-vintage-700 text-white shadow-lg shadow-vintage-500/20',
                      footerActionLink: 'text-vintage-600 hover:text-vintage-700',
                      formFieldInput: 'border-stone-200 focus:border-vintage-500 focus:ring-vintage-500/20 bg-white',
                      formFieldLabel: 'text-stone-600'
                    }
                  }}
                  routing="hash"
                  signUpUrl="#/signup"
                />
              ) : (
                <SignUp
                  appearance={{
                    elements: {
                      rootBox: 'w-full',
                      card: 'shadow-none bg-transparent p-0',
                      headerTitle: 'text-2xl font-bold text-stone-800 font-sans',
                      headerSubtitle: 'text-stone-500',
                      socialButtonsBlockButton: 'border border-stone-200 hover:bg-stone-50 text-stone-600',
                      formButtonPrimary: 'bg-vintage-600 hover:bg-vintage-700 text-white shadow-lg shadow-vintage-500/20',
                      footerActionLink: 'text-vintage-600 hover:text-vintage-700',
                      formFieldInput: 'border-stone-200 focus:border-vintage-500 focus:ring-vintage-500/20 bg-white',
                      formFieldLabel: 'text-stone-600'
                    }
                  }}
                  routing="hash"
                  signInUrl="#/signin"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans overflow-x-hidden selection:bg-vintage-200 selection:text-vintage-900 bg-noise">
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-40 bg-stone-50/80 backdrop-blur-md border-b border-stone-200/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-vintage-500 to-vintage-600 rounded-xl flex items-center justify-center shadow-lg shadow-vintage-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-stone-800">A.U.R.A</span>
          </div>

          <div className="flex items-center space-x-6">
            <button
              onClick={() => setShowAuth('signin')}
              className="text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors hidden sm:block"
            >
              Sign In
            </button>
            <button
              onClick={() => setShowAuth('signup')}
              className="px-6 py-2.5 bg-stone-900 text-stone-50 rounded-full hover:bg-stone-800 transition-all shadow-lg hover:shadow-xl text-sm font-medium tracking-wide"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Column: Text */}
            <div className="space-y-10 animate-slide-up">
              <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-vintage-50 border border-vintage-100 rounded-full text-vintage-700 text-xs font-bold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" />
                <span>The OS for a Lively Future</span>
              </div>

              <h1 className="text-6xl md:text-7xl font-bold leading-[1.1] tracking-tight text-stone-900">
                Not just smart. <br />
                <span className="text-vintage-600 italic font-serif">Alive.</span>
              </h1>

              <p className="text-xl text-stone-500 leading-relaxed max-w-lg">
                Experience an AI that feels less like a computer and more like a companion. 
                Warm, responsive, and designed to help you thrive.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <button
                  onClick={() => setShowAuth('signup')}
                  className="px-8 py-4 bg-vintage-600 text-white rounded-2xl hover:bg-vintage-700 transition-all shadow-xl shadow-vintage-500/20 font-medium text-lg flex items-center gap-2 group"
                >
                  <span>Start your Journey</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => setShowAuth('signin')}
                  className="px-8 py-4 bg-white text-stone-600 rounded-2xl border border-stone-200 hover:border-stone-300 hover:bg-stone-50 transition-all shadow-sm font-medium text-lg"
                >
                  Log In
                </button>
              </div>
              
              <div className="pt-8 flex items-center gap-4 text-sm text-stone-400">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-stone-200"></div>
                  ))}
                </div>
                <p>Joined by 10,000+ creators today</p>
              </div>
            </div>

            {/* Right Column: The Vintage Car Image */}
            <div className="relative animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {/* Abstract decorative shapes behind image */}
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-vintage-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-clay-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
              
              {/* Main Image Container */}
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white transform rotate-1 hover:rotate-0 transition-transform duration-700 ease-out">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10 pointer-events-none"></div>
                
                {/* Using a specific Unsplash ID for a vintage car (Porsche/Alfa Romeo style) 
                   with warm, nostalgic toning to match the "Her" aesthetic.
                */}
                <img 
                  src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2670&auto=format&fit=crop" 
                  alt="Vintage car in warm light" 
                  className="w-full h-[600px] object-cover hover:scale-105 transition-transform duration-1000 ease-out"
                />
                
                {/* Floating UI Element on top of image */}
                <div className="absolute bottom-8 left-8 right-8 z-20">
                  <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white/40 shadow-lg flex items-center gap-4">
                    <div className="w-10 h-10 bg-vintage-100 rounded-full flex items-center justify-center">
                      <Zap className="w-5 h-5 text-vintage-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Status</p>
                      <p className="text-sm font-semibold text-stone-800">System Healthy & Lively</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Feature Section */}
      <section className="py-24 px-6 bg-white border-t border-stone-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold text-stone-900 mb-4 tracking-tight">Capabilities</h2>
            <p className="text-stone-500 text-lg">
              Designed to handle the complexity of the modern world with the simplicity of the past.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Brain className="w-6 h-6" />}
              title="Reasoning"
              desc="Analyzes complex documents and data with human-like nuance."
              color="vintage"
            />
            <FeatureCard 
              icon={<Zap className="w-6 h-6" />}
              title="Booking Agent"
              desc="Connects directly to FasterBook to handle your real-world logistics."
              color="clay"
            />
            <FeatureCard 
              icon={<Sparkles className="w-6 h-6" />}
              title="Creativity"
              desc="Generates imagery and concepts that feel organic and inspired."
              color="stone"
            />
            <FeatureCard 
              icon={<Globe className="w-6 h-6" />}
              title="Connectivity"
              desc="Seamlessly integrates with external APIs and services."
              color="vintage"
            />
            <FeatureCard 
              icon={<Shield className="w-6 h-6" />}
              title="Privacy First"
              desc="Your data is treated with the same respect as a personal letter."
              color="stone"
            />
            <FeatureCard 
              icon={<Zap className="w-6 h-6" />}
              title="Instant Response"
              desc="Fluid, low-latency interactions that never break the flow."
              color="clay"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-stone-100 bg-[#fafaf9]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-stone-400 text-sm">
            © 2025 A.U.R.A. System. Crafted with care in Hyderabad.
          </p>
        </div>
      </footer>
    </div>
  );
}

// Sub-component for features
function FeatureCard({ icon, title, desc, color }: { icon: any, title: string, desc: string, color: 'vintage' | 'stone' | 'clay' }) {
  const colors = {
    vintage: 'bg-vintage-50 text-vintage-600 group-hover:bg-vintage-100',
    stone: 'bg-stone-100 text-stone-600 group-hover:bg-stone-200',
    clay: 'bg-clay-50 text-clay-500 group-hover:bg-clay-100',
  };

  return (
    <div className="group p-8 rounded-3xl bg-white border border-stone-100 hover:border-stone-200 hover:shadow-xl hover:shadow-stone-200/40 transition-all duration-300">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors ${colors[color]}`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-stone-800 mb-3">{title}</h3>
      <p className="text-stone-500 leading-relaxed">
        {desc}
      </p>
    </div>
  );
}
