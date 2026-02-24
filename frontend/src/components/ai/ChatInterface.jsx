import { useEffect, useRef } from 'react';
import { User, Bot, Sparkles, MessageSquare, FileText, Calculator } from 'lucide-react';
import { colors } from '../../styles/tokens';

/**
 * ChatInterface - AI Assistant chat component
 * 
 * Accessibility features:
 * - aria-live region for new messages
 * - role="log" for chat history
 * - Reduced motion support for streaming indicator
 * - Suggested actions in empty state
 */
const suggestedActions = [
  { icon: MessageSquare, label: 'Analyze leads', prompt: 'Analyze my recent leads' },
  { icon: Calculator, label: 'Check pricing', prompt: 'Help me with pricing for a new job' },
  { icon: FileText, label: 'Code compliance', prompt: 'What are the code requirements for rough-in?' },
  { icon: Sparkles, label: 'Materials', prompt: 'Recommend materials for a custom home' },
];

export function ChatInterface({ messages, streamingMessage, isStreaming, onSuggestionClick }) {
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  return (
    <div 
      ref={chatContainerRef}
      className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
      aria-atomic="false"
    >
      {messages.length === 0 && !streamingMessage && (
        <div className="text-center mt-12">
          <div 
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ 
              background: colors.accent.muted,
            }}
          >
            <Bot 
              className="w-8 h-8" 
              style={{ color: colors.accent.blue }}
              aria-hidden="true"
            />
          </div>
          <h3 
            className="text-lg font-semibold mb-2"
            style={{ color: colors.text.primary }}
          >
            CTL Plumbing AI Assistant
          </h3>
          <p 
            className="text-sm mb-6 max-w-md mx-auto"
            style={{ color: colors.text.secondary }}
          >
            Ask me about lead analysis, pricing guidance, material recommendations, or code compliance
          </p>
          
          {/* Suggested Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto px-4">
            {suggestedActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => onSuggestionClick?.(action.prompt)}
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
                style={{
                  background: colors.surface.card,
                  border: `1px solid ${colors.border.default}`,
                  color: colors.text.secondary,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.border.strong;
                  e.currentTarget.style.color = colors.text.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.border.default;
                  e.currentTarget.style.color = colors.text.secondary;
                }}
              >
                <action.icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {msg.role === 'assistant' && (
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: colors.accent.muted }}
            >
              <Bot 
                className="w-5 h-5" 
                style={{ color: colors.accent.blue }}
                aria-hidden="true"
              />
            </div>
          )}
          <div
            className="max-w-[85%] sm:max-w-[70%] rounded-lg p-4"
            style={{
              background: msg.role === 'user' ? colors.accent.blue : colors.surface.card,
              border: msg.role === 'user' ? 'none' : `1px solid ${colors.border.default}`,
              color: msg.role === 'user' ? colors.text.inverse : colors.text.primary,
            }}
          >
            <p className="whitespace-pre-wrap text-sm sm:text-base">{msg.content}</p>
          </div>
          {msg.role === 'user' && (
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: colors.surface.elevated }}
            >
              <User 
                className="w-5 h-5" 
                style={{ color: colors.text.secondary }}
                aria-hidden="true"
              />
            </div>
          )}
        </div>
      ))}

      {streamingMessage && (
        <div className="flex gap-3 justify-start">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: colors.accent.muted }}
          >
            <Bot 
              className="w-5 h-5" 
              style={{ color: colors.accent.blue }}
              aria-hidden="true"
            />
          </div>
          <div 
            className="max-w-[85%] sm:max-w-[70%] rounded-lg p-4"
            style={{
              background: colors.surface.card,
              border: `1px solid ${colors.border.default}`,
              color: colors.text.primary,
            }}
          >
            <p className="whitespace-pre-wrap text-sm sm:text-base">{streamingMessage}</p>
            {isStreaming && (
              <span 
                className="inline-block w-2 h-4 ml-1 animate-pulse"
                style={{ background: colors.accent.blue }}
                aria-hidden="true"
              />
            )}
            {/* Screen reader announcement for streaming */}
            <span className="sr-only" role="status" aria-live="polite">
              {isStreaming ? 'AI is typing...' : 'Message complete'}
            </span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
