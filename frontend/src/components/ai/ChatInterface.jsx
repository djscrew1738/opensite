import { useEffect, useRef, useMemo, memo } from 'react';
import { User, Bot, Sparkles, MessageSquare, FileText, Calculator } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const SUGGESTED_ACTIONS = [
  { icon: MessageSquare, label: 'Analyze leads', prompt: 'Analyze my recent leads' },
  { icon: Calculator, label: 'Check pricing', prompt: 'Help me with pricing for a new job' },
  { icon: FileText, label: 'Code compliance', prompt: 'What are the code requirements for rough-in?' },
  { icon: Sparkles, label: 'Materials', prompt: 'Recommend materials for a custom home' },
];

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Suggested action button for empty state
 */
const SuggestedAction = memo(function SuggestedAction({ action, onClick }) {
  const Icon = action.icon;
  
  return (
    <button
      type="button"
      onClick={() => onClick?.(action.prompt)}
      className="
        flex items-center gap-2 px-4 py-3 rounded-lg text-left 
        transition-all duration-200
        bg-surface-card border border-border text-text-secondary
        hover:border-border-strong hover:text-text-primary hover:bg-surface-elevated
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50
      "
    >
      <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <span className="text-sm font-medium">{action.label}</span>
    </button>
  );
});

/**
 * Empty state when no messages exist
 */
const EmptyState = memo(function EmptyState({ onSuggestionClick }) {
  return (
    <div className="text-center mt-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-muted flex items-center justify-center">
        <Bot className="w-8 h-8 text-accent-blue" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">
        CTL Plumbing AI Assistant
      </h3>
      <p className="text-sm text-text-secondary mb-6 max-w-md mx-auto">
        Ask me about lead analysis, pricing guidance, material recommendations, or code compliance
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto px-4">
        {SUGGESTED_ACTIONS.map((action) => (
          <SuggestedAction 
            key={action.label} 
            action={action} 
            onClick={onSuggestionClick} 
          />
        ))}
      </div>
    </div>
  );
});

/**
 * User message bubble
 */
const UserMessage = memo(function UserMessage({ content }) {
  return (
    <div className="flex gap-3 justify-end">
      <div className="max-w-[85%] sm:max-w-[70%] rounded-2xl rounded-br-md px-4 py-3 bg-accent-blue text-white">
        <p className="whitespace-pre-wrap text-sm sm:text-base">{content}</p>
      </div>
      <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-semibold text-text-secondary">You</span>
      </div>
    </div>
  );
});

/**
 * Assistant message bubble
 */
const AssistantMessage = memo(function AssistantMessage({ content }) {
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-8 h-8 rounded-full bg-accent-muted flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-accent-blue" aria-hidden="true" />
      </div>
      <div className="max-w-[85%] sm:max-w-[70%] rounded-2xl rounded-bl-md px-4 py-3 bg-surface-card border border-border text-text-primary">
        <p className="whitespace-pre-wrap text-sm sm:text-base">{content}</p>
      </div>
    </div>
  );
});

/**
 * Streaming message with typing indicator
 */
const StreamingMessage = memo(function StreamingMessage({ content, isStreaming }) {
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-8 h-8 rounded-full bg-accent-muted flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-accent-blue" aria-hidden="true" />
      </div>
      <div className="max-w-[85%] sm:max-w-[70%] rounded-2xl rounded-bl-md px-4 py-3 bg-surface-card border border-border text-text-primary">
        <p className="whitespace-pre-wrap text-sm sm:text-base">
          {content}
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-accent-blue animate-pulse" aria-hidden="true" />
          )}
        </p>
        {/* Screen reader announcement for streaming */}
        <span className="sr-only" role="status" aria-live="polite">
          {isStreaming ? 'AI is typing...' : 'Message complete'}
        </span>
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
// Custom Hooks
// ═══════════════════════════════════════════════════════════════

/**
 * Hook to auto-scroll to bottom of chat
 */
function useAutoScroll(dependencies, ref) {
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * ChatInterface - AI Assistant chat component
 * 
 * Accessibility features:
 * - aria-live region for new messages
 * - role="log" for chat history
 * - Reduced motion support for streaming indicator
 * - Suggested actions in empty state
 */
function ChatInterface({ messages, streamingMessage, isStreaming, onSuggestionClick }) {
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Scroll to bottom when messages change
  useAutoScroll([messages, streamingMessage], messagesEndRef);

  const hasMessages = messages.length > 0 || Boolean(streamingMessage);

  // Memoize message list to prevent unnecessary re-renders
  const messageList = useMemo(() => {
    return messages.map((msg, idx) => {
      if (msg.role === 'user') {
        return <UserMessage key={idx} content={msg.content} />;
      }
      return <AssistantMessage key={idx} content={msg.content} />;
    });
  }, [messages]);

  return (
    <div 
      ref={chatContainerRef}
      className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
      aria-atomic="false"
    >
      {!hasMessages && <EmptyState onSuggestionClick={onSuggestionClick} />}

      {messageList}

      {streamingMessage && (
        <StreamingMessage 
          content={streamingMessage} 
          isStreaming={isStreaming} 
        />
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

export { ChatInterface };
export default ChatInterface;
