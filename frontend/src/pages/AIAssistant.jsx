import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Send, CheckCircle, Bot, Sparkles, Cpu, Menu, Plus, Trash2, 
  Download, MessageSquare, X, ChevronLeft, FileText, 
  MoreVertical, Edit2, Save, Clock, BookOpen
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { 
  ChatInterface, 
  ModelSelector 
} from '../components/ai';
import { 
  useStreamingResponse,
  useModelPreference,
  useToast 
} from '../hooks';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { PageHeader, ConfirmDialog } from '../components/shared';

// Format date for conversation list
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Generate conversation title from first message
function generateTitle(messages) {
  if (!messages || messages.length === 0) return 'New Conversation';
  const firstUser = messages.find(m => m.role === 'user');
  if (!firstUser) return 'New Conversation';
  const preview = firstUser.content.slice(0, 40);
  return preview.length < firstUser.content.length ? preview + '...' : preview;
}

// Export conversation as file
function exportConversation(messages, format = 'md') {
  const timestamp = new Date().toISOString().slice(0, 10);
  let content = '';
  
  if (format === 'md') {
    content = `# CTL Plumbing AI Conversation\n\n**Date:** ${new Date().toLocaleString()}\n\n---\n\n`;
    messages.forEach(msg => {
      const role = msg.role === 'user' ? '**You**' : '**AI Assistant**';
      content += `${role}:\n${msg.content}\n\n---\n\n`;
    });
  } else {
    content = `CTL Plumbing AI Conversation\nDate: ${new Date().toLocaleString()}\n\n`;
    messages.forEach((msg, i) => {
      const role = msg.role === 'user' ? 'You' : 'AI Assistant';
      content += `[${role}]:\n${msg.content}\n\n${i < messages.length - 1 ? '---\n\n' : ''}`;
    });
  }
  
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ctl-conversation-${timestamp}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Token estimation (rough approximation)
function estimateTokens(text) {
  // Rough estimate: 1 token ≈ 4 characters for English
  return Math.ceil(text.length / 4);
}

// Conversation Drawer Component
function ConversationDrawer({ 
  isOpen, 
  onClose, 
  conversations, 
  activeConversationId,
  onSelect,
  onNew,
  onDelete,
  isLoading 
}) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-80 bg-surface-50 dark:bg-surface-900 
        border-r border-surface-200 dark:border-surface-700
        transform transition-transform duration-300 ease-out
        flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:hidden xl:hidden'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
          <h2 className="font-semibold text-surface-900 dark:text-surface-100 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Conversations
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={onNew}
              className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-400"
              title="New conversation"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-400 lg:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-surface-200 dark:bg-surface-800 animate-pulse" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-surface-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                className={`
                  group flex items-center gap-3 p-3 rounded-lg cursor-pointer
                  transition-colors relative
                  ${activeConversationId === conv.id 
                    ? 'bg-accent-100 dark:bg-accent-900/30 border border-accent-200 dark:border-accent-800' 
                    : 'hover:bg-surface-100 dark:hover:bg-surface-800 border border-transparent'
                  }
                `}
                onClick={() => onSelect(conv)}
              >
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                  ${activeConversationId === conv.id 
                    ? 'bg-accent-200 dark:bg-accent-800 text-accent-700 dark:text-accent-300'
                    : 'bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-400'
                  }
                `}>
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                    {conv.title || 'Untitled'}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    {conv.messageCount || 0} messages · {formatDate(conv.updatedAt || conv.createdAt)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(conv);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-surface-400 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Conversation?"
          message={`This will permanently delete "${deleteTarget.title || 'Untitled'}". This action cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => {
            onDelete(deleteTarget.id);
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}

export default function AIAssistant() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const { isMobile } = useBreakpoint();
  
  // URL param for opening specific conversation
  const urlConversationId = searchParams.get('id');
  
  // State
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [conversationTitle, setConversationTitle] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isSmartMode, setIsSmartMode] = useState(true);
  
  const { isStreaming, streamingMessage, error: streamError, sendMessage, stopStreaming } = useStreamingResponse();
  
  // Show toast on stream error
  useEffect(() => {
    if (streamError) {
      showError(streamError);
    }
  }, [streamError, showError]);

  const { defaultModel } = useModelPreference();
  const [selectedModel, setSelectedModel] = useState('');
  const effectiveModel = selectedModel || defaultModel;
  
  // Fetch conversations list
  const { data: conversationsData, isLoading: isLoadingConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.history.getConversations({ limit: 50 }),
  });
  
  const conversations = conversationsData?.conversations || [];
  
  // Fetch specific conversation if URL has id
  const { data: conversationData, isLoading: isLoadingConversation } = useQuery({
    queryKey: ['conversation', urlConversationId],
    queryFn: () => api.history.getConversation(urlConversationId),
    enabled: !!urlConversationId,
  });
  
  // Load conversation from URL or start fresh
  useEffect(() => {
    if (urlConversationId && conversationData) {
      setConversationId(urlConversationId);
      setMessages(conversationData.messages || []);
      setConversationTitle(conversationData.title || generateTitle(conversationData.messages));
    } else if (!urlConversationId) {
      // Start fresh
      setConversationId(null);
      setMessages([]);
      setConversationTitle('');
    }
  }, [urlConversationId, conversationData]);
  
  // Delete conversation mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.history.deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      success('Conversation deleted');
      if (conversationId === deleteMutation.variables) {
        handleNewConversation();
      }
    },
    onError: (err) => showError(`Failed to delete: ${err.message}`),
  });
  
  // Fetch models
  const { data: modelsData } = useQuery({
    queryKey: ['ollama-models'],
    queryFn: () => api.ai.getModels(),
    retry: false
  });
  
  const activeProvider = modelsData?.provider || 'gemini';
  const providerLabel = {
    gemini: 'Google Gemini',
    groq: 'Groq Cloud',
    anthropic: 'Anthropic Claude',
    ollama: 'Ollama Local',
    openclaw: 'OpenClaw Gateway',
  }[activeProvider] || activeProvider;
  
  // Start new conversation
  const handleNewConversation = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setConversationTitle('');
    setSearchParams({});
    setIsDrawerOpen(false);
  }, [setSearchParams]);
  
  // Select existing conversation
  const handleSelectConversation = useCallback((conv) => {
    setSearchParams({ id: conv.id });
    setIsDrawerOpen(false);
  }, [setSearchParams]);
  
  // Clear current conversation
  const handleClearConversation = useCallback(() => {
    if (messages.length > 0) {
      setShowClearConfirm(true);
    }
  }, [messages]);

  const confirmClear = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setConversationTitle('');
    setShowClearConfirm(false);
  }, []);
  
  // Export conversation
  const handleExport = useCallback((format) => {
    if (messages.length === 0) {
      showError('No messages to export');
      return;
    }
    exportConversation(messages, format);
    success(`Exported as ${format.toUpperCase()}`);
    setShowExportMenu(false);
  }, [messages, success, showError]);
  
  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isStreaming) return;
    
    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    const newMessages = [...messages, { role: 'user', content: userMessage, timestamp: new Date().toISOString() }];
    setMessages(newMessages);
    
    await sendMessage(
      userMessage, 
      conversationId, 
      effectiveModel, 
      (response, newConversationId) => {
        if (response) {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: response,
            timestamp: new Date().toISOString()
          }]);
        }
        if (newConversationId) {
          setConversationId(newConversationId);
          setSearchParams({ id: newConversationId });
          if (!conversationTitle && newMessages.length === 2) {
            setConversationTitle(generateTitle(newMessages));
          }
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      },
      { isSmart: isSmartMode }
    );
  };
  
  // Character and token counts
  const charCount = inputMessage.length;
  const tokenCount = estimateTokens(inputMessage);
  const isNearLimit = charCount > 3000;
  
  // Handle suggested action click
  const handleSuggestionClick = useCallback((prompt) => {
    setInputMessage(prompt);
  }, []);
  
  return (
    <div className="h-full flex page-transition-wrapper">
      {/* Conversation Drawer */}
      <ConversationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        conversations={conversations}
        activeConversationId={conversationId}
        onSelect={handleSelectConversation}
        onNew={handleNewConversation}
        onDelete={(id) => deleteMutation.mutate(id)}
        isLoading={isLoadingConversations}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 p-3 sm:p-6">
          <div className="flex items-center gap-3">
            {/* Menu button (mobile) */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-400"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <PageHeader
              title={
                <div className="flex items-center gap-3">
                  {conversationTitle || 'New Conversation'}
                  {messages.length > 0 && (
                    <span className="text-xs text-surface-400 font-normal">
                      {messages.length} messages
                    </span>
                  )}
                </div>
              }
              subtitle={`Powered by ${providerLabel} — Ask about leads, pricing, materials, and code compliance`}
            >
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {/* Action buttons */}
                {messages.length > 0 && (
                  <div className="flex items-center gap-1 mr-2">
                    <button
                      onClick={handleClearConversation}
                      className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-400"
                      title="Clear conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-400"
                        title="Export conversation"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {showExportMenu && (
                        <div className="absolute right-0 top-full mt-2 w-40 rounded-lg bg-surface-card border border-border shadow-lg z-50 py-1">
                          <button
                            onClick={() => handleExport('md')}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-surface-elevated flex items-center gap-2"
                          >
                            <FileText className="w-4 h-4" />
                            Export as Markdown
                          </button>
                          <button
                            onClick={() => handleExport('txt')}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-surface-elevated flex items-center gap-2"
                          >
                            <FileText className="w-4 h-4" />
                            Export as Text
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    {isMobile ? 'Context' : 'CTL Context Active'}
                  </span>
                </div>

                {/* Smart Mode Toggle */}
                <button
                  onClick={() => setIsSmartMode(!isSmartMode)}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full transition-all
                    ${isSmartMode 
                      ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/20' 
                      : 'bg-surface-200 dark:bg-surface-800 text-surface-600 dark:text-surface-400 border border-surface-300 dark:border-surface-700'}
                  `}
                >
                  <Sparkles className={`w-4 h-4 ${isSmartMode ? 'animate-pulse' : ''}`} />
                  <span className="text-sm font-bold">{isMobile ? 'Smart' : 'Smart Mode'}</span>
                </button>

                {/* Knowledge Base Link */}
                <button
                  onClick={() => navigate('/knowledge')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-200 dark:bg-surface-800 text-surface-600 dark:text-surface-400 border border-surface-300 dark:border-surface-700 hover:bg-surface-300 dark:hover:bg-surface-700 transition-all"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm font-bold hidden sm:inline">Knowledge</span>
                </button>
              </div>
            </PageHeader>
          </div>
          
          {/* Model Selector */}
          <div className="flex items-center gap-3 mt-4 p-3 rounded-xl bg-surface-100 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700/50 w-full sm:w-fit">
            <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-accent-600 dark:text-accent-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">Model</label>
              <ModelSelector
                value={effectiveModel}
                onChange={(modelName) => setSelectedModel(modelName)}
                disabled={isStreaming}
                showSizes={true}
                className="text-sm py-1 border-0 bg-transparent focus:ring-0 p-0 font-medium text-surface-900 dark:text-surface-100"
              />
            </div>
          </div>
        </div>
        
        {/* Click outside to close export menu */}
        {showExportMenu && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowExportMenu(false)}
          />
        )}

        {/* Chat Interface */}
        <div className="flex-1 overflow-hidden bg-surface-50 dark:bg-surface-925">
          <ChatInterface
            messages={messages}
            streamingMessage={streamingMessage}
            isStreaming={isStreaming}
            onSuggestionClick={handleSuggestionClick}
          />
        </div>

        {/* Input Form */}
        <div
          className="bg-surface-50 dark:bg-surface-900 border-t border-surface-200 dark:border-surface-700 p-4"
          style={isMobile ? { paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' } : undefined}
        >
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
              
              {isStreaming ? (
                <motion.button
                  type="button"
                  onClick={stopStreaming}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 700, damping: 35 }}
                  className="bg-danger-500 hover:bg-danger-600 text-white flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-danger-500/20"
                >
                  <X className="w-4 h-4" />
                  <span>Stop</span>
                </motion.button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isStreaming}
                  className="btn-primary flex items-center gap-2 px-6 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              )}
            </div>
            
            {/* Character/Token Counter */}
            <div className={`mt-2 flex ${isMobile ? 'flex-col items-start gap-1' : 'items-center justify-between'}`}>
              <p className="text-xs text-surface-400 dark:text-surface-500">
                AI responses are generated based on your data and may require verification.
              </p>
              <div className={`text-xs font-mono ${isNearLimit ? 'text-amber-500' : 'text-surface-400 dark:text-surface-500'}`}>
                {charCount} chars · ~{tokenCount} tokens
                {isNearLimit && ' (near limit)'}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Clear Confirmation */}
      {showClearConfirm && (
        <ConfirmDialog
          title="Clear Conversation?"
          message="Are you sure you want to clear the current messages? You can still find this conversation in your history later."
          confirmLabel="Clear"
          onConfirm={confirmClear}
          onCancel={() => setShowClearConfirm(false)}
          variant="warning"
        />
      )}
    </div>
  );
}
