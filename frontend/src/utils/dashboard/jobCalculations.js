/**
 * Job Calculation Utilities
 * Business logic for dashboard job metrics and focus items
 */

import { ensureArray } from '../safeArray';

// Phase normalization map — handles API variations
export const PHASE_NORMALIZE = {
  'underground': 'underground',
  'rough-in': 'roughin',
  'roughin': 'roughin',
  'rough_in': 'roughin',
  'top-out': 'topout',
  'topout': 'topout',
  'top_out': 'topout',
  'trim': 'trim',
  'final': 'final',
  'complete': 'final',
};

export const EARLY_PHASES = ['underground', 'roughin'];

/**
 * Normalize job phase from various API formats
 * @param {string} phase - Raw phase from API
 * @returns {string} Normalized phase
 */
export function normalizePhase(phase) {
  return PHASE_NORMALIZE[phase] || 'underground';
}

/**
 * Calculate job status based on days in phase
 * @param {number} daysInPhase 
 * @returns {string} Status: 'overdue' | 'due-today' | 'healthy'
 */
export function calculateJobStatus(daysInPhase) {
  if (daysInPhase > 10) return 'overdue';
  if (daysInPhase >= 7) return 'due-today';
  return 'healthy';
}

/**
 * Compute focus items for dashboard
 * Shows overdue jobs and jobs due soon for inspection
 * 
 * @param {Array} jobs - Array of job objects
 * @returns {Array} Focus items with job and reason
 */
export function computeFocusItems(jobs) {
  const safeJobs = ensureArray(jobs);
  if (safeJobs.length === 0) return [];

  const items = [];

  // Overdue: in phase > 10 days
  safeJobs
    .filter(j => j && j.daysInPhase > 10)
    .sort((a, b) => (b.daysInPhase || 0) - (a.daysInPhase || 0))
    .slice(0, 2)
    .forEach(job => {
      items.push({
        job,
        reason: `Overdue ${job.daysInPhase} days`,
        reasonColor: 'text-accent-red',
      });
    });

  // Due soon: 7-10 days in phase (exclude overdue already captured)
  safeJobs
    .filter(j => j && j.daysInPhase >= 7 && j.daysInPhase <= 10)
    .slice(0, 2)
    .forEach(job => {
      items.push({
        job,
        reason: 'Inspection soon',
        reasonColor: 'text-accent-amber',
      });
    });

  return items.slice(0, 4);
}

/**
 * Compute dashboard metrics from jobs and stats
 * 
 * @param {Array} jobs - Array of job objects
 * @param {Object} stats - Dashboard stats from API
 * @returns {Array} Metrics array for display
 */
export function computeMetrics(jobs, stats = {}) {
  const safeJobs = ensureArray(jobs);

  const activeJobs = safeJobs.filter(j => j && j.status !== 'completed').length;
  const overdueJobs = safeJobs.filter(j => j && j.daysInPhase > 10).length;
  const inspectionsDue = safeJobs.filter(j => j && j.daysInPhase >= 7 && j.daysInPhase <= 10).length;

  const totalRevenue = safeJobs.reduce((sum, j) => {
    if (!j) return sum;
    return sum + (j.estimate?.total || j.totalPrice || 0);
  }, 0);

  const pipelineJobs = safeJobs.filter(j =>
    j && EARLY_PHASES.includes(j.phase)
  ).length;

  return [
    { 
      label: 'Active Jobs', 
      value: String(activeJobs), 
      icon: 'HardHat', 
      color: 'text-accent', 
      bg: 'bg-accent/10' 
    },
    { 
      label: 'Inspections', 
      value: String(inspectionsDue || stats?.inspectionsDue || 0), 
      icon: 'Calendar', 
      color: 'text-accent-purple', 
      bg: 'bg-accent-purple/10' 
    },
    { 
      label: 'Overdue', 
      value: String(overdueJobs), 
      icon: 'AlertTriangle', 
      color: 'text-accent-red', 
      bg: 'bg-accent-red/10' 
    },
    { 
      label: 'Revenue', 
      value: totalRevenue > 0 
        ? `$${(totalRevenue / 1000).toFixed(1)}K` 
        : '$' + (stats?.revenue || '0'), 
      icon: 'DollarSign', 
      color: 'text-accent-green', 
      bg: 'bg-accent-green/10' 
    },
    { 
      label: 'Pipeline', 
      value: String(pipelineJobs), 
      icon: 'TrendingUp', 
      color: 'text-accent-amber', 
      bg: 'bg-accent-amber/10' 
    },
  ];
}

/**
 * Transform raw API job data to normalized format
 * @param {Object} jobData - Raw API response
 * @returns {Array} Normalized jobs array
 */
export function transformJobs(jobData) {
  const data = jobData && typeof jobData === 'object' ? jobData : {};
  const rawJobs = ensureArray(data.projects ?? data.jobs);

  return rawJobs.map(job => {
    if (!job || typeof job !== 'object') return null;
    
    const days = job.daysInPhase || 
      job.daysInCurrentPhase || 
      Math.floor((new Date() - new Date(job.updatedAt)) / (1000 * 60 * 60 * 24)) || 
      0;
    
    const normalizedPhase = normalizePhase(job.phase || job.currentPhase);
    
    return {
      id: job.id || job.jobId,
      address: job.address || job.name || 'Unknown Address',
      city: job.city || 'Unknown City',
      zip: job.zip || job.zipCode || '',
      builder: job.builder || job.builderName || 'Unknown Builder',
      phase: normalizedPhase,
      daysInPhase: days,
      status: calculateJobStatus(days),
      estimate: job.estimate,
      totalPrice: job.totalPrice || job.estimate?.total
    };
  }).filter(Boolean);
}
