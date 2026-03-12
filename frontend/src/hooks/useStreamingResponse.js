import { useState, useCallback, useRef } from 'react';

export function useStreamingResponse() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(async (message, conversationId, model, onComplete, options = {}) => {
    setIsStreaming(true);
    setStreamingMessage('');
    setError(null);

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const endpoint = options.isSmart ? '/api/ai/smart-chat/stream' : '/api/ai/chat/stream';

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message, conversationId, model, history: options.history, options }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${response.status}`);
      }

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
              
              if (data.error) {
                throw new Error(data.error);
              }

              if (data.chunk) {
                fullMessage += data.chunk;
                setStreamingMessage(fullMessage);
              }
              if (data.done) {
                if (data.conversationId) {
                  resultConversationId = data.conversationId;
                }
                setIsStreaming(false);
                abortControllerRef.current = null;
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
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Streaming aborted by user');
      } else {
        console.error('Streaming error:', err);
        setError(err.message);
        if (onComplete) {
          onComplete(null, conversationId, err);
        }
      }
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, []);

  return {
    isStreaming,
    streamingMessage,
    error,
    sendMessage,
    stopStreaming
  };
}
