import { useCallback, useRef } from 'react';

const STORAGE_KEY = 'max_chat_history';
const MAX_HISTORY_MESSAGES = 20;
const COMPRESS_AFTER_EXCHANGES = 10;

export const MAX_SYSTEM_PROMPT = {
  role: 'system',
  content: `You are MAX, chief of staff for CTL Plumbing LLC and Sami Customs.
Owner: Paco — Master Plumber M-43106, DFW metro.
You remember everything discussed in this conversation.
Be direct. No filler.`,
};

export function usePersistentMemory() {
  const exchangeCountRef = useRef(0);

  const loadHistory = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const msgs = saved ? JSON.parse(saved) : [];
      // Always ensure system prompt is first
      if (msgs.length === 0 || msgs[0]?.role !== 'system') {
        return [MAX_SYSTEM_PROMPT, ...msgs];
      }
      return msgs;
    } catch {
      return [MAX_SYSTEM_PROMPT];
    }
  }, []);

  const saveHistory = useCallback((fullHistory) => {
    try {
      // Strip system prompt before saving — re-injected on load
      const toSave = fullHistory
        .filter(m => m.role !== 'system')
        .slice(-MAX_HISTORY_MESSAGES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // Storage quota exceeded — clear and retry
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    exchangeCountRef.current = 0;
  }, []);

  // Returns true every COMPRESS_AFTER_EXCHANGES calls (time to compress)
  const incrementExchange = useCallback(() => {
    exchangeCountRef.current += 1;
    return exchangeCountRef.current % COMPRESS_AFTER_EXCHANGES === 0;
  }, []);

  // Compress history to a summary + last 5 messages to reduce context size
  const compressMemory = useCallback(async (fullHistory) => {
    const compressionPrompt =
      'Summarize the key facts, decisions, and context from our conversation so far in under 200 words. ' +
      'Focus on: active jobs, leads, Sami orders, anything Paco asked you to remember.';
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: compressionPrompt, history: fullHistory }),
      });
      const data = await res.json();
      const summary = data?.data?.response;
      if (!summary) return fullHistory;

      const nonSystem = fullHistory.filter(m => m.role !== 'system');
      return [
        MAX_SYSTEM_PROMPT,
        { role: 'assistant', content: `[Memory summary: ${summary}]` },
        ...nonSystem.slice(-5),
      ];
    } catch {
      return fullHistory;
    }
  }, []);

  return {
    loadHistory,
    saveHistory,
    clearHistory,
    incrementExchange,
    compressMemory,
    systemPrompt: MAX_SYSTEM_PROMPT,
  };
}
