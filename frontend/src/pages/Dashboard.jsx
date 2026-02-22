import { Plus } from 'lucide-react';
import { useState } from 'react';
import JobPulseHome from '../components/dashboard/JobPulseHome';
import { QuickAddSheet } from '../components/ui/BottomSheet';

/**
 * Dashboard Page — Job Pulse Command Center
 * Mobile-first with FAB → Quick Add bottom sheet
 */
export default function Dashboard() {
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  return (
    <div className="relative min-h-screen">
      <JobPulseHome />

      {/* Floating Action Button */}
      <button
        className="fab"
        onClick={() => setShowQuickAdd(true)}
        aria-label="Quick add job"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>

      {/* Quick Add Bottom Sheet */}
      <QuickAddSheet
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        title="Quick Add"
        subtitle="Add a new job or inspection"
      >
        <div className="p-4 space-y-4">
          <div>
            <label className="label">Job Address</label>
            <input className="input" placeholder="123 Main St, Frisco, 75034" />
          </div>
          <div>
            <label className="label">Builder</label>
            <select className="input select-arrow">
              <option value="">Select builder...</option>
              <option value="drhorton">DR Horton</option>
              <option value="horizon">Horizon Homes</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Starting Phase</label>
            <select className="input select-arrow">
              <option value="underground">Underground</option>
              <option value="roughin">Rough-In</option>
              <option value="topout">Top-Out</option>
              <option value="trim">Trim</option>
              <option value="final">Final</option>
            </select>
          </div>
          <button className="btn-primary w-full">
            <Plus className="w-4 h-4" />
            Add Job
          </button>
        </div>
      </QuickAddSheet>
    </div>
  );
}
