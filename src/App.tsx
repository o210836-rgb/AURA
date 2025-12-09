import { SignIn, SignUp, ClerkLoaded, ClerkLoading } from '@clerk/clerk-react';
import { Sparkles, Brain, Shield, Globe, ArrowRight, X, Zap } from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState<'signin' | 'signup' | null>(null);

  if (showAuth) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-stone-100/60 backdrop-blur-md transition-opacity" 
          onClick={() => setShowAuth(null)}
        />

        {/* Modal Content */}
        <div className="relative w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 animate-fade-in">
          <button
            onClick={() => setShowAuth(null)}
            className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 transition-colors rounded-full hover:bg-stone-100/50"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Loading State for Clerk */}
          <ClerkLoading>
            <div className="h-[400px] flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 border-4 border-iris-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-stone-500 text-sm">Connecting securely...</p>
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
                      headerTitle: 'text-xl font-bold text-stone-800 font-serif',
                      headerSubtitle: 'text-stone-500',
                      formButtonPrimary: 'bg-iris-600 hover:bg-iris-700 text-white !shadow-none rounded-xl',
                      socialButtonsBlockButton: 'border-stone-200 hover:bg-stone-50 rounded-xl',
                      formFieldInput: 'rounded-xl border-stone-200 focus:ring-iris-500/20 focus:border-iris-500',
                      footerActionLink: 'text-iris-600 hover:text-iris-700'
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
                      headerTitle: 'text-xl font-bold text-stone-800 font-serif',
                      headerSubtitle: 'text-stone-500',
                      formButtonPrimary: 'bg-iris-600 hover:bg-iris-700 text-white !shadow-none rounded-xl',
                      socialButtonsBlockButton: 'border-stone-200 hover:bg-stone-50 rounded-xl',
                      formFieldInput: 'rounded-xl border-stone-200 focus:ring-iris-500/20 focus:border-iris-500',
                      footerActionLink: 'text-iris-600 hover:text-iris-700'
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
    <div className="min-h-screen bg-[#FDFCF8] text-stone-800 font-sans selection:bg-iris-200 selection:text-iris-900 overflow-x-hidden relative">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-iris-200/20 rounded-full blur-[120px] animate-breathe" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amethyst-200/20 rounded-full blur-[120px] animate-breathe" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-40 px-6 py-6 transition-all duration-300">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-iris-600 rounded-lg flex items-center justify-center shadow-lg shadow-iris-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-stone-900 font-serif">A.U.R.A</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowAuth('signin')}
              className="px-5 py-2.5 rounded-full text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-all"
            >
              Sign In
            </button>
            <button
              onClick={() => setShowAuth('signup')}
              className="px-6 py-2.5 rounded-full text-sm font-medium bg-iris-900/5 hover:bg-iris-900/10 text-iris-900 backdrop-blur-md border border-iris-900/5 transition-all shadow-sm"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/60 border border-stone-200/60 backdrop-blur-md shadow-sm animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-iris-500 animate-pulse"></span>
            <span className="text-xs font-bold tracking-widest text-stone-500 uppercase">System Online</span>
          </div>

          {/* Headline */}
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-stone-900 leading-[0.95] animate-slide-up font-serif">
            Not just smart. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-iris-600 to-iris-400 italic pr-2">Alive.</span>
          </h1>

          {/* Subtext */}
          <p className="text-xl md:text-2xl text-stone-500 max-w-2xl mx-auto leading-relaxed font-light animate-slide-up" style={{ animationDelay: '0.1s' }}>
            An AI that feels less like a machine and more like a companion. 
            Warm, responsive, and designed to help you thrive.
          </p>

          {/* Glassy Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <button
              onClick={() => setShowAuth('signup')}
              className="group relative px-8 py-4 rounded-2xl bg-iris-600/90 text-white font-medium text-lg shadow-xl shadow-iris-500/20 hover:shadow-2xl hover:bg-iris-600 hover:-translate-y-0.5 transition-all duration-300 backdrop-blur-md overflow-hidden"
            >
              <span className="relative flex items-center gap-2">
                Start your Journey <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            
            <button
              onClick={() => setShowAuth('signin')}
              className="px-8 py-4 rounded-2xl bg-white/40 border border-white/60 text-stone-700 font-medium text-lg shadow-lg shadow-stone-200/20 hover:bg-white/60 hover:border-white hover:-translate-y-0.5 transition-all duration-300 backdrop-blur-md"
            >
              Resume Session
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="max-w-6xl mx-auto mt-32 grid md:grid-cols-3 gap-6">
          <FeatureCard 
            icon={<Brain className="w-6 h-6" />}
            title="Deep Reasoning"
            desc="Understands context and nuance in your documents like a human."
          />
          <FeatureCard 
            icon={<Zap className="w-6 h-6" />}
            title="Agent Mode"
            desc="Connects to FasterBook to book meals and movies instantly."
          />
          <FeatureCard 
            icon={<Globe className="w-6 h-6" />}
            title="Always Connected"
            desc="A unified interface for your digital life and services."
          />
        </div>
      </main>

      <footer className="py-8 text-center text-stone-400 text-sm relative z-10">
        <p>© 2025 A.U.R.A. System • Hyderabad</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="p-8 rounded-3xl bg-white/40 border border-white/60 shadow-sm hover:shadow-md hover:bg-white/60 transition-all duration-300 backdrop-blur-sm group">
      <div className="w-12 h-12 rounded-2xl bg-white border border-stone-100 flex items-center justify-center text-iris-600 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-stone-800 mb-3 font-serif">{title}</h3>
      <p className="text-stone-500 leading-relaxed">
        {desc}
      </p>
    </div>
  );
}
