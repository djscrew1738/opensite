import { useState } from 'react';
import { X, Briefcase } from 'lucide-react';

const PHASES = [
  { value: 'rough-in', label: 'Rough-In' },
  { value: 'top-out', label: 'Top-Out' },
  { value: 'trim', label: 'Trim' },
  { value: 'complete', label: 'Complete' }
];

export default function ProjectModal({ project, onClose, onSave, isSaving }) {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    phase: project?.phase || 'rough-in',
    progress: project?.progress || 0,
    value: project?.value || '',
    startDate: project?.startDate || new Date().toISOString().split('T')[0],
    estimatedCompletion: project?.estimatedCompletion || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      value: Number(formData.value) || 0,
      progress: Number(formData.progress) || 0
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full shadow-2xl border border-concrete-200 dark:border-gray-700 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-concrete-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-display font-bold text-gray-900 dark:text-gray-100">
              {project ? 'Edit Project' : 'New Project'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-concrete-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Project Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input w-full"
              placeholder="e.g. Lakewood Apartments - Building C"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Phase
              </label>
              <select
                name="phase"
                value={formData.phase}
                onChange={handleChange}
                className="input w-full"
              >
                {PHASES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Progress (%)
              </label>
              <input
                type="number"
                name="progress"
                value={formData.progress}
                onChange={handleChange}
                min="0"
                max="100"
                className="input w-full"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Project Value ($)
            </label>
            <input
              type="number"
              name="value"
              value={formData.value}
              onChange={handleChange}
              className="input w-full"
              placeholder="50000"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Est. Completion
              </label>
              <input
                type="date"
                name="estimatedCompletion"
                value={formData.estimatedCompletion}
                onChange={handleChange}
                className="input w-full"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
