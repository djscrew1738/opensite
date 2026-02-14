import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  DollarSign,
  Briefcase,
  TrendingUp,
  Users,
  Building2,
  Flame,
  Circle,
  Plus,
  Activity,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Bot,
  FileText,
  Clock
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/dashboard/StatCard';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.dashboard.getStats(),
    refetchInterval: 30000
  });

  const { data: permitSummary } = useQuery({
    queryKey: ['permit-summary'],
    queryFn: () => api.permits.getSummary(),
    refetchInterval: 60000
  });

  const { data: prospects } = useQuery({
    queryKey: ['top-prospects'],
    queryFn: () => api.permits.getProspects(5)
  });

  const { data: leadsData } = useQuery({
    queryKey: ['recent-leads'],
    queryFn: () => api.leads.getAll({ limit: 5 })
  });

  const recentLeads = leadsData?.leads || [];

  // Error State
  if (error) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="card-body bg-gradient-to-br from-hot-50 to-hot-100 border-2 border-hot-200 dark:from-hot-950/30 dark:to-hot-900/20 dark:border-hot-900/50">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-hot-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-display font-bold text-hot-900 dark:text-hot-200 mb-2">
                Failed to Load Dashboard
              </h3>
              <p className="text-sm text-hot-700 dark:text-hot-400 mb-4">{error.message}</p>
              <button
                onClick={() => refetch()}
                className="btn-primary text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
        <div className="skeleton h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card-body">
              <div className="skeleton h-14 w-14 rounded-2xl mb-4" />
              <div className="skeleton h-4 w-20 mb-2" />
              <div className="skeleton h-8 w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">

      {/* ── 1. COMMAND HEADER ── */}
      <header className="command-header animate-slide-down">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/80 via-primary-800/60 to-transparent pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight mb-2">
              {getGreeting()}, <span className="text-accent-400">Operator</span>
            </h1>
            <div className="flex items-center gap-4 flex-wrap">
              <p className="text-sm text-primary-200 font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-300" />
                {currentTime.toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              <div className="pulse-beacon">Live</div>
            </div>
          </div>

          <button
            onClick={() => refetch()}
            className="backdrop-blur-xl bg-white/10 border border-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-white/20 transition-all duration-200 active:scale-95 shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden md:inline">Refresh</span>
          </button>
        </div>
      </header>

      {/* ── 2. METRIC GAUGES ROW ── */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="card animate-slide-up stagger-1">
            <StatCard
              icon={DollarSign}
              label="Pipeline Value"
              value={`$${(stats?.pipelineValue || 0).toLocaleString()}`}
              subtext="Hot leads total"
              trend="up"
              trendValue="12.5"
              color="primary"
              edgeBar
            />
          </div>

          <div className="card animate-slide-up stagger-2">
            <StatCard
              icon={Briefcase}
              label="Active Projects"
              value={stats?.activeProjectsCount || 0}
              subtext="In progress"
              trend="down"
              trendValue="3.2"
              color="blue"
              edgeBar
            />
          </div>

          <div className="card animate-slide-up stagger-3">
            <StatCard
              icon={TrendingUp}
              label="Hot Leads"
              value={stats?.hotLeadsCount || 0}
              subtext="High-priority"
              trend="up"
              trendValue="8.7"
              color="hot"
              edgeBar
            />
          </div>

          <div className="card animate-slide-up stagger-4">
            <StatCard
              icon={Users}
              label="Total Leads"
              value={leadsData?.total || 0}
              subtext="All in system"
              color="purple"
              edgeBar
            />
          </div>
        </div>
      </section>

      {/* ── 3. QUICK ACTIONS STRIP ── */}
      <section className="animate-slide-up stagger-5">
        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate('/leads/new')} className="quick-action-primary">
            <Plus className="w-4 h-4" />
            New Lead
          </button>
          <button onClick={() => navigate('/estimates/new')} className="quick-action-secondary">
            <FileText className="w-4 h-4" />
            New Estimate
          </button>
          <button onClick={() => navigate('/ai-assistant')} className="quick-action-secondary">
            <Bot className="w-4 h-4" />
            AI Assistant
          </button>
          <button onClick={() => navigate('/permits')} className="quick-action-secondary">
            <Building2 className="w-4 h-4" />
            View Permits
          </button>
        </div>
      </section>

      {/* ── 4. PERMIT PULSE ── */}
      {permitSummary && (
        <section className="animate-slide-up stagger-6">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-5 h-5 text-blue-500 dark:text-blue-400" strokeWidth={2.5} />
            <h2 className="text-lg font-display font-bold text-primary-900 dark:text-gray-100">Permit Pulse</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div
              className="permit-metric permit-metric-hot cursor-pointer hover:shadow-md transition-all duration-200"
              onClick={() => navigate('/leads')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Hot</p>
                  <p className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 tabular-nums">{permitSummary.hot || 0}</p>
                </div>
                <Flame className="w-5 h-5 text-hot-500" strokeWidth={2.5} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Score &ge;80</p>
            </div>

            <div
              className="permit-metric permit-metric-warm cursor-pointer hover:shadow-md transition-all duration-200"
              onClick={() => navigate('/leads')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Warm</p>
                  <p className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 tabular-nums">{permitSummary.warm || 0}</p>
                </div>
                <Circle className="w-5 h-5 text-warm-500" strokeWidth={2.5} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Score 50-79</p>
            </div>

            <div className="permit-metric permit-metric-emerald">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">New Today</p>
                  <p className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 tabular-nums">{permitSummary.newToday || 0}</p>
                </div>
                <Plus className="w-5 h-5 text-emerald-500" strokeWidth={2.5} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Ingested today</p>
            </div>

            <div className="permit-metric permit-metric-blue">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total</p>
                  <p className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 tabular-nums">{permitSummary.total || 0}</p>
                </div>
                <Building2 className="w-5 h-5 text-blue-500" strokeWidth={2.5} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">All tracked</p>
            </div>
          </div>
        </section>
      )}

      {/* ── 5. MAIN CONTENT GRID (7 + 5) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN (7) — Active Projects + Hot Leads */}
        <div className="lg:col-span-7 space-y-6 animate-slide-up stagger-7">

          {/* Active Projects with Pipe-Fill Progress */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-display font-bold text-primary-900 dark:text-gray-100 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>
                  Active Projects
                </h2>
                <button
                  onClick={() => navigate('/projects')}
                  className="text-sm text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300 font-bold flex items-center gap-1 transition-transform hover:translate-x-1"
                >
                  View All
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

              {stats?.activeProjects && stats.activeProjects.length > 0 ? (
                <div className="space-y-3">
                  {stats.activeProjects.map((project) => (
                    <div
                      key={project.id}
                      className="p-4 bg-gradient-to-br from-concrete-50 to-white dark:from-gray-800/50 dark:to-gray-900 rounded-xl border-2 border-concrete-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
                            {project.name}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <span className="flex items-center gap-1">
                              <Activity className="w-3.5 h-3.5" />
                              {project.phase}
                            </span>
                            <span className="font-mono font-bold text-accent-600 dark:text-accent-400">
                              ${project.value?.toLocaleString() || 0}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-3xl font-display font-bold text-primary-900 dark:text-gray-100 tabular-nums">
                            {project.progress || 0}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
                        </div>
                      </div>

                      {/* Pipeline Progress Bar */}
                      <div className="pipe-track">
                        <div
                          className="pipe-fill bg-gradient-to-r from-accent-500 to-accent-600"
                          style={{ '--pipe-width': `${project.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Briefcase className="w-16 h-16 mx-auto mb-4 text-concrete-300 dark:text-gray-700" strokeWidth={1.5} />
                  <p className="text-gray-500 dark:text-gray-400 font-medium mb-3">No active projects</p>
                  <button className="btn-secondary text-sm">
                    Create First Project
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Hot Leads */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-display font-bold text-primary-900 dark:text-gray-100 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-hot-500 to-hot-600 rounded-lg flex items-center justify-center">
                    <Flame className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>
                  Hot Leads
                </h2>
                <button
                  onClick={() => navigate('/leads')}
                  className="text-sm text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300 font-bold flex items-center gap-1 transition-transform hover:translate-x-1"
                >
                  View All
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

              {stats?.hotLeads && stats.hotLeads.length > 0 ? (
                <div className="space-y-3">
                  {stats.hotLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-hot-50 via-hot-50/50 to-transparent dark:from-hot-950/20 dark:via-hot-950/10 dark:to-transparent rounded-xl border-2 border-hot-100 dark:border-hot-900/40 hover:border-hot-300 dark:hover:border-hot-700 hover:shadow-md transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-hot-700 dark:group-hover:text-hot-400 transition-colors">
                          {lead.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{lead.company || 'No company'}</p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl font-display font-bold text-hot-600 dark:text-hot-400 tabular-nums">{lead.score}</span>
                          <CheckCircle2 className="w-5 h-5 text-hot-600 dark:text-hot-400" strokeWidth={2.5} />
                        </div>
                        <p className="text-sm font-mono font-bold text-gray-600 dark:text-gray-400">
                          ${lead.value?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Flame className="w-16 h-16 mx-auto mb-4 text-concrete-300 dark:text-gray-700" strokeWidth={1.5} />
                  <p className="text-gray-500 dark:text-gray-400 font-medium mb-3">No hot leads yet</p>
                  <button className="btn-secondary text-sm" onClick={() => navigate('/leads')}>
                    Add First Lead
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5) — Top Prospects + Activity Timeline */}
        <aside className="lg:col-span-5 space-y-6 animate-slide-up stagger-8">

          {/* Top Prospects */}
          {prospects && prospects.length > 0 && (
            <div className="card">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-bold text-primary-900 dark:text-gray-100 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
                    Top Prospects
                  </h3>
                  <button
                    onClick={() => navigate('/leads')}
                    className="text-xs text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300 font-bold"
                  >
                    View All
                  </button>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 font-medium">
                  Active builders without plumbers
                </p>
                <div className="space-y-2">
                  {prospects.slice(0, 5).map((builder) => (
                    <div
                      key={builder.id}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/20 dark:to-transparent rounded-xl border border-blue-100 dark:border-blue-900/40 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                          {builder.name || builder.company}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {builder.permitsLast30d || 0} permits (30d)
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-lg font-display font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                            {builder.totalPermits || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-display font-bold text-primary-900 dark:text-gray-100 mb-5 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-600 dark:text-primary-400" strokeWidth={2.5} />
                Activity Timeline
              </h3>
              {recentLeads.length > 0 ? (
                <div>
                  {recentLeads.slice(0, 5).map((lead) => {
                    const dotColor =
                      lead.status === 'hot' ? 'timeline-dot-hot' :
                      lead.status === 'warm' ? 'timeline-dot-warm' :
                      'timeline-dot-cool';
                    return (
                      <div
                        key={lead.id}
                        className="timeline-item cursor-pointer group"
                      >
                        <div className={`timeline-dot ${dotColor}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">
                            {lead.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{lead.company || 'No company'}</p>
                          <p className="text-2xs text-gray-400 dark:text-gray-500 mt-1 font-medium">
                            {new Date(lead.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400 dark:text-gray-500">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* ── 6. SYSTEM STATUS BAR ── */}
      <footer className="animate-slide-up stagger-8">
        <div className="status-bar">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-emerald-800 dark:text-emerald-300 font-bold">System Operational</span>
            <span className="hidden md:inline text-gray-500 dark:text-gray-400">— All services running</span>
          </div>
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <span className="hidden md:inline tabular-nums">
              {new Date().toLocaleTimeString()}
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Live
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
