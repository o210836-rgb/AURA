// src/App.tsx

import React, { useState, useEffect } from 'react';
import { MessageSquare, Mic, MicOff, Waves, Leaf, Settings, History, FileText, Zap, CheckCircle2, Clock, Play, Upload, Paperclip, LogIn, User, Network, ShoppingBag, ChevronDown, Brain } from 'lucide-react';
// --- NEW: Import the custom error ---
import { GeminiService, MissingDetailsError } from './services/gemini';
// --- END NEW ---
import { FileUpload } from './components/FileUpload';
import { ImageDisplay } from './components/ImageDisplay';
import { OrderDisplay } from './components/OrderDisplay';
import { ExtractedFile, extractTextFromFile } from './utils/fileExtractor';
import { FoodBookingResult } from './services/foodBooking';
import { TicketBookingResult } from './services/ticketBooking';
import { FoodBookingResponse, MovieBookingResponse, BookingsResponse, AvailableItemsResponse } from './services/fasterbook';
import { useUser, useClerk, SignInButton, UserButton } from '@clerk/clerk-react';
import { clerkAuthService, ClerkUser } from './services/clerkAuth';
import TaskCenter from './components/TaskCenter';
import Markdown from './utils/markdown';
import FilesView from './components/FilesView';
import MemoryLogs from './components/MemoryLogs';
import LandingPage from './components/LandingPage';
import ExternalServices from './components/ExternalServices';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  imagePrompt?: string;
  orderType?: 'food' | 'ticket' | 'fasterbook_food' | 'fasterbook_movie' | 'fasterbook_bookings' | 'fasterbook_menu';
  orderData?: FoodBookingResult | TicketBookingResult | FoodBookingResponse | MovieBookingResponse | BookingsResponse | AvailableItemsResponse;
}

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed';
  description: string;
  timestamp: Date;
}

type AppMode = 'aura' | 'fasterbook';

