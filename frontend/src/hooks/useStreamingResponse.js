import { useState, useCallback } from 'react';

export function useStreamingResponse() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');

  const sendMessage = useCallback(async (message, conversationId, model, onComplete) => {
    setIsStreaming(true);
    setStreamingMessage('');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message, conversationId, model })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullMessage = '';
      let resultConversationId = conversationId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.chunk) {
                fullMessage += data.chunk;
                setStreamingMessage(fullMessage);
              }
              if (data.done) {
                if (data.conversationId) {
                  resultConversationId = data.conversationId;
                }
                setIsStreaming(false);
                if (onComplete) {
                  onComplete(fullMessage, resultConversationId);
                }
                return;
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      setIsStreaming(false);
      if (onComplete) {
        onComplete(null, conversationId);
      }
    }
  }, []);

  return {
    isStreaming,
    streamingMessage,
    sendMessage
  };
}
