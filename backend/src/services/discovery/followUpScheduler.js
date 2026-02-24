// Follow-Up Scheduling Service
// Manages automated follow-up sequences for leads

import { v4 as uuidv4 } from 'uuid';
import logger from '../logger.js';

// Default follow-up sequences (in days from initial contact)
const DEFAULT_SEQUENCES = {
  hot: [
    { day: 0, type: 'email', template: 'initial_outreach', priority: 'high' },
    { day: 2, type: 'call', template: 'follow_up_call', priority: 'high' },
    { day: 5, type: 'email', template: 'value_add', priority: 'medium' },
    { day: 10, type: 'email', template: 'case_study', priority: 'medium' },
    { day: 14, type: 'call', template: 'final_follow_up', priority: 'high' },
  ],
  warm: [
    { day: 0, type: 'email', template: 'initial_outreach', priority: 'medium' },
    { day: 3, type: 'email', template: 'educational', priority: 'medium' },
    { day: 7, type: 'email', template: 'value_add', priority: 'medium' },
    { day: 14, type: 'email', template: 'case_study', priority: 'low' },
    { day: 21, type: 'email', template: 'final_follow_up', priority: 'low' },
  ],
  cold: [
    { day: 0, type: 'email', template: 'soft_intro', priority: 'low' },
    { day: 7, type: 'email', template: 'educational', priority: 'low' },
    { day: 21, type: 'email', template: 'value_add', priority: 'low' },
  ],
};

/**
 * Calculate follow-up date from start date
 */
function calculateFollowUpDate(startDate, days) {
  const date = new Date(startDate);
  date.setDate(date.getDate() + days);

  // Skip weekends
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }

  return date.toISOString();
}

/**
 * Create a follow-up schedule for a lead
 */
export function createFollowUpSchedule(lead, options = {}) {
  const {
    sequence = null, // Custom sequence or use tier-based default
    startDate = new Date().toISOString(),
    customTouchpoints = null,
  } = options;

  // Use appropriate sequence based on tier
  const tier = lead.icpTier || 'cold';
  const touchpoints = sequence || customTouchpoints || DEFAULT_SEQUENCES[tier] || DEFAULT_SEQUENCES.cold;

  const schedule = {
    id: uuidv4(),
    leadId: lead.id,
    leadBusinessName: lead.businessName,
    createdAt: new Date().toISOString(),
    startDate,
    status: 'active',
    touchpoints: touchpoints.map((tp, index) => ({
      id: uuidv4(),
      sequenceOrder: index + 1,
      type: tp.type,
      template: tp.template,
      priority: tp.priority,
      scheduledFor: calculateFollowUpDate(startDate, tp.day),
      status: tp.day === 0 ? 'due' : 'pending',
      completedAt: null,
      completedBy: null,
      notes: null,
      autoSend: tp.type === 'email' && tp.day > 0, // Auto-send emails after initial
    })),
  };

  logger.info(`Created follow-up schedule for ${lead.businessName} with ${touchpoints.length} touchpoints`);

  return schedule;
}

/**
 * Get upcoming follow-ups
 */
export function getUpcomingFollowUps(schedules, options = {}) {
  const {
    withinHours = 24,
    priority = null,
    type = null,
  } = options;

  const now = new Date();
  const cutoff = new Date(now.getTime() + withinHours * 60 * 60 * 1000);

  const upcoming = [];

  for (const schedule of schedules) {
    if (schedule.status !== 'active') continue;

    for (const tp of schedule.touchpoints) {
      if (tp.status !== 'pending' && tp.status !== 'due') continue;
      if (priority && tp.priority !== priority) continue;
      if (type && tp.type !== type) continue;

      const scheduledDate = new Date(tp.scheduledFor);
      if (scheduledDate <= cutoff) {
        upcoming.push({
          scheduleId: schedule.id,
          leadId: schedule.leadId,
          leadBusinessName: schedule.leadBusinessName,
          ...tp,
        });
      }
    }
  }

  // Sort by scheduled date, then priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  upcoming.sort((a, b) => {
    const dateDiff = new Date(a.scheduledFor) - new Date(b.scheduledFor);
    if (dateDiff !== 0) return dateDiff;
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return upcoming;
}

/**
 * Mark touchpoint as completed
 */
export function completeTouchpoint(schedule, touchpointId, completionData = {}) {
  const { notes = null, completedBy = 'system', outcome = 'completed' } = completionData;

  const touchpoint = schedule.touchpoints.find(tp => tp.id === touchpointId);
  if (!touchpoint) {
    return { success: false, error: 'Touchpoint not found' };
  }

  touchpoint.status = outcome === 'completed' ? 'completed' : outcome;
  touchpoint.completedAt = new Date().toISOString();
  touchpoint.completedBy = completedBy;
  touchpoint.notes = notes;

  // Activate next touchpoint if this one was completed
  if (outcome === 'completed') {
    const nextTp = schedule.touchpoints.find(tp =>
      tp.sequenceOrder === touchpoint.sequenceOrder + 1 && tp.status === 'pending'
    );
    if (nextTp) {
      nextTp.status = 'due';
      logger.info(`Activated next touchpoint for ${schedule.leadBusinessName}: ${nextTp.type} on ${nextTp.scheduledFor}`);
    }
  }

  // Check if all touchpoints are completed
  const allCompleted = schedule.touchpoints.every(tp =>
    tp.status === 'completed' || tp.status === 'skipped' || tp.status === 'bounced'
  );
  if (allCompleted) {
    schedule.status = 'completed';
    schedule.completedAt = new Date().toISOString();
  }

  return { success: true, schedule, touchpoint };
}

