// src/App.tsx

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Plus, History, FileText, Zap, 
  Network, ChevronDown, Brain, ShoppingBag, 
  Send, Paperclip, PanelLeftClose, PanelLeft, 
  Trash2, MessageCircle, MoreHorizontal, LayoutGrid, Settings
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
  const defaultMessage: Message = {
    id: 'init',
    type: 'assistant',
    content: 'Hello. I am A.U.R.A. How can I help you today?',
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
    // Save current session if it has user interaction
    if (messages.length > 1) { 
      const newSession: ChatSession = {
        id: currentSessionId || Date.now().toString(),
        title: messages[1]?.content.slice(0, 40) + (messages[1]?.content.length > 40 ? '...' : '') || 'New Conversation',
        date: new Date(),
        messages: [...messages]
      };

      setChatSessions(prev => {
        const exists = prev.findIndex(s => s.id === newSession.id);
        if (exists >= 0) {
          const updated = [...prev];
          updated[exists] = newSession;
          return updated;
        }
        return [newSession, ...prev];
      });
    }

    // Reset for new chat
    setMessages([defaultMessage]);
    setCurrentSessionId(null);
    setCurrentView('chat');
    setPendingAction(null);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const loadSession = (session: ChatSession) => {
    // You might want to save the *current* active chat before switching here as well
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
      content: `Mode switched to **${newMode === 'aura' ? 'General' : 'FasterBook Agent'}**.`,
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
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: "Sorry, I couldn't generate that image.",
            timestamp: new Date()
          }]);
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
        setPendingAction({ originalMessage: messageToSend, action: error.message }); // Hack: logic should be handled by preserving context
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: error.message,
          timestamp: new Date()
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: "I encountered an error processing your request.",
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
        content: `I've analyzed **"${extractedFile.name}"**.`,
        timestamp: new Date()
      }]);
    } catch (error: any) {
      setUploadError(error.message);
    } finally {
      setIsUploadingFile(false);
      event.target.value = '';
    }
  };

  const handleRemoveFile = (fileName: string) => {
    geminiService.removeUploadedFile(fileName);
  };

  if (!isLoaded) return <div className="h-screen flex items-center justify-center bg-zinc-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div></div>;
  if (!isSignedIn) return <LandingPage />;

  return (
    <div className="flex h-screen bg-zinc-50 text-zinc-900 font-sans overflow-hidden selection:bg-brand-100 selection:text-brand-900">
      
      {/* --- Sidebar --- */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-zinc-50/95 backdrop-blur-xl border-r border-zinc-200 transform transition-transform duration-300 ease-out lg:relative lg:translate-x-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${!sidebarOpen && 'lg:hidden'}`}
      >
        {/* Sidebar Header: New Chat */}
        <div className="p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-6 px-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center shadow-lg shadow-zinc-900/20">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight text-zinc-900">A.U.R.A</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 hover:bg-zinc-200 rounded-md text-zinc-500 transition-colors">
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>

          <button 
            onClick={createNewChat}
            className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-zinc-100 text-zinc-900 rounded-xl transition-all shadow-sm hover:shadow-md border border-zinc-200 group"
          >
            <div className="flex items-center space-x-3">
              <Plus className="w-5 h-5 text-zinc-500 group-hover:text-zinc-900" />
              <span className="font-medium">New Chat</span>
            </div>
            <MessageSquare className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
          </button>
        </div>

        {/* Sidebar Middle: History */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 min-h-0 custom-scrollbar">
          <div className="px-4 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            History
          </div>
          
          {chatSessions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-zinc-400 italic">
              No previous chats
            </div>
          ) : (
            chatSessions.map((session) => (
              <div 
                key={session.id}
                onClick={() => loadSession(session)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all mx-2 ${
                  currentSessionId === session.id 
                    ? 'bg-zinc-200/80 text-zinc-900' 
                    : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <MessageCircle className={`w-4 h-4 flex-shrink-0 ${currentSessionId === session.id ? 'text-zinc-900' : 'text-zinc-400'}`} />
                  <span className="text-sm truncate leading-none">{session.title}</span>
                </div>
                <button 
                  onClick={(e) => deleteSession(e, session.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-zinc-200 rounded-md text-zinc-400 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Sidebar Bottom: Apps/Tools */}
        <div className="p-2 border-t border-zinc-200 bg-zinc-50 flex-shrink-0">
          <div className="grid grid-cols-2 gap-1 mb-2">
            <button onClick={() => setCurrentView('tasks')} className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${currentView === 'tasks' ? 'bg-white shadow-sm text-zinc-900' : 'hover:bg-zinc-100 text-zinc-500'}`}>
              <Zap className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">Tasks</span>
            </button>
            <button onClick={() => setCurrentView('files')} className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${currentView === 'files' ? 'bg-white shadow-sm text-zinc-900' : 'hover:bg-zinc-100 text-zinc-500'}`}>
              <FileText className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">Files</span>
            </button>
            <button onClick={() => setCurrentView('memory')} className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${currentView === 'memory' ? 'bg-white shadow-sm text-zinc-900' : 'hover:bg-zinc-100 text-zinc-500'}`}>
              <History className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">Logs</span>
            </button>
            <button onClick={() => setCurrentView('services')} className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${currentView === 'services' ? 'bg-white shadow-sm text-zinc-900' : 'hover:bg-zinc-100 text-zinc-500'}`}>
              <Network className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">Services</span>
            </button>
          </div>

          <div className="flex items-center space-x-3 p-2 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer border border-transparent hover:border-zinc-200">
            <UserButton afterSignOutUrl="/"/>
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-sm font-semibold text-zinc-900 truncate">{currentUser?.full_name}</p>
              <p className="text-xs text-zinc-500 truncate">{currentUser?.email}</p>
            </div>
            <Settings className="w-4 h-4 text-zinc-400" />
          </div>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-white">
        
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-zinc-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-lg hover:bg-zinc-100 text-zinc-500 transition-colors ${sidebarOpen ? 'hidden lg:block lg:opacity-0 lg:pointer-events-none' : ''}`}
            >
              <PanelLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-900">
                {currentView === 'chat' ? 'A.U.R.A Chat' : 
                 currentView.charAt(0).toUpperCase() + currentView.slice(1)}
              </span>
              {currentView === 'chat' && (
                <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 text-xs font-medium border border-zinc-200">
                  {currentMode === 'aura' ? 'v2.5' : 'Agent Beta'}
                </span>
              )}
            </div>
          </div>

          {currentView === 'chat' && (
            <div className="relative">
              <button
                onClick={() => setShowModeDropdown(!showModeDropdown)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  currentMode === 'aura' 
                    ? 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300' 
                    : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
                }`}
              >
                {currentMode === 'aura' ? <Brain className="w-4 h-4 text-zinc-500" /> : <ShoppingBag className="w-4 h-4 text-orange-500" />}
                <span>{currentMode === 'aura' ? 'Standard' : 'Agent Mode'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showModeDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showModeDropdown && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-zinc-100 p-1.5 z-20 animate-slide-up transform origin-top-right">
                  <button
                    onClick={() => handleModeChange('aura')}
                    className="w-full flex items-start space-x-3 p-3 rounded-lg hover:bg-zinc-50 transition-colors text-left"
                  >
                    <div className="p-2 bg-zinc-100 rounded-md"><Brain className="w-4 h-4 text-zinc-600"/></div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">Standard Mode</p>
                      <p className="text-xs text-zinc-500">General purpose reasoning & creation.</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleModeChange('fasterbook')}
                    className="w-full flex items-start space-x-3 p-3 rounded-lg hover:bg-orange-50 transition-colors text-left"
                  >
                    <div className="p-2 bg-orange-100 rounded-md"><ShoppingBag className="w-4 h-4 text-orange-600"/></div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">Agent Mode</p>
                      <p className="text-xs text-zinc-500">Dedicated booking automation.</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative bg-white">
          {currentView === 'chat' ? (
            <div className="flex flex-col h-full max-w-5xl mx-auto w-full">
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-8 scroll-smooth">
                {messages.length === 1 && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-50 pb-20">
                    <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center">
                      <Brain className="w-8 h-8 text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900">How can I help you?</h3>
                      <p className="text-zinc-500 max-w-md mx-auto mt-2">I can help you analyze documents, generate images, or book services via FasterBook.</p>
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in group`}>
                    <div className={`flex max-w-3xl ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-4`}>
                      
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-medium shadow-sm border ${
                        msg.type === 'user' 
                          ? 'bg-zinc-900 border-zinc-900 text-white' 
                          : currentMode === 'fasterbook' ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-zinc-200 text-zinc-700'
                      }`}>
                        {msg.type === 'user' ? 'U' : currentMode === 'fasterbook' ? 'FB' : 'AI'}
                      </div>

                      {/* Message Bubble */}
                      <div className={`relative px-6 py-4 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                        msg.type === 'user' 
                          ? 'bg-zinc-100 text-zinc-900 rounded-tr-sm' 
                          : 'bg-white border border-zinc-100 text-zinc-800 rounded-tl-sm shadow-sm'
                      }`}>
                        <Markdown content={msg.content} />
                        
                        {msg.imageUrl && (
                          <div className="mt-4 rounded-xl overflow-hidden border border-zinc-100 shadow-sm">
                            <ImageDisplay imageUrl={msg.imageUrl} prompt={msg.imagePrompt || ''} />
                          </div>
                        )}
                        {msg.orderType && msg.orderData && (
                          <div className="mt-4">
                            <OrderDisplay orderType={msg.orderType} orderData={msg.orderData} />
                          </div>
                        )}
                        
                        <span className={`text-[10px] absolute -bottom-5 ${msg.type === 'user' ? 'right-0' : 'left-0'} text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity`}>
                          {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shadow-sm">
                        <Brain className="w-4 h-4 text-zinc-400 animate-pulse" />
                      </div>
                      <div className="px-4 py-3 bg-white border border-zinc-100 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
              </div>

              {/* Input Area */}
              <div className="p-6 bg-white/90 backdrop-blur-xl border-t border-zinc-100">
                <div className="max-w-3xl mx-auto">
                  {uploadError && (
                    <div className="mb-3 px-4 py-2 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex justify-between items-center">
                      <span>{uploadError}</span>
                      <button onClick={() => setUploadError(null)} className="font-bold">×</button>
                    </div>
                  )}

                  <div className={`relative flex items-end gap-2 p-2 rounded-2xl border transition-all shadow-sm ${
                    currentMode === 'fasterbook' 
                      ? 'border-orange-200 bg-orange-50/20 focus-within:ring-2 focus-within:ring-orange-100' 
                      : 'border-zinc-200 bg-white focus-within:ring-2 focus-within:ring-zinc-100 focus-within:border-zinc-300'
                  }`}>
                    
                    <input type="file" id="file-upload" className="hidden" onChange={handleQuickFileUpload} disabled={isUploadingFile || currentMode === 'fasterbook'} />
                    
                    <button 
                      onClick={() => document.getElementById('file-upload')?.click()}
                      className={`p-2.5 rounded-xl transition-colors mb-0.5 ${
                        currentMode === 'fasterbook' 
                          ? 'text-zinc-300 cursor-not-allowed' 
                          : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600'
                      }`}
                      title={currentMode === 'fasterbook' ? "Upload disabled in Agent Mode" : "Upload File"}
                    >
                      {isUploadingFile ? <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"/> : <Paperclip className="w-5 h-5" />}
                    </button>

                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                      placeholder={pendingAction ? "Please provide the missing details..." : currentMode === 'fasterbook' ? "Ask to order food or book movies..." : "Message A.U.R.A..."}
                      className="flex-1 bg-transparent border-0 focus:ring-0 resize-none py-3 max-h-32 text-[15px] text-zinc-800 placeholder:text-zinc-400"
                      rows={1}
                      style={{ minHeight: '48px' }}
                    />

                    <button
                      onClick={handleSendMessage}
                      disabled={!input.trim() || isTyping}
                      className={`p-2.5 rounded-xl mb-0.5 transition-all duration-200 ${
                        !input.trim() || isTyping
                          ? 'bg-zinc-100 text-zinc-300'
                          : currentMode === 'fasterbook' 
                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 hover:bg-orange-600'
                            : 'bg-zinc-900 text-white shadow-md shadow-zinc-900/20 hover:bg-zinc-800'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="mt-2 text-center text-[11px] text-zinc-400">
                    AI can make mistakes. Please verify important information.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Non-Chat Views
            <div className="h-full w-full bg-white p-6 overflow-y-auto animate-fade-in">
              <div className="max-w-6xl mx-auto">
                {currentView === 'tasks' && <TaskCenter />}
                {currentView === 'files' && <FilesView files={geminiService.getUploadedFiles()} onRemoveFile={(name) => geminiService.removeUploadedFile(name)} />}
                {currentView === 'memory' && <MemoryLogs messages={messages} />}
                {currentView === 'services' && <ExternalServices />}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