// --- NEW: Define the shape of our pending action state ---
interface PendingAction {
  originalMessage: string;
  action: string;
}
// --- END NEW ---

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m A.U.R.A, your Universal Reasoning Agent. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Research sustainable energy', status: 'completed', description: 'Analysis of renewable tech', timestamp: new Date(Date.now() - 3600000) },
    { id: '2', title: 'Schedule team meeting', status: 'processing', description: 'Coordinating calendars', timestamp: new Date(Date.now() - 1800000) },
    { id: '3', title: 'Analyze market trends', status: 'pending', description: 'Deep dive into Q4 metrics', timestamp: new Date() }
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
  
  const [currentMode, setCurrentMode] = useState<AppMode>('aura');
  const [showModeDropdown, setShowModeDropdown] = useState(false);

  // --- NEW: State for conversational context ---
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  // --- END NEW ---
  
  const [geminiService] = useState(() => new GeminiService()); 

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

  const handleModeChange = (newMode: AppMode) => {
    if (newMode === currentMode) {
      setShowModeDropdown(false);
      return;
    }

    setCurrentMode(newMode);
    setShowModeDropdown(false);
    // --- NEW: Clear pending action on mode switch ---
    setPendingAction(null);
    // --- END NEW ---

    const modeName = newMode === 'aura' ? 'General A.U.R.A Mode' : 'FasterBook Agent Mode';
    const systemMessage: Message = {
      id: Date.now().toString(),
      type: 'assistant',
      content: `Switched to *${modeName}*.`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, systemMessage]);
  };

  const handleFileUploaded = (file: ExtractedFile) => {
    geminiService.addUploadedFile(file);
    setShowFileUpload(false);
    const systemMessage: Message = {
      id: Date.now().toString(),
      type: 'assistant',
      content: `I've successfully processed "${file.name}". I can now reference its content.`,
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
      event.target.value = '';
    }
  };

  // --- MODIFIED: This function is now context-aware ---
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const messageContent = input;
    const newMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageContent,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsTyping(true);

    let messageToSend = messageContent;
    let actionToExecute = '';
    let isFollowUp = false;

    // --- NEW: Check if this is an answer to a pending question ---
    if (pendingAction && currentMode === 'fasterbook') {
      messageToSend = pendingAction.originalMessage + " " + messageContent; // e.g., "book 2 biryani in ongole"
      actionToExecute = pendingAction.action;
      isFollowUp = true;
      setPendingAction(null); // Clear the pending action
      console.log("Handling follow-up message. Combined:", messageToSend);
    }
    // --- END NEW ---

    try {
      let aiResponse: string;

      if (isFollowUp) {
        aiResponse = actionToExecute; // We already know the action
      } else {
        // This is a new request
        const isFasterBook = currentMode === 'fasterbook';
        aiResponse = await geminiService.sendMessage(messageToSend, isFasterBook);
      }

      // Handle Image Generation
      if (aiResponse.startsWith('IMAGE_GENERATION:')) {
        setIsGeneratingImage(true);
        try {
          const imagePrompt = aiResponse.replace('IMAGE_GENERATION:', '');
          const imageUrl = await geminiService.generateImage(imagePrompt);
          const imageResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: `I've generated an image: "${imagePrompt}"`,
            timestamp: new Date(),
            imageUrl,
            imagePrompt
          };
          setMessages(prev => [...prev, imageResponse]);
        } catch (error) {
          const errorResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: error instanceof Error ? error.message : 'Failed to generate image.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorResponse]);
        } finally {
          setIsGeneratingImage(false);
        }
      }
      
      // Handle Agentic Actions (FasterBook, Legacy, etc.)
      else if (aiResponse.endsWith('_REQUEST')) {
        console.log(`Executing agentic action: ${aiResponse}`);
        try {
          // We use messageToSend (which might be the combined message)
          const agenticAction = await geminiService.executeAgenticAction(messageToSend, aiResponse);
          
          if (agenticAction) {
            let orderMessage: Message;
            // Handle all FasterBook responses
            if (agenticAction.type.startsWith('fasterbook_')) {
              let content = 'I\'ve processed your FasterBook request:';
              if (agenticAction.type === 'fasterbook_menu') content = 'Here\'s the FasterBook menu:';
              if (agenticAction.type === 'fasterbook_bookings') content = 'Here are your FasterBook bookings:';
              
              orderMessage = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: content,
                timestamp: new Date(),
                orderType: agenticAction.type as any,
                orderData: agenticAction.result
              };
            } 
            // Handle legacy responses
            else {
              orderMessage = {
                id: (Date.now() + 1).toString(),
                type: 'assistant',
                content: `I've processed your legacy ${agenticAction.type.split('_')[0]} booking:`,
                timestamp: new Date(),
                orderType: agenticAction.type as any,
                orderData: agenticAction.result
              };
            }
            setMessages(prev => [...prev, orderMessage]);
          }
        } catch (error) {
          console.error('Error in executeAgenticAction:', error);
          let errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';

          // --- NEW: Check for MissingDetailsError to set pending state ---
          if (error instanceof MissingDetailsError) {
            setPendingAction({
              originalMessage: messageToSend, // Save the original (or combined) message
              action: aiResponse
            });
            console.log("Set pending action for missing details.");
          } else {
            // It's a real error, clear any pending action
            setPendingAction(null);
          }
          // --- END NEW ---

          const errorResponse: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: errorMessage, // This will be the question (e.g., "Where to deliver?")
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorResponse]);
        } finally {
          setIsTyping(false);
        }
      } 
      
      // Handle General LLM Response
      else {
        // --- NEW: Clear pending action on general chat response ---
        setPendingAction(null);
        // --- END NEW ---
        const response: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: aiResponse,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, response]);
      }
      
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      // This is the outer catch block
      setPendingAction(null); // Clear pending action on any major failure
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: error instanceof Error ? error.message : 'I apologize, but I encountered a connection issue.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
      setIsGeneratingImage(false);
    }
  };

  const toggleVoice = () => {
    setIsListening(!isListening);
    // Voice logic would go here
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

  // --- MAIN JSX RETURN ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-white to-beige-50 relative overflow-hidden">
      {/* ... (Particles background) ... */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-sage-200/20 animate-float"
            style={{
              left: `${particle.x}%`, top: `${particle.y}%`,
              width: `${particle.size}px`, height: `${particle.size}px`,
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
            <div className={`flex-1 overflow-y-auto p-6 space-y-6 ${showFileUpload ? 'h-[calc(1ch-20rem)]' : ''}`}>
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
                        <ImageDisplay imageUrl={message.imageUrl} prompt={message.imagePrompt} />
                      </div>
                    )}
                    {message.orderType && message.orderData && (
                      <div className="mt-4">
                        <OrderDisplay orderType={message.orderType} orderData={message.orderData} />
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
              {uploadError && (
                <div className="mb-4 flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <span className="text-sm">{uploadError}</span>
                  <button onClick={() => setUploadError(null)} className="ml-auto text-red-500 hover:text-red-700">×</button>
                </div>
              )}

              {/* Mode Selector Dropdown */}
              <div className="relative mb-3 flex justify-center">
                <button
                  onClick={() => setShowModeDropdown(!showModeDropdown)}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-lg border border-sage-200/50 hover:bg-sage-50 transition-all text-sage-800 font-medium"
                >
                  {currentMode === 'aura' ? (
                    <Brain className="w-5 h-5 text-sage-600" />
                  ) : (
                    <ShoppingBag className="w-5 h-5 text-orange-600" />
                  )}
                  <span>
                    {currentMode === 'aura' ? 'A.U.R.A' : 'FasterBook Agent'}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showModeDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showModeDropdown && (
                  <div className="absolute bottom-full mb-2 w-72 bg-white rounded-xl shadow-2xl border border-sage-200/50 p-2 z-10 animate-bloom">
                    <button
                      onClick={() => handleModeChange('aura')}
                      className={`w-full flex items-start space-x-3 p-3 rounded-lg hover:bg-sage-50 ${currentMode === 'aura' ? 'bg-sage-100' : ''}`}
                    >
                      <Leaf className="w-5 h-5 text-sage-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sage-800 text-left">A.U.R.A</p>
                        <p className="text-sm text-sage-600 text-left">General chat, file analysis, and image generation.</p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleModeChange('fasterbook')}
                      className={`w-full flex items-start space-x-3 p-3 rounded-lg hover:bg-orange-50 ${currentMode === 'fasterbook' ? 'bg-orange-100' : ''}`}
                    >
                      <ShoppingBag className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-orange-800 text-left">FasterBook Agent</p>
                        <p className="text-sm text-orange-600 text-left">Dedicated agent for booking food and movies.</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
              
              {/* Main Input Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-end space-y-3 sm:space-y-0 sm:space-x-4">
                
                <div className="flex-1 relative">
                  {/* --- NEW: Show pending action hint --- */}
                  {pendingAction && (
                    <div className="absolute -top-8 left-2 text-xs text-orange-700 bg-orange-100/80 px-2 py-1 rounded-md animate-pulse">
                      Waiting for details... (e.g., address, seats)
                    </div>
                  )}
                  {/* --- END NEW --- */}
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    // --- MODIFIED: Placeholder updates when waiting for answer ---
                    placeholder={pendingAction
                      ? 'Please provide the missing details...'
                      : currentMode === 'fasterbook'
                        ? "Agent Mode: Order food or book movies..."
                        : "Chat with A.U.R.A..."}
                    // --- END MODIFICATION ---
                    className={`w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/60 backdrop-blur-sm rounded-2xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 text-sage-800 placeholder-sage-500 text-sm sm:text-base resize-none min-h-[56px] max-h-32 ${
                      currentMode === 'fasterbook'
                        ? 'border-2 border-orange-400 focus:ring-orange-500'
                        : 'border border-sage-200/50 focus:ring-sage-300'
                    }`}
                    rows={1}
                  />

                  {geminiService.getUploadedFiles().length > 0 && currentMode === 'aura' && !pendingAction && (
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
                  disabled={isUploadingFile || currentMode === 'fasterbook'}
                />

                <div className="flex items-center space-x-2 sm:space-x-3">
                  <button
                    onClick={() => document.getElementById('quick-file-upload')?.click()}
                    disabled={isUploadingFile || currentMode === 'fasterbook'}
                    className="p-3 sm:p-4 rounded-xl bg-sage-100 text-sage-600 hover:bg-sage-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    title={currentMode === 'fasterbook' ? 'File upload disabled in Agent Mode' : 'Upload file'}
                  >
                    {isUploadingFile ? <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-sage-400 border-t-transparent rounded-full animate-spin" /> : <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                  <button
                    onClick={toggleVoice}
                    className={`p-3 sm:p-4 rounded-xl transition-all duration-300 ${isListening ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-sage-100 text-sage-600 hover:bg-sage-200'}`}
                  >
                    {isListening ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
                    {isListening && <Waves className="w-3 h-3 sm:w-4 sm:h-4 absolute animate-ping" />}
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isTyping || isGeneratingImage}
                    className={`px-4 sm:px-6 py-3 sm:py-4 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm hover:shadow-md text-sm sm:text-base font-medium ${
                      currentMode === 'fasterbook' || pendingAction
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                        : 'bg-gradient-to-r from-sage-500 to-sage-600 hover:from-sage-600 hover:to-sage-700'
                    }`}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other Views */}
        {currentView === 'tasks' && <TaskCenter />}
        {currentView === 'files' && <FilesView files={geminiService.getUploadedFiles()} onRemoveFile={handleRemoveFile} />}
        {currentView === 'memory' && <MemoryLogs messages={messages} />}
        {currentView === 'services' && <ExternalServices />}
      </div>

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
