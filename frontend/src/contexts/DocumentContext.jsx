import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { docvaultApi } from '../api/docvault';

/**
 * DocumentContext - Centralized state management for document operations
 * Reduces prop drilling between DocViewer, DocSidebar, and document panels
 * Uses docvaultApi for text intelligence features
 */

const DocumentContext = createContext(null);

export function DocumentProvider({ children, document: initialDoc }) {
  const [document, setDocument] = useState(initialDoc);
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedModel, setSelectedModel] = useState('auto');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [error, setError] = useState(null);

  const isDocumentReady = useMemo(() => 
    document?.status === 'ready', 
    [document]
  );

  // Fetch chat history when document changes
  const fetchChatHistory = useCallback(async (docId) => {
    if (!docId) return;
    try {
      const messages = await docvaultApi.getChatHistory(docId);
      setChatHistory(messages || []);
    } catch {
      setChatHistory([]);
    }
  }, []);

  const handleSummarize = useCallback(async () => {
    if (!document?.id || isAiLoading || !isDocumentReady) return;
    
    setIsAiLoading(true);
    setError(null);
    
    try {
      const response = await docvaultApi.summarize(document.id, selectedModel);
      if (response?.summary) {
        setDocument(prev => ({ ...prev, summary: response.summary }));
      }
    } catch (err) {
      setError({ type: 'SUMMARIZE_FAILED', message: err.message });
    } finally {
      setIsAiLoading(false);
    }
  }, [document?.id, isAiLoading, isDocumentReady, selectedModel]);

  const handleExtract = useCallback(async () => {
    if (!document?.id || isAiLoading || !isDocumentReady) return;
    
    setIsAiLoading(true);
    setError(null);
    
    try {
      const response = await docvaultApi.extract(document.id, selectedModel);
      if (response?.entities) {
        setDocument(prev => ({ ...prev, entities: response.entities }));
      }
    } catch (err) {
      setError({ type: 'EXTRACTION_FAILED', message: err.message });
    } finally {
      setIsAiLoading(false);
    }
  }, [document?.id, isAiLoading, isDocumentReady, selectedModel]);

  const handleChat = useCallback(async (message) => {
    if (!document?.id || isAiLoading || !isDocumentReady || !message.trim()) return;
    
    const userMessage = { 
      role: 'user', 
      content: message.trim(),
      created_at: new Date().toISOString()
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    setIsAiLoading(true);
    setError(null);
    
    try {
      const response = await docvaultApi.chat(document.id, message.trim(), selectedModel);
      if (response?.answer) {
        const assistantMessage = {
          role: 'assistant',
          content: response.answer,
          created_at: new Date().toISOString()
        };
        setChatHistory(prev => [...prev, assistantMessage]);
      }
    } catch (err) {
      setError({ type: 'CHAT_FAILED', message: err.message });
      // Add error message to chat
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        created_at: new Date().toISOString()
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsAiLoading(false);
    }
  }, [document?.id, isAiLoading, isDocumentReady, selectedModel]);

  const handleClearChat = useCallback(async () => {
    if (!document?.id) return;
    try {
      await docvaultApi.clearChat(document.id);
      setChatHistory([]);
    } catch (err) {
      setError({ type: 'CLEAR_CHAT_FAILED', message: err.message });
    }
  }, [document?.id]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo(() => ({
    document,
    setDocument,
    chatHistory,
    selectedModel,
    setSelectedModel,
    isAiLoading,
    error,
    isDocumentReady,
    handleSummarize,
    handleExtract,
    handleChat,
    handleClearChat,
    clearError,
    fetchChatHistory,
  }), [
    document,
    chatHistory,
    selectedModel,
    setSelectedModel,
    isAiLoading,
    error,
    isDocumentReady,
    handleSummarize,
    handleExtract,
    handleChat,
    handleClearChat,
    clearError,
    fetchChatHistory,
  ]);

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocument() {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return context;
}

export default DocumentContext;
