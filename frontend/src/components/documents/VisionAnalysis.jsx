import { useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, BrainCircuit, FileText, 
  Activity, CheckCircle2, Clock, 
  AlertCircle, LayoutGrid, List, Search,
  Play, Sparkles
} from 'lucide-react';
import { NoAnalysisEmpty } from '../empty-states';
import VisionCanvas from '../vision/VisionCanvas';
import { colors, shadows } from '../../styles/tokens';

/**
 * Status Badge for project analysis state
 */
const AnalysisStatusBadge = memo(function AnalysisStatusBadge({ lastAnalyzed }) {
  if (!lastAnalyzed) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border"
            style={{ backgroundColor: 'rgba(100, 116, 139, 0.1)', color: '#94A3B8', borderColor: 'rgba(100, 116, 139, 0.2)' }}>
        <Clock className="w-2.5 h-2.5" />
        Needs Scan
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border"
          style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#4ADE80', borderColor: 'rgba(34, 197, 94, 0.2)' }}>
      <CheckCircle2 className="w-2.5 h-2.5" />
      Analyzed
    </span>
  );
});

/**
 * Project Summary Card
 */
const ProjectSummary = memo(function ProjectSummary({ projects }) {
  const stats = useMemo(() => ({
    total: projects.length,
    analyzed: projects.filter(p => p.lastAnalyzedAt).length,
    pending: projects.filter(p => !p.lastAnalyzedAt).length,
  }), [projects]);

  return (
    <div className="flex flex-col gap-4 p-4 rounded-2xl bg-surface-900 border border-surface-800">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-500">Analysis Overview</h4>
        <Activity className="w-4 h-4 text-accent-default" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1 p-2 rounded-lg bg-surface-950 border border-surface-800">
          <span className="text-xl font-bold text-white">{stats.total}</span>
          <span className="text-xs text-surface-500 uppercase">Blueprints</span>
        </div>
        <div className="flex flex-col gap-1 p-2 rounded-lg bg-surface-950 border border-surface-800">
          <span className="text-xl font-bold text-green-400">{stats.analyzed}</span>
          <span className="text-xs text-surface-500 uppercase">Analyzed</span>
        </div>
        <div className="flex flex-col gap-1 p-2 rounded-lg bg-surface-950 border border-surface-800">
          <span className="text-xl font-bold text-amber-400">{stats.pending}</span>
          <span className="text-xs text-surface-500 uppercase">Pending</span>
        </div>
      </div>

      {stats.pending > 0 && (
        <button 
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-accent-default text-white text-sm font-medium hover:bg-accent-hover transition-colors"
          onClick={() => alert('Batch analysis with local Ollama started')}
        >
          <Sparkles className="w-4 h-4" />
          Scan Pending Blueprints
        </button>
      )}
    </div>
  );
});

export default function VisionAnalysis({ projects, onSelectProject }) {
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    return projects.filter(p => 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projects, searchQuery]);

  const selectedProject = projects.find(p => p.id === selectedId);

  if (selectedId && selectedProject) {
    return (
      <div className="h-full flex flex-col">
        <div
          className="flex items-center justify-between p-4 bg-surface-950"
          style={{ borderBottom: '1px solid #1F2430' }}
        >
          <motion.button
            onClick={() => setSelectedId(null)}
            whileHover={{ x: -2 }}
            transition={{ duration: 0.1 }}
            className="flex items-center gap-2 text-sm font-medium"
            style={{ color: '#94A3B8' }}
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to Vision Library
          </motion.button>
          
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-white">{selectedProject.name}</span>
            <div className="h-4 w-px bg-surface-700 mx-1" />
            <AnalysisStatusBadge lastAnalyzed={selectedProject.lastAnalyzedAt} />
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <VisionCanvas 
            projectId={selectedId} 
            onClose={() => setSelectedId(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 bg-surface-950">
      {/* Sidebar Summary */}
      <div className="w-72 border-r border-surface-800 p-4 flex flex-col gap-6 overflow-y-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center">
            <BrainCircuit className="w-6 h-6 text-accent-default" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-tight">Vision Hub</h2>
            <p className="text-xs text-surface-500">Spatial Intelligence Engine</p>
          </div>
        </div>

        <ProjectSummary projects={projects} />

        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-500 mb-1">Recent Activity</h4>
          {projects.filter(p => p.lastAnalyzedAt).slice(0, 3).map(p => (
            <div key={p.id} className="flex flex-col p-2 rounded-lg bg-surface-900 border border-surface-800 text-xs">
              <span className="text-surface-300 font-medium truncate">{p.name}</span>
              <span className="text-surface-600 mt-0.5">Analyzed: {new Date(p.lastAnalyzedAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 border-b border-surface-800 flex items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input 
              type="text" 
              placeholder="Search blueprints..."
              className="w-full bg-surface-900 border border-surface-800 rounded-lg pl-10 pr-4 py-1.5 text-sm focus:border-accent-default outline-none transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {filteredProjects.length === 0 ? (
            <NoAnalysisEmpty onUpload={() => {}} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredProjects.map((project) => (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -4 }}
                    className="group relative rounded-2xl bg-surface-900 border border-surface-800 overflow-hidden cursor-pointer"
                    onClick={() => setSelectedId(project.id)}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-[4/3] relative bg-black overflow-hidden border-b border-surface-800">
                      {project.thumbnailUrl ? (
                        <img
                          src={project.thumbnailUrl}
                          alt={project.name}
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-950">
                          <FileText className="w-10 h-10 text-surface-800" />
                        </div>
                      )}
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-accent-default/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="p-2 rounded-full bg-accent-default text-white shadow-lg transform scale-0 group-hover:scale-100 transition-transform">
                          <Play className="w-5 h-5 fill-current" />
                        </div>
                      </div>

                      {/* Status badge in corner */}
                      <div className="absolute top-2 right-2">
                        <AnalysisStatusBadge lastAnalyzed={project.lastAnalyzedAt} />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h4 className="text-sm font-semibold text-white truncate">{project.name || 'Untitled Blueprint'}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-surface-500 uppercase tracking-tighter">
                          {project.fileType || 'PDF'} • {project.pageCount || 1} pg
                        </span>
                        {project.lastAnalyzedAt ? (
                          <span className="text-xs text-accent-default font-medium">Results Ready</span>
                        ) : (
                          <span className="text-xs text-surface-600">Unscanned</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
