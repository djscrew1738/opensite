import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, MessageSquare, Loader2, Sparkles } from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  'Summarize the key points',
  'What are the main topics?',
  'List important dates and numbers',
  'Explain the document structure',
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block w-2 h-2 rounded-full"
          style={{
            backgroundColor: '#94A3B8',
            animation: `docChatBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes docChatBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function formatTime(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className="max-w-[80%] rounded-xl px-4 py-2.5"
        style={{
          backgroundColor: isUser ? '#3B82F6' : '#181C24',
          color: isUser ? '#FFFFFF' : '#F1F5F9',
        }}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        {message.created_at && (
          <p
            className="text-[10px] mt-1"
            style={{ color: isUser ? 'rgba(255,255,255,0.6)' : '#64748B' }}
          >
            {formatTime(message.created_at)}
          </p>
        )}
      </div>
    </div>
  );
}

function SuggestedQuestions({ onSelect }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-8">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}
      >
        <Sparkles size={24} style={{ color: '#3B82F6' }} />
      </div>
      <h3 className="text-base font-semibold mb-1" style={{ color: '#F1F5F9' }}>
        Ask anything about this document
      </h3>
      <p className="text-sm mb-6" style={{ color: '#64748B' }}>
        Try one of these suggestions to get started
      </p>
      <div className="flex flex-wrap justify-center gap-2 max-w-md">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onSelect(q)}
            className="rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer"
            style={{
              backgroundColor: '#181C24',
              color: '#94A3B8',
              border: '1px solid #1F2430',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1F2430';
              e.currentTarget.style.color = '#F1F5F9';
              e.currentTarget.style.borderColor = '#3B82F6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#181C24';
              e.currentTarget.style.color = '#94A3B8';
              e.currentTarget.style.borderColor = '#1F2430';
            }}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DocChat({ document, chatHistory, onChat, onClearChat, isLoading }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const hasMessages = chatHistory && chatHistory.length > 0;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isLoading]);

  function handleSubmit(e) {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onChat(trimmed);
    setInput('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleSuggestionSelect(question) {
    if (isLoading) return;
    onChat(question);
  }

  return (
    <div
      className="flex flex-col h-full rounded-xl overflow-hidden"
      style={{
        backgroundColor: '#111318',
        border: '1px solid #1F2430',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{
          borderBottom: '1px solid #1F2430',
          backgroundColor: '#111318',
        }}
      >
        <div className="flex items-center gap-2">
          <MessageSquare size={18} style={{ color: '#3B82F6' }} />
          <h2 className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>
            Document Q&A
          </h2>
        </div>
        {hasMessages && (
          <button
            type="button"
            onClick={onClearChat}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer"
            style={{
              color: '#64748B',
              backgroundColor: 'transparent',
              border: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#EF4444';
              e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#64748B';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Clear chat history"
          >
            <Trash2 size={14} />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        {hasMessages ? (
          <>
            {chatHistory.map((msg, idx) => (
              <ChatMessage key={idx} message={msg} />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-3">
                <div
                  className="rounded-xl"
                  style={{ backgroundColor: '#181C24' }}
                >
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <SuggestedQuestions onSelect={handleSuggestionSelect} />
        )}
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-4 py-3 shrink-0"
        style={{
          borderTop: '1px solid #1F2430',
          backgroundColor: '#111318',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about this document..."
          disabled={isLoading}
          className="flex-1 text-sm rounded-lg px-3 py-2.5 outline-none transition-colors"
          style={{
            backgroundColor: '#181C24',
            color: '#F1F5F9',
            border: '1px solid #1F2430',
            opacity: isLoading ? 0.5 : 1,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#3B82F6';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#1F2430';
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors shrink-0 cursor-pointer"
          style={{
            backgroundColor: input.trim() && !isLoading ? '#3B82F6' : '#181C24',
            color: input.trim() && !isLoading ? '#FFFFFF' : '#64748B',
            border: 'none',
          }}
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </form>
    </div>
  );
}
