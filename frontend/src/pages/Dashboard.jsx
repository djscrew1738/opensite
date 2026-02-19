import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  DollarSign, Briefcase, Flame, Users, Building2, Plus, Activity,
  ArrowUpRight, RefreshCw, AlertCircle, Bot, FileText, X,
  MapPin, Phone, Mail, Edit3, Clock,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/dashboard/StatCard';
import ProjectModal from '../components/projects/ProjectModal';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning, Cory';
  if (h < 17) return 'Good afternoon, Cory';
  return 'Good evening, Cory';
}

function phaseColor(phase = '') {
  const p = phase.toLowerCase();
  if (p.includes('rough')) return '#3b82f6';
  if (p.includes('finish')) return '#10b981';
  if (p.includes('design') || p.includes('permit')) return '#f59e0b';
  if (p.includes('complete')) return '#8b5cf6';
  return '#003594';
}

/* ── Lead Drawer ── */
function LeadDetailDrawer({ lead, onClose, onNavigate }) {
  if (!lead) return null;
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-surface-900 h-full shadow-2xl animate-slide-left overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800 px-5 py-4 flex items-center justify-between">
          <h3 className="text-sm font-display font-bold text-surface-900 dark:text-surface-100">
            Lead Details
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            <X className="w-4 h-4 text-surface-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <h2 className="text-xl font-display font-bold text-surface-900 dark:text-surface-100">
              {lead.name}
            </h2>
            {lead.company && (
              <p className="text-sm text-surface-500 mt-0.5">{lead.company}</p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                lead.status === 'hot'
                  ? 'bg-hot-50 text-hot-600 dark:bg-hot-950/30 dark:text-hot-400'
                  : lead.status === 'warm'
                  ? 'bg-warm-50 text-warm-600 dark:bg-warm-950/30 dark:text-warm-400'
                  : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400'
              }`}
            >
              {lead.status || 'new'}
            </span>
            {lead.score > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-copper-50 text-copper-600 dark:bg-copper-950/30 dark:text-copper-400">
                Score {lead.score}
              </span>
            )}
          </div>

          {lead.value > 0 && (
            <div
              className="p-4 rounded-xl"
              style={{
                background: 'rgba(0,53,148,0.04)',
                border: '1px solid rgba(0,53,148,0.1)',
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-surface-400 mb-1">
                Estimated Value
              </p>
              <p className="text-3xl font-display font-bold text-copper-600 dark:text-copper-400">
                ${lead.value?.toLocaleString()}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {lead.email && (
              <div className="flex items-center gap-3 text-sm text-surface-700 dark:text-surface-300">
                <Mail className="w-4 h-4 text-surface-400" />
                <span>{lead.email}</span>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-3 text-sm text-surface-700 dark:text-surface-300">
                <Phone className="w-4 h-4 text-surface-400" />
                <span>{lead.phone}</span>
              </div>
            )}
            {lead.location && (
              <div className="flex items-center gap-3 text-sm text-surface-700 dark:text-surface-300">
                <MapPin className="w-4 h-4 text-surface-400" />
                <span>{lead.location}</span>
              </div>
            )}
          </div>

          {lead.notes && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-surface-400 mb-2">
                Notes
              </p>
              <p className="text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap leading-relaxed">
                {lead.notes}
              </p>
            </div>
          )}

          <p className="text-xs text-surface-400">
            Added{' '}
            {new Date(lead.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => { onClose(); onNavigate('/leads'); }}
              className="btn-primary flex-1 text-sm"
            >
              <Edit3 className="w-4 h-4" />
              Edit Lead
            </button>
            <button
              onClick={() => { onClose(); onNavigate('/plans'); }}
              className="btn-secondary flex-1 text-sm"
            >
              <FileText className="w-4 h-4" />
              Estimate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Section Card wrapper ── */
function SectionCard({ children, className = '' }) {
  return (
    <div
      className={`bg-white dark:bg-surface-900/80 rounded-2xl border border-surface-200/60 dark:border-surface-800/40 overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

/* ── Section Header ── */
function SectionHead({ icon: Icon, iconColor, iconBg, title, action, actionLabel }) {
  return (
    <div className="px-5 pt-4 pb-3 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}
        >
          <Icon className="w-3.5 h-3.5" strokeWidth={2} style={{ color: iconColor }} />
        </div>
        <span className="text-sm font-display font-bold text-surface-900 dark:text-surface-100">
          {title}
        </span>
      </div>
      {action && (
        <button
          onClick={action}
          className="text-xs font-bold flex items-center gap-1 transition-colors text-copper-500 dark:text-copper-400 hover:text-copper-600"
        >
          {actionLabel || 'View All'}
          <ArrowUpRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════ */
export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.dashboard.getStats(),
    refetchInterval: 30000,
  });

  const { data: permitSummary } = useQuery({
    queryKey: ['permit-summary'],
    queryFn: () => api.permits.getSummary(),
    refetchInterval: 60000,
  });

  const { data: prospects } = useQuery({
    queryKey: ['top-prospects'],
    queryFn: () => api.permits.getProspects(5),
  });

  const { data: leadsData } = useQuery({
    queryKey: ['recent-leads'],
    queryFn: () => api.leads.getAll({ limit: 10 }),
  });

  const createProject = useMutation({
    mutationFn: (data) => api.projects.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setShowProjectModal(false);
      setEditingProject(null);
    },
  });

  const updateProject = useMutation({
    mutationFn: ({ id, data }) => api.projects.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setShowProjectModal(false);
      setEditingProject(null);
    },
  });

  const handleSave = (data) => {
    if (editingProject) updateProject.mutate({ id: editingProject.id, data });
    else createProject.mutate(data);
  };

  const openNewProject = () => { setEditingProject(null); setShowProjectModal(true); };
  const recentLeads = leadsData?.leads || [];

  /* ── Error ── */
  if (error) {
    return (
      <div className="p-4 md:p-8">
        <div className="rounded-2xl border border-hot-200 dark:border-hot-900/30 bg-hot-50 dark:bg-hot-950/20 p-6 flex items-start gap-4">
          <div className="w-10 h-10 bg-hot-500 rounded-xl flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-display font-bold text-hot-800 dark:text-hot-200 mb-1">
              Dashboard unavailable
            </h3>
            <p className="text-sm text-hot-600 dark:text-hot-400 mb-3">{error.message}</p>
            <button onClick={() => refetch()} className="btn-primary text-sm">
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-5 animate-fade-in">
        <div className="skeleton h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="skeleton h-10 w-72 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 skeleton h-80 rounded-2xl" />
          <div className="lg:col-span-5 space-y-5">
            <div className="skeleton h-52 rounded-2xl" />
            <div className="skeleton h-44 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Main render ── */
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-5 animate-fade-in">

      {/* ── COMMAND HEADER ── */}
      <header className="command-header animate-slide-down">
        {/* Atmospheric blue glow bottom-right */}
        <div
          className="absolute bottom-0 right-0 w-80 h-48 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at bottom right, rgba(0,53,148,0.14) 0%, transparent 70%)',
          }}
        />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span
                className="text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ color: 'rgba(255,255,255,0.25)' }}
              >
                CTL Plumbing · DFW Operations
              </span>
            </div>
            <h1 className="text-2xl md:text-[1.75rem] font-display font-bold text-white tracking-tight leading-none mb-1.5">
              {getGreeting()}
            </h1>
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
              <span className="mx-2 opacity-40">·</span>
              {currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-colors"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.4)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </header>

      {/* ── KPI ROW ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          {
            icon: DollarSign,
            label: 'Pipeline Value',
            value: `$${Math.round((stats?.pipelineValue || 0) / 1000)}k`,
            subtext: 'Hot leads total',
            trend: 'up',
            trendValue: '12.5',
            color: 'primary',
            onClick: () => navigate('/leads'),
          },
          {
            icon: Briefcase,
            label: 'Active Projects',
            value: stats?.activeProjectsCount || 0,
            subtext: 'In progress',
            color: 'blue',
            onClick: openNewProject,
          },
          {
            icon: Flame,
            label: 'Hot Leads',
            value: stats?.hotLeadsCount || 0,
            subtext: 'High-priority',
            trend: 'up',
            trendValue: '8.7',
            color: 'hot',
            onClick: () => navigate('/leads'),
          },
          {
            icon: Users,
            label: 'Total Leads',
            value: leadsData?.total || 0,
            subtext: 'All in system',
            color: 'purple',
            onClick: () => navigate('/leads'),
          },
        ].map((props, i) => (
          <div key={props.label} className={`animate-slide-up stagger-${i + 1}`}>
            <StatCard {...props} edgeBar />
          </div>
        ))}
      </section>

      {/* ── QUICK ACTIONS ── */}
      <section className="flex items-center gap-2 flex-wrap animate-slide-up stagger-5">
        <button
          onClick={openNewProject}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.97]"
          style={{
            background: 'linear-gradient(135deg, #003594, #002266)',
            boxShadow: '0 2px 8px rgba(0,53,148,0.22)',
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          New Project
        </button>
        {[
          { label: 'Find Leads', icon: Users, path: '/leads' },
          { label: 'Estimate', icon: FileText, path: '/plans' },
          { label: 'AI Chat', icon: Bot, path: '/ai' },
          { label: 'Permits', icon: Building2, path: '/leads' },
        ].map(({ label, icon: Icon, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="quick-action-secondary text-xs py-2 px-4 min-h-0"
          >
            <Icon className="w-3.5 h-3.5 opacity-60" />
            {label}
          </button>
        ))}
      </section>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* LEFT COL */}
        <div className="lg:col-span-7 space-y-5 animate-slide-up stagger-6">

          {/* Active Projects */}
          <SectionCard>
            <SectionHead
              icon={Briefcase}
              iconColor="#3b82f6"
              iconBg="rgba(59,130,246,0.08)"
              title="Active Projects"
              action={openNewProject}
              actionLabel={<><Plus className="w-3 h-3" />Add New</>}
            />

            {stats?.activeProjects?.length > 0 ? (
              <div className="px-2 pb-2">
                {stats.activeProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => { setEditingProject(project); setShowProjectModal(true); }}
                    className="w-full text-left px-3 py-3.5 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 mb-2.5">
                      <div
                        className="w-2 h-2 rounded-full shrink-0 mt-0.5"
                        style={{ background: phaseColor(project.phase) }}
                      />
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate group-hover:text-copper-600 dark:group-hover:text-copper-400 transition-colors">
                          {project.name}
                        </span>
                        <span className="text-sm font-mono font-bold text-surface-500 dark:text-surface-400 shrink-0 tabular-nums">
                          ${(project.value || 0).toLocaleString()}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-surface-400 dark:text-surface-500 shrink-0 tabular-nums w-10 text-right">
                        {project.progress || 0}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-5 mb-0.5">
                      <span className="text-[10px] text-surface-400 dark:text-surface-500 mr-1">{project.phase}</span>
                    </div>
                    <div className="pipe-track ml-5">
                      <div
                        className="pipe-fill"
                        style={{
                          '--pipe-width': `${project.progress || 0}%`,
                          background: phaseColor(project.phase),
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-5 pb-8 pt-2 text-center">
                <Briefcase className="w-10 h-10 mx-auto mb-3 text-surface-300 dark:text-surface-700" strokeWidth={1.5} />
                <p className="text-sm text-surface-500 mb-3">No active projects yet</p>
                <button className="btn-secondary text-xs" onClick={openNewProject}>
                  <Plus className="w-3.5 h-3.5" />
                  Create First Project
                </button>
              </div>
            )}
          </SectionCard>

          {/* Top Prospects — horizontal scrollable */}
          {prospects && prospects.length > 0 && (
            <SectionCard>
              <SectionHead
                icon={Building2}
                iconColor="#3b82f6"
                iconBg="rgba(59,130,246,0.08)"
                title="Top Prospects"
                action={() => navigate('/leads')}
              />
              <p className="px-5 -mt-1 pb-3 text-[10px] text-surface-400">
                Active builders without plumbers
              </p>
              <div className="px-4 pb-4 flex gap-2 overflow-x-auto scrollbar-hide">
                {prospects.slice(0, 6).map((builder) => (
                  <button
                    key={builder.id}
                    onClick={() => navigate('/leads')}
                    className="shrink-0 flex flex-col items-start gap-1.5 px-3.5 py-3 rounded-xl text-left transition-all duration-150 hover:-translate-y-0.5"
                    style={{
                      background: 'rgba(59,130,246,0.04)',
                      border: '1px solid rgba(59,130,246,0.1)',
                    }}
                  >
                    <span className="text-xs font-bold text-surface-900 dark:text-surface-100 whitespace-nowrap">
                      {builder.name || builder.company}
                    </span>
                    <div className="flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-blue-400" />
                      <span className="text-xs font-mono font-bold text-blue-500 tabular-nums">
                        {builder.totalPermits || 0}
                      </span>
                      <span className="text-[10px] text-surface-400">permits</span>
                    </div>
                    {builder.permitsLast30d > 0 && (
                      <span className="text-[10px] text-surface-400">
                        {builder.permitsLast30d} last 30d
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        {/* RIGHT COL */}
        <aside className="lg:col-span-5 space-y-5 animate-slide-up stagger-7">

          {/* Hot Leads */}
          <SectionCard>
            <SectionHead
              icon={Flame}
              iconColor="#ef4444"
              iconBg="rgba(239,68,68,0.08)"
              title="Hot Leads"
              action={() => navigate('/leads')}
            />

            {stats?.hotLeads?.length > 0 ? (
              <div className="px-2 pb-2">
                {stats.hotLeads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-hot-50/40 dark:hover:bg-hot-950/15 transition-colors group"
                  >
                    {/* Score chip */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-mono font-bold tabular-nums"
                      style={{
                        background:
                          lead.score >= 90
                            ? 'rgba(239,68,68,0.1)'
                            : lead.score >= 75
                            ? 'rgba(245,158,11,0.1)'
                            : 'rgba(200,197,191,0.12)',
                        color:
                          lead.score >= 90
                            ? '#ef4444'
                            : lead.score >= 75
                            ? '#d97706'
                            : '#78736b',
                      }}
                    >
                      {lead.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate group-hover:text-hot-600 dark:group-hover:text-hot-400 transition-colors">
                        {lead.name}
                      </p>
                      <p className="text-xs text-surface-400 truncate">{lead.company || 'Independent'}</p>
                    </div>
                    <span className="text-sm font-mono font-bold text-surface-500 dark:text-surface-400 shrink-0 tabular-nums">
                      ${(lead.value || 0).toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-5 pb-8 pt-2 text-center">
                <Flame className="w-10 h-10 mx-auto mb-3 text-surface-300 dark:text-surface-700" strokeWidth={1.5} />
                <p className="text-sm text-surface-500 mb-3">No hot leads yet</p>
                <button className="btn-secondary text-xs" onClick={() => navigate('/leads')}>
                  Add First Lead
                </button>
              </div>
            )}
          </SectionCard>

          {/* Permit Pulse */}
          {permitSummary && (
            <SectionCard>
              <SectionHead
                icon={Building2}
                iconColor="#3b82f6"
                iconBg="rgba(59,130,246,0.08)"
                title="Permit Pulse"
                action={() => navigate('/leads')}
              />
              <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                {[
                  { label: 'Hot', value: permitSummary.hot || 0, color: '#ef4444', bg: 'rgba(239,68,68,0.06)', sub: 'Score ≥ 80' },
                  { label: 'Warm', value: permitSummary.warm || 0, color: '#f59e0b', bg: 'rgba(245,158,11,0.06)', sub: 'Score 50–79' },
                  { label: 'New Today', value: permitSummary.newToday || 0, color: '#10b981', bg: 'rgba(16,185,129,0.06)', sub: 'Ingested today' },
                  { label: 'Total', value: permitSummary.total || 0, color: '#3b82f6', bg: 'rgba(59,130,246,0.06)', sub: 'All tracked' },
                ].map(({ label, value, color, bg, sub }) => (
                  <button
                    key={label}
                    onClick={() => navigate('/leads')}
                    className="text-left rounded-xl p-3.5 transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.98]"
                    style={{ background: bg, border: `1px solid ${color}1a` }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wide mb-1.5" style={{ color: `${color}88` }}>
                      {label}
                    </p>
                    <p className="text-2xl font-display font-bold tabular-nums leading-none mb-1" style={{ color }}>
                      {value}
                    </p>
                    <p className="text-[10px] text-surface-400">{sub}</p>
                  </button>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Activity Timeline */}
          <SectionCard>
            <SectionHead
              icon={Clock}
              iconColor="#78736b"
              iconBg="rgba(120,115,107,0.08)"
              title="Recent Activity"
            />

            {recentLeads.length > 0 ? (
              <div className="px-2 pb-3">
                {recentLeads.slice(0, 5).map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors group"
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                      style={{
                        background:
                          lead.status === 'hot'
                            ? '#ef4444'
                            : lead.status === 'warm'
                            ? '#f59e0b'
                            : '#a09b93',
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-surface-800 dark:text-surface-200 truncate group-hover:text-copper-600 dark:group-hover:text-copper-400 transition-colors">
                        {lead.name}
                      </p>
                      <p className="text-[10px] text-surface-400 mt-0.5">
                        {new Date(lead.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                        {lead.company && ` · ${lead.company}`}
                      </p>
                    </div>
                    <Activity className="w-3 h-3 text-surface-300 dark:text-surface-600 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-5 pb-6 pt-2 text-center">
                <p className="text-xs text-surface-400">No recent activity</p>
              </div>
            )}
          </SectionCard>
        </aside>
      </div>

      {/* ── STATUS BAR ── */}
      <footer className="animate-slide-up stagger-8">
        <div
          className="flex items-center justify-between px-5 py-3 rounded-xl text-xs"
          style={{
            background: 'rgba(16,185,129,0.04)',
            border: '1px solid rgba(16,185,129,0.1)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="font-bold text-emerald-700 dark:text-emerald-400">System Operational</span>
            <span className="hidden md:inline text-surface-400">— All services running</span>
          </div>
          <span className="font-mono text-surface-400 tabular-nums hidden md:block">
            {currentTime.toLocaleTimeString()}
          </span>
        </div>
      </footer>

      {/* Modals */}
      {showProjectModal && (
        <ProjectModal
          project={editingProject}
          onClose={() => { setShowProjectModal(false); setEditingProject(null); }}
          onSave={handleSave}
          isSaving={createProject.isPending || updateProject.isPending}
        />
      )}
      {selectedLead && (
        <LeadDetailDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onNavigate={navigate}
        />
      )}
    </div>
  );
}
