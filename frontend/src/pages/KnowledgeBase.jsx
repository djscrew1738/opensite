import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  BookOpen, Search, RefreshCw, FileText, Trash2, 
  Layers, CheckCircle2, AlertCircle, Database, Clock 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';
import { useToast } from '../hooks/useToast';

/**
 * KnowledgeBase Page
 * Manage the AI Intelligence knowledge base and documentation indexing.
 */
export default function KnowledgeBase() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isReindexing, setIsReindexing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch knowledge entries
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['knowledge'],
    queryFn: () => api.knowledge.list(),
  });

  // Re-index mutation
  const reindexMutation = useMutation({
    mutationFn: () => api.knowledge.reindex(),
    onSuccess: () => {
      setIsReindexing(true);
      toast('Success', 'Indexing process started in the background.', 'success');
      // Polling is difficult for this, but we can refetch after a delay
      setTimeout(() => {
        refetch();
        setIsReindexing(false);
      }, 5000);
    },
    onError: (err) => {
      toast('Error', `Failed to start re-indexing: ${err.message}`, 'error');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.knowledge.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['knowledge']);
      toast('Success', 'Knowledge entry deleted.', 'success');
    },
    onError: (err) => {
      toast('Error', `Failed to delete: ${err.message}`, 'error');
    }
  });

  // Filtered files
  const filteredFiles = useMemo(() => {
    if (!data?.files) return [];
    if (!searchTerm) return data.files;
    
    const lowerSearch = searchTerm.toLowerCase();
    return data.files.filter(file => 
      file.title.toLowerCase().includes(lowerSearch) || 
      file.path.toLowerCase().includes(lowerSearch)
    );
  }, [data, searchTerm]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto page-transition-wrapper">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-surface-50">
            <BookOpen className="w-6 h-6 text-accent-500" />
            AI Knowledge Base
          </h1>
          <p className="text-surface-400 text-sm mt-1">
            Manage the documentation and project data used for RAG (Retrieval-Augmented Generation).
          </p>
        </div>

        <motion.button
          onClick={() => reindexMutation.mutate()}
          disabled={isReindexing || isLoading}
          whileTap={!(isReindexing || isLoading) ? { scale: 0.95 } : undefined}
          transition={{ type: 'spring', stiffness: 700, damping: 35 }}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold
            ${isReindexing
              ? 'bg-surface-800 text-surface-500 cursor-not-allowed'
              : 'bg-accent-500 hover:bg-accent-600 text-white shadow-lg shadow-accent-500/20'}
          `}
        >
          <RefreshCw className={`w-4 h-4 ${isReindexing ? 'animate-spin' : ''}`} />
          {isReindexing ? 'Indexing...' : 'Re-index Everything'}
        </motion.button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          icon={FileText} 
          label="Total Files" 
          value={data?.files?.length || 0} 
          color="accent" 
        />
        <StatCard 
          icon={Layers} 
          label="Text Chunks" 
          value={data?.total || 0} 
          color="emerald" 
        />
        <StatCard 
          icon={Database} 
          label="Storage Engine" 
          value="SQLite Vector" 
          color="amber" 
        />
      </div>

      {/* Search & Content */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <input
            type="text"
            placeholder="Search indexed files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-900 border border-surface-700 rounded-xl text-surface-100 focus:ring-2 focus:ring-accent-500 outline-none transition-all"
          />
        </div>

        <div className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-surface-800 bg-surface-800/30">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-surface-400">Source File</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-surface-400">Path</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-surface-400">Chunks</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-surface-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800">
                <AnimatePresence mode="popLayout">
                  {filteredFiles.map((file) => (
                    <motion.tr 
                      key={file.path}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-surface-300" />
                          </div>
                          <span className="font-semibold text-surface-100">{file.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs px-2 py-1 rounded bg-surface-800 text-surface-400 border border-surface-700">
                          {file.path}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-500/10 text-accent-500 border border-accent-500/20">
                          {file.chunks} chunks
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => {
                            if (window.confirm('Are you sure? This will remove all chunks for this file.')) {
                              file.entries.forEach(e => deleteMutation.mutate(e.id));
                            }
                          }}
                          className="p-2 text-surface-500 hover:text-danger-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>

                {filteredFiles.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-30">
                        <AlertCircle className="w-12 h-12" />
                        <p className="text-lg font-medium">No indexed files found</p>
                        <p className="text-sm">Try running the re-index process above.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    accent: 'bg-accent-500/10 text-accent-500 border-accent-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  };

  return (
    <div className="p-5 bg-surface-900 border border-surface-800 rounded-2xl shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl border ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold text-surface-50 tabular-nums">{value}</div>
        <div className="text-sm text-surface-500 font-medium">{label}</div>
      </div>
    </div>
  );
}
