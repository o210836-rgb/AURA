import { MessageSquare, User, Bot } from 'lucide-react';
import Markdown from '../utils/markdown';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
  imagePrompt?: string;
}

interface MemoryLogsProps {
  messages: Message[];
}

export default function MemoryLogs({ messages }: MemoryLogsProps) {
  if (messages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <MessageSquare className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Chat History</h3>
        <p className="text-gray-600 max-w-md">
          Start a conversation with AURA to see your chat history here.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Memory Logs</h2>
        <p className="text-gray-600">Complete conversation history with AURA</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-4 p-4 rounded-xl ${
              message.type === 'user'
                ? 'bg-green-50 border border-green-200'
                : 'bg-white border border-gray-200'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.type === 'user'
                  ? 'bg-gradient-to-br from-green-400 to-emerald-600'
                  : 'bg-gradient-to-br from-gray-400 to-gray-600'
              }`}
            >
              {message.type === 'user' ? (
                <User className="w-5 h-5 text-white" />
              ) : (
                <Bot className="w-5 h-5 text-white" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">
                  {message.type === 'user' ? 'You' : 'AURA'}
                </span>
                <span className="text-xs text-gray-500">
                  {message.timestamp.toLocaleString()}
                </span>
              </div>

              <div className="text-gray-800">
                {message.type === 'assistant' ? (
                  <Markdown content={message.content} />
                ) : (
                  <p className="text-sm leading-relaxed">{message.content}</p>
                )}
              </div>

              {message.imageUrl && (
                <div className="mt-3">
                  <img
                    src={message.imageUrl}
                    alt={message.imagePrompt || 'Generated image'}
                    className="rounded-lg max-w-sm border border-gray-200"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
