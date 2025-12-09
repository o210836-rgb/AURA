import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Plus, History, FileText, Zap, 
  Network, ChevronDown, Brain, ShoppingBag, 
  Send, Paperclip, PanelLeftClose, PanelLeft, 
  Trash2, Settings, Sparkles, User, Waves, Wind, Droplets
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
  const { user, isLoaded, isSignedIn } = useUser();
  const [currentUser, setCurrentUser] = useState<ClerkUser | null>(null);
  const [geminiService] = useState(() => new GeminiService());

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('chat');
  const [currentMode, setCurrentMode] = useState<AppMode>('aura');
  const [showModeDropdown, setShowModeDropdown] = useState(false);

  const defaultMessage: Message = {
    id: 'init',
    type: 'assistant',
    content: "Greetings. I am A.U.R.A. The tide is high; how can I assist?",
    timestamp: new Date()
  };

  const [messages, setMessages] = useState<Message[]>([defaultMessage]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // --- Handlers ---
  const createNewChat = () => {
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
    setMessages([defaultMessage]);
    setCurrentSessionId(null);
    setCurrentView('chat');
    setPendingAction(null);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const loadSession = (session: ChatSession) => {
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
            content: `I've conjured an image for: "${imagePrompt}"`,
            timestamp: new Date(),
            imageUrl,
            imagePrompt
          }]);
        } catch (e: any) {
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: "The currents are too strong; I couldn't generate that image.",
            timestamp: new Date()
          }]);
        } finally {
          setIsGeneratingImage(false);
        }
      }
      else if (aiResponse.endsWith('_REQUEST')) {
        const agenticAction = await geminiService.executeAgenticAction(messageToSend, aiResponse);
        if (agenticAction) {
          let content = 'Here is the result:';
          if (agenticAction.type.includes('menu')) content = 'Here is the FasterBook menu:';
          
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
        setPendingAction({ originalMessage: messageToSend, action: error.message });
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
          content: "The connection drifted. Could you say that again?",
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
        content: `I've anchored **"${extractedFile.name}"** in my memory.`,
        timestamp: new Date()
      }]);
    } catch (error: any) {
      setUploadError(error.message);
    } finally {
      setIsUploadingFile(false);
      event.target.value = '';
    }
  };

  const handleModeChange = (newMode: AppMode) => {
    setCurrentMode(newMode);
    setShowModeDropdown(false);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'assistant',
      content: `Switched to **${newMode === 'aura' ? 'General' : 'Agent'}** mode.`,
      timestamp: new Date()
    }]);
  };

  if (!isLoaded) return <div className="h-screen flex items-center justify-center bg-sand-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tide-600"></div></div>;
  if (!isSignedIn) return <LandingPage />;

  return (
    <div className="flex h-screen bg-sand-50 text-sand-800 font-sans overflow-hidden selection:bg-tide-100 selection:text-tide-900 bg-noise">
      
      {/* --- Sidebar (Sea Glass) --- */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-sand-50/90 backdrop-blur-xl border-r border-tide-200/50 transform transition-transform duration-500 cubic-bezier(0.2, 0.8, 0.2, 1) lg:relative lg:translate-x-0 flex flex-col shadow-2xl lg:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${!sidebarOpen && 'lg:hidden'}`}
      >
        <div className="p-5 flex-shrink-0">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-tide-500 to-tide-600 rounded-xl flex items-center justify-center shadow-lg shadow-tide-400/30">
                <Waves className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight text-sand-900 font-serif">A.U.R.A</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-sand-100 rounded-full text-sand-400">
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>

          <button 
            onClick={createNewChat}
            className="w-full flex items-center justify-between px-4 py-3.5 bg-white/80 hover:bg-tide-50 text-sand-700 hover:text-tide-800 rounded-2xl transition-all shadow-sm border border-tide-100/50 group hover:border-tide-200"
          >
            <div className="flex items-center space-x-3">
              <Plus className="w-5 h-5 text-tide-400 group-hover:text-tide-600 transition-colors" />
              <span className="font-medium">New Chat</span>
            </div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1 min-h-0 custom-scrollbar">
          <div className="px-3 py-2 text-[11px] font-bold text-sand-400 uppercase tracking-widest">
            History
          </div>
          {chatSessions.length === 0 ? (
            <div className="px-3 py-4 text-sm text-sand-400 italic font-light">The horizon is clear.</div>
          ) : (
            chatSessions.map((session) => (
              <div 
                key={session.id}
                onClick={() => loadSession(session)}
                className={`group flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all ${
                  currentSessionId === session.id 
                    ? 'bg-tide-50 text-tide-900 font-medium' 
                    : 'hover:bg-sand-100 text-sand-500 hover:text-sand-800'
                }`}
              >
                <span className="text-sm truncate w-full">{session.title}</span>
                <button 
                  onClick={(e) => deleteSession(e, session.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-coral-50 rounded-lg text-sand-400 hover:text-coral-500 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-tide-100/50 bg-sand-50/50 flex-shrink-0">
          <div className="grid grid-cols-4 gap-1 mb-4">
            {[
              { id: 'tasks', icon: Zap, label: 'Tasks' },
              { id: 'files', icon: FileText, label: 'Files' },
              { id: 'memory', icon: History, label: 'Logs' },
              { id: 'services', icon: Network, label: 'Apps' }
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => setCurrentView(item.id as ViewType)} 
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 ${
                  currentView === item.id 
                    ? 'bg-white shadow-sm text-tide-700' 
                    : 'text-sand-400 hover:bg-sand-100 hover:text-sand-600'
                }`}
              >
                <item.icon className="w-5 h-5 mb-1.5" />
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3 p-2.5 rounded-2xl bg-white/80 border border-tide-100/50 shadow-sm backdrop-blur-sm">
            <UserButton afterSignOutUrl="/"/>
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-sm font-semibold text-sand-800 truncate">{currentUser?.full_name || 'Guest'}</p>
              <p className="text-[10px] text-tide-500 truncate tracking-wide">CAPTAIN</p>
            </div>
            <Settings className="w-4 h-4 text-sand-300 hover:text-sand-500 cursor-pointer transition-colors" />
          </div>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-sand-50 shadow-inner">
        
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-10 bg-sand-50/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`p-2 rounded-xl hover:bg-sand-100 text-sand-500 transition-all ${sidebarOpen ? 'hidden lg:block lg:opacity-0' : ''}`}>
              <PanelLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-sand-800 tracking-tight font-serif">
                {currentView === 'chat' ? (currentMode === 'aura' ? 'General' : 'Agent Mode') : 
                 currentView.charAt(0).toUpperCase() + currentView.slice(1)}
              </span>
              <span className="text-xs text-tide-500 font-medium tracking-wide">
                {isTyping ? 'Thinking...' : 'Online'}
              </span>
            </div>
          </div>

          {currentView === 'chat' && (
            <div className="relative">
              <button
                onClick={() => setShowModeDropdown(!showModeDropdown)}
                className={`flex items-center gap-3 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition-all duration-300 ${
                  currentMode === 'aura' 
                    ? 'bg-white border-tide-200 text-tide-700 hover:border-tide-300' 
                    : 'bg-coral-50 border-coral-200 text-coral-600 hover:bg-coral-100'
                }`}
              >
                {currentMode === 'aura' ? 'Standard' : 'Agent'}
                <ChevronDown className={`w-3 h-3 transition-transform ${showModeDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showModeDropdown && (
                <div className="absolute right-0 top-full mt-3 w-72 bg-white rounded-2xl shadow-2xl shadow-tide-500/10 border border-sand-200 p-2 z-20 animate-slide-up origin-top-right">
                  <button onClick={() => handleModeChange('aura')} className="w-full flex items-start gap-4 p-3 rounded-xl hover:bg-tide-50 transition-colors text-left">
                    <div className="p-2.5 bg-tide-100 rounded-lg"><Brain className="w-5 h-5 text-tide-600"/></div>
                    <div>
                      <p className="text-sm font-bold text-sand-800">Standard Mode</p>
                      <p className="text-xs text-sand-500 mt-0.5 leading-relaxed">Deep analysis and reasoning.</p>
                    </div>
                  </button>
                  <button onClick={() => handleModeChange('fasterbook')} className="w-full flex items-start gap-4 p-3 rounded-xl hover:bg-coral-50 transition-colors text-left">
                    <div className="p-2.5 bg-coral-100 rounded-lg"><ShoppingBag className="w-5 h-5 text-coral-600"/></div>
                    <div>
                      <p className="text-sm font-bold text-sand-800">Agent Mode</p>
                      <p className="text-xs text-sand-500 mt-0.5 leading-relaxed">Booking and transactions.</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-hidden relative">
          {currentView === 'chat' ? (
            <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
              
              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10 scroll-smooth custom-scrollbar">
                {messages.length === 1 && (
                  <div className="flex flex-col items-center justify-center h-full pb-20 opacity-0 animate-fade-in" style={{ animationDelay: '0.2s', opacity: 1 }}>
                    <div className="w-24 h-24 bg-gradient-to-tr from-tide-100 to-white rounded-full flex items-center justify-center shadow-lg shadow-tide-200/50 mb-8 border border-tide-50 animate-float">
                      <Wind className="w-10 h-10 text-tide-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-sand-800 mb-2 font-serif">Good Morning.</h2>
                    <p className="text-sand-500">I am ready.</p>
                  </div>
                )}

                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up group`}>
                    <div className={`flex max-w-2xl ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-5`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold tracking-wider shadow-sm ${
                        msg.type === 'user' ? 'bg-sand-800 text-sand-100' : 
                        currentMode === 'fasterbook' ? 'bg-coral-100 text-coral-600' : 'bg-white border border-tide-200 text-tide-600'
                      }`}>
                        {msg.type === 'user' ? 'YOU' : 'AI'}
                      </div>

                      <div className={`relative p-0 text-[15px] leading-7 ${msg.type === 'user' ? 'text-sand-800' : 'text-sand-700'}`}>
                        <div className={`p-5 rounded-2xl ${
                          msg.type === 'user' ? 'bg-sand-200/50 rounded-tr-sm text-sand-900 border border-sand-200' : 'bg-white border border-tide-100 shadow-sm rounded-tl-sm'
                        }`}>
                          <Markdown content={msg.content} />
                          {msg.imageUrl && (
                            <div className="mt-4 rounded-xl overflow-hidden shadow-sm">
                              <ImageDisplay imageUrl={msg.imageUrl} prompt={msg.imagePrompt || ''} />
                            </div>
                          )}
                          {msg.orderType && msg.orderData && (
                            <div className="mt-4">
                              <OrderDisplay orderType={msg.orderType} orderData={msg.orderData} />
                            </div>
                          )}
                        </div>
                        <span className={`text-[10px] absolute -bottom-6 ${msg.type === 'user' ? 'right-0' : 'left-0'} text-sand-300 font-medium opacity-0 group-hover:opacity-100 transition-opacity`}>
                          {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start animate-fade-in pl-14">
                    <div className="flex space-x-1.5">
                      <div className="w-1.5 h-1.5 bg-tide-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-tide-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-tide-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
              </div>

              {/* Input Area */}
              <div className="p-6 pb-8">
                <div className="max-w-3xl mx-auto">
                  {uploadError && (
                    <div className="mb-3 px-4 py-2 bg-coral-50 border border-coral-100 text-coral-500 text-xs font-medium rounded-lg flex justify-between items-center">
                      <span>{uploadError}</span>
                      <button onClick={() => setUploadError(null)} className="hover:text-coral-700">Dismiss</button>
                    </div>
                  )}

                  <div className={`relative flex items-end gap-2 p-2 rounded-3xl border transition-all duration-300 shadow-sm ${
                    currentMode === 'fasterbook' 
                      ? 'bg-coral-50/30 border-coral-200 focus-within:ring-2 focus-within:ring-coral-100' 
                      : 'bg-white/80 border-tide-200 focus-within:shadow-md focus-within:border-tide-300 backdrop-blur-md'
                  }`}>
                    
                    <input type="file" id="file-upload" className="hidden" onChange={handleQuickFileUpload} disabled={isUploadingFile || currentMode === 'fasterbook'} />
                    
                    <button 
                      onClick={() => document.getElementById('file-upload')?.click()}
                      className={`p-3 rounded-2xl transition-colors mb-0.5 ${
                        currentMode === 'fasterbook' 
                          ? 'text-sand-300 cursor-not-allowed' 
                          : 'text-sand-400 hover:bg-sand-100 hover:text-sand-600'
                      }`}
                      title={currentMode === 'fasterbook' ? "Disabled in Agent Mode" : "Attach File"}
                    >
                      {isUploadingFile ? <div className="w-5 h-5 border-2 border-sand-300 border-t-transparent rounded-full animate-spin"/> : <Paperclip className="w-5 h-5" />}
                    </button>

                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                      placeholder={pendingAction ? "Reply here..." : currentMode === 'fasterbook' ? "Order food or tickets..." : "Type a message..."}
                      className="flex-1 bg-transparent border-0 focus:ring-0 resize-none py-3.5 max-h-32 text-[15px] text-sand-800 placeholder:text-sand-400"
                      rows={1}
                      style={{ minHeight: '52px' }}
                    />

                    <button
                      onClick={handleSendMessage}
                      disabled={!input.trim() || isTyping}
                      className={`p-3 rounded-2xl mb-0.5 transition-all duration-300 transform active:scale-95 ${
                        !input.trim() || isTyping
                          ? 'bg-sand-100 text-sand-300'
                          : currentMode === 'fasterbook' 
                            ? 'bg-coral-500 text-white shadow-lg shadow-coral-500/20 hover:bg-coral-600'
                            : 'bg-tide-600 text-white shadow-lg shadow-tide-600/20 hover:bg-tide-700'
                      }`}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Non-Chat Views
            <div className="h-full w-full p-8 overflow-y-auto animate-fade-in bg-sand-50">
              <div className="max-w-5xl mx-auto">
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
