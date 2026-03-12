import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Calculator, Search, Trash2, X, Clock,
  ChevronRight, User, Bot, FileText, Hash, Building2,
  Inbox, CheckCircle2, CreditCard, Loader2
} from 'lucide-react';
import { api } from '../api/client';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { PageHeader, EmptyState, ListItemCard, CardSkeleton, InlineLoader } from '../components/shared';
import { TabSystem, Tab, MobileTabBar } from '../components/tabs';
import { useBreakpoint } from '../hooks/useBreakpoint';

const TABS = [
  { id: 'conversations', label: 'AI Conversations', shortLabel: 'Conversations', icon: MessageSquare },
  { id: 'estimates', label: 'Plans & Estimates', shortLabel: 'Estimates', icon: Calculator },
];

function useDebounce(fn, delay) {
  const [timer, setTimer] = useState(null);
  return useCallback((...args) => {
    if (timer) clearTimeout(timer);
    setTimer(setTimeout(() => fn(...args), delay));
  }, [fn, delay, timer]);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function formatCurrency(val) {
  if (!val && val !== 0) return '--';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
}

// ─── Conversation Detail Modal ───
function ConversationModal({ conversation, onClose }) {
  if (!conversation) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-3 sm:p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-surface-900 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-surface-200 dark:border-surface-700 page-transition-wrapper"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-surface-200 dark:border-surface-700">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-surface-900 dark:text-surface-100">Conversation</h2>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{conversation.messages?.length || 0} messages · {formatDate(conversation.createdAt)}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {conversation.messages?.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role !== 'user' && (
                <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                </div>
              )}
              <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-accent-600 text-white rounded-br-md'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-800 dark:text-surface-200 rounded-bl-md'
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.timestamp && (
                  <p className={`text-xs mt-1.5 ${msg.role === 'user' ? 'text-white/50' : 'text-surface-400'}`}>
                    {formatDate(msg.timestamp)}
                  </p>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-surface-200 dark:bg-surface-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-surface-600 dark:text-surface-300" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Estimate Detail Modal ───
function EstimateModal({ estimate, onClose }) {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.quickbooks.syncEstimate(estimate.id);
      alert('Estimate synced to QuickBooks!');
      queryClient.invalidateQueries({ queryKey: ['history', 'estimate', estimate.id] });
      queryClient.invalidateQueries({ queryKey: ['history', 'estimates'] });
    } catch (err) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  if (!estimate) return null;
  const breakdown = estimate.breakdown || [];
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-3 sm:p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-surface-900 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-surface-200 dark:border-surface-700 page-transition-wrapper"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-surface-200 dark:border-surface-700">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-surface-900 dark:text-surface-100">Estimate Details</h2>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
              {estimate.sqft?.toLocaleString()} sqft · {estimate.units} units
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!estimate.qboId ? (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CreditCard className="w-3 h-3" />}
                <span className="hidden sm:inline">Sync to QBO</span>
                <span className="sm:hidden">Sync</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase border border-emerald-100 dark:border-emerald-800">
                <CheckCircle2 className="w-3 h-3" />
                <span className="hidden sm:inline">QBO Synced</span>
                <span className="sm:hidden">Synced</span>
              </div>
            )}
            <button onClick={onClose} className="p-2 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { label: 'Total', value: formatCurrency(estimate.total) },
              { label: 'Per Unit', value: formatCurrency(estimate.perUnit) },
              { label: 'Margin', value: estimate.margin || '--' },
            ].map(s => (
              <div key={s.label} className="bg-surface-50 dark:bg-surface-800 rounded-xl p-3 sm:p-4 text-center border border-surface-200 dark:border-surface-700">
                <p className="text-[10px] sm:text-xs uppercase tracking-wider text-surface-500 dark:text-surface-400 font-semibold">{s.label}</p>
                <p className="text-sm sm:text-lg font-bold text-surface-900 dark:text-surface-100 mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Breakdown */}
          {breakdown.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">Breakdown</h3>
              <div className="space-y-2">
                {breakdown.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2.5 px-3 rounded-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-sm">
                    <span className="text-surface-700 dark:text-surface-300 truncate mr-2">{item.category || item.label || item.name || `Item ${i + 1}`}</span>
                    <span className="font-semibold text-surface-900 dark:text-surface-100 flex-shrink-0">{formatCurrency(item.cost || item.total || item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blueprints */}
          {estimate.blueprints?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">Blueprints</h3>
              <div className="space-y-2">
                {estimate.blueprints.map(bp => (
                  <div key={bp.id} className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400 py-2 px-3 rounded-lg bg-surface-50 dark:bg-surface-800">
                    <FileText className="w-4 h-4 text-surface-400 flex-shrink-0" />
                    <span className="truncate">{bp.fileName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Analysis */}
          {estimate.analysis && (
            <div>
              <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-3">AI Analysis</h3>
              <div className="bg-surface-50 dark:bg-surface-800 rounded-xl p-4 text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap leading-relaxed border border-surface-200 dark:border-surface-700">
                {estimate.analysis}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Conversations Tab ───
function ConversationsTab({ data, loading, onSelect, onDelete, onOpenInAssistant, isMobile }) {
  if (loading) return <CardSkeleton count={4} />;
  if (data.length === 0) return (
    <EmptyState
      icon={Inbox}
      title="No conversations yet"
      description="Your AI conversation history will appear here"
      action={{ label: 'Start Chat', href: '/ai' }}
    />
  );
  return (
    <div className="space-y-3">
      {data.map(conv => (
        <ListItemCard
          key={conv.id}
          icon={MessageSquare}
          iconColor="accent"
          title={conv.title || 'Untitled Conversation'}
          subtitle={
            <span className="flex items-center gap-2 flex-wrap">
              <span>{conv.messageCount || 0} messages</span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(conv.lastMessageAt || conv.createdAt)}
              </span>
            </span>
          }
          meta={<span className="text-xs text-surface-400 hidden sm:block">{formatDate(conv.createdAt)}</span>}
          onClick={() => onSelect(conv.id)}
          actions={[
            { icon: ChevronRight, label: 'Open', onClick: (e) => { e.stopPropagation(); onOpenInAssistant(conv.id); }, variant: 'primary' },
            { icon: Trash2, label: 'Delete', onClick: (e) => { e.stopPropagation(); onDelete(conv.id, conv.title || 'Untitled'); }, variant: 'danger' },
          ]}
          compact={isMobile}
        />
      ))}
    </div>
  );
}

// ─── Estimates Tab ───
function EstimatesTab({ data, loading, onSelect, onDelete, isMobile }) {
  if (loading) return <CardSkeleton count={4} />;
  if (data.length === 0) return (
    <EmptyState
      icon={Calculator}
      title="No saved estimates"
      description="Estimates you generate will appear here"
      action={{ label: 'Create Estimate', href: '/jobs' }}
    />
  );
  return (
    <div className="space-y-3">
      {data.map(est => (
        <ListItemCard
          key={est.id}
          icon={FileText}
          iconColor="emerald"
          title={est.projectName || `Estimate #${est.id?.slice(-6)}`}
          subtitle={
            <span className="flex items-center gap-3 text-xs flex-wrap">
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {est.sqft?.toLocaleString() || '--'} sqft
              </span>
              <span className="flex items-center gap-1">
                <Hash className="w-3 h-3" />
                {est.units || '--'} units
              </span>
            </span>
          }
          meta={
            <div className="text-right">
              <p className="font-bold text-surface-900 dark:text-surface-100 text-sm sm:text-base">{formatCurrency(est.total)}</p>
              <p className="text-xs text-surface-400 hidden sm:block">{formatCurrency(est.perUnit)}/unit</p>
            </div>
          }
          onClick={() => onSelect(est.id)}
          actions={[
            { icon: ChevronRight, label: 'View', onClick: (e) => { e.stopPropagation(); onSelect(est.id); }, variant: 'primary' },
            { icon: Trash2, label: 'Delete', onClick: (e) => { e.stopPropagation(); onDelete(est.id, est.projectName || `Estimate #${est.id?.slice(-6)}`); }, variant: 'danger' },
          ]}
          compact={isMobile}
        />
      ))}
    </div>
  );
}

// ─── Search Bar Component ───
function SearchBar({ value, onChange, placeholder, onClear }) {
  return (
    <div className="relative max-w-md w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-10 py-2 text-sm rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500 transition-all"
      />
      {value && (
        <button 
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 p-1 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ─── Main History Page ───
export default function History() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isMobile } = useBreakpoint();
  
  // URL-persisted state
  const activeTab = searchParams.get('tab') || 'conversations';
  
  // Local state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedConv, setSelectedConv] = useState(null);
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Tab change handler with URL persistence
  const handleTabChange = (tabId) => {
    const next = new URLSearchParams(searchParams);
    if (tabId === 'conversations') {
      next.delete('tab');
    } else {
      next.set('tab', tabId);
    }
    // Clear search when switching tabs
    next.delete('q');
    setSearchParams(next);
    setSearch('');
    setDebouncedSearch('');
  };

  const debouncedSetSearch = useDebounce((val) => setDebouncedSearch(val), 300);
  const handleSearch = (e) => {
    setSearch(e.target.value);
    debouncedSetSearch(e.target.value);
  };

  const convQuery = useQuery({
    queryKey: ['history', 'conversations', debouncedSearch],
    queryFn: () => api.history.getConversations(debouncedSearch ? { search: debouncedSearch } : {}),
    enabled: activeTab === 'conversations',
  });

  const estQuery = useQuery({
    queryKey: ['history', 'estimates', debouncedSearch],
    queryFn: () => api.history.getEstimates(debouncedSearch ? { search: debouncedSearch } : {}),
    enabled: activeTab === 'estimates',
  });

  const convDetailQuery = useQuery({
    queryKey: ['history', 'conversation', selectedConv],
    queryFn: () => api.history.getConversation(selectedConv),
    enabled: !!selectedConv,
  });

  const estDetailQuery = useQuery({
    queryKey: ['history', 'estimate', selectedEstimate],
    queryFn: () => api.history.getEstimate(selectedEstimate),
    enabled: !!selectedEstimate,
  });

  const deleteConv = useMutation({
    mutationFn: (id) => api.history.deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history', 'conversations'] });
      setDeleteTarget(null);
    },
  });

  const deleteEst = useMutation({
    mutationFn: (id) => api.history.deleteEstimate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history', 'estimates'] });
      setDeleteTarget(null);
    },
  });

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'conversation') deleteConv.mutate(deleteTarget.id);
    else deleteEst.mutate(deleteTarget.id);
  };

  const handleOpenInAssistant = (conversationId) => {
    navigate(`/ai?id=${conversationId}`);
  };

  const conversations = convQuery.data || [];
  const estimates = estQuery.data || [];

  // Tab definitions for mobile
  const tabDefinitions = useMemo(() => TABS, []);

  return (
    <div className={`h-full flex flex-col overflow-hidden page-transition-wrapper ${isMobile ? 'pb-16' : ''}`}>
      {/* Header */}
      <div className="px-4 sm:px-6 pt-4 pb-0 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 flex-shrink-0">
        <PageHeader 
          title="History" 
          subtitle="Your AI conversations and saved estimates" 
        />
      </div>

      {/* Desktop TabSystem */}
      {!isMobile && (
        <TabSystem 
          defaultTab={activeTab}
          variant="underline" 
          className="flex-1 flex flex-col min-h-0"
          listClassName="px-6 border-b border-surface-200 dark:border-surface-700 flex-shrink-0"
          contentClassName="flex-1 overflow-hidden flex flex-col"
          onTabChange={handleTabChange}
        >
          <Tab id="conversations" label="AI Conversations" icon={MessageSquare}>
            {/* Search */}
            <div className="px-6 py-3 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 flex-shrink-0">
              <SearchBar
                value={search}
                onChange={handleSearch}
                placeholder="Search conversations..."
                onClear={() => { setSearch(''); setDebouncedSearch(''); }}
              />
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <ConversationsTab
                data={conversations}
                loading={convQuery.isLoading}
                onSelect={setSelectedConv}
                onDelete={(id, label) => setDeleteTarget({ type: 'conversation', id, label })}
                onOpenInAssistant={handleOpenInAssistant}
              />
            </div>
          </Tab>
          
          <Tab id="estimates" label="Plans & Estimates" icon={Calculator}>
            {/* Search */}
            <div className="px-6 py-3 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 flex-shrink-0">
              <SearchBar
                value={search}
                onChange={handleSearch}
                placeholder="Search estimates..."
                onClear={() => { setSearch(''); setDebouncedSearch(''); }}
              />
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <EstimatesTab
                data={estimates}
                loading={estQuery.isLoading}
                onSelect={setSelectedEstimate}
                onDelete={(id, label) => setDeleteTarget({ type: 'estimate', id, label })}
              />
            </div>
          </Tab>
        </TabSystem>
      )}

      {/* Mobile Content with Bottom Bar */}
      {isMobile && (
        <>
          {/* Search Bar */}
          <div className="px-4 py-3 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 flex-shrink-0">
            <SearchBar
              value={search}
              onChange={handleSearch}
              placeholder={activeTab === 'conversations' ? 'Search conversations...' : 'Search estimates...'}
              onClear={() => { setSearch(''); setDebouncedSearch(''); }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <AnimatePresence mode="wait">
              {activeTab === 'conversations' && (
                <motion.div
                  key="conversations"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <ConversationsTab
                    data={conversations}
                    loading={convQuery.isLoading}
                    onSelect={setSelectedConv}
                    onDelete={(id, label) => setDeleteTarget({ type: 'conversation', id, label })}
                    onOpenInAssistant={handleOpenInAssistant}
                    isMobile
                  />
                </motion.div>
              )}
              {activeTab === 'estimates' && (
                <motion.div
                  key="estimates"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <EstimatesTab
                    data={estimates}
                    loading={estQuery.isLoading}
                    onSelect={setSelectedEstimate}
                    onDelete={(id, label) => setDeleteTarget({ type: 'estimate', id, label })}
                    isMobile
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Bottom Navigation */}
          <MobileTabBar
            tabs={tabDefinitions}
            activeTab={activeTab}
            onChange={handleTabChange}
            variant="default"
            showLabels={true}
          />
        </>
      )}

      {/* Modals */}
      {selectedConv && convDetailQuery.data && (
        <ConversationModal conversation={convDetailQuery.data} onClose={() => setSelectedConv(null)} />
      )}
      {selectedEstimate && estDetailQuery.data && (
        <EstimateModal estimate={estDetailQuery.data} onClose={() => setSelectedEstimate(null)} />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          title={`Delete ${deleteTarget.type === 'conversation' ? 'Conversation' : 'Estimate'}?`}
          message={`This will permanently delete "${deleteTarget.label}". This action cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
