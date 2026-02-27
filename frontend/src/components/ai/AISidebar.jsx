import { 
  useState, 
  useRef, 
  useEffect, 
  useCallback, 
  useMemo, 
  memo 
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Send, 
  X, 
  Bot, 
  Sparkles, 
  Cpu, 
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { api } from '../../api/client';
import { 
  useStreamingResponse, 
  useModelPreference, 
  usePageContext,
} from '../../hooks';
import { ModelSelector } from './ModelSelector';

// ═══════════════════════════════════════════════════════════════
// Custom Hooks
// ═══════════════════════════════════════════════════════════════

/**
 * Hook to manage keyboard shortcuts
 */
function useKeyboardShortcut(key, callback, deps = []) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === key) {
        callback();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ...deps]);
}

/**
 * Hook to manage body scroll lock
 */
function useScrollLock(isLocked) {
  useEffect(() => {
    if (isLocked) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isLocked]);
}

/**
 * Hook to auto-focus input on mount/visibility change
 */
function useAutoFocus(isActive, ref) {
  useEffect(() => {
    if (isActive && ref.current) {
      const timer = setTimeout(() => ref.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isActive, ref]);
}

/**
 * Hook to scroll to bottom of messages
 */
function useScrollToBottom(dependencies, ref) {
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const QUICK_ACTION_ICONS = {
  'Score': 'TrendingUp',
  'Draft': 'MessageSquare',
  'Estimate': 'Calculator',
  'Analyze': 'TrendingUp',
  'Check': 'FileText',
  'Schedule': 'Calendar',
  'Materials': 'Wrench',
  'Help': 'MessageSquare',
  'Search': 'FileText',
  'Organize': 'ClipboardList',
  'Extract': 'FileText',
  'Configure': 'Wrench',
  'Troubleshoot': 'Wrench',
  'Summary': 'ClipboardList',
  'Priorities': 'TrendingUp',
  'Overdue': 'Calendar',
};

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Sidebar header with title and controls
 */
const SidebarHeader = memo(function SidebarHeader({ 
  pageTitle, 
  provider, 
  onClear, 
  onClose,
  showClear 
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-card">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center">
          <Bot className="w-5 h-5 text-accent-blue" />
        </div>
        <div>
          <h2 className="font-semibold text-text-primary">AI Assistant</h2>
          <p className="text-xs text-text-muted">
            {pageTitle} • {provider}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        {showClear && (
          <button
            onClick={onClear}
            className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
            title="Clear conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
          aria-label="Close AI assistant"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
});

/**
 * Model selector section
 */
const ModelSelectorSection = memo(function ModelSelectorSection({ 
  model, 
  onChange, 
  disabled 
}) {
  return (
    <div className="px-4 py-3 border-b border-border bg-surface-card/50">
      <div className="flex items-center gap-2">
        <Cpu className="w-4 h-4 text-text-muted" />
        <ModelSelector
          value={model}
          onChange={onChange}
          disabled={disabled}
          showSizes={false}
          size="sm"
          className="flex-1"
        />
      </div>
    </div>
  );
});

/**
 * Empty state for messages
 */
const EmptyState = memo(function EmptyState() {
  return (
    <div className="text-center mt-8">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-muted flex items-center justify-center">
        <Sparkles className="w-8 h-8 text-accent-blue" />
      </div>
      <p className="text-text-muted text-sm">
        Start a conversation or use quick actions below
      </p>
    </div>
  );
});

/**
 * Message Bubble Component
 */
const MessageBubble = memo(function MessageBubble({ 
  message, 
  isStreaming = false, 
  isContextGreeting = false 
}) {
  const isUser = message.role === 'user';

  const bubbleClass = useMemo(() => {
    if (isUser) {
      return 'bg-accent-blue text-white rounded-br-md';
    }
    if (isContextGreeting) {
      return 'bg-accent-muted/50 text-text-primary border border-accent-blue/20 rounded-bl-md';
    }
    return 'bg-surface-elevated text-text-primary border border-border rounded-bl-md';
  }, [isUser, isContextGreeting]);

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-accent-muted flex items-center justify-center flex-shrink-0 mt-1">
          <Bot className="w-4 h-4 text-accent-blue" />
        </div>
      )}
      
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${bubbleClass}`}>
        {message.content}
        {isStreaming && (
          <span className="inline-block w-2 h-4 ml-1 bg-accent-blue animate-pulse" />
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-xs font-semibold text-text-secondary">You</span>
        </div>
      )}
    </div>
  );
});

/**
 * Quick Action Chip Component
 */
const QuickActionChip = memo(function QuickActionChip({ 
  action, 
  onClick, 
  disabled 
}) {
  const iconClass = 'w-3.5 h-3.5';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
        bg-surface-elevated border border-border
        text-xs font-medium text-text-secondary
        hover:border-accent-blue/50 hover:text-text-primary hover:bg-accent-muted/20
        transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
      "
    >
      <ChevronRight className={iconClass} />
      <span>{action.label}</span>
    </button>
  );
});

/**
 * Quick Actions Section
 */
const QuickActionsSection = memo(function QuickActionsSection({ 
  actions, 
  onActionClick, 
  disabled 
}) {
  if (!actions?.length) return null;

  return (
    <div className="px-4 py-3 border-t border-border bg-surface-card/50">
      <p className="text-xs text-text-muted mb-2 uppercase tracking-wider font-medium">
        Quick Actions
      </p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action, idx) => (
          <QuickActionChip
            key={idx}
            action={action}
            onClick={() => onActionClick(action.prompt)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
});

/**
 * Message Input Component
 */
const MessageInput = memo(function MessageInput({ 
  value, 
  onChange, 
  onSubmit, 
  isStreaming, 
  placeholder,
  inputRef 
}) {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  }, [onSubmit]);

  return (
    <div className="p-4 border-t border-border bg-surface-card">
      <form onSubmit={onSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isStreaming}
            className="w-full input pr-10 py-3 text-base"
          />
          {isStreaming && (
            <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-accent-blue animate-pulse" />
          )}
        </div>
        <button
          type="submit"
          disabled={!value.trim() || isStreaming}
          className="btn-primary px-4 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
      <p className="text-xs text-text-muted mt-2 text-center">
        AI responses may require verification. Press ESC to close.
      </p>
    </div>
  );
});

/**
 * Messages List Component
 */
const MessagesList = memo(function MessagesList({ 
  messages, 
  streamingMessage,
  scrollRef 
}) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && !streamingMessage && <EmptyState />}

      {messages.map((msg, idx) => (
        <MessageBubble 
          key={idx} 
          message={msg} 
          isContextGreeting={msg.isContextGreeting}
        />
      ))}

      {streamingMessage && (
        <MessageBubble 
          message={{ role: 'assistant', content: streamingMessage }}
          isStreaming={true}
        />
      )}

      <div ref={scrollRef} />
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * AISidebar - Context-aware AI assistant slide-out sidebar
 * - 400px wide on desktop
 * - Full-screen on mobile
 * - Context-aware greetings and quick actions
 * - Persistent across all pages
 */
function AISidebar({ isOpen, onClose }) {
  const pageContext = usePageContext();
  
  // Initialize messages with context-aware greeting
  const [messages, setMessages] = useState(() => 
    isOpen ? [{
      role: 'assistant',
      content: pageContext.greeting,
      isContextGreeting: true,
      timestamp: new Date().toISOString(),
    }] : []
  );
  const [inputMessage, setInputMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const hasInitializedRef = useRef(isOpen);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const { isStreaming, streamingMessage, sendMessage } = useStreamingResponse();
  const { defaultModel } = useModelPreference();
  
  const [selectedModel, setSelectedModel] = useState('');
  const effectiveModel = selectedModel || defaultModel;

  // Fetch available models
  const { data: modelsData } = useQuery({
    queryKey: ['ollama-models'],
    queryFn: () => api.ai.getModels(),
    retry: false,
    staleTime: 60000,
  });

  const activeProvider = modelsData?.provider || 'ollama';

  // Initialize messages when sidebar opens - using scheduler to avoid cascading renders
  useEffect(() => {
    if (isOpen && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      // Use scheduler to defer state update to next tick
      const timer = setTimeout(() => {
        setMessages([{
          role: 'assistant',
          content: pageContext.greeting,
          isContextGreeting: true,
          timestamp: new Date().toISOString(),
        }]);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, pageContext.greeting]);

  // Auto-focus input when opened
  useAutoFocus(isOpen, inputRef);

  // Scroll to bottom on new messages
  useScrollToBottom([messages, streamingMessage], messagesEndRef);

  // Handle keyboard shortcuts
  useKeyboardShortcut('Escape', onClose, [onClose]);

  // Prevent body scroll when sidebar is open
  useScrollLock(isOpen);

  const handleSendMessage = useCallback(async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isStreaming) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    const userMsg = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);

    const contextPrompt = `[Context: User is on ${pageContext.title} page]\n\n${userMessage}`;

    await sendMessage(
      contextPrompt, 
      conversationId, 
      effectiveModel, 
      (response, newConversationId) => {
        if (response) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: response,
            timestamp: new Date().toISOString(),
          }]);
        }
        if (newConversationId) {
          setConversationId(newConversationId);
        }
      }
    );
  }, [inputMessage, isStreaming, conversationId, effectiveModel, pageContext.title, sendMessage]);

  const handleQuickAction = useCallback((prompt) => {
    setInputMessage(prompt);
    setTimeout(() => {
      handleSendMessage({ preventDefault: () => {} });
    }, 100);
  }, [handleSendMessage]);

  const handleClearConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    hasInitializedRef.current = false;
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div 
        className="fixed right-0 top-0 bottom-0 z-50 bg-surface-primary border-l border-border flex flex-col
                   w-full sm:w-[400px] animate-slide-in-right shadow-2xl"
        role="dialog"
        aria-label="AI Assistant"
        aria-modal="true"
      >
        <SidebarHeader 
          pageTitle={pageContext.title}
          provider={activeProvider}
          onClear={handleClearConversation}
          onClose={onClose}
          showClear={messages.length > 0}
        />

        <ModelSelectorSection 
          model={effectiveModel}
          onChange={setSelectedModel}
          disabled={isStreaming}
        />

        <MessagesList 
          messages={messages}
          streamingMessage={streamingMessage}
          scrollRef={messagesEndRef}
        />

        <QuickActionsSection 
          actions={pageContext?.quickActions}
          onActionClick={handleQuickAction}
          disabled={isStreaming}
        />

        <MessageInput
          value={inputMessage}
          onChange={setInputMessage}
          onSubmit={handleSendMessage}
          isStreaming={isStreaming}
          placeholder={`Ask about ${pageContext.title.toLowerCase()}...`}
          inputRef={inputRef}
        />
      </div>

      {/* Animation styles - using Tailwind arbitrary values instead of inline styles */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  );
}

export default AISidebar;
