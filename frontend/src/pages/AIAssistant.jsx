import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Send, CheckCircle, Bot } from 'lucide-react';
import { api } from '../api/client';
import ChatInterface from '../components/ai/ChatInterface';
import ModelSelector from '../components/ai/ModelSelector';
import { useStreamingResponse } from '../hooks/useStreamingResponse';
import { useModelPreference } from '../hooks/useModelPreference';

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);

  const { isStreaming, streamingMessage, sendMessage } = useStreamingResponse();
  const { defaultModel } = useModelPreference();

  // Use defaultModel directly, or keep the previously selected model
  const [selectedModel, setSelectedModel] = useState('');
  const effectiveModel = selectedModel || defaultModel;

  // Fetch available models and active provider
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

    // Add user message to display
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    // Send message and stream response with selected model
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-surface-900 dark:text-surface-100 tracking-tight">AI Assistant</h1>
            <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
              Powered by {providerLabel} — Ask about leads, pricing, materials, and code compliance
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span>CTL Context Active</span>
          </div>
        </div>

        {/* Model Selector */}
        <div className="flex items-center gap-3">
          <Bot className="w-4 h-4 text-surface-500" />
          <label className="text-sm text-surface-600 dark:text-surface-400">Model:</label>
          <ModelSelector
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={isStreaming}
            showSizes={true}
            className="text-sm py-1"
          />
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
          <div className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about leads, pricing, materials, code compliance..."
              disabled={isStreaming}
              className="input flex-1"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isStreaming}
              className="btn-primary flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
