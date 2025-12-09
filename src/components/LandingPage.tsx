import { SignIn, SignUp, ClerkLoaded, ClerkLoading } from '@clerk/clerk-react';
import { Sparkles, Brain, Globe, ArrowRight, X, Zap, Waves, Droplets } from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState<'signin' | 'signup' | null>(null);

  if (showAuth) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-sand-100/60 backdrop-blur-md transition-opacity" 
          onClick={() => setShowAuth(null)}
        />

        {/* Modal Content - Sea Glass Style */}
        <div className="relative w-full max-w-md bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 p-8 animate-fade-in">
          <button
            onClick={() => setShowAuth(null)}
            className="absolute top-4 right-4 p-2 text-sand-400 hover:text-sand-700 transition-colors rounded-full hover:bg-sand-100/50"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Loading State for Clerk */}
          <ClerkLoading>
            <div className="h-[400px] flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 border-4 border-tide-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sand-500 text-sm">Navigating securely...</p>
            </div>
          </ClerkLoading>

          {/* Clerk Component */}
          <ClerkLoaded>
            <div className="min-h-[400px]">
              {showAuth === 'signin' ? (
                <SignIn
                  appearance={{
                    layout: { socialButtonsPlacement: 'bottom' },
                    elements: {
                      rootBox: 'w-full',
                      card: 'shadow-none bg-transparent p-0 w-full',
                      headerTitle: 'text-xl font-bold text-sand-800 font-serif',
                      headerSubtitle: 'text-sand-500',
                      formButtonPrimary: 'bg-tide-600 hover:bg-tide-700 text-white !shadow-none rounded-xl',
                      socialButtonsBlockButton: 'border-sand-200 hover:bg-sand-50 rounded-xl',
                      formFieldInput: 'rounded-xl border-sand-200 focus:ring-tide-500/20 focus:border-tide-500 bg-white/50',
                      footerActionLink: 'text-tide-600 hover:text-tide-700'
                    }
                  }}
                  routing="path" 
                  path="/"
                />
              ) : (
                <SignUp
                  appearance={{
                    layout: { socialButtonsPlacement: 'bottom' },
                    elements: {
                      rootBox: 'w-full',
                      card: 'shadow-none bg-transparent p-0 w-full',
                      headerTitle: 'text-xl font-bold text-sand-800 font-serif',
                      headerSubtitle: 'text-sand-500',
                      formButtonPrimary: 'bg-tide-600 hover:bg-tide-700 text-white !shadow-none rounded-xl',
                      socialButtonsBlockButton: 'border-sand-200 hover:bg-sand-50 rounded-xl',
                      formFieldInput: 'rounded-xl border-sand-200 focus:ring-tide-500/20 focus:border-tide-500 bg-white/50',
                      footerActionLink: 'text-tide-600 hover:text-tide-700'
                    }
                  }}
                  routing="path" 
                  path="/"
                />
              )}
            </div>
          </ClerkLoaded>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-50 text-sand-800 font-sans selection:bg-tide-100 selection:text-tide-900 overflow-x-hidden relative bg-noise">
      
      {/* --- Ocean / Sky Background Animation --- */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Deep Ocean Blob */}
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-tide-200/20 rounded-full blur-[140px] animate-wave-slow" />
        
        {/* Surface Sparkle Blob */}
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-tide-100/40 rounded-full blur-[120px] animate-wave-fast" style={{ animationDelay: '2s' }} />
        
        {/* Floating "Bubbles" */}
        <div className="absolute top-[20%] right-[20%] w-32 h-32 bg-white/40 rounded-full blur-[40px] animate-float" />
        <div className="absolute bottom-[30%] left-[10%] w-24 h-24 bg-tide-300/10 rounded-full blur-[30px] animate-float" style={{ animationDelay: '1s' }} />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-40 px-6 py-6 transition-all duration-300">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-tide-500 rounded-lg flex items-center justify-center shadow-lg shadow-tide-400/20">
              <Waves className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-sand-900 font-serif">A.U.R.A</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowAuth('signin')}
              className="px-5 py-2.5 rounded-full text-sm font-medium text-sand-600 hover:text-sand-900 hover:bg-white/50 transition-all"
            >
              Sign In
            </button>
            <button
              onClick={() => setShowAuth('signup')}
              className="px-6 py-2.5 rounded-full text-sm font-medium bg-tide-900/5 hover:bg-tide-900/10 text-tide-900 backdrop-blur-md border border-tide-900/5 transition-all shadow-sm"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-40 pb-20 px-6 z-10">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/40 border border-white/60 backdrop-blur-md shadow-sm animate-fade-in">
            <Droplets className="w-3 h-3 text-tide-500 animate-pulse" />
            <span className="text-xs font-bold tracking-widest text-sand-500 uppercase">System Fluid</span>
          </div>

          {/* Headline */}
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-sand-900 leading-[0.95] animate-slide-up font-serif">
            The ocean of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-tide-600 to-tide-400 italic pr-2">Intelligence.</span>
          </h1>

          {/* Subtext */}
          <p className="text-xl md:text-2xl text-sand-500 max-w-2xl mx-auto leading-relaxed font-light animate-slide-up" style={{ animationDelay: '0.1s' }}>
            A vast, calm, and responsive AI. <br className="hidden md:block"/>
            Designed to flow with your thoughts.
          </p>

          {/* Glassy Buttons (Sea Glass Style) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <button
              onClick={() => setShowAuth('signup')}
              className="group relative px-9 py-4 rounded-2xl bg-tide-600/90 text-white font-medium text-lg shadow-xl shadow-tide-500/20 hover:shadow-2xl hover:bg-tide-600 hover:-translate-y-0.5 transition-all duration-300 backdrop-blur-md overflow-hidden"
            >
              <span className="relative flex items-center gap-2">
                Dive In <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            
            <button
              onClick={() => setShowAuth('signin')}
              className="px-9 py-4 rounded-2xl bg-white/30 border border-white/50 text-sand-700 font-medium text-lg shadow-lg shadow-tide-200/10 hover:bg-white/50 hover:border-white hover:-translate-y-0.5 transition-all duration-300 backdrop-blur-md"
            >
              Resume Drift
            </button>
          </div>
        </div>

        {/* Feature Grid (Floating Cards) */}
        <div className="max-w-6xl mx-auto mt-40 grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Brain className="w-6 h-6" />}
            title="Deep Currents"
            desc="Reasoning capabilities that go beneath the surface."
          />
          <FeatureCard 
            icon={<Zap className="w-6 h-6" />}
            title="Fluid Action"
            desc="Seamlessly book, order, and organize without friction."
          />
          <FeatureCard 
            icon={<Globe className="w-6 h-6" />}
            title="Vast Horizon"
            desc="Connected to the world's data like the seven seas."
          />
        </div>
      </main>

      <footer className="py-8 text-center text-sand-400 text-sm relative z-10">
        <p>© 2025 A.U.R.A. System • Hyderabad</p>
      </footer>
    </div>
  );
}

// Minimal Glassy Card Component (Sea Glass)
function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="p-8 rounded-[2rem] bg-white/20 border border-white/40 shadow-sm hover:shadow-xl hover:bg-white/40 transition-all duration-500 backdrop-blur-sm group hover:-translate-y-1">
      <div className="w-14 h-14 rounded-2xl bg-white/60 border border-white/50 flex items-center justify-center text-tide-600 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-sand-800 mb-3 font-serif">{title}</h3>
      <p className="text-sand-500 leading-relaxed font-light">
        {desc}
      </p>
    </div>
  );
}
