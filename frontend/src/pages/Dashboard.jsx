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
  CheckCircle2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/dashboard/StatCard';

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
        <div className="card-body bg-gradient-to-br from-hot-50 to-hot-100 border-2 border-hot-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-hot-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-display font-bold text-hot-900 mb-2">
                Failed to Load Dashboard
              </h3>
              <p className="text-sm text-hot-700 mb-4">{error.message}</p>
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
        {/* Header Skeleton */}
        <div className="space-y-3">
          <div className="skeleton h-10 w-48" />
          <div className="skeleton h-4 w-64" />
        </div>

        {/* Stats Skeleton */}
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
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-5xl font-display font-bold text-primary-950 tracking-tight mb-2">
              Dashboard
            </h1>
            <p className="text-sm md:text-base text-gray-600 font-medium flex items-center gap-2 flex-wrap">
              <Activity className="w-4 h-4 text-accent-500" />
              <span>
                {currentTime.toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </p>
          </div>

          <button
            onClick={() => refetch()}
            className="btn-ghost shrink-0"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="hidden md:inline">Refresh</span>
          </button>
        </div>
      </header>

      {/* Key Metrics */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="card animate-slide-up" style={{ animationDelay: '50ms' }}>
            <StatCard
              icon={DollarSign}
              label="Pipeline Value"
              value={`$${(stats?.pipelineValue || 0).toLocaleString()}`}
              subtext="Hot leads total"
              trend="up"
              trendValue="12.5"
              color="primary"
            />
          </div>

          <div className="card animate-slide-up" style={{ animationDelay: '100ms' }}>
            <StatCard
              icon={Briefcase}
              label="Active Projects"
              value={stats?.activeProjectsCount || 0}
              subtext="In progress"
              trend="down"
              trendValue="3.2"
              color="blue"
            />
          </div>

          <div className="card animate-slide-up" style={{ animationDelay: '150ms' }}>
            <StatCard
              icon={TrendingUp}
              label="Hot Leads"
              value={stats?.hotLeadsCount || 0}
              subtext="High-priority"
              trend="up"
              trendValue="8.7"
              color="hot"
            />
          </div>

          <div className="card animate-slide-up" style={{ animationDelay: '200ms' }}>
            <StatCard
              icon={Users}
              label="Total Leads"
              value={leadsData?.total || 0}
              subtext="All in system"
              color="purple"
            />
          </div>
        </div>
      </section>

      {/* Permit Lead Tracking */}
      {permitSummary && (
        <section className="animate-slide-up" style={{ animationDelay: '250ms' }}>
          <div className="section-header">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="section-title">Permit Leads</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="card cursor-pointer" onClick={() => navigate('/leads')}>
              <StatCard
                icon={Flame}
                label="Hot Permits"
                value={permitSummary.hot || 0}
                subtext="Score ≥80"
                color="hot"
                onClick={() => navigate('/leads')}
              />
            </div>

            <div className="card cursor-pointer" onClick={() => navigate('/leads')}>
              <StatCard
                icon={Circle}
                label="Warm Permits"
                value={permitSummary.warm || 0}
                subtext="Score 50-79"
                color="warm"
                onClick={() => navigate('/leads')}
              />
            </div>

            <div className="card">
              <StatCard
                icon={Plus}
                label="New Today"
                value={permitSummary.newToday || 0}
                subtext="Ingested today"
                color="emerald"
              />
            </div>

            <div className="card">
              <StatCard
                icon={Building2}
                label="Total Permits"
                value={permitSummary.total || 0}
                subtext="All tracked"
                color="primary"
              />
            </div>
          </div>
        </section>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects */}
        <section className="lg:col-span-2 space-y-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-display font-bold text-primary-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>
                  Active Projects
                </h2>
                <button
                  onClick={() => navigate('/projects')}
                  className="text-sm text-accent-600 hover:text-accent-700 font-bold flex items-center gap-1 transition-transform hover:translate-x-1"
                >
                  View All
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

              {stats?.activeProjects && stats.activeProjects.length > 0 ? (
                <div className="space-y-3">
                  {stats.activeProjects.map((project, index) => (
                    <div
                      key={project.id}
                      className="p-4 bg-gradient-to-br from-concrete-50 to-white rounded-xl border-2 border-concrete-200 hover:border-primary-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                      style={{ animationDelay: `${350 + index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
                            {project.name}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                            <span className="flex items-center gap-1">
                              <Activity className="w-3.5 h-3.5" />
                              {project.phase}
                            </span>
                            <span className="font-mono font-bold text-accent-600">
                              ${project.value?.toLocaleString() || 0}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-3xl font-display font-bold text-primary-900">
                            {project.progress || 0}
                          </span>
                          <span className="text-sm text-gray-500">%</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="relative">
                        <div className="w-full bg-concrete-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-accent-500 to-accent-600 h-2 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${project.progress || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Briefcase className="w-16 h-16 mx-auto mb-4 text-concrete-300" strokeWidth={1.5} />
                  <p className="text-gray-500 font-medium mb-3">No active projects</p>
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
                <h2 className="text-xl md:text-2xl font-display font-bold text-primary-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-hot-500 to-hot-600 rounded-lg flex items-center justify-center">
                    <Flame className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>
                  Hot Leads
                </h2>
                <button
                  onClick={() => navigate('/leads')}
                  className="text-sm text-accent-600 hover:text-accent-700 font-bold flex items-center gap-1 transition-transform hover:translate-x-1"
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
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-hot-50 via-hot-50/50 to-transparent rounded-xl border-2 border-hot-100 hover:border-hot-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate group-hover:text-hot-700 transition-colors">
                          {lead.name}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">{lead.company || 'No company'}</p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl font-display font-bold text-hot-600">{lead.score}</span>
                          <CheckCircle2 className="w-5 h-5 text-hot-600" strokeWidth={2.5} />
                        </div>
                        <p className="text-sm font-mono font-bold text-gray-600">
                          ${lead.value?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Flame className="w-16 h-16 mx-auto mb-4 text-concrete-300" strokeWidth={1.5} />
                  <p className="text-gray-500 font-medium mb-3">No hot leads yet</p>
                  <button className="btn-secondary text-sm" onClick={() => navigate('/leads')}>
                    Add First Lead
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right Sidebar */}
        <aside className="space-y-4 animate-slide-up" style={{ animationDelay: '350ms' }}>
          {/* Top Prospects */}
          {prospects && prospects.length > 0 && (
            <div className="card">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-bold text-primary-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
                    Top Prospects
                  </h3>
                  <button
                    onClick={() => navigate('/leads')}
                    className="text-xs text-accent-600 hover:text-accent-700 font-bold"
                  >
                    View All
                  </button>
                </div>
                <p className="text-xs text-gray-600 mb-4 font-medium">
                  Active builders without plumbers
                </p>
                <div className="space-y-2">
                  {prospects.slice(0, 5).map((builder) => (
                    <div
                      key={builder.id}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-transparent rounded-xl border border-blue-100 hover:border-blue-300 hover:shadow-sm transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                          {builder.name || builder.company}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {builder.permitsLast30d || 0} permits (30d)
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          <span className="text-lg font-display font-bold text-blue-600">
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

          {/* Recent Activity */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-display font-bold text-primary-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-600" strokeWidth={2.5} />
                Recent Leads
              </h3>
              {recentLeads.length > 0 ? (
                <div className="space-y-2">
                  {recentLeads.slice(0, 5).map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-start gap-3 p-3 hover:bg-concrete-50 rounded-xl transition-all duration-200 cursor-pointer group"
                    >
                      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                        lead.status === 'hot' ? 'bg-hot-500' :
                        lead.status === 'warm' ? 'bg-warm-500' :
                        'bg-cool-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900 truncate group-hover:text-primary-700 transition-colors">
                          {lead.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{lead.company || 'No company'}</p>
                        <p className="text-2xs text-gray-400 mt-1 font-medium">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* System Status */}
      <footer className="animate-slide-up" style={{ animationDelay: '400ms' }}>
        <div className="card bg-gradient-to-r from-emerald-50 via-blue-50 to-primary-50 border-2 border-emerald-200">
          <div className="card-body">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="font-display font-bold text-gray-900">System Operational</p>
                  <p className="text-sm text-gray-600 font-medium">All services running smoothly</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 font-medium">
                <span className="hidden md:inline">
                  {new Date().toLocaleTimeString()}
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Live
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
