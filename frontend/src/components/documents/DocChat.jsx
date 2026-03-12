import { useState, useRef, useEffect, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { Send, Trash2, MessageSquare, Loader2, Sparkles } from 'lucide-react';
import { colors, shadows } from '../../styles/tokens';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

/**
 * Default suggested questions for empty chat state
 * @type {string[]}
 */
const SUGGESTED_QUESTIONS = [
  'Summarize the key points',
  'What are the main topics?',
  'List important dates and numbers',
  'Explain the document structure',
];

// ═══════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════

/**
 * Formats a date string into a localized time string
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted time (e.g., "2:30 PM")
 */
function formatTime(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ═══════════════════════════════════════════════════════════════
// Sub-Components
// ═══════════════════════════════════════════════════════════════

/**
 * Animated typing indicator with bouncing dots
 * @returns {JSX.Element} Typing indicator component
 */
const TypingDots = memo(function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block w-2 h-2 rounded-full animate-bounce"
          style={{ 
            backgroundColor: colors.text.secondary,
            animationDelay: `${i * 0.15}s`, 
            animationDuration: '1s' 
          }}
        />
      ))}
    </div>
  );
});

TypingDots.displayName = 'TypingDots';

/**
 * Individual chat message bubble
 * 
 * @param {Object} props - Component props
 * @param {Object} props.message - Message data
 * @param {string} props.message.role - Message sender ('user' or 'assistant')
 * @param {string} props.message.content - Message text content
 * @param {string} [props.message.created_at] - Message timestamp
 * @returns {JSX.Element} Chat message component
 */
const ChatMessage = memo(function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  // Message bubble styles based on sender
  const bubbleStyle = isUser 
    ? { 
        backgroundColor: colors.accent.DEFAULT, 
        color: colors.text.primary,
        borderBottomRightRadius: '4px'
      }
    : { 
        backgroundColor: colors.surface.elevated, 
        color: colors.text.primary,
        borderBottomLeftRadius: '4px'
      };

  const timestampStyle = isUser 
    ? { color: 'rgba(255, 255, 255, 0.6)' }
    : { color: colors.text.muted };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className="max-w-[85%] sm:max-w-[80%] rounded-xl px-4 py-2.5"
        style={bubbleStyle}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        {message.created_at && (
          <p className="text-xs mt-1" style={timestampStyle}>
            {formatTime(message.created_at)}
          </p>
        )}
      </div>
    </div>
  );
});

ChatMessage.propTypes = {
  message: PropTypes.shape({
    role: PropTypes.oneOf(['user', 'assistant']).isRequired,
    content: PropTypes.string.isRequired,
    created_at: PropTypes.string,
  }).isRequired,
};

ChatMessage.displayName = 'ChatMessage';

/**
 * Suggested questions for empty chat state
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onSelect - Callback when a question is selected
 * @param {boolean} [props.disabled] - Whether buttons are disabled
 * @returns {JSX.Element} Suggested questions component
 */
const SuggestedQuestions = memo(function SuggestedQuestions({ onSelect, disabled }) {
  /**
   * Handles question selection
   * @param {string} question - Selected question text
   */
  const handleSelect = useCallback((question) => {
    if (!disabled) {
      onSelect(question);
    }
  }, [onSelect, disabled]);

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-8">
      {/* Icon */}
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: colors.accent.muted }}
      >
        <Sparkles size={24} style={{ color: colors.accent.DEFAULT }} />
      </div>
      
      {/* Title */}
      <h3 
        className="text-base font-semibold mb-1"
        style={{ color: colors.text.primary }}
      >
        Ask anything about this document
      </h3>
      
      {/* Subtitle */}
      <p 
        className="text-sm mb-6"
        style={{ color: colors.text.muted }}
      >
        Try one of these suggestions to get started
      </p>
      
      {/* Question buttons */}
      <div className="flex flex-wrap justify-center gap-2 max-w-md">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => handleSelect(q)}
            disabled={disabled}
            className="rounded-lg px-3 py-2 text-sm transition-all cursor-pointer border disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: colors.surface.elevated,
              color: colors.text.secondary,
              borderColor: colors.border.default,
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.backgroundColor = colors.border.default;
                e.currentTarget.style.color = colors.text.primary;
                e.currentTarget.style.borderColor = colors.accent.DEFAULT;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.surface.elevated;
              e.currentTarget.style.color = colors.text.secondary;
              e.currentTarget.style.borderColor = colors.border.default;
            }}
            aria-label={`Ask: ${q}`}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
});

