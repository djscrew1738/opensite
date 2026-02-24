import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Send, X, Bot, Sparkles, Cpu, ChevronRight, 
  MessageSquare, Calculator, FileText, Users, 
  ClipboardList, TrendingUp, Wrench, Calendar
} from 'lucide-react';
import { api } from '../../api/client';
import { 
  useStreamingResponse, 
  useModelPreference, 
  usePageContext,
  useAIStatus 
} from '../../hooks';
import { ModelSelector } from './ModelSelector';

/**
 * AISidebar - Context-aware AI assistant slide-out sidebar
 * - 400px wide on desktop
 * - Full-screen on mobile
 * - Context-aware greetings and quick actions
 * - Persistent across all pages
 */
export default function AISidebar({ isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const { isStreaming, streamingMessage, sendMessage } = useStreamingResponse();
  const { defaultModel } = useModelPreference();
  const pageContext = usePageContext();
  
  const [selectedModel, setSelectedModel] = useState('');
  const effectiveModel = selectedModel || defaultModel;

  const { data: modelsData } = useQuery({
    queryKey: ['ollama-models'],
    queryFn: () => api.ai.getModels(),
    retry: false,
    staleTime: 60000,
  });

  const activeProvider = modelsData?.provider || 'ollama';

  // Initialize with context-aware greeting when opened
  useEffect(() => {
    if (isOpen && !hasInitialized) {
      // Add context-aware greeting as first assistant message
      const greeting = {
        role: 'assistant',
        content: pageContext.greeting,
        isContextGreeting: true,
        timestamp: new Date().toISOString(),
      };
      setMessages([greeting]);
      setHasInitialized(true);
    }
  }, [isOpen, hasInitialized, pageContext.greeting]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      // Optional: clear conversation after a delay or keep it
      // setHasInitialized(false);
    }
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

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

    // Include page context in the request
    const contextPrompt = `[Context: User is on ${pageContext.title} page]\n\n${userMessage}`;

    await sendMessage(contextPrompt, conversationId, effectiveModel, (response, newConversationId) => {
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
    });
  }, [inputMessage, isStreaming, conversationId, effectiveModel, pageContext.title, sendMessage]);

  const handleQuickAction = useCallback((prompt) => {
    setInputMessage(prompt);
    // Auto-submit after a brief delay
    setTimeout(() => {
      handleSendMessage({ preventDefault: () => {} });
    }, 100);
  }, [handleSendMessage]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setHasInitialized(false);
  }, []);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div 
        className="fixed right-0 top-0 bottom-0 z-50 bg-surface-primary border-l border-border flex flex-col
                   w-full sm:w-[400px] animate-slideInRight shadow-2xl"
        role="dialog"
        aria-label="AI Assistant"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center">
              <Bot className="w-5 h-5 text-accent-blue" />
            </div>
            <div>
              <h2 className="font-semibold text-text-primary">AI Assistant</h2>
              <p className="text-xs text-text-muted">
                {pageContext.title} • {activeProvider}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Clear chat button */}
            {messages.length > 0 && (
              <button
                onClick={clearConversation}
                className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
                title="Clear conversation"
              >
                <span className="text-xs">Clear</span>
              </button>
            )}
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
              aria-label="Close AI assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Model Selector */}
        <div className="px-4 py-3 border-b border-border bg-surface-card/50">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-text-muted" />
            <ModelSelector
              value={effectiveModel}
              onChange={setSelectedModel}
              disabled={isStreaming}
              showSizes={false}
              size="sm"
              className="flex-1"
            />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !streamingMessage && (
            <div className="text-center mt-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-muted flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-accent-blue" />
              </div>
              <p className="text-text-muted text-sm">
                Start a conversation or use quick actions below
              </p>
            </div>
          )}

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

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {pageContext?.quickActions?.length > 0 && (
          <div className="px-4 py-3 border-t border-border bg-surface-card/50">
            <p className="text-xs text-text-muted mb-2 uppercase tracking-wider font-medium">
              Quick Actions
            </p>
            <div className="flex flex-wrap gap-2">
              {pageContext.quickActions.map((action, idx) => (
                <QuickActionChip
                  key={idx}
                  action={action}
                  onClick={() => handleQuickAction(action.prompt)}
                  disabled={isStreaming}
                />
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border bg-surface-card">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Ask about ${pageContext.title.toLowerCase()}...`}
                disabled={isStreaming}
                className="w-full input pr-10 py-3 text-base"
              />
              {isStreaming && (
                <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-accent-blue animate-pulse" />
              )}
            </div>
            <button
              type="submit"
              disabled={!inputMessage.trim() || isStreaming}
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
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  );
}

/**
 * Message Bubble Component
 */
function MessageBubble({ message, isStreaming, isContextGreeting }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-accent-muted flex items-center justify-center flex-shrink-0 mt-1">
          <Bot className="w-4 h-4 text-accent-blue" />
        </div>
      )}
      
      <div
        className={`
          max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${isUser 
            ? 'bg-accent-blue text-white rounded-br-md' 
            : isContextGreeting
              ? 'bg-accent-muted/50 text-text-primary border border-accent-blue/20 rounded-bl-md'
              : 'bg-surface-elevated text-text-primary border border-border rounded-bl-md'
          }
        `}
      >
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
}

/**
 * Quick Action Chip Component
 */
function QuickActionChip({ action, onClick, disabled }) {
  const icons = {
    'Score': TrendingUp,
    'Draft': MessageSquare,
    'Estimate': Calculator,
    'Analyze': TrendingUp,
    'Check': FileText,
    'Schedule': Calendar,
    'Materials': Wrench,
    'Help': MessageSquare,
    'Search': FileText,
    'Organize': ClipboardList,
    'Extract': FileText,
    'Configure': Wrench,
    'Troubleshoot': Wrench,
    'Summary': ClipboardList,
    'Priorities': TrendingUp,
    'Overdue': Calendar,
  };

  // Find matching icon or default
  const IconKey = Object.keys(icons).find(key => 
    action.label.toLowerCase().includes(key.toLowerCase())
  );
  const Icon = icons[IconKey] || ChevronRight;

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
      <Icon className="w-3.5 h-3.5" />
      <span>{action.label}</span>
    </button>
  );
}
