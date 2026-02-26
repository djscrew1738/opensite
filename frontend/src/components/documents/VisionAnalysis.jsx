import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, BrainCircuit, FileText } from 'lucide-react';
import { NoAnalysisEmpty } from '../empty-states';
import VisionCanvas from '../vision/VisionCanvas';

export default function VisionAnalysis({ projects, onSelectProject }) {
  const [selectedId, setSelectedId] = useState(null);

  const selectedProject = projects.find(p => p.id === selectedId);

  if (selectedId && selectedProject) {
    return (
      <div className="h-full flex flex-col">
        <div
          className="flex items-center gap-3 p-4"
          style={{ borderBottom: '1px solid #1F2430' }}
        >
          <motion.button
            onClick={() => setSelectedId(null)}
            whileHover={{ x: -2 }}
            transition={{ duration: 0.1 }}
            className="flex items-center gap-1 text-sm"
            style={{ color: '#94A3B8' }}
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to documents
          </motion.button>
        </div>
        <div className="flex-1 overflow-hidden">
          <VisionCanvas projectId={selectedId} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div
        className="flex items-center justify-between mb-6 p-4 rounded-xl"
        style={{
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(59, 130, 246, 0.1)' }}
          >
            <BrainCircuit className="w-5 h-5" style={{ color: '#3B82F6' }} />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: '#F1F5F9' }}>AI Vision Analysis</h3>
            <p className="text-sm" style={{ color: '#94A3B8' }}>Analyze blueprints with AI-powered detection</p>
          </div>
        </div>
      </div>

      {projects.length === 0 ? (
        <NoAnalysisEmpty onUpload={() => {}} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {projects.map((project) => (
            <motion.button
              key={project.id}
              onClick={() => setSelectedId(project.id)}
              whileHover={{ y: -2, borderColor: '#2D3548' }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="p-4 rounded-xl text-left"
              style={{
                background: '#111318',
                border: '1px solid #1F2430',
              }}
            >
              <div className="aspect-video rounded-lg mb-3 overflow-hidden" style={{ background: '#0A0B0D' }}>
                {project.thumbnailUrl ? (
                  <img
                    src={project.thumbnailUrl}
                    alt={project.name}
                    className="w-full h-full object-cover opacity-70"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="w-8 h-8" style={{ color: '#2D3548' }} />
                  </div>
                )}
              </div>
              <p className="font-medium text-sm truncate" style={{ color: '#F1F5F9' }}>
                {project.name || 'Untitled'}
              </p>
              <p className="text-xs mt-1" style={{ color: '#64748B' }}>
                Click to analyze
              </p>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
