import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MessageSquare, Calculator, Search, Trash2, X, Clock,
  ChevronRight, User, Bot, FileText, Hash, Building2,
  Inbox, CheckCircle2, CreditCard, Loader2
} from 'lucide-react';
import { api } from '../api/client';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { PageHeader, EmptyState, ListItemCard, CardSkeleton, InlineLoader } from '../components/shared';

const TABS = [
  { id: 'conversations', label: 'AI Conversations', icon: MessageSquare },
  { id: 'estimates', label: 'Plans & Estimates', icon: Calculator },
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-surface-900 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-surface-200 dark:border-surface-700 page-transition-wrapper"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
          <div>
            <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100">Conversation</h2>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{conversation.messages?.length || 0} messages · {formatDate(conversation.createdAt)}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {conversation.messages?.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role !== 'user' && (
                <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-surface-900 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-surface-200 dark:border-surface-700 page-transition-wrapper"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
          <div>
            <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100">Estimate Details</h2>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
              {estimate.sqft?.toLocaleString()} sqft · {estimate.units} units · {formatDate(estimate.createdAt)}
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
                Sync to QBO
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase border border-emerald-100 dark:border-emerald-800">
                <CheckCircle2 className="w-3 h-3" />
                QBO Synced
              </div>
            )}
            <button onClick={onClose} className="p-2 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total', value: formatCurrency(estimate.total) },
              { label: 'Per Unit', value: formatCurrency(estimate.perUnit) },
              { label: 'Margin', value: estimate.margin || '--' },
            ].map(s => (
              <div key={s.label} className="bg-surface-50 dark:bg-surface-800 rounded-xl p-4 text-center border border-surface-200 dark:border-surface-700">
                <p className="text-xs uppercase tracking-wider text-surface-500 dark:text-surface-400 font-semibold">{s.label}</p>
                <p className="text-lg font-bold text-surface-900 dark:text-surface-100 mt-1">{s.value}</p>
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
                    <span className="text-surface-700 dark:text-surface-300">{item.category || item.label || item.name || `Item ${i + 1}`}</span>
                    <span className="font-semibold text-surface-900 dark:text-surface-100">{formatCurrency(item.cost || item.total || item.amount)}</span>
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
                    <FileText className="w-4 h-4 text-surface-400" />
                    <span>{bp.fileName}</span>
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

// ─── Main History Page ───
export default function History() {
  const [searchParams, setSearchParams] = useSearchParams();
  
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

  return (
    <div className="h-full flex flex-col overflow-hidden page-transition-wrapper">
      {/* Header */}
      <div className="px-6 pt-4 pb-0 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 flex-shrink-0">
        <PageHeader title="History" subtitle="Your AI conversations and saved estimates" />
        
        <nav className="flex -mb-px mt-4">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-all duration-200
                  ${isActive
                    ? 'border-accent-500 text-accent-600 dark:text-accent-400'
                    : 'border-transparent text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300 hover:border-surface-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Search */}
      <div className="px-6 py-3 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 flex-shrink-0">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder={activeTab === 'conversations' ? 'Search conversations...' : 'Search estimates...'}
            value={search}
            onChange={handleSearch}
            className="w-full pl-10 pr-10 py-2 text-sm rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500 transition-all"
          />
          {search && (
            <button 
              onClick={() => { setSearch(''); setDebouncedSearch(''); }} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 p-1 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'conversations' && (
          <ConversationsTab
            data={conversations}
            loading={convQuery.isLoading}
            onSelect={setSelectedConv}
            onDelete={(id, label) => setDeleteTarget({ type: 'conversation', id, label })}
            onOpenInAssistant={handleOpenInAssistant}
          />
        )}
        {activeTab === 'estimates' && (
          <EstimatesTab
            data={estimates}
            loading={estQuery.isLoading}
            onSelect={setSelectedEstimate}
            onDelete={(id, label) => setDeleteTarget({ type: 'estimate', id, label })}
          />
        )}
      </div>

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

// ─── Conversations Tab ───
function ConversationsTab({ data, loading, onSelect, onDelete, onOpenInAssistant }) {
  if (loading) return <CardSkeleton count={4} />;
  if (data.length === 0) return (
    <EmptyState 
      icon={Inbox}
      title="No conversations yet"
      subtitle="Start chatting with the AI Assistant to see your conversation history here."
    />
  );

  return (
    <div className="space-y-3 stagger-container">
      {data.map((conv, i) => (
        <ListItemCard
          key={conv.id}
          icon={MessageSquare}
          iconColor="blue"
          title={conv.preview}
          subtitle={
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1">
                <Hash className="w-3 h-3" />{conv.messageCount} messages
              </span>
              <span className="text-xs text-surface-400 dark:text-surface-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />{formatDate(conv.updatedAt)}
              </span>
            </div>
          }
          onClick={() => onSelect(conv.id)}
          actions={
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); onOpenInAssistant(conv.id); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/20 transition-all"
                title="Open in AI Assistant"
              >
                Open in Assistant
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(conv.id, conv.preview?.slice(0, 40)); }}
                className="p-2 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          }
          style={{ animationDelay: `${i * 40}ms` }}
        />
      ))}
    </div>
  );
}

// ─── Estimates Tab ───
function EstimatesTab({ data, loading, onSelect, onDelete }) {
  const queryClient = useQueryClient();
  const [syncingId, setSyncingId] = useState(null);

  const handleSync = async (e, estId) => {
    e.stopPropagation();
    setSyncingId(estId);
    try {
      await api.quickbooks.syncEstimate(estId);
      alert('Estimate synced to QuickBooks!');
      queryClient.invalidateQueries({ queryKey: ['history', 'estimates'] });
    } catch (err) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setSyncingId(null);
    }
  };

  if (loading) return <CardSkeleton count={4} />;
  if (data.length === 0) return (
    <EmptyState 
      icon={Calculator}
      title="No estimates yet"
      subtitle="Create an estimate from the Plans page to see your saved estimates here."
    />
  );

  return (
    <div className="space-y-3 stagger-container">
      {data.map((est, i) => (
        <ListItemCard
          key={est.id}
          icon={Calculator}
          iconColor="green"
          title={formatCurrency(est.total)}
          subtitle={
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1">
                <Building2 className="w-3 h-3" />{est.sqft?.toLocaleString()} sqft
              </span>
              <span className="text-xs text-surface-500 dark:text-surface-400">
                {est.units} units · {est.stories} stories
              </span>
              <span className="text-xs text-surface-400 dark:text-surface-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />{formatDate(est.createdAt)}
              </span>
            </div>
          }
          meta={
            <div className="flex items-center gap-2">
              {est.qboId && (
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  QBO Synced
                </span>
              )}
              {est.margin && (
                <span className="text-xs px-2 py-1 rounded-full bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400 font-semibold uppercase">
                  {est.margin}
                </span>
              )}
            </div>
          }
          onClick={() => onSelect(est.id)}
          actions={
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => handleSync(e, est.id)}
                disabled={!!syncingId}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center gap-1.5"
                title="Sync to QuickBooks"
              >
                {syncingId === est.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                Sync
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(est.id, `${formatCurrency(est.total)} estimate`); }}
                className="p-2 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          }
          style={{ animationDelay: `${i * 40}ms` }}
        />
      ))}
    </div>
  );
}
