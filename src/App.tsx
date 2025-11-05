import React, { useState, useEffect } from 'react';
import { MessageSquare, Mic, MicOff, Waves, Leaf, Settings, History, FileText, Zap, CheckCircle2, Clock, Play, Upload, Paperclip, LogIn, LogOut, User, Network, ShoppingBag } from 'lucide-react';
import { GeminiService } from './services/gemini';
import { FileUpload } from './components/FileUpload';
import { ImageDisplay } from './components/ImageDisplay';
import { OrderDisplay } from './components/OrderDisplay';
import { ExtractedFile, extractTextFromFile } from './utils/fileExtractor';
import { FoodBookingResult } from './services/foodBooking';
import { TicketBookingResult } from './services/ticketBooking';
import { FoodBookingResponse, MovieBookingResponse, BookingsResponse, AvailableItemsResponse } from './services/fasterbook';
import { useUser, useClerk, SignInButton, UserButton } from '@clerk/clerk-react';
import { clerkAuthService, ClerkUser } from './services/clerkAuth';
import { tasksService, TaskType } from './services/tasks';
import { mockRestaurantApi, mockHotelApi, mockFlightApi, mockRideApi } from './services/mockApis';
import TaskCenter from './components/TaskCenter';
import Markdown from './utils/markdown';
import FilesView from './components/FilesView';
import MemoryLogs from './components/MemoryLogs';
import { handleBookingWithTask } from './utils/bookingHelper';
import LandingPage from './components/LandingPage';
import ExternalServices from './components/ExternalServices';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  imagePrompt?: string;
  orderType?: 'food' | 'ticket' | 'fasterbook_food' | 'fasterbook_movie' | 'fasterbook_bookings' | 'fasterbook_menu' | 'restaurant' | 'hotel' | 'flight' | 'ride';
  orderData?: FoodBookingResult | TicketBookingResult | FoodBookingResponse | MovieBookingResponse | BookingsResponse | AvailableItemsResponse;
}

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed';
  description: string;
  timestamp: Date;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m A.U.R.A, your Universal Reasoning Agent. I can help you think through complex problems, manage tasks, and understand the world around you. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Research sustainable energy solutions',
      status: 'completed',
      description: 'Comprehensive analysis of renewable energy technologies',
      timestamp: new Date(Date.now() - 3600000)
    },
    {
      id: '2',
      title: 'Schedule team meeting',
      status: 'processing',
      description: 'Coordinating calendars and sending invitations',
      timestamp: new Date(Date.now() - 1800000)
    },
    {
      id: '3',
      title: 'Analyze market trends',
      status: 'pending',
      description: 'Deep dive into Q4 performance metrics',
      timestamp: new Date()
    }
  ]);

  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'chat' | 'tasks' | 'files' | 'memory' | 'services'>('chat');
  const [isTyping, setIsTyping] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [currentUser, setCurrentUser] = useState<ClerkUser | null>(null);
  const [fasterbookAgentMode, setFasterbookAgentMode] = useState(false);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading A.U.R.A...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <LandingPage />;
  }

  // Initialize Gemini service
  const [geminiService] = useState(() => new GeminiService());

  // Update agent mode in service when toggle changes
  useEffect(() => {
    geminiService.setFasterbookAgentMode(fasterbookAgentMode);
  }, [fasterbookAgentMode, geminiService]);

  // Floating particles animation
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, size: number, speed: number}>>([]);

  useEffect(() => {
    const newParticles = Array.from({length: 12}, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      speed: Math.random() * 2 + 1
    }));
    setParticles(newParticles);

    const loadUser = async () => {
      if (isLoaded && user) {
        const clerkUser = await clerkAuthService.getCurrentUser(user);
        setCurrentUser(clerkUser);
      } else {
        setCurrentUser(null);
      }
    };
    loadUser();
  }, [user, isLoaded]);

  const handleFileUploaded = (file: ExtractedFile) => {
    geminiService.addUploadedFile(file);
    setShowFileUpload(false);
    
    // Add a system message about the uploaded file
    const systemMessage: Message = {
      id: Date.now().toString(),
      type: 'assistant',
      content: `I've successfully processed "${file.name}" and can now reference its content in our conversation. Feel free to ask me questions about the document or request analysis of its contents.`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  const handleRemoveFile = (fileName: string) => {
    geminiService.removeUploadedFile(fileName);
  };

  const handleQuickFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      setUploadError('File size must be less than 100MB.');
      return;
    }

    setIsUploadingFile(true);
    setUploadError(null);

    try {
      const extractedFile = await extractTextFromFile(file);
      handleFileUploaded(extractedFile);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to process file');
    } finally {
      setIsUploadingFile(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const aiResponse = await geminiService.sendMessage(input);

      if (aiResponse.startsWith('IMAGE_GENERATION:')) {
        const imagePrompt = aiResponse.replace('IMAGE_GENERATION:', '');
        setIsGeneratingImage(true);

        try {
          const imageUrl = await geminiService.generateImage(imagePrompt);

          const imageResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: `I've generated an image based on your request: "${imagePrompt}"`,
            timestamp: new Date(),
            imageUrl,
            imagePrompt
          };
          setMessages(prev => [...prev, imageResponse]);
        } catch (error) {
          const errorResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: 'I apologize, but I encountered an issue generating the image. Please try again with a different prompt.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorResponse]);
        } finally {
          setIsGeneratingImage(false);
        }
      } else if (aiResponse === 'FOOD_BOOKING_REQUEST') {
        setIsTyping(true);

        try {
          const agenticAction = await geminiService.executeAgenticAction(input);

          if (agenticAction && agenticAction.type === 'food_booking') {
            const orderResponse: Message = {
              id: (Date.now() + 1).toString(),
              type: 'assistant',
              content: 'I\'ve processed your food order! Here are the details:',
              timestamp: new Date(),
              orderType: 'food',
              orderData: agenticAction.result
            };
            setMessages(prev => [...prev, orderResponse]);
          }
        } catch (error) {
          const errorResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: 'I apologize, but I encountered an issue processing your food order. Please try again.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorResponse]);
        } finally {
          setIsTyping(false);
        }
      } else if (aiResponse === 'TICKET_BOOKING_REQUEST') {
        setIsTyping(true);

        try {
          const agenticAction = await geminiService.executeAgenticAction(input);

          if (agenticAction && agenticAction.type === 'ticket_booking') {
            const orderResponse: Message = {
              id: (Date.now() + 1).toString(),
              type: 'assistant',
              content: 'I\'ve booked your tickets! Here are the details:',
              timestamp: new Date(),
              orderType: 'ticket',
              orderData: agenticAction.result
            };
            setMessages(prev => [...prev, orderResponse]);
          }
        } catch (error) {
          const errorResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: 'I apologize, but I encountered an issue booking your tickets. Please try again.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorResponse]);
        } finally {
          setIsTyping(false);
        }
      } else if (aiResponse === 'FASTERBOOK_FOOD_REQUEST') {
        setIsTyping(true);

        try {
          const agenticAction = await geminiService.executeAgenticAction(input);

          if (agenticAction && agenticAction.type === 'fasterbook_food') {
            const orderResponse: Message = {
              id: (Date.now() + 1).toString(),
              type: 'assistant',
              content: 'I\'ve processed your FasterBook food order! Here are the details:',
              timestamp: new Date(),
              orderType: 'fasterbook_food',
              orderData: agenticAction.result
            };
            setMessages(prev => [...prev, orderResponse]);
          }
        } catch (error) {
          const errorResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: 'I apologize, but I encountered an issue with your FasterBook food order. Please try again.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorResponse]);
        } finally {
          setIsTyping(false);
        }
      } else if (aiResponse === 'FASTERBOOK_MOVIE_REQUEST') {
        setIsTyping(true);

        try {
          const agenticAction = await geminiService.executeAgenticAction(input);

          if (agenticAction && agenticAction.type === 'fasterbook_movie') {
            const orderResponse: Message = {
              id: (Date.now() + 1).toString(),
              type: 'assistant',
              content: 'I\'ve processed your FasterBook movie booking! Here are the details:',
              timestamp: new Date(),
              orderType: 'fasterbook_movie',
              orderData: agenticAction.result
            };
            setMessages(prev => [...prev, orderResponse]);
          }
        } catch (error) {
          const errorResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: 'I apologize, but I encountered an issue with your FasterBook movie booking. Please try again.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorResponse]);
        } finally {
          setIsTyping(false);
        }
      } else if (aiResponse === 'FASTERBOOK_BOOKINGS_REQUEST') {
        setIsTyping(true);

        try {
          const agenticAction = await geminiService.executeAgenticAction(input);

          if (agenticAction && agenticAction.type === 'fasterbook_bookings') {
            const orderResponse: Message = {
              id: (Date.now() + 1).toString(),
              type: 'assistant',
              content: 'Here are your FasterBook bookings:',
              timestamp: new Date(),
              orderType: 'fasterbook_bookings',
              orderData: agenticAction.result
            };
            setMessages(prev => [...prev, orderResponse]);
          }
        } catch (error) {
          const errorResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: 'I apologize, but I encountered an issue retrieving your FasterBook bookings. Please try again.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorResponse]);
        } finally {
          setIsTyping(false);
        }
      } else if (aiResponse === 'RESTAURANT_ORDER_REQUEST') {
        setIsTyping(true);
        try {
          const agenticAction = await geminiService.executeAgenticAction(input);
          if (agenticAction) {
            const result = await handleBookingWithTask(agenticAction, input);
            if (result) {
              const orderResponse: Message = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: result.message,
                timestamp: new Date(),
                orderType: result.orderType as any,
                orderData: result.orderData
              };
              setMessages(prev => [...prev, orderResponse]);
            }
          }
        } catch (error) {
          const errorResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: 'I apologize, but I encountered an issue processing your restaurant order. Please try again.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorResponse]);
        } finally {
          setIsTyping(false);
        }
      } else if (aiResponse === 'HOTEL_BOOKING_REQUEST') {
        setIsTyping(true);
        try {
          const agenticAction = await geminiService.executeAgenticAction(input);
          if (agenticAction) {
            const result = await handleBookingWithTask(agenticAction, input);
            if (result) {
              const orderResponse: Message = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: result.message,
                timestamp: new Date(),
                orderType: result.orderType as any,
                orderData: result.orderData
              };
              setMessages(prev => [...prev, orderResponse]);
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error && error.message.startsWith('MISSING_DETAILS:')
            ? error.message.replace('MISSING_DETAILS: ', '')
            : 'I apologize, but I encountered an issue booking your hotel. Please try again.';

          const errorResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: errorMessage,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorResponse]);
        } finally {
          setIsTyping(false);
        }
      } else if (aiResponse === 'FLIGHT_BOOKING_REQUEST') {
        setIsTyping(true);
        try {
          const agenticAction = await geminiService.executeAgenticAction(input);
          if (agenticAction) {
            const result = await handleBookingWithTask(agenticAction, input);
            if (result) {
              const orderResponse: Message = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: result.message,
                timestamp: new Date(),
                orderType: result.orderType as any,
                orderData: result.orderData
              };
              setMessages(prev => [...prev, orderResponse]);
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error && error.message.startsWith('MISSING_DETAILS:')
            ? error.message.replace('MISSING_DETAILS: ', '')
            : 'I apologize, but I encountered an issue booking your flight. Please try again.';

          const errorResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: errorMessage,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorResponse]);
        } finally {
          setIsTyping(false);
        }
      } else if (aiResponse === 'RIDE_BOOKING_REQUEST') {
        setIsTyping(true);
        try {
          const agenticAction = await geminiService.executeAgenticAction(input);
          if (agenticAction) {
            const result = await handleBookingWithTask(agenticAction, input);
            if (result) {
              const orderResponse: Message = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: result.message,
                timestamp: new Date(),
                orderType: result.orderType as any,
                orderData: result.orderData
              };
              setMessages(prev => [...prev, orderResponse]);
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error && error.message.startsWith('MISSING_DETAILS:')
            ? error.message.replace('MISSING_DETAILS: ', '')
            : 'I apologize, but I encountered an issue booking your ride. Please try again.';

          const errorResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: errorMessage,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorResponse]);
        } finally {
          setIsTyping(false);
        }
      } else if (aiResponse === 'FASTERBOOK_MENU_REQUEST') {
        setIsTyping(true);

        try {
          const agenticAction = await geminiService.executeAgenticAction(input);

          if (agenticAction && agenticAction.type === 'fasterbook_menu') {
            const orderResponse: Message = {
              id: (Date.now() + 1).toString(),
              type: 'assistant',
              content: 'Here\'s the FasterBook menu with all available items:',
              timestamp: new Date(),
              orderType: 'fasterbook_menu',
              orderData: agenticAction.result
            };
            setMessages(prev => [...prev, orderResponse]);
          }
        } catch (error) {
          const errorResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: 'I apologize, but I encountered an issue retrieving the FasterBook menu. Please try again.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorResponse]);
        } finally {
          setIsTyping(false);
        }
      } else {
        const response: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: aiResponse,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, response]);
      }
      
      // Generate task suggestions based on the conversation
      const suggestions = await geminiService.generateTaskSuggestions(input);
      if (suggestions.length > 0) {
        const newTasks = suggestions.map((suggestion, index) => ({
          id: `task-${Date.now()}-${index}`,
          title: suggestion,
          status: 'pending' as const,
          description: `Generated from your conversation with A.U.R.A`,
          timestamp: new Date()
        }));
        setTasks(prev => [...newTasks, ...prev]);
      }
    } catch (error) {
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered a brief connection issue. Please try your message again, and I\'ll be ready to assist you.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleVoice = () => {
    setIsListening(!isListening);
  };

  const getTaskIcon = (status: string) => {
    switch(status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'processing': return <Play className="w-4 h-4 text-amber-500" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-emerald-50 border-emerald-200';
      case 'processing': return 'bg-amber-50 border-amber-200';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-beige-50 relative overflow-hidden">
      {/* Floating Particles Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-sage-200/20 animate-float"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${particle.id * 0.5}s`,
              animationDuration: `${particle.speed + 3}s`
            }}
          />
        ))}
      </div>

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-80 bg-white/40 backdrop-blur-md border-r border-sage-200/50 transform transition-transform duration-500 ease-out z-40 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-sage-200/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sage-400 to-sage-600 rounded-full flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-sage-800">AURA</h2>
              <p className="text-sm text-sage-600">Universal Reasoning Agent</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <button 
            onClick={() => setCurrentView('chat')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${currentView === 'chat' ? 'bg-sage-100 text-sage-800' : 'text-sage-600 hover:bg-sage-50'}`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>Conversations</span>
          </button>
          
          <button
            onClick={() => setCurrentView('tasks')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${currentView === 'tasks' ? 'bg-sage-100 text-sage-800' : 'text-sage-600 hover:bg-sage-50'}`}
          >
            <Zap className="w-5 h-5" />
            <span>Task Center</span>
          </button>

          <button
            onClick={() => setShowFileUpload(!showFileUpload)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${showFileUpload ? 'bg-sage-100 text-sage-800' : 'text-sage-600 hover:bg-sage-50'}`}
          >
            <Upload className="w-5 h-5" />
            <span>Upload Files</span>
          </button>

          <button
            onClick={() => setCurrentView('memory')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${currentView === 'memory' ? 'bg-sage-100 text-sage-800' : 'text-sage-600 hover:bg-sage-50'}`}
          >
            <History className="w-5 h-5" />
            <span>Memory Logs</span>
          </button>

          <button
            onClick={() => setCurrentView('files')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${currentView === 'files' ? 'bg-sage-100 text-sage-800' : 'text-sage-600 hover:bg-sage-50'}`}
          >
            <FileText className="w-5 h-5" />
            <span>Files</span>
          </button>

          <button
            onClick={() => setCurrentView('services')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${currentView === 'services' ? 'bg-sage-100 text-sage-800' : 'text-sage-600 hover:bg-sage-50'}`}
          >
            <Network className="w-5 h-5" />
            <span>External Services</span>
          </button>

          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sage-600 hover:bg-sage-50 transition-all duration-300">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-500 ease-out ${sidebarOpen ? 'ml-80' : 'ml-0'}`}>
        {/* Header */}
        <header className="bg-white/30 backdrop-blur-md border-b border-sage-200/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg bg-sage-100/50 hover:bg-sage-200/50 transition-colors duration-200"
              >
                <div className="w-5 h-5 flex flex-col justify-between">
                  <div className="w-full h-0.5 bg-sage-600 rounded"></div>
                  <div className="w-full h-0.5 bg-sage-600 rounded"></div>
                  <div className="w-full h-0.5 bg-sage-600 rounded"></div>
                </div>
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-sage-400 to-sage-600 rounded-full flex items-center justify-center animate-pulse">
                  <Leaf className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-xl text-sage-800">A.U.R.A</h1>
                  <p className="text-sm text-sage-600">Ready to assist</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {isLoaded && user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 px-4 py-2 bg-sage-100/50 rounded-full">
                    <User className="w-4 h-4 text-sage-700" />
                    <span className="text-sm text-sage-700">{currentUser?.full_name || currentUser?.email}</span>
                  </div>
                  <div className="clerk-user-button-wrapper">
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox: 'w-10 h-10',
                          userButtonPopoverCard: 'bg-white shadow-2xl border border-sage-200',
                          userButtonPopoverActionButton: 'hover:bg-sage-50',
                        }
                      }}
                    />
                  </div>
                </div>
              ) : isLoaded ? (
                <SignInButton mode="modal">
                  <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl">
                    <LogIn className="w-4 h-4" />
                    <span className="text-sm font-medium">Sign In</span>
                  </button>
                </SignInButton>
              ) : null}
            </div>
          </div>
        </header>

        {/* Chat View */}
        {currentView === 'chat' && (
          <div className="flex flex-col h-[calc(100vh-5rem)]">
            {/* File Upload Panel */}
            {showFileUpload && (
              <div className="p-6 bg-white/20 backdrop-blur-sm border-b border-sage-200/30 animate-slideIn">
                <FileUpload
                  onFileUploaded={handleFileUploaded}
                  uploadedFiles={geminiService.getUploadedFiles()}
                  onRemoveFile={handleRemoveFile}
                />
              </div>
            )}
            
            {/* Messages */}
            <div className={`flex-1 overflow-y-auto p-6 space-y-6 ${showFileUpload ? 'h-[calc(100vh-20rem)]' : ''}`}>
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-slideIn`}>
                  <div className={`max-w-2xl ${message.type === 'user' 
                    ? 'bg-sage-500 text-white rounded-3xl rounded-br-lg' 
                    : 'bg-white/60 backdrop-blur-sm text-sage-800 rounded-3xl rounded-bl-lg border border-sage-200/30'
                  } px-6 py-4 shadow-sm hover:shadow-md transition-all duration-300`}>
                    {message.type === 'assistant' ? (
                      <Markdown content={message.content} />
                    ) : (
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    )}
                    {message.imageUrl && message.imagePrompt && (
                      <div className="mt-4">
                        <ImageDisplay
                          imageUrl={message.imageUrl}
                          prompt={message.imagePrompt}
                        />
                      </div>
                    )}
                    {message.orderType && message.orderData && (
                      <div className="mt-4">
                        <OrderDisplay
                          orderType={message.orderType}
                          orderData={message.orderData}
                        />
                      </div>
                    )}
                    <p className={`text-xs mt-2 ${message.type === 'user' ? 'text-sage-100' : 'text-sage-500'}`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {(isTyping || isGeneratingImage) && (
                <div className="flex justify-start animate-slideIn">
                  <div className="bg-white/60 backdrop-blur-sm rounded-3xl rounded-bl-lg px-6 py-4 border border-sage-200/30">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-sage-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-sage-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-sage-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      {isGeneratingImage && (
                        <span className="text-sm text-sage-600">Generating image...</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white/20 backdrop-blur-sm border-t border-sage-200/30">
              {/* Upload Error */}
              {uploadError && (
                <div className="mb-4 flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <span className="text-sm">{uploadError}</span>
                  <button 
                    onClick={() => setUploadError(null)}
                    className="ml-auto text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              )}
              
              {/* FasterBook Agent Mode Toggle */}
              <div className="mb-4 flex items-center justify-between p-4 bg-white/40 backdrop-blur-sm border border-sage-200/50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <ShoppingBag className={`w-5 h-5 ${fasterbookAgentMode ? 'text-orange-600' : 'text-gray-400'}`} />
                  <div>
                    <p className={`font-semibold text-sm ${fasterbookAgentMode ? 'text-orange-900' : 'text-gray-700'}`}>
                      FasterBook Agent Mode
                    </p>
                    <p className="text-xs text-gray-600">
                      {fasterbookAgentMode
                        ? 'Using FasterBook API exclusively for all bookings'
                        : 'General assistant mode'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setFasterbookAgentMode(!fasterbookAgentMode)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                    fasterbookAgentMode ? 'bg-orange-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ${
                      fasterbookAgentMode ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-end space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="flex-1 relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder={fasterbookAgentMode
                      ? "FasterBook Agent: Order food or book movie tickets (e.g., 'I want biryani' or 'Book a movie')"
                      : "Chat with A.U.R.A, book food/movies via FasterBook, upload documents, or generate images..."}
                    className={`w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/60 backdrop-blur-sm rounded-2xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 text-sage-800 placeholder-sage-500 text-sm sm:text-base resize-none min-h-[56px] max-h-32 ${
                      fasterbookAgentMode
                        ? 'border-2 border-orange-400 focus:ring-orange-500'
                        : 'border border-sage-200/50 focus:ring-sage-300'
                    }`}
                    rows={1}
                  />

                  {geminiService.getUploadedFiles().length > 0 && (
                    <div className="absolute -top-8 left-2 text-xs text-sage-600 bg-sage-100/80 px-2 py-1 rounded-md">
                      📎 {geminiService.getUploadedFiles().length} file(s) attached
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  accept="*"
                  onChange={handleQuickFileUpload}
                  className="hidden"
                  id="quick-file-upload"
                  disabled={isUploadingFile}
                />

                <div className="flex items-center space-x-2 sm:space-x-3">
                  <button
                    onClick={() => document.getElementById('quick-file-upload')?.click()}
                    disabled={isUploadingFile}
                    className="p-3 sm:p-4 rounded-xl bg-sage-100 text-sage-600 hover:bg-sage-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    title="Upload file"
                  >
                    {isUploadingFile ? <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-sage-400 border-t-transparent rounded-full animate-spin" /> : <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>

                  <button
                    onClick={toggleVoice}
                    className={`p-3 sm:p-4 rounded-xl transition-all duration-300 ${isListening
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-sage-100 text-sage-600 hover:bg-sage-200'
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
                    {isListening && <Waves className="w-3 h-3 sm:w-4 sm:h-4 absolute animate-ping" />}
                  </button>

                  <button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isTyping || isGeneratingImage}
                    className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-sage-500 to-sage-600 text-white rounded-xl hover:from-sage-600 hover:to-sage-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm hover:shadow-md text-sm sm:text-base font-medium"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tasks View */}
        {currentView === 'tasks' && (
          <TaskCenter />
        )}

        {/* Files View */}
        {currentView === 'files' && (
          <FilesView
            files={geminiService.getUploadedFiles()}
            onRemoveFile={handleRemoveFile}
          />
        )}

        {/* Memory Logs View */}
        {currentView === 'memory' && (
          <MemoryLogs messages={messages} />
        )}

        {/* External Services View */}
        {currentView === 'services' && (
          <ExternalServices />
        )}

        {/* Old Tasks View (kept for reference) */}
        {currentView === 'tasks_old' && (
          <div className="p-6 space-y-6">
            <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-sage-200/30">
              <h2 className="text-xl font-semibold text-sage-800 mb-4">Active Tasks</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tasks.map((task) => (
                  <div key={task.id} className={`p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 ${getTaskStatusColor(task.status)} cursor-pointer animate-fadeIn`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getTaskIcon(task.status)}
                        <span className="text-sm font-medium capitalize text-slate-700">{task.status}</span>
                      </div>
                      <div className="text-xs text-slate-500">{task.timestamp.toLocaleTimeString()}</div>
                    </div>
                    <h3 className="font-semibold text-slate-800 mb-2">{task.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{task.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-sage-200/30">
              <h3 className="text-lg font-semibold text-sage-800 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="p-4 bg-gradient-to-br from-sage-100 to-sage-200 rounded-xl hover:from-sage-200 hover:to-sage-300 transition-all duration-300 text-sage-800 text-center">
                  <FileText className="w-6 h-6 mx-auto mb-2" />
                  <span className="text-sm">Create Report</span>
                </button>
                <button className="p-4 bg-gradient-to-br from-sage-100 to-sage-200 rounded-xl hover:from-sage-200 hover:to-sage-300 transition-all duration-300 text-sage-800 text-center">
                  <Zap className="w-6 h-6 mx-auto mb-2" />
                  <span className="text-sm">Automate Task</span>
                </button>
                <button className="p-4 bg-gradient-to-br from-sage-100 to-sage-200 rounded-xl hover:from-sage-200 hover:to-sage-300 transition-all duration-300 text-sage-800 text-center">
                  <History className="w-6 h-6 mx-auto mb-2" />
                  <span className="text-sm">Review History</span>
                </button>
                <button className="p-4 bg-gradient-to-br from-sage-100 to-sage-200 rounded-xl hover:from-sage-200 hover:to-sage-300 transition-all duration-300 text-sage-800 text-center">
                  <Settings className="w-6 h-6 mx-auto mb-2" />
                  <span className="text-sm">Configure</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

    </div>
  );
}

export default App;