SuggestedQuestions.propTypes = {
  onSelect: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

SuggestedQuestions.defaultProps = {
  disabled: false,
};

SuggestedQuestions.displayName = 'SuggestedQuestions';

/**
 * Processing banner shown when document is not ready
 * @returns {JSX.Element} Processing banner component
 */
const ProcessingBanner = memo(function ProcessingBanner() {
  return (
    <div 
      className="flex items-center gap-2 px-4 py-2.5 shrink-0 border-t"
      style={{ 
        backgroundColor: colors.warning.muted, 
        borderColor: colors.warning.border 
      }}
      role="alert"
      aria-live="polite"
    >
      <Loader2 size={14} className="animate-spin" style={{ color: colors.warning.DEFAULT }} />
      <p className="text-xs" style={{ color: colors.warning.DEFAULT }}>
        Document is still processing — chat available when ready
      </p>
    </div>
  );
});

ProcessingBanner.displayName = 'ProcessingBanner';

/**
 * Chat input form with auto-resizing textarea
 * 
 * @param {Object} props - Component props
 * @param {string} props.value - Current input value
 * @param {Function} props.onChange - Callback when input changes
 * @param {Function} props.onSubmit - Callback when form is submitted
 * @param {boolean} props.isLoading - Whether a message is being sent
 * @param {boolean} props.isDisabled - Whether input is disabled
 * @returns {JSX.Element} Chat input component
 */
const ChatInput = memo(function ChatInput({ 
  value, 
  onChange, 
  onSubmit, 
  isLoading, 
  isDisabled 
}) {
  const textareaRef = useRef(null);

  /**
   * Handles key down events for submit on Enter
   * @param {React.KeyboardEvent} e - Keyboard event
   */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }, [onSubmit]);

  /**
   * Handles input change
   * @param {React.ChangeEvent<HTMLTextAreaElement>} e - Change event
   */
  const handleChange = useCallback((e) => {
    onChange(e.target.value);
  }, [onChange]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [value]);

  const canSubmit = value.trim() && !isLoading && !isDisabled;

  // Submit button styles
  const submitButtonStyle = canSubmit 
    ? { 
        backgroundColor: colors.accent.DEFAULT, 
        color: colors.text.primary 
      }
    : { 
        backgroundColor: colors.surface.elevated, 
        color: colors.text.muted 
      };

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
      className="flex items-end gap-2 px-4 py-3 shrink-0 border-t"
      style={{ 
        borderColor: colors.border.default,
        backgroundColor: colors.surface.card 
      }}
    >
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={isDisabled ? 'Document processing...' : 'Ask about this document...'}
        disabled={isLoading || isDisabled}
        className="flex-1 text-sm rounded-lg px-3 py-2.5 outline-none transition-colors min-h-[40px] max-h-[120px] overflow-y-auto resize-none disabled:opacity-50"
        style={{
          backgroundColor: colors.surface.elevated,
          color: colors.text.primary,
          border: `1px solid ${colors.border.default}`,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = colors.accent.DEFAULT;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = colors.border.default;
        }}
        aria-label="Chat message input"
      />
      
      {/* Submit button */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors shrink-0 disabled:cursor-not-allowed"
        style={submitButtonStyle}
        onMouseEnter={(e) => {
          if (canSubmit) {
            e.currentTarget.style.backgroundColor = colors.accent.hover;
          }
        }}
        onMouseLeave={(e) => {
          if (canSubmit) {
            e.currentTarget.style.backgroundColor = colors.accent.DEFAULT;
          }
        }}
        aria-label={isLoading ? 'Sending message' : 'Send message'}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Send size={18} />
        )}
      </button>
    </form>
  );
});

ChatInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  isDisabled: PropTypes.bool.isRequired,
};

ChatInput.displayName = 'ChatInput';

/**
 * Chat header with title and clear button
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.hasMessages - Whether there are messages to clear
 * @param {Function} props.onClearChat - Callback to clear chat history
 * @returns {JSX.Element} Chat header component
 */
