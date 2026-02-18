import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare, Calculator, Search, Trash2, X, Clock,
  ChevronRight, User, Bot, FileText, Hash, Building2
} from 'lucide-react';
import { api } from '../api/client';
import ConfirmDialog from '../components/shared/ConfirmDialog';

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
        className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-surface-200 dark:border-gray-700 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-display font-bold text-surface-900 dark:text-surface-100">Conversation</h2>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{conversation.messages?.length || 0} messages · {formatDate(conversation.createdAt)}</p>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {conversation.messages?.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role !== 'user' && (
                <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white rounded-br-md'
                  : 'bg-surface-100 dark:bg-gray-800 text-surface-800 dark:text-surface-200 rounded-bl-md'
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.timestamp && (
                  <p className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-white/50' : 'text-surface-400'}`}>
                    {formatDate(msg.timestamp)}
                  </p>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-surface-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
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
  if (!estimate) return null;
  const breakdown = estimate.breakdown || [];
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-surface-200 dark:border-gray-700 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-display font-bold text-surface-900 dark:text-surface-100">Estimate Details</h2>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
              {estimate.sqft?.toLocaleString()} sqft · {estimate.units} units · {formatDate(estimate.createdAt)}
            </p>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total', value: formatCurrency(estimate.total) },
              { label: 'Per Unit', value: formatCurrency(estimate.perUnit) },
              { label: 'Margin', value: estimate.margin || '--' },
            ].map(s => (
              <div key={s.label} className="bg-surface-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-surface-500 dark:text-surface-400 font-semibold">{s.label}</p>
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
                  <div key={i} className="flex justify-between items-center py-2 px-3 rounded-lg bg-surface-50 dark:bg-gray-800 text-sm">
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
                  <div key={bp.id} className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                    <FileText className="w-4 h-4" />
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
              <div className="bg-surface-50 dark:bg-gray-800 rounded-xl p-4 text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap leading-relaxed">
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
  const [activeTab, setActiveTab] = useState('conversations');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedConv, setSelectedConv] = useState(null);
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type, id, label }

  const queryClient = useQueryClient();

  const debouncedSetSearch = useDebounce((val) => setDebouncedSearch(val), 300);
  const handleSearch = (e) => {
    setSearch(e.target.value);
    debouncedSetSearch(e.target.value);
  };

  // Queries
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

  // Full detail queries
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

  // Delete mutations
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

  const conversations = convQuery.data || [];
  const estimates = estQuery.data || [];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header + Tab Bar */}
      <div className="px-6 pt-4 pb-0 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-100 tracking-tight">History</h1>
        </div>
        <nav className="flex -mb-px">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearch(''); setDebouncedSearch(''); }}
                className={`
                  flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors
                  ${isActive
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-surface-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
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

      {/* Search bar */}
      <div className="px-6 py-3 bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 flex-shrink-0">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder={activeTab === 'conversations' ? 'Search conversations...' : 'Search estimates...'}
            value={search}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-surface-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
          />
          {search && (
            <button onClick={() => { setSearch(''); setDebouncedSearch(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
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

      {/* Detail Modals */}
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
function ConversationsTab({ data, loading, onSelect, onDelete }) {
  if (loading) return <LoadingSkeleton count={4} />;
  if (data.length === 0) return <EmptyState icon={MessageSquare} message="No conversations yet" sub="Start chatting with the AI Assistant to see history here." />;

  return (
    <div className="space-y-3">
      {data.map((conv, i) => (
        <div
          key={conv.id}
          className="group bg-white dark:bg-gray-800/60 rounded-xl border border-surface-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-all cursor-pointer overflow-hidden"
          style={{ animationDelay: `${i * 40}ms` }}
          onClick={() => onSelect(conv.id)}
        >
          <div className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-primary-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">
                {conv.preview}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1">
                  <Hash className="w-3 h-3" />{conv.messageCount} messages
                </span>
                <span className="text-xs text-surface-400 dark:text-surface-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />{formatDate(conv.updatedAt)}
                </span>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(conv.id, conv.preview?.slice(0, 40)); }}
              className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <ChevronRight className="w-4 h-4 text-surface-300 dark:text-surface-600" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Estimates Tab ───
function EstimatesTab({ data, loading, onSelect, onDelete }) {
  if (loading) return <LoadingSkeleton count={4} />;
  if (data.length === 0) return <EmptyState icon={Calculator} message="No estimates yet" sub="Create an estimate from the Plans page to see history here." />;

  return (
    <div className="space-y-3">
      {data.map((est, i) => (
        <div
          key={est.id}
          className="group bg-white dark:bg-gray-800/60 rounded-xl border border-surface-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition-all cursor-pointer overflow-hidden"
          style={{ animationDelay: `${i * 40}ms` }}
          onClick={() => onSelect(est.id)}
        >
          <div className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
              <Calculator className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">
                  {formatCurrency(est.total)}
                </p>
                {est.margin && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold uppercase">
                    {est.margin}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-xs text-surface-500 dark:text-surface-400 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />{est.sqft?.toLocaleString()} sqft
                </span>
                <span className="text-xs text-surface-500 dark:text-surface-400">
                  {est.units} units · {est.stories} stories
                </span>
                {est.blueprintFileNames && (
                  <span className="text-xs text-surface-400 dark:text-surface-500 flex items-center gap-1">
                    <FileText className="w-3 h-3" />{est.blueprintFileNames.split(',')[0]}
                  </span>
                )}
                <span className="text-xs text-surface-400 dark:text-surface-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />{formatDate(est.createdAt)}
                </span>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(est.id, `${formatCurrency(est.total)} estimate`); }}
              className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <ChevronRight className="w-4 h-4 text-surface-300 dark:text-surface-600" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Shared Components ───
function EmptyState({ icon: Icon, message, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-surface-300 dark:text-surface-600" />
      </div>
      <p className="text-lg font-semibold text-surface-500 dark:text-surface-400">{message}</p>
      <p className="text-sm text-surface-400 dark:text-surface-500 mt-1 max-w-xs">{sub}</p>
    </div>
  );
}

function LoadingSkeleton({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800/60 rounded-xl border border-surface-200 dark:border-gray-700 p-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-surface-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-surface-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-surface-100 dark:bg-gray-700/50 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
