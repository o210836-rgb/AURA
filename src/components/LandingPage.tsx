import { SignIn, SignUp } from '@clerk/clerk-react';
import { Sparkles, Zap, Brain, Shield, Globe, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState<'signin' | 'signup' | null>(null);

  if (showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <button
            onClick={() => setShowAuth(null)}
            className="mb-4 text-sm text-gray-600 hover:text-gray-800 flex items-center space-x-1"
          >
            <span>←</span>
            <span>Back to home</span>
          </button>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {showAuth === 'signin' ? (
              <SignIn
                appearance={{
                  elements: {
                    rootBox: 'w-full',
                    card: 'shadow-none',
                    headerTitle: 'text-2xl font-bold text-gray-800',
                    headerSubtitle: 'text-gray-600',
                    socialButtonsBlockButton: 'border-2 border-gray-200 hover:border-green-500 transition-all',
                    formButtonPrimary: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all',
                    footerActionLink: 'text-green-600 hover:text-green-700',
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
                    card: 'shadow-none',
                    headerTitle: 'text-2xl font-bold text-gray-800',
                    headerSubtitle: 'text-gray-600',
                    socialButtonsBlockButton: 'border-2 border-gray-200 hover:border-green-500 transition-all',
                    formButtonPrimary: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all',
                    footerActionLink: 'text-green-600 hover:text-green-700',
                  }
                }}
                routing="hash"
                signInUrl="#/signin"
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative">
        <nav className="px-6 py-6 md:px-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                A.U.R.A
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAuth('signin')}
                className="px-6 py-2.5 text-gray-700 hover:text-green-600 transition-colors font-medium"
              >
                Sign In
              </button>
              <button
                onClick={() => setShowAuth('signup')}
                className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl font-medium"
              >
                Get Started
              </button>
            </div>
          </div>
        </nav>

        <main className="px-6 py-20 md:px-12 md:py-32">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-8 mb-20">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-100 rounded-full text-green-700 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                <span>Your Universal Reasoning Agent</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight">
                Meet <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">A.U.R.A</span>
                <br />
                <span className="text-3xl md:text-5xl text-gray-600">Your Intelligent Assistant</span>
              </h1>

              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Powered by advanced AI, A.U.R.A helps you analyze documents, book services,
                generate images, and solve complex problems with natural conversation.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 pt-8">
                <button
                  onClick={() => setShowAuth('signup')}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-xl hover:shadow-2xl font-semibold text-lg flex items-center justify-center space-x-2"
                >
                  <span>Start for Free</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowAuth('signin')}
                  className="w-full sm:w-auto px-8 py-4 bg-white text-gray-800 rounded-xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl font-semibold text-lg border-2 border-gray-200"
                >
                  Sign In
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-20">
              <FeatureCard
                icon={<Brain className="w-8 h-8" />}
                title="Intelligent Analysis"
                description="Upload documents and get instant insights with advanced AI-powered analysis"
                gradient="from-blue-500 to-cyan-500"
              />
              <FeatureCard
                icon={<Zap className="w-8 h-8" />}
                title="Smart Booking"
                description="Book food, tickets, hotels, and flights through natural conversation"
                gradient="from-green-500 to-emerald-500"
              />
              <FeatureCard
                icon={<Sparkles className="w-8 h-8" />}
                title="Image Generation"
                description="Create stunning images from text descriptions powered by AI"
                gradient="from-purple-500 to-pink-500"
              />
              <FeatureCard
                icon={<Globe className="w-8 h-8" />}
                title="Multi-Service Integration"
                description="Access multiple services and APIs through a single interface"
                gradient="from-orange-500 to-red-500"
              />
              <FeatureCard
                icon={<Shield className="w-8 h-8" />}
                title="Secure & Private"
                description="Enterprise-grade security with Clerk authentication"
                gradient="from-indigo-500 to-purple-500"
              />
              <FeatureCard
                icon={<Zap className="w-8 h-8" />}
                title="Lightning Fast"
                description="Get instant responses powered by cutting-edge AI technology"
                gradient="from-yellow-500 to-orange-500"
              />
            </div>
          </div>
        </main>

        <footer className="px-6 py-12 md:px-12 border-t border-gray-200">
          <div className="max-w-6xl mx-auto text-center text-gray-600">
            <p className="text-sm">
              Developed by CSE Undergrads: Golla Santhosh Kumar, Vallepu Vijaya Lakshmi,
              Nuthangi Chaitanya Karthik, Karnam Hemanth Kumar, Shaik Veligandla Yasmin, Shaik Parveen
            </p>
            <p className="text-xs mt-4 text-gray-500">
              © 2025 A.U.R.A. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}

function FeatureCard({ icon, title, description, gradient }: FeatureCardProps) {
  return (
    <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-green-200">
      <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}
