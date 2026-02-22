import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Send, CheckCircle, Bot, Sparkles, Cpu } from 'lucide-react';
import { api } from '../api/client';
import ChatInterface from '../components/ai/ChatInterface';
import ModelSelector from '../components/ai/ModelSelector';
import { useStreamingResponse } from '../hooks/useStreamingResponse';
import { useModelPreference } from '../hooks/useModelPreference';
import { PageHeader } from '../components/shared';

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);

  const { isStreaming, streamingMessage, sendMessage } = useStreamingResponse();
  const { defaultModel } = useModelPreference();

  const [selectedModel, setSelectedModel] = useState('');
  const effectiveModel = selectedModel || defaultModel;

  const { data: modelsData } = useQuery({
    queryKey: ['ollama-models'],
    queryFn: () => api.ai.getModels(),
    retry: false
  });

  const activeProvider = modelsData?.provider || 'ollama';
  const providerLabel = {
    groq: 'Groq Cloud',
    anthropic: 'Anthropic Claude',
    ollama: 'Ollama Local',
    openclaw: 'OpenClaw Gateway',
  }[activeProvider] || activeProvider;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isStreaming) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    await sendMessage(userMessage, conversationId, effectiveModel, (response, newConversationId) => {
      if (response) {
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      }
      if (newConversationId) {
        setConversationId(newConversationId);
      }
    });
  };

  return (
    <div className="h-full flex flex-col page-transition-wrapper">
      {/* Header */}
      <div className="bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 p-4 sm:p-6">
        <PageHeader
          title="AI Assistant"
          subtitle={`Powered by ${providerLabel} — Ask about leads, pricing, materials, and code compliance`}
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">CTL Context Active</span>
          </div>
        </PageHeader>

        {/* Model Selector */}
        <div className="flex items-center gap-3 mt-4 p-3 rounded-xl bg-surface-100 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700/50 w-fit">
          <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-accent-600 dark:text-accent-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Model</label>
            <ModelSelector
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={isStreaming}
              showSizes={true}
              className="text-sm py-1 border-0 bg-transparent focus:ring-0 p-0 font-medium text-surface-900 dark:text-surface-100"
            />
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 overflow-hidden bg-surface-50 dark:bg-surface-925">
        <ChatInterface
          messages={messages}
          streamingMessage={streamingMessage}
          isStreaming={isStreaming}
        />
      </div>

      {/* Input Form */}
      <div className="bg-surface-50 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700 p-4">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about leads, pricing, materials, code compliance..."
                disabled={isStreaming}
                className="input w-full pr-12 py-3.5 text-base"
              />
              {isStreaming && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Sparkles className="w-5 h-5 text-accent-500 animate-pulse" />
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!inputMessage.trim() || isStreaming}
              className="btn-primary flex items-center gap-2 px-6 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
          <p className="text-xs text-surface-400 dark:text-surface-500 mt-2 text-center">
            AI responses are generated based on your data and may require verification.
          </p>
        </form>
      </div>
    </div>
  );
}
