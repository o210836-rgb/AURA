// src/App.tsx

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Plus, History, FileText, Zap, 
  Settings, Network, ChevronDown, Brain, ShoppingBag, 
  Send, Paperclip, PanelLeftClose, PanelLeft, Trash2, MessageCircle
} from 'lucide-react';
import { GeminiService, MissingDetailsError } from './services/gemini';
import { ImageDisplay } from './components/ImageDisplay';
import { OrderDisplay } from './components/OrderDisplay';
import { ExtractedFile, extractTextFromFile } from './utils/fileExtractor';
import { useUser, useClerk, UserButton } from '@clerk/clerk-react';
import { clerkAuthService, ClerkUser } from './services/clerkAuth';
import TaskCenter from './components/TaskCenter';
import Markdown from './utils/markdown';
import FilesView from './components/FilesView';
import MemoryLogs from './components/MemoryLogs';
import LandingPage from './components/LandingPage';
import ExternalServices from './components/ExternalServices';
import { FileUpload } from './components/FileUpload';

// --- Interfaces ---
interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  imagePrompt?: string;
  orderType?: string;
  orderData?: any;
}

interface ChatSession {
  id: string;
  title: string;
  date: Date;
  messages: Message[];
}

interface PendingAction {
  originalMessage: string;
  action: string;
}

type AppMode = 'aura' | 'fasterbook';
type ViewType = 'chat' | 'tasks' | 'files' | 'memory' | 'services';

