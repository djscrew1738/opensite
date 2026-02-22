import { useState, useCallback, useMemo, useEffect } from 'react';

/**
 * Notification priority levels
 */
export const NotificationPriority = {
  URGENT: 'urgent',     // Red - immediate action required
  ACTION: 'action',     // Yellow - action needed soon
  INFO: 'info',         // Gray - informational
};

/**
 * Notification types for contextual actions
 */
export const NotificationType = {
  COLD_LEAD: 'cold_lead',           // Lead going cold
  STUCK_JOB: 'stuck_job',           // Job stuck in phase
  HOT_LEAD: 'hot_lead',             // AI-scored hot lead
  NEW_PERMIT: 'new_permit',         // New permit detected
  PENDING_ESTIMATE: 'pending_estimate', // Estimate needs sending
  PHASE_DUE: 'phase_due',           // Phase transition due
  PHASE_COMPLETED: 'phase_completed', // Phase completed
  LEAD_ARCHIVED: 'lead_archived',   // Lead archived
};

/**
 * Generate notifications from job and lead data
 * This function analyzes the data and creates contextual notifications
 */
export function generateNotifications(jobs = [], leads = []) {
  const notifications = [];
  const now = new Date();

  // Check for jobs stuck in phases (7+ days)
  jobs.forEach(job => {
    if (job.daysInPhase >= 7) {
      notifications.push({
        id: `stuck-${job.id}`,
        type: NotificationType.STUCK_JOB,
        priority: NotificationPriority.URGENT,
        title: 'Job Stuck in Phase',
        message: `${job.address} has been in ${job.phase} for ${job.daysInPhase} days`,
        entityId: job.id,
        entityType: 'job',
        actionLabel: 'Advance Phase',
        actionIcon: 'arrow-right',
        timestamp: now.toISOString(),
      });
    } else if (job.daysInPhase >= 5) {
      // Warning for jobs approaching 7 days
      notifications.push({
        id: `phase-due-${job.id}`,
        type: NotificationType.PHASE_DUE,
        priority: NotificationPriority.ACTION,
        title: 'Phase Transition Due',
        message: `${job.address} - ${job.phase} phase may need advancement`,
        entityId: job.id,
        entityType: 'job',
        actionLabel: 'View Job',
        actionIcon: 'eye',
        timestamp: now.toISOString(),
      });
    }

    // Check for overdue status
    if (job.status === 'overdue') {
      notifications.push({
        id: `overdue-${job.id}`,
        type: NotificationType.STUCK_JOB,
        priority: NotificationPriority.URGENT,
        title: 'Overdue Job',
        message: `${job.address} is marked overdue`,
        entityId: job.id,
        entityType: 'job',
        actionLabel: 'Take Action',
        actionIcon: 'alert',
        timestamp: now.toISOString(),
      });
    }
  });

  // Check leads for cold leads (no contact in 48hrs)
  leads.forEach(lead => {
    const lastContact = lead.lastContactDate ? new Date(lead.lastContactDate) : null;
    const hoursSinceContact = lastContact 
      ? (now - lastContact) / (1000 * 60 * 60)
      : Infinity;

    if (hoursSinceContact > 48 && lead.status !== 'archived') {
      notifications.push({
        id: `cold-${lead.id}`,
        type: NotificationType.COLD_LEAD,
        priority: NotificationPriority.URGENT,
        title: 'Lead Going Cold',
        message: `${lead.name || lead.company} - no contact in ${Math.floor(hoursSinceContact / 24)} days`,
        entityId: lead.id,
        entityType: 'lead',
        actionLabel: 'Call Now',
        actionIcon: 'phone',
        timestamp: now.toISOString(),
      });
    }

    // Hot leads from AI scoring
    if (lead.aiScore >= 80 && lead.status !== 'contacted') {
      notifications.push({
        id: `hot-${lead.id}`,
        type: NotificationType.HOT_LEAD,
        priority: NotificationPriority.URGENT,
        title: 'Hot Lead Alert',
        message: `${lead.name || lead.company} scored ${lead.aiScore}/100 - High priority follow-up`,
        entityId: lead.id,
        entityType: 'lead',
        actionLabel: 'View Lead',
        actionIcon: 'eye',
        timestamp: now.toISOString(),
      });
    }

    // New permits detected
    if (lead.isNewPermit && lead.permitDate) {
      const permitDate = new Date(lead.permitDate);
      const daysSincePermit = (now - permitDate) / (1000 * 60 * 60 * 24);
      
      if (daysSincePermit <= 3) {
        notifications.push({
          id: `permit-${lead.id}`,
          type: NotificationType.NEW_PERMIT,
          priority: NotificationPriority.ACTION,
          title: 'New Permit Detected',
          message: `${lead.address || lead.company} - permit issued ${Math.floor(daysSincePermit)} days ago`,
          entityId: lead.id,
          entityType: 'lead',
          actionLabel: 'View Lead',
          actionIcon: 'eye',
          timestamp: now.toISOString(),
        });
      }
    }

    // Pending estimates
    if (lead.status === 'estimate_pending') {
      notifications.push({
        id: `estimate-${lead.id}`,
        type: NotificationType.PENDING_ESTIMATE,
        priority: NotificationPriority.ACTION,
        title: 'Estimate Pending',
        message: `${lead.name || lead.company} - estimate needs to be sent`,
        entityId: lead.id,
        entityType: 'lead',
        actionLabel: 'Send Quote',
        actionIcon: 'send',
        timestamp: now.toISOString(),
      });
    }

    // Archived leads info
    if (lead.status === 'archived' && lead.archivedDate) {
      const archivedDate = new Date(lead.archivedDate);
      const daysSinceArchived = (now - archivedDate) / (1000 * 60 * 60 * 24);
      
      if (daysSinceArchived <= 1) {
        notifications.push({
          id: `archived-${lead.id}`,
          type: NotificationType.LEAD_ARCHIVED,
          priority: NotificationPriority.INFO,
          title: 'Lead Archived',
          message: `${lead.name || lead.company} was archived`,
          entityId: lead.id,
          entityType: 'lead',
          actionLabel: 'View Archive',
          actionIcon: 'archive',
          timestamp: now.toISOString(),
        });
      }
    }
  });

  // Sort by priority (urgent first), then by timestamp
  return notifications.sort((a, b) => {
    const priorityOrder = { [NotificationPriority.URGENT]: 0, [NotificationPriority.ACTION]: 1, [NotificationPriority.INFO]: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
}

/**
 * Hook for managing notifications
 */
export function useNotifications(jobs = [], leads = []) {
  // Generate notifications from data
  const generatedNotifications = useMemo(() => {
    return generateNotifications(jobs, leads);
  }, [jobs, leads]);

  // Read state - stored in localStorage
  const [readIds, setReadIds] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('notification_read_ids');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  // Dismissed notifications (for current session)
  const [dismissedIds, setDismissedIds] = useState([]);

  // Persist read state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notification_read_ids', JSON.stringify(readIds));
    }
  }, [readIds]);

  // Filter out dismissed notifications
  const activeNotifications = useMemo(() => {
    return generatedNotifications.filter(n => !dismissedIds.includes(n.id));
  }, [generatedNotifications, dismissedIds]);

  // Mark single notification as read
  const markAsRead = useCallback((id) => {
    setReadIds(prev => [...new Set([...prev, id])]);
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setReadIds(prev => [...new Set([...prev, ...activeNotifications.map(n => n.id)])]);
  }, [activeNotifications]);

  // Dismiss notification
  const dismiss = useCallback((id) => {
    setDismissedIds(prev => [...prev, id]);
    markAsRead(id);
  }, [markAsRead]);

  // Clear all dismissed notifications
  const clearAll = useCallback(() => {
    setDismissedIds(activeNotifications.map(n => n.id));
    markAllAsRead();
  }, [activeNotifications, markAllAsRead]);

  // Get unread count
  const unreadCount = useMemo(() => {
    return activeNotifications.filter(n => !readIds.includes(n.id)).length;
  }, [activeNotifications, readIds]);

  // Check for urgent notifications
  const hasUrgent = useMemo(() => {
    return activeNotifications.some(n => 
      n.priority === NotificationPriority.URGENT && !readIds.includes(n.id)
    );
  }, [activeNotifications, readIds]);

  // Group notifications by priority
  const groupedNotifications = useMemo(() => {
    return {
      urgent: activeNotifications.filter(n => n.priority === NotificationPriority.URGENT),
      action: activeNotifications.filter(n => n.priority === NotificationPriority.ACTION),
      info: activeNotifications.filter(n => n.priority === NotificationPriority.INFO),
    };
  }, [activeNotifications]);

  return {
    notifications: activeNotifications,
    groupedNotifications,
    unreadCount,
    hasUrgent,
    readIds,
    markAsRead,
    markAllAsRead,
    dismiss,
    clearAll,
  };
}

export default useNotifications;
