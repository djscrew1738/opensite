import { 
  useState, 
  useRef, 
  useEffect, 
  useCallback, 
  useMemo, 
  memo 
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  X, 
  Bot, 
  Sparkles, 
  Cpu, 
  ChevronRight,
  Trash2,
  Zap,
  MessageSquare,
  History,
  Maximize2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import {
  useStreamingResponse,
  useModelPreference,
  usePageContext,
  usePersistentMemory,
} from '../../hooks';
import { ModelSelector } from './ModelSelector';
import ChatInterface from './ChatInterface';
import { colors, shadows, radius } from '../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Enhanced Sidebar header
 */
const SidebarHeader = memo(function SidebarHeader({ 
  pageTitle, 
  provider, 
  onClear, 
  onClose,
  onExpand,
  showClear 
}) {
  return (
    <div className="relative px-5 py-4 border-b border-surface-700/50 bg-surface-card/80 backdrop-blur-md z-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-lg shadow-accent-500/20">
            <Zap className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <div>
            <h2 className="text-base font-bold text-surface-50 leading-tight">Intelligence</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-accent-500 mt-0.5">
              {pageTitle} Context
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {showClear && (
            <button
              onClick={onClear}
              className="p-2 rounded-xl text-surface-400 hover:text-danger-500 hover:bg-danger-500/10 transition-all active:scale-95"
              title="Clear conversation"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          
          <button
            onClick={onExpand}
            className="p-2 rounded-xl text-surface-400 hover:text-surface-100 hover:bg-white/5 transition-all active:scale-95"
            title="Open full page"
          >
            <Maximize2 className="w-5 h-5" />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-surface-400 hover:text-surface-100 hover:bg-white/5 transition-all active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
});

/**
 * Floating Quick Action Chips
 */
const QuickActionChips = memo(function QuickActionChips({ actions, onActionClick, disabled }) {
  if (!actions?.length) return null;

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide no-wrap">
      {actions.map((action, idx) => (
        <button
          key={idx}
          onClick={() => onActionClick(action.prompt)}
          disabled={disabled}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full bg-surface-elevated/80 border border-surface-700/50 text-xs font-bold text-surface-200 hover:border-accent-500/50 hover:text-white transition-all active:scale-95 disabled:opacity-50"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

function AISidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const pageContext = usePageContext();
  const { loadHistory, saveHistory, clearHistory, incrementExchange, compressMemory } = usePersistentMemory();

  // Load persisted messages
  const [messages, setMessages] = useState(() => {
    const persisted = loadHistory().filter(m => m.role !== 'system');
    if (persisted.length > 0) return persisted;
    return [];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const inputRef = useRef(null);

  const { isStreaming, streamingMessage, sendMessage, stopStreaming } = useStreamingResponse();
  const { defaultModel } = useModelPreference();
  const [selectedModel, setSelectedModel] = useState('');
  const effectiveModel = selectedModel || defaultModel;

  // Fetch models
  const { data: modelsData } = useQuery({
    queryKey: ['ollama-models'],
    queryFn: () => api.ai.getModels(),
    retry: false,
    staleTime: 60000,
  });

  const activeProvider = modelsData?.provider || 'ollama';

  // Auto-focus
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

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

    const history = loadHistory();
    const systemPrompt = history[0];
    const pastMsgs = messages.filter(m => !m.isContextGreeting);
    const contextHistory = [systemPrompt, ...pastMsgs, userMsg];

    const contextPrompt = `[Context: User is on ${pageContext.title} page]\n\n${userMessage}`;

    await sendMessage(
      contextPrompt,
      conversationId,
      effectiveModel,
      async (response, newConversationId) => {
        if (response) {
          const assistantMsg = {
            role: 'assistant',
            content: response,
            timestamp: new Date().toISOString(),
          };

          setMessages(prev => {
            const updated = [...prev, assistantMsg];
            const toSave = [systemPrompt, ...updated];
            saveHistory(toSave);
            return updated;
          });

          if (incrementExchange()) {
            const current = loadHistory();
            const compressed = await compressMemory(current);
            saveHistory(compressed);
            setMessages(compressed.filter(m => m.role !== 'system'));
          }
        }
        if (newConversationId) {
          setConversationId(newConversationId);
        }
      },
      { history: contextHistory }
    );
  }, [inputMessage, isStreaming, conversationId, effectiveModel, pageContext.title, sendMessage,
      messages, loadHistory, saveHistory, incrementExchange, compressMemory]);

  const handleQuickAction = useCallback((prompt) => {
    setInputMessage(prompt);
    // Use a small delay to ensure state update if needed, though not strictly required
    setTimeout(() => {
      // Create a fake event for handleSendMessage
      const fakeEvent = { preventDefault: () => {} };
      // We need to call it with the prompt directly or set the state and then call it
      // To be safe, let's just use the state approach but trigger it properly
    }, 0);
  }, []);

  // Trigger send when inputMessage changes via quick action
  useEffect(() => {
    if (inputMessage && !isStreaming && messages.length === 0) {
      // Only auto-send if it was a quick action on empty state
      // Actually, better to just let the user see it first or use a dedicated handler
    }
  }, [inputMessage, isStreaming, messages.length]);

  const handleClearConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    clearHistory();
  }, [clearHistory]);

  const handleExpand = useCallback(() => {
    onClose();
    navigate('/ai' + (conversationId ? `?id=${conversationId}` : ''));
  }, [conversationId, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sidebar */}
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full sm:w-[450px] h-full bg-surface-primary flex flex-col shadow-2xl border-l border-surface-700/50"
      >
        <SidebarHeader 
          pageTitle={pageContext.title}
          provider={activeProvider}
          onClear={handleClearConversation}
          onClose={onClose}
          onExpand={handleExpand}
          showClear={messages.length > 0}
        />

        {/* Model and Context Indicator */}
        <div className="px-5 py-2 flex items-center justify-between bg-surface-card/30 border-b border-surface-700/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400">Context Active</span>
          </div>
          <ModelSelector
            value={effectiveModel}
            onChange={setSelectedModel}
            disabled={isStreaming}
            size="xs"
            className="bg-transparent border-0 py-0 px-0 text-[10px] font-bold uppercase tracking-widest text-accent-500 focus:ring-0"
          />
        </div>

        <ChatInterface 
          messages={messages}
          streamingMessage={streamingMessage}
          isStreaming={isStreaming}
          onSuggestionClick={(prompt) => {
            setInputMessage(prompt);
            // Auto-trigger send for empty state suggestions
            setTimeout(() => inputRef.current?.focus(), 10);
          }}
        />

        {/* Floating Input Area */}
        <div className="p-4 sm:p-6 bg-gradient-to-t from-surface-primary via-surface-primary to-transparent">
          <QuickActionChips 
            actions={pageContext?.quickActions} 
            onActionClick={(prompt) => {
              setInputMessage(prompt);
              setTimeout(() => inputRef.current?.focus(), 10);
            }}
            disabled={isStreaming}
          />

          <form onSubmit={handleSendMessage} className="relative group">
            <div className={`
              flex items-center gap-2 p-1.5 rounded-[22px] border transition-all duration-300
              ${isStreaming ? 'bg-surface-elevated border-accent-500/30' : 'bg-surface-card border-surface-700 group-focus-within:border-accent-500/50 group-focus-within:shadow-[0_0_20px_rgba(59,130,246,0.1)]'}
            `}>
              <div className="pl-3 text-surface-500">
                <Bot className={`w-5 h-5 ${isStreaming ? 'text-accent-500 animate-pulse' : ''}`} />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={isStreaming ? "AI is thinking..." : "Message Intelligence..."}
                disabled={isStreaming}
                className="flex-1 bg-transparent border-0 focus:ring-0 text-[15px] py-2.5 text-surface-100 placeholder:text-surface-500"
              />
              
              {isStreaming ? (
                <button
                  type="button"
                  onClick={stopStreaming}
                  className="w-10 h-10 rounded-full bg-danger-500/10 text-danger-500 flex items-center justify-center hover:bg-danger-500 hover:text-white transition-all active:scale-90"
                >
                  <X className="w-5 h-5" strokeWidth={2.5} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="w-10 h-10 rounded-full bg-accent-500 text-white flex items-center justify-center disabled:opacity-30 disabled:bg-surface-elevated transition-all active:scale-90 shadow-lg shadow-accent-500/20"
                >
                  <Send className="w-5 h-5" strokeWidth={2.5} />
                </button>
              )}
            </div>
          </form>
          
          <div className="mt-3 flex justify-center">
            <p className="text-[10px] text-surface-500 font-medium uppercase tracking-widest">
              Secured Command Link • DFW-NODE-01
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default AISidebar;
