import { useState, useMemo } from 'react';
import {
  Bell, Mail, HardHat, Radar, Settings as GearIcon,
  Check, CheckCheck, X,
} from 'lucide-react';

/**
 * Alerts Page — Full alert center for Job Pulse
 * Filter tabs: All, Emails, Jobs, Leads, System
 * Each alert has type color, icon, title, body preview, timestamp
 * Swipe left to dismiss, tap to expand
 */

// Mock alert data
const MOCK_ALERTS = [
  {
    id: 1, type: 'job', title: 'Inspection Scheduled',
    body: 'Rough-In inspection for 4521 Maple Ridge Dr scheduled for tomorrow at 9am.',
    timestamp: '2h ago', read: false,
  },
  {
    id: 2, type: 'email', title: 'DR Horton — Schedule Update',
    body: 'Updated schedule for Windhaven Phase 3. Three new lots added to your scope starting next week.',
    timestamp: '4h ago', read: false,
  },
  {
    id: 3, type: 'lead', title: 'New Permit: Prosper',
    body: 'Plumbing permit filed at 1823 Heritage Oak Ln, Prosper 75078. Builder: Horizon Homes.',
    timestamp: '6h ago', read: false,
  },
  {
    id: 4, type: 'job', title: 'Phase Overdue',
    body: 'Job #1042 at 9120 Stone Creek has been in Rough-In for 14 days. Expected: 7 days.',
    timestamp: '1d ago', read: true,
  },
  {
    id: 5, type: 'system', title: 'Sync Complete',
    body: 'All job data synchronized successfully. 12 jobs updated.',
    timestamp: '1d ago', read: true,
  },
  {
    id: 6, type: 'lead', title: 'Keyword Match: "plumbing permit"',
    body: 'New mention found in Denton County permit records matching your keyword rules.',
    timestamp: '2d ago', read: true,
  },
  {
    id: 7, type: 'email', title: 'Horizon Homes — Invoice Received',
    body: 'Payment confirmation for Invoice #2847. Amount: $12,450.00.',
    timestamp: '3d ago', read: true,
  },
];

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

export default function Alerts() {
  const [filter, setFilter] = useState('all');
  const [alerts, setAlerts] = useState(MOCK_ALERTS);

  const filtered = useMemo(() => {
    if (filter === 'all') return alerts;
    return alerts.filter(a => a.type === filter);
  }, [alerts, filter]);

  const unreadCount = alerts.filter(a => !a.read).length;

  const markAllRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
  };

  const dismissAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1
            className="font-bold"
            style={{ color: '#F1F5F9', fontSize: '22px', lineHeight: 1.2 }}
          >
            Alerts
          </h1>
          {unreadCount > 0 && (
            <span
              className="flex items-center justify-center text-white font-bold"
              style={{
                width: '22px', height: '22px', fontSize: '11px',
                borderRadius: '11px', background: '#EF4444',
              }}
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
          const count = key === 'all' ? alerts.length : alerts.filter(a => a.type === key).length;
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
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Bell className="w-12 h-12 mb-4" style={{ color: '#475569' }} strokeWidth={1.5} />
            <p style={{ color: '#F1F5F9', fontSize: '17px', fontWeight: 600 }}>All clear</p>
            <p style={{ color: '#475569', fontSize: '15px' }} className="mt-1">No alerts in this category</p>
          </div>
        ) : (
          filtered.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onDismiss={() => dismissAlert(alert.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function AlertCard({ alert, onDismiss }) {
  const { type, title, body, timestamp, read } = alert;
  const color = ALERT_COLORS[type] || '#94A3B8';
  const TypeIcon = ALERT_TYPES[type]?.icon || Bell;

  return (
    <div
      className="relative flex gap-3 p-3.5 rounded-xl transition-all duration-200 group"
      style={{
        background: read ? '#111318' : '#13151B',
        border: `1px solid ${read ? '#1F2430' : '#1F2430'}`,
        boxShadow: read ? 'none' : `inset 3px 0 0 ${color}`,
        minHeight: '56px',
      }}
    >
      {/* Type icon */}
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-lg"
        style={{
          width: '36px', height: '36px',
          background: `${color}15`,
        }}
      >
        <TypeIcon className="w-4 h-4" style={{ color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className="font-semibold truncate"
            style={{
              color: read ? '#94A3B8' : '#F1F5F9',
              fontSize: '15px', lineHeight: 1.4,
            }}
          >
            {title}
          </p>
          <span
            className="font-mono text-xs tabular-nums flex-shrink-0 mt-0.5"
            style={{ color: '#475569' }}
          >
            {timestamp}
          </span>
        </div>
        <p
          className="mt-0.5 line-clamp-2"
          style={{ color: '#475569', fontSize: '13px', lineHeight: 1.4 }}
        >
          {body}
        </p>
      </div>

      {/* Dismiss button on hover */}
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/5"
        style={{ color: '#475569' }}
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Unread indicator */}
      {!read && (
        <div
          className="absolute top-3 right-3 w-2 h-2 rounded-full"
          style={{ background: '#3B82F6', boxShadow: '0 0 6px rgba(59,130,246,0.4)' }}
        />
      )}
    </div>
  );
}
