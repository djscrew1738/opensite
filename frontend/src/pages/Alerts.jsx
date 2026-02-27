import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bell, Mail, HardHat, Radar, Settings as GearIcon,
  CheckCheck, X, Loader2,
} from 'lucide-react';
import { api } from '../api/client';
import { ensureArray } from '../utils/safeArray';

/**
 * Alerts Page — Real-time alert center for Job Pulse
 * Sources: email monitor, job overdue detection, recent permits
 */

const ALERT_TYPES = {
  all:    { label: 'All',    icon: Bell },
  email:  { label: 'Emails', icon: Mail },
  job:    { label: 'Jobs',   icon: HardHat },
  lead:   { label: 'Leads',  icon: Radar },
  system: { label: 'System', icon: GearIcon },
};

const ALERT_COLORS = {
  email:  '#3B82F6',
  job:    '#F59E0B',
  lead:   '#10B981',
  system: '#8B5CF6',
};

function formatRelative(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  if (diff < 60000)        return 'Just now';
  if (diff < 3600000)      return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000)     return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 7 * 86400000) return `${Math.floor(diff / 86400000)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Build unified alert list from multiple API sources
function buildAlerts(emailData, projectsData, permitsData) {
  const alerts = [];

  // ── Email monitor alerts ──────────────────────────────────────────────────
  const emails = ensureArray(emailData?.alerts ?? emailData);
  emails.forEach((e) => {
    alerts.push({
      id:      `email-${e.id}`,
      type:    'email',
      title:   e.subject || 'Email Alert',
      body:    e.snippet || `From: ${e.fromName || e.fromAddress}${e.matchedKeywords ? ` · Keywords: ${e.matchedKeywords}` : ''}`,
      timestamp: formatRelative(e.receivedAt),
      sortKey: new Date(e.receivedAt).getTime(),
      read:    true,
    });
  });

  // ── Job alerts — overdue / inspection-due ─────────────────────────────────
  const rawProjects = ensureArray(projectsData?.projects ?? projectsData?.jobs ?? projectsData);
  rawProjects.forEach((job) => {
    const days = job.daysInPhase ?? job.daysInCurrentPhase ??
      Math.floor((Date.now() - new Date(job.updatedAt).getTime()) / 86400000);
    if (days < 7) return;
    const overdue = days > 10;
    const address = job.address || job.name || 'Unknown Address';
    const phaseRaw = (job.phase || job.currentPhase || 'phase');
    const phase = phaseRaw === 'roughin' ? 'Rough-In' : phaseRaw === 'topout' ? 'Top-Out' : phaseRaw;
    alerts.push({
      id:      `job-${job.id}`,
      type:    'job',
      title:   overdue ? 'Phase Overdue' : 'Inspection Due',
      body:    `${address} has been in ${phase} for ${days} days.${overdue ? ' Expected: 7 days.' : ''}`,
      timestamp: `${days}d`,
      sortKey: Date.now() - days * 86400000,
      read:    !overdue,
    });
  });

  // ── Recent permit / lead alerts ───────────────────────────────────────────
  const permits = ensureArray(permitsData?.data ?? permitsData?.permits ?? permitsData);
  permits.slice(0, 8).forEach((p) => {
    if (!p.createdAt) return;
    const age = Date.now() - new Date(p.createdAt).getTime();
    if (age > 7 * 86400000) return; // only last 7 days
    const address = p.address || p.location || 'Unknown Address';
    const city    = p.city || '';
    alerts.push({
      id:      `permit-${p.id}`,
      type:    'lead',
      title:   `New Permit${city ? `: ${city}` : ''}`,
      body:    `${p.permitType || 'Plumbing'} permit filed at ${address}${p.builderName ? ` · Builder: ${p.builderName}` : ''}.`,
      timestamp: formatRelative(p.createdAt),
      sortKey: new Date(p.createdAt).getTime(),
      read:    true,
    });
  });

  // Sort newest first
  return alerts.sort((a, b) => b.sortKey - a.sortKey);
}

export default function Alerts() {
  const [filter, setFilter]     = useState('all');
  const [dismissed, setDismissed] = useState(new Set());
  const [read, setRead]         = useState(new Set());

  // ── Data fetching ─────────────────────────────────────────────────────────
  const { data: emailData, isLoading: loadingEmail } = useQuery({
    queryKey: ['alerts-email'],
    queryFn:  () => api.emailMonitor.getAlerts({ limit: 20 }),
    staleTime: 60000,
    retry: 1,
  });

  const { data: projectsData, isLoading: loadingJobs } = useQuery({
    queryKey: ['alerts-jobs'],
    queryFn:  () => api.projects.getAll(),
    staleTime: 120000,
    retry: 1,
  });

  const { data: permitsData, isLoading: loadingPermits } = useQuery({
    queryKey: ['alerts-permits'],
    queryFn:  () => api.permits.getAll({ limit: 20, sort: 'date' }),
    staleTime: 300000,
    retry: 1,
  });

  const isLoading = loadingEmail && loadingJobs && loadingPermits;

  // ── Merge + filter ────────────────────────────────────────────────────────
  const allAlerts = useMemo(
    () => buildAlerts(emailData, projectsData, permitsData).filter(a => !dismissed.has(a.id)),
    [emailData, projectsData, permitsData, dismissed],
  );

  const displayAlerts = useMemo(() => {
    const withRead = allAlerts.map(a => ({ ...a, read: a.read || read.has(a.id) }));
    if (filter === 'all') return withRead;
    return withRead.filter(a => a.type === filter);
  }, [allAlerts, filter, read]);

  const unreadCount = useMemo(
    () => allAlerts.filter(a => !a.read && !read.has(a.id)).length,
    [allAlerts, read],
  );

  const markAllRead = () => setRead(new Set(allAlerts.map(a => a.id)));
  const dismiss     = (id) => setDismissed(prev => new Set([...prev, id]));

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="font-bold" style={{ color: '#F1F5F9', fontSize: '22px', lineHeight: 1.2 }}>
            Alerts
          </h1>
          {unreadCount > 0 && (
            <span
              className="flex items-center justify-center text-white font-bold"
              style={{ width: '22px', height: '22px', fontSize: '11px', borderRadius: '11px', background: '#EF4444' }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
            style={{ color: '#3B82F6' }}
            onClick={markAllRead}
          >
            <CheckCheck className="w-4 h-4" />
            Mark All Read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto scrollbar-hide pb-1">
        {Object.entries(ALERT_TYPES).map(([key, { label, icon: Icon }]) => {
          const isActive = filter === key;
          const count = key === 'all'
            ? allAlerts.length
            : allAlerts.filter(a => a.type === key).length;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all duration-200 flex-shrink-0"
              style={{
                background: isActive ? '#3B82F6' : 'transparent',
                color: isActive ? '#FFFFFF' : '#94A3B8',
                minHeight: '40px',
              }}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span
                className="font-mono text-xs tabular-nums px-1.5 py-0.5 rounded-full"
                style={{
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(148,163,184,0.1)',
                  fontSize: '11px',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Alert feed */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#3B82F6' }} />
        </div>
      ) : displayAlerts.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Bell className="w-12 h-12 mb-4" style={{ color: '#475569' }} strokeWidth={1.5} />
          <p style={{ color: '#F1F5F9', fontSize: '17px', fontWeight: 600 }}>All clear</p>
          <p style={{ color: '#475569', fontSize: '15px' }} className="mt-1">
            No alerts in this category
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onDismiss={() => dismiss(alert.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function AlertCard({ alert, onDismiss }) {
  const { type, title, body, timestamp, read } = alert;
  const color    = ALERT_COLORS[type] || '#94A3B8';
  const TypeIcon = ALERT_TYPES[type]?.icon || Bell;

  return (
    <div
      className="relative flex gap-3 p-3.5 rounded-xl transition-all duration-200 group"
      style={{
        background: read ? '#111318' : '#13151B',
        border: '1px solid #1F2430',
        boxShadow: read ? 'none' : `inset 3px 0 0 ${color}`,
        minHeight: '56px',
      }}
    >
      {/* Type icon */}
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-lg"
        style={{ width: '36px', height: '36px', background: `${color}15` }}
      >
        <TypeIcon className="w-4 h-4" style={{ color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className="font-semibold truncate"
            style={{ color: read ? '#94A3B8' : '#F1F5F9', fontSize: '15px', lineHeight: 1.4 }}
          >
            {title}
          </p>
          <span className="font-mono text-xs tabular-nums flex-shrink-0 mt-0.5" style={{ color: '#475569' }}>
            {timestamp}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2" style={{ color: '#475569', fontSize: '13px', lineHeight: 1.4 }}>
          {body}
        </p>
      </div>

      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/5"
        style={{ color: '#475569' }}
        aria-label="Dismiss alert"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Unread dot */}
      {!read && (
        <div
          className="absolute top-3 right-3 w-2 h-2 rounded-full"
          style={{ background: '#3B82F6', boxShadow: '0 0 6px rgba(59,130,246,0.4)' }}
        />
      )}
    </div>
  );
}
