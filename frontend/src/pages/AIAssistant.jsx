import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Send, CheckCircle, Bot } from 'lucide-react';
import { api } from '../api/client';
import ChatInterface from '../components/ai/ChatInterface';
import { useStreamingResponse } from '../hooks/useStreamingResponse';

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [selectedModel, setSelectedModel] = useState('');

  const { isStreaming, streamingMessage, sendMessage } = useStreamingResponse();

  // Fetch available models
  const { data: modelsData } = useQuery({
    queryKey: ['ollama-models'],
    queryFn: () => api.ai.getModels(),
    retry: false
  });

  const availableModels = modelsData?.models || [];
  const defaultModel = modelsData?.defaultModel || '';

  // Set default model once loaded
  if (!selectedModel && defaultModel) {
    setSelectedModel(defaultModel);
  }

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isStreaming) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    // Add user message to display
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    // Send message and stream response with selected model
    await sendMessage(userMessage, conversationId, selectedModel, (response, newConversationId) => {
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
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Assistant</h1>
            <p className="text-sm text-gray-600 mt-1">
              Powered by Ollama - Ask about leads, pricing, materials, and code compliance
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span>CTL Context Active</span>
          </div>
        </div>

        {/* Model Selector */}
        {availableModels.length > 0 && (
          <div className="flex items-center gap-3">
            <Bot className="w-4 h-4 text-gray-500" />
            <label className="text-sm text-gray-600">Model:</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={isStreaming}
              className="input text-sm py-1"
            >
              {availableModels.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name} ({(model.size / (1024 ** 3)).toFixed(1)}GB)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Chat Interface */}
      <div className="flex-1 overflow-hidden bg-gray-50">
        <ChatInterface
          messages={messages}
          streamingMessage={streamingMessage}
          isStreaming={isStreaming}
        />
      </div>

      {/* Input Form */}
      <div className="bg-white border-t border-gray-200 p-4">
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
