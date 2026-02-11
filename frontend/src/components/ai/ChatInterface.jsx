import { useEffect, useRef } from 'react';
import { User, Bot } from 'lucide-react';

export default function ChatInterface({ messages, streamingMessage, isStreaming }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.length === 0 && !streamingMessage && (
        <div className="text-center text-gray-500 mt-12">
          <Bot className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">CTL Plumbing AI Assistant</h3>
          <p className="text-sm">
            Ask me about lead analysis, pricing guidance, material recommendations, or code compliance
          </p>
        </div>
      )}

      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {msg.role === 'assistant' && (
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-primary-600" />
            </div>
          )}
          <div
            className={`max-w-[70%] rounded-lg p-4 ${
              msg.role === 'user'
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-200 text-gray-900'
            }`}
          >
            <p className="whitespace-pre-wrap">{msg.content}</p>
          </div>
          {msg.role === 'user' && (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-gray-600" />
            </div>
          )}
        </div>
      ))}

      {streamingMessage && (
        <div className="flex gap-3 justify-start">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 text-primary-600" />
          </div>
          <div className="max-w-[70%] rounded-lg p-4 bg-white border border-gray-200 text-gray-900">
            <p className="whitespace-pre-wrap">{streamingMessage}</p>
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-primary-600 ml-1 animate-pulse"></span>
            )}
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