const ChatHeader = memo(function ChatHeader({ hasMessages, onClearChat }) {
  /**
   * Handles clear chat click
   */
  const handleClear = useCallback(() => {
    onClearChat();
  }, [onClearChat]);

  return (
    <div 
      className="flex items-center justify-between px-4 py-3 shrink-0 border-b"
      style={{ 
        borderColor: colors.border.default,
        backgroundColor: colors.surface.card 
      }}
    >
      {/* Title */}
      <div className="flex items-center gap-2">
        <MessageSquare size={18} style={{ color: colors.accent.DEFAULT }} />
        <h2 
          className="text-sm font-semibold"
          style={{ color: colors.text.primary }}
        >
          Document Q&A
        </h2>
      </div>
      
      {/* Clear button */}
      {hasMessages && (
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors"
          style={{ 
            color: colors.text.muted,
            backgroundColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = colors.danger.DEFAULT;
            e.currentTarget.style.backgroundColor = colors.danger.muted;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = colors.text.muted;
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Clear chat history"
          aria-label="Clear chat history"
        >
          <Trash2 size={14} />
          <span>Clear</span>
        </button>
      )}
    </div>
  );
});

ChatHeader.propTypes = {
  hasMessages: PropTypes.bool.isRequired,
  onClearChat: PropTypes.func.isRequired,
};

ChatHeader.displayName = 'ChatHeader';

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════

/**
 * DocChat - Document chat interface with AI Q&A
 * 
 * @param {Object} props - Component props
 * @param {Object} [props.document] - Current document data
 * @param {Array} [props.chatHistory] - Array of chat messages
 * @param {Function} props.onChat - Callback when user sends a message
 * @param {Function} props.onClearChat - Callback to clear chat history
 * @param {boolean} [props.isLoading] - Whether AI is generating a response
 * @param {boolean} [props.isDocumentReady] - Whether document is ready for chat
 * @returns {JSX.Element} Document chat component
 */
function DocChat({ 
  document, 
  chatHistory, 
  onChat, 
  onClearChat, 
  isLoading, 
  isDocumentReady = true 
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const hasMessages = chatHistory && chatHistory.length > 0;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isLoading]);

  /**
   * Handles message submission
   */
  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || !isDocumentReady) return;
    onChat(trimmed);
    setInput('');
  }, [input, isLoading, isDocumentReady, onChat]);

  /**
   * Handles suggested question selection
   * @param {string} question - Selected question
   */
  const handleSuggestionSelect = useCallback((question) => {
    if (isLoading) return;
    onChat(question);
  }, [isLoading, onChat]);

  /**
   * Handles input change
   * @param {string} value - New input value
   */
  const handleInputChange = useCallback((value) => {
    setInput(value);
  }, []);

  // Container styles
  const containerStyle = {
    backgroundColor: colors.surface.card,
    borderColor: colors.border.default,
    boxShadow: shadows.card,
  };

  return (
    <div 
      className="flex flex-col h-full rounded-xl overflow-hidden border"
      style={containerStyle}
      role="region"
      aria-label="Document chat"
    >
      {/* Header */}
      <ChatHeader hasMessages={hasMessages} onClearChat={onClearChat} />

      {/* Messages area */}
      <div 
        className="flex-1 overflow-y-auto px-4 py-4 min-h-0"
        style={{ backgroundColor: colors.surface.primary }}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {hasMessages ? (
          <>
            {chatHistory.map((msg, idx) => (
              <ChatMessage key={`${msg.role}-${idx}`} message={msg} />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-3">
                <div 
                  className="rounded-xl"
                  style={{ 
                    backgroundColor: colors.surface.elevated,
                    borderBottomLeftRadius: '4px'
                  }}
                >
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <SuggestedQuestions 
            onSelect={handleSuggestionSelect} 
            disabled={isLoading || !isDocumentReady}
          />
        )}
      </div>

      {/* Processing banner */}
      {!isDocumentReady && <ProcessingBanner />}

      {/* Input area */}
      <ChatInput
        value={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        isDisabled={!isDocumentReady}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PropTypes
// ═══════════════════════════════════════════════════════════════

DocChat.propTypes = {
  document: PropTypes.object,
  chatHistory: PropTypes.arrayOf(PropTypes.shape({
    role: PropTypes.oneOf(['user', 'assistant']).isRequired,
    content: PropTypes.string.isRequired,
    created_at: PropTypes.string,
  })),
  onChat: PropTypes.func.isRequired,
  onClearChat: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  isDocumentReady: PropTypes.bool,
};

DocChat.defaultProps = {
  document: null,
  chatHistory: [],
  isLoading: false,
  isDocumentReady: true,
};

// ═══════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════

export default memo(DocChat);