function App() {
  // --- State: Auth & Core ---
  const { user, isLoaded, isSignedIn } = useUser();
  const [currentUser, setCurrentUser] = useState<ClerkUser | null>(null);
  const [geminiService] = useState(() => new GeminiService());

  // --- State: UI & Navigation ---
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('chat');
  const [currentMode, setCurrentMode] = useState<AppMode>('aura');
  const [showModeDropdown, setShowModeDropdown] = useState(false);

  // --- State: Chat Data ---
  // Default empty message for a new chat
  const defaultMessage: Message = {
    id: 'init',
    type: 'assistant',
    content: 'Hello! I\'m A.U.R.A. How can I help you today?',
    timestamp: new Date()
  };

  const [messages, setMessages] = useState<Message[]>([defaultMessage]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // --- State: Inputs & Processing ---
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false); // Kept for compatibility

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  useEffect(() => {
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // --- Chat Session Management ---

  const createNewChat = () => {
    // 1. If the current chat has user messages, save it to history
    if (messages.length > 1) { // >1 because of the default greeting
      const newSession: ChatSession = {
        id: currentSessionId || Date.now().toString(),
        title: messages[1].content.slice(0, 30) + (messages[1].content.length > 30 ? '...' : ''), // Use first user message as title
        date: new Date(),
        messages: [...messages]
      };

      setChatSessions(prev => {
        // Update existing if ID matches, else add new
        const exists = prev.findIndex(s => s.id === newSession.id);
        if (exists >= 0) {
          const updated = [...prev];
          updated[exists] = newSession;
          return updated;
        }
        return [newSession, ...prev];
      });
    }

    // 2. Reset workspace
    setMessages([defaultMessage]);
    setCurrentSessionId(null);
    setCurrentView('chat');
    setPendingAction(null);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const loadSession = (session: ChatSession) => {
    // Save current before switching? (Optional, skipping for simplicity)
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setCurrentView('chat');
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const deleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      setMessages([defaultMessage]);
      setCurrentSessionId(null);
    }
  };

  // --- Handlers ---

  const handleModeChange = (newMode: AppMode) => {
    setCurrentMode(newMode);
    setShowModeDropdown(false);
    setPendingAction(null);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'assistant',
      content: `Switched to *${newMode === 'aura' ? 'General Mode' : 'FasterBook Agent Mode'}*.`,
      timestamp: new Date()
    }]);
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

    // Context Logic
    let messageToSend = newMessage.content;
    let actionToExecute = '';
    let isFollowUp = false;

    if (pendingAction && currentMode === 'fasterbook') {
      messageToSend = pendingAction.originalMessage + " " + newMessage.content;
      actionToExecute = pendingAction.action;
      isFollowUp = true;
      setPendingAction(null);
    }

    try {
      let aiResponse: string;

      if (isFollowUp) {
        aiResponse = actionToExecute;
      } else {
        const isFasterBook = currentMode === 'fasterbook';
        aiResponse = await geminiService.sendMessage(messageToSend, isFasterBook);
      }

      // Handle Responses
      if (aiResponse.startsWith('IMAGE_GENERATION:')) {
        setIsGeneratingImage(true);
        const imagePrompt = aiResponse.replace('IMAGE_GENERATION:', '');
        try {
          const imageUrl = await geminiService.generateImage(imagePrompt);
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: `Generated image: "${imagePrompt}"`,
            timestamp: new Date(),
            imageUrl,
            imagePrompt
          }]);
        } catch (e: any) {
          throw new Error(e.message);
        } finally {
          setIsGeneratingImage(false);
        }
      }
      else if (aiResponse.endsWith('_REQUEST')) {
        const agenticAction = await geminiService.executeAgenticAction(messageToSend, aiResponse);
        if (agenticAction) {
          let content = 'Action processed.';
          if (agenticAction.type.includes('menu')) content = 'Here is the menu:';
          if (agenticAction.type.includes('bookings')) content = 'Here are your bookings:';
          
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content,
            timestamp: new Date(),
            orderType: agenticAction.type as any,
            orderData: agenticAction.result
          }]);
        }
      }
      else {
        setPendingAction(null);
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: aiResponse,
          timestamp: new Date()
        }]);
      }

    } catch (error: any) {
      if (error instanceof MissingDetailsError) {
        setPendingAction({ originalMessage: messageToSend, action: error.message }); // Hack: storing action type in error for now? No, need to re-trigger. 
        // Actually, gemini.ts throws MissingDetailsError with the QUESTION as message.
        // We need to know which action triggered it.
        // For simplicity in this UI update, we assume the previous action holds.
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: error.message, // "Where should I deliver?"
          timestamp: new Date()
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: error.message || 'An error occurred.',
          timestamp: new Date()
        }]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingFile(true);
    try {
      const extractedFile = await extractTextFromFile(files[0]);
      geminiService.addUploadedFile(extractedFile);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'assistant',
        content: `I've read **"${extractedFile.name}"**. What would you like to know?`,
        timestamp: new Date()
      }]);
    } catch (error: any) {
      setUploadError(error.message);
    } finally {
      setIsUploadingFile(false);
      event.target.value = '';
    }
  };

  const handleFileUploaded = (file: ExtractedFile) => {
    geminiService.addUploadedFile(file);
    setShowFileUpload(false);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'assistant',
      content: `File processed: ${file.name}`,
      timestamp: new Date()
    }]);
  };

  if (!isLoaded) return <div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-600"></div></div>;
  if (!isSignedIn) return <LandingPage />;

  return (
    <div className="flex h-screen bg-sage-50 text-sage-900 font-sans overflow-hidden">
      
      {/* --- Sidebar --- */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-sage-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${!sidebarOpen && 'lg:hidden'}`}
      >
        <div className="flex flex-col h-full">
          {/* Header & New Chat */}
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center space-x-2 font-bold text-xl text-sage-800">
                <div className="w-8 h-8 bg-sage-600 rounded-lg flex items-center justify-center text-white">
                  <Brain className="w-5 h-5" />
                </div>
                <span>A.U.R.A</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-sage-400">
                <PanelLeftClose className="w-6 h-6" />
              </button>
            </div>

            <button 
              onClick={createNewChat}
              className="w-full flex items-center justify-between px-4 py-3 bg-sage-100 hover:bg-sage-200 text-sage-900 rounded-xl transition-colors group border border-sage-200"
            >
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span className="font-semibold">New Chat</span>
              </div>
              <MessageSquare className="w-4 h-4 text-sage-400 group-hover:text-sage-600" />
            </button>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            <div className="px-3 py-2 text-xs font-semibold text-sage-400 uppercase tracking-wider">
              Recent History
            </div>
            
            {chatSessions.length === 0 ? (
              <div className="px-3 py-4 text-sm text-sage-400 text-center italic">
                No history yet.
              </div>
            ) : (
              chatSessions.map((session) => (
                <div 
                  key={session.id}
                  onClick={() => loadSession(session)}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    currentSessionId === session.id ? 'bg-sage-100/80 text-sage-900' : 'hover:bg-sage-50 text-sage-600'
                  }`}
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <MessageCircle className="w-4 h-4 flex-shrink-0 text-sage-400" />
                    <span className="text-sm truncate">{session.title}</span>
                  </div>
                  <button 
                    onClick={(e) => deleteSession(e, session.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Bottom Tools Navigation */}
          <div className="p-3 border-t border-sage-100 bg-sage-50/50 space-y-1">
            <button 
              onClick={() => setCurrentView('tasks')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${currentView === 'tasks' ? 'bg-white shadow-sm text-sage-900' : 'text-sage-600 hover:bg-white/60'}`}
            >
              <Zap className="w-4 h-4" />
              <span>Task Center</span>
            </button>
            <button 
              onClick={() => setCurrentView('files')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${currentView === 'files' ? 'bg-white shadow-sm text-sage-900' : 'text-sage-600 hover:bg-white/60'}`}
            >
              <FileText className="w-4 h-4" />
              <span>Files</span>
            </button>
            <button 
              onClick={() => setCurrentView('memory')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${currentView === 'memory' ? 'bg-white shadow-sm text-sage-900' : 'text-sage-600 hover:bg-white/60'}`}
            >
              <History className="w-4 h-4" />
              <span>Logs</span>
            </button>
            <button 
              onClick={() => setCurrentView('services')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${currentView === 'services' ? 'bg-white shadow-sm text-sage-900' : 'text-sage-600 hover:bg-white/60'}`}
            >
              <Network className="w-4 h-4" />
              <span>Services</span>
            </button>
          </div>

          {/* User Footer */}
          <div className="p-4 border-t border-sage-200">
            {isLoaded && user && (
              <div className="flex items-center space-x-3">
                <UserButton afterSignOutUrl="/"/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sage-900 truncate">{currentUser?.full_name}</p>
                  <p className="text-xs text-sage-500 truncate">{currentUser?.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-white">
        
        {/* Header (Context Bar) */}
        <header className="h-14 border-b border-sage-100 flex items-center justify-between px-4 bg-white/80 backdrop-blur-sm z-10">
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="mr-3 p-1.5 rounded-md hover:bg-sage-100 text-sage-500">
              {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
            </button>
            <h1 className="font-semibold text-sage-800">
              {currentView === 'chat' ? (currentMode === 'aura' ? 'General Assistant' : 'FasterBook Agent') : 
               currentView.charAt(0).toUpperCase() + currentView.slice(1)}
            </h1>
          </div>

          {currentView === 'chat' && (
            <div className="relative">
              <button
                onClick={() => setShowModeDropdown(!showModeDropdown)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  currentMode === 'aura' 
                    ? 'bg-sage-50 border-sage-200 text-sage-600' 
                    : 'bg-orange-50 border-orange-200 text-orange-700'
                }`}
              >
                {currentMode === 'aura' ? <Brain className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                <span>{currentMode === 'aura' ? 'Standard' : 'Agent Mode'}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              
              {showModeDropdown && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-sage-100 p-1 z-20">
                  <button onClick={() => handleModeChange('aura')} className="w-full flex items-center space-x-2 p-2 hover:bg-sage-50 rounded-lg text-left text-sm text-sage-800">
                    <Brain className="w-4 h-4 text-sage-500"/> <span>Standard Mode</span>
                  </button>
                  <button onClick={() => handleModeChange('fasterbook')} className="w-full flex items-center space-x-2 p-2 hover:bg-orange-50 rounded-lg text-left text-sm text-sage-800">
                    <ShoppingBag className="w-4 h-4 text-orange-500"/> <span>Agent Mode</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-hidden relative">
          {currentView === 'chat' ? (
            <div className="flex flex-col h-full">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-2xl px-5 py-3.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
                      msg.type === 'user' 
                        ? 'bg-sage-600 text-white rounded-tr-sm' 
                        : 'bg-white border border-sage-200 text-sage-900 rounded-tl-sm'
                    }`}>
                      <Markdown content={msg.content} />
                      {msg.imageUrl && (
                        <div className="mt-3 rounded-lg overflow-hidden border border-white/20">
                          <ImageDisplay imageUrl={msg.imageUrl} prompt={msg.imagePrompt || ''} />
                        </div>
                      )}
                      {msg.orderType && msg.orderData && (
                        <div className="mt-3">
                          <OrderDisplay orderType={msg.orderType} orderData={msg.orderData} />
                        </div>
                      )}
                      <span className={`text-[10px] block mt-1 ${msg.type === 'user' ? 'text-sage-200' : 'text-sage-400'}`}>
                        {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                ))}
                
                {/* Loading Indicator */}
                {(isTyping || isGeneratingImage) && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-sage-200 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 bg-sage-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-sage-400 rounded-full animate-bounce delay-75" />
                      <div className="w-1.5 h-1.5 bg-sage-400 rounded-full animate-bounce delay-150" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Upload Error */}
              {uploadError && (
                <div className="mx-4 mb-2 p-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex justify-between items-center">
                  <span>{uploadError}</span>
                  <button onClick={() => setUploadError(null)} className="font-bold">×</button>
                </div>
              )}

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-sage-100">
                <div className={`max-w-4xl mx-auto flex items-end space-x-2 p-2 rounded-2xl border transition-colors ${
                  currentMode === 'fasterbook' ? 'border-orange-200 bg-orange-50/30' : 'border-sage-200 bg-white'
                } focus-within:ring-2 focus-within:ring-sage-200`}>
                  
                  <input type="file" id="file-upload" className="hidden" onChange={handleQuickFileUpload} disabled={isUploadingFile || currentMode === 'fasterbook'} />
                  <button 
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className={`p-2 rounded-xl transition-colors ${currentMode === 'fasterbook' ? 'text-sage-300 cursor-not-allowed' : 'text-sage-400 hover:bg-sage-100 hover:text-sage-600'}`}
                    title={currentMode === 'fasterbook' ? "Upload disabled in Agent Mode" : "Upload File"}
                  >
                    {isUploadingFile ? <div className="w-5 h-5 border-2 border-sage-400 border-t-transparent rounded-full animate-spin"/> : <Paperclip className="w-5 h-5" />}
                  </button>

                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                    placeholder={pendingAction ? "Please provide details..." : currentMode === 'fasterbook' ? "Ask to order food or book movies..." : "Message A.U.R.A..."}
                    className="flex-1 bg-transparent border-0 focus:ring-0 resize-none py-2.5 max-h-32 text-sm text-sage-900 placeholder:text-sage-400"
                    rows={1}
                    style={{ minHeight: '44px' }}
                  />

                  <button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isTyping}
                    className={`p-2 rounded-xl transition-all duration-200 ${
                      !input.trim() || isTyping
                        ? 'bg-sage-100 text-sage-300'
                        : currentMode === 'fasterbook' 
                          ? 'bg-orange-500 text-white shadow-md shadow-orange-200 hover:bg-orange-600'
                          : 'bg-sage-600 text-white shadow-md shadow-sage-200 hover:bg-sage-700'
                    }`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Hints */}
                <div className="max-w-4xl mx-auto mt-2 flex justify-between items-center text-[10px] text-sage-400 px-2">
                  <span className="flex items-center gap-1">
                    {currentMode === 'fasterbook' && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />}
                    {currentMode === 'fasterbook' ? 'Agent Mode Active' : 'AI Reasoning Active'}
                  </span>
                  <span>{geminiService.getUploadedFiles().length > 0 ? `${geminiService.getUploadedFiles().length} file(s) attached` : ''}</span>
                </div>
              </div>
            </div>
          ) : (
            // Other Views Container
            <div className="h-full w-full bg-sage-50 p-6 overflow-y-auto">
              {currentView === 'tasks' && <TaskCenter />}
              {currentView === 'files' && <FilesView files={geminiService.getUploadedFiles()} onRemoveFile={(name) => geminiService.removeUploadedFile(name)} />}
              {currentView === 'memory' && <MemoryLogs messages={messages} />}
              {currentView === 'services' && <ExternalServices />}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
