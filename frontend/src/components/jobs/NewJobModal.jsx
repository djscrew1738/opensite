import { Plus, X, MapPin, Building2, HardHat, CheckCircle2, FileText } from 'lucide-react';

export default function NewJobModal({ show, onClose, jobData, setJobData, onSubmit, isPending, error }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-xl overflow-hidden"
        style={{ background: '#111318', border: '1px solid #1F2430' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #1F2430' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(59, 130, 246, 0.1)' }}
            >
              <Plus className="w-5 h-5" style={{ color: '#3B82F6' }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: '#F1F5F9' }}>
                Create New Job
              </h2>
              <p className="text-sm" style={{ color: '#64748B' }}>
                Add a new project to track
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#1F2430] transition-colors"
          >
            <X className="w-5 h-5" style={{ color: '#64748B' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>
              <MapPin className="w-4 h-4 inline mr-1" />
              Job Name / Address *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., 123 Main St, Dallas, TX"
              value={jobData.name}
              onChange={(e) => setJobData({ ...jobData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-[#0A0C10] border border-[#1F2430] text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>
              <Building2 className="w-4 h-4 inline mr-1" />
              Builder / Client
            </label>
            <input
              type="text"
              placeholder="e.g., Lennar Homes"
              value={jobData.builder}
              onChange={(e) => setJobData({ ...jobData, builder: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-[#0A0C10] border border-[#1F2430] text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>
                <HardHat className="w-4 h-4 inline mr-1" />
                Phase
              </label>
              <select
                value={jobData.phase}
                onChange={(e) => setJobData({ ...jobData, phase: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-[#0A0C10] border border-[#1F2430] text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-colors"
              >
                <option value="rough-in">Rough In</option>
                <option value="top-out">Top Out</option>
                <option value="trim">Trim</option>
                <option value="complete">Complete</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>
                <CheckCircle2 className="w-4 h-4 inline mr-1" />
                Status
              </label>
              <select
                value={jobData.status}
                onChange={(e) => setJobData({ ...jobData, status: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-[#0A0C10] border border-[#1F2430] text-[#F1F5F9] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-colors"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>
              <FileText className="w-4 h-4 inline mr-1" />
              Notes
            </label>
            <textarea
              rows={3}
              placeholder="Additional job details..."
              value={jobData.notes}
              onChange={(e) => setJobData({ ...jobData, notes: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-[#0A0C10] border border-[#1F2430] text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] transition-colors resize-none"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">
                {error.message || 'Failed to create job'}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-all"
              style={{ background: '#1F2430', color: '#94A3B8' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!jobData.name.trim() || isPending}
              className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: '#3B82F6',
                color: '#FFFFFF',
                boxShadow: '0 0 12px rgba(59, 130, 246, 0.3)',
              }}
            >
              {isPending ? 'Creating...' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
