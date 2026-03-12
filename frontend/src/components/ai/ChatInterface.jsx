/**
 * ChatInterface Component
 * AI Assistant chat component with accessibility features
 * 
 * @module components/ai/ChatInterface
 */

import { useEffect, useRef, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Bot, Sparkles, MessageSquare, FileText, Calculator, Zap, Cpu } from 'lucide-react';
import { colors, shadows, radius, animation } from '../../styles/tokens';

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
    <motion.button
      whileHover={{ scale: 1.02, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
      whileTap={{ scale: 0.98 }}
      type="button"
      onClick={() => onClick?.(action.prompt)}
      className="flex items-center gap-3 px-4 py-4 rounded-2xl text-left transition-all duration-200 focus:outline-none focus-visible:ring-2"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        border: `1px solid ${colors.border.default}`,
        color: colors.text.secondary,
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="w-10 h-10 rounded-xl bg-surface-elevated flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5" style={{ color: colors.accent.blue }} aria-hidden="true" />
      </div>
      <span className="text-sm font-bold text-surface-100">{action.label}</span>
    </motion.button>
  );
});

/**
 * Empty state when no messages exist
 */
const EmptyState = memo(function EmptyState({ onSuggestionClick }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
        className="w-20 h-20 mb-6 rounded-[28px] bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-xl shadow-accent-500/20 relative"
      >
        <Zap className="w-10 h-10 text-white" fill="currentColor" />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-[-8px] rounded-[32px] border-2 border-accent-500/20" 
        />
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-2xl font-bold mb-3 text-surface-50">
          OpenSite Intelligence
        </h3>
        <p className="text-sm mb-10 max-w-xs mx-auto text-surface-400 leading-relaxed">
          Ask about lead analysis, DFW plumbing codes, pricing strategies, or material takeoffs.
        </p>
      </motion.div>
      
      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg"
      >
        {SUGGESTED_ACTIONS.map((action) => (
          <SuggestedAction 
            key={action.label} 
            action={action} 
            onClick={onSuggestionClick} 
          />
        ))}
      </motion.div>
    </div>
  );
});

/**
 * User message bubble
 */
const UserMessage = memo(function UserMessage({ content }) {
  return (
    <motion.div 
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="flex gap-3 justify-end items-end mb-4"
    >
      <div 
        className="max-w-[85%] sm:max-w-[70%] rounded-[20px] rounded-br-md px-5 py-3.5 text-white shadow-lg"
        style={{ 
          background: `linear-gradient(135deg, ${colors.accent.blue}, ${colors.accent.hover})`,
          boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
        }}
      >
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed font-medium">{content}</p>
      </div>
    </motion.div>
  );
});

/**
 * Assistant message bubble
 */
const AssistantMessage = memo(function AssistantMessage({ content, isStreaming }) {
  return (
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="flex gap-3 justify-start items-start mb-6"
    >
      <div 
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-md"
        style={{ 
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}
      >
        <Bot className="w-5 h-5 text-accent-blue" />
      </div>
      <div 
        className="max-w-[88%] sm:max-w-[80%] rounded-[22px] rounded-tl-md px-5 py-4 relative group"
        style={{ 
          backgroundColor: 'rgba(24, 28, 36, 0.5)', 
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(10px)',
          color: colors.text.primary,
        }}
      >
        <div className="absolute -top-3 left-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] font-bold uppercase tracking-widest text-accent-500 bg-surface-primary px-2 py-0.5 rounded-full border border-accent-500/20">
            AI Assistant
          </span>
        </div>
        <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
          {content}
          {isStreaming && (
            <span className="inline-flex gap-1 ml-2 items-center align-middle">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-bounce" style={{ animationDelay: '200ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-bounce" style={{ animationDelay: '400ms' }} />
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
});

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

const ChatInterface = memo(function ChatInterface({ 
  messages, 
  streamingMessage, 
  isStreaming, 
  onSuggestionClick 
}) {
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  const hasMessages = messages.length > 0 || Boolean(streamingMessage);

  return (
    <div 
      ref={chatContainerRef}
      className="flex-1 overflow-y-auto px-4 py-6 sm:p-8 space-y-2 scrollbar-hide"
      role="log"
      aria-live="polite"
      aria-label="Chat history"
    >
      {!hasMessages && <EmptyState onSuggestionClick={onSuggestionClick} />}

      <AnimatePresence initial={false}>
        {messages.map((msg, idx) => (
          msg.role === 'user' 
            ? <UserMessage key={`user-${idx}`} content={msg.content} />
            : <AssistantMessage key={`ai-${idx}`} content={msg.content} />
        ))}
        
        {streamingMessage && (
          <AssistantMessage 
            key="streaming"
            content={streamingMessage} 
            isStreaming={true} 
          />
        )}
      </AnimatePresence>

      <div ref={messagesEndRef} className="h-4" />
    </div>
  );
});

ChatInterface.displayName = 'ChatInterface';

export { ChatInterface };
export default ChatInterface;