/**
 * Skip a touchpoint
 */
export function skipTouchpoint(schedule, touchpointId, reason = '') {
  return completeTouchpoint(schedule, touchpointId, {
    outcome: 'skipped',
    notes: reason,
  });
}

/**
 * Reschedule a touchpoint
 */
export function rescheduleTouchpoint(schedule, touchpointId, newDate) {
  const touchpoint = schedule.touchpoints.find(tp => tp.id === touchpointId);
  if (!touchpoint) {
    return { success: false, error: 'Touchpoint not found' };
  }

  touchpoint.scheduledFor = newDate;
  touchpoint.status = 'pending';
  touchpoint.notes = touchpoint.notes ? `${touchpoint.notes} (Rescheduled)` : 'Rescheduled';

  // Re-sort touchpoints by scheduled date
  schedule.touchpoints.sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));

  // Reassign sequence orders
  schedule.touchpoints.forEach((tp, idx) => {
    tp.sequenceOrder = idx + 1;
  });

  return { success: true, schedule, touchpoint };
}

/**
 * Pause/resume follow-up schedule
 */
export function setScheduleStatus(schedule, status) {
  if (!['active', 'paused', 'completed', 'cancelled'].includes(status)) {
    return { success: false, error: 'Invalid status' };
  }

  schedule.status = status;
  schedule.statusChangedAt = new Date().toISOString();

  return { success: true, schedule };
}

/**
 * Get schedule stats
 */
export function getScheduleStats(schedules) {
  const stats = {
    total: schedules.length,
    active: 0,
    paused: 0,
    completed: 0,
    cancelled: 0,
    totalTouchpoints: 0,
    completedTouchpoints: 0,
    pendingTouchpoints: 0,
    overdueTouchpoints: 0,
  };

  const now = new Date();

  for (const schedule of schedules) {
    stats[schedule.status]++;

    for (const tp of schedule.touchpoints) {
      stats.totalTouchpoints++;

      if (tp.status === 'completed') {
        stats.completedTouchpoints++;
      } else if (tp.status === 'pending' || tp.status === 'due') {
        stats.pendingTouchpoints++;
        if (new Date(tp.scheduledFor) < now) {
          stats.overdueTouchpoints++;
        }
      }
    }
  }

  stats.completionRate = stats.totalTouchpoints > 0
    ? ((stats.completedTouchpoints / stats.totalTouchpoints) * 100).toFixed(1)
    : 0;

  return stats;
}

/**
 * Generate daily follow-up task list
 */
export function generateDailyTasks(schedules, date = null) {
  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

  const tasks = {
    calls: [],
    emails: [],
    other: [],
  };

  for (const schedule of schedules) {
    if (schedule.status !== 'active') continue;

    for (const tp of schedule.touchpoints) {
      if (tp.status !== 'pending' && tp.status !== 'due') continue;

      const scheduledDate = new Date(tp.scheduledFor);
      if (scheduledDate >= startOfDay && scheduledDate <= endOfDay) {
        const task = {
          scheduleId: schedule.id,
          leadId: schedule.leadId,
          leadBusinessName: schedule.leadBusinessName,
          touchpointId: tp.id,
          type: tp.type,
          template: tp.template,
          priority: tp.priority,
          scheduledFor: tp.scheduledFor,
        };

        if (tp.type === 'call') {
          tasks.calls.push(task);
        } else if (tp.type === 'email') {
          tasks.emails.push(task);
        } else {
          tasks.other.push(task);
        }
      }
    }
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  tasks.calls.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  tasks.emails.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return tasks;
}

/**
 * Create custom sequence from template
 */
export function createCustomSequence(baseTier, modifications = {}) {
  const baseSequence = DEFAULT_SEQUENCES[baseTier] || DEFAULT_SEQUENCES.cold;

  if (modifications.add) {
    return [...baseSequence, ...modifications.add];
  }

  if (modifications.remove) {
    return baseSequence.filter(tp => !modifications.remove.includes(tp.day));
  }

  if (modifications.adjust) {
    return baseSequence.map(tp => ({
      ...tp,
      day: modifications.adjust[tp.day] ?? tp.day,
    }));
  }

  return baseSequence;
}

/**
 * Auto-process due touchpoints (for automated email sending)
 */
export function getAutoSendEmails(schedules) {
  const now = new Date();
  const toSend = [];

  for (const schedule of schedules) {
    if (schedule.status !== 'active') continue;

    for (const tp of schedule.touchpoints) {
      if (tp.type === 'email' &&
          tp.autoSend &&
          tp.status === 'due' &&
          new Date(tp.scheduledFor) <= now) {
        toSend.push({
          scheduleId: schedule.id,
          leadId: schedule.leadId,
          leadBusinessName: schedule.leadBusinessName,
          touchpointId: tp.id,
          template: tp.template,
          scheduledFor: tp.scheduledFor,
        });
      }
    }
  }

  return toSend;
}

export default {
  createFollowUpSchedule,
  getUpcomingFollowUps,
  completeTouchpoint,
  skipTouchpoint,
  rescheduleTouchpoint,
  setScheduleStatus,
  getScheduleStats,
  generateDailyTasks,
  createCustomSequence,
  getAutoSendEmails,
  DEFAULT_SEQUENCES,
};
