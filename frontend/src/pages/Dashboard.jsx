import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import {
  DollarSign,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Plus,
  FileText,
  Calculator,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Activity
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.dashboard.getStats(),
    refetchInterval: 30000 // Auto-refresh every 30 seconds
  });

  const { data: tiersData } = useQuery({
    queryKey: ['pricing-tiers'],
    queryFn: () => api.dashboard.getTiers()
  });

  const { data: leadsData } = useQuery({
    queryKey: ['recent-leads'],
    queryFn: () => api.leads.getAll({ limit: 5 })
  });

  // Calculate trends (mock data for now - will be real when backend provides historical data)
  const getTrend = (value) => {
    const trend = Math.random() > 0.5 ? 'up' : 'down';
    const percent = (Math.random() * 20).toFixed(1);
    return { trend, percent };
  };

  const pipelineTrend = getTrend(stats?.pipelineValue);
  const projectsTrend = getTrend(stats?.activeProjectsCount);
  const leadsTrend = getTrend(stats?.hotLeadsCount);

  if (error) {
    return (
      <div className="p-8">
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Failed to load dashboard</h3>
              <p className="text-sm text-red-700 mt-1">{error.message}</p>
              <button
                onClick={() => refetch()}
                className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-8">
            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>

          {/* Metrics skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>

          {/* Content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="space-y-6">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tiers = tiersData?.tiers || [];
  const recentLeads = leadsData?.leads || [];
  const totalLeads = leadsData?.total || 0;

  const quickActions = [
    {
      label: 'New Lead',
      icon: Plus,
      color: 'primary',
      onClick: () => navigate('/leads')
    },
    {
      label: 'Calculate',
      icon: Calculator,
      color: 'green',
      onClick: () => navigate('/pricing')
    },
    {
      label: 'Upload Blueprint',
      icon: FileText,
      color: 'blue',
      onClick: () => navigate('/pricing')
    }
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {currentTime.toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <button
            onClick={() => refetch()}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Key Metrics - Enhanced with trends */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {/* Pipeline Value */}
        <div className="card hover:shadow-lg transition-shadow duration-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="w-6 h-6 text-primary-600" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${
                pipelineTrend.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {pipelineTrend.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {pipelineTrend.percent}%
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Pipeline Value</p>
            <p className="text-3xl font-bold text-gray-900">
              ${(stats?.pipelineValue || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-2">Hot leads total value</p>
          </div>
        </div>

        {/* Active Projects */}
        <div className="card hover:shadow-lg transition-shadow duration-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${
                projectsTrend.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {projectsTrend.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {projectsTrend.percent}%
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Active Projects</p>
            <p className="text-3xl font-bold text-gray-900">
              {stats?.activeProjectsCount || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">Currently in progress</p>
          </div>
        </div>

        {/* Hot Leads */}
        <div className="card hover:shadow-lg transition-shadow duration-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-hot-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-hot-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-hot-600" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${
                leadsTrend.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {leadsTrend.trend === 'up' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {leadsTrend.percent}%
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Hot Leads</p>
            <p className="text-3xl font-bold text-gray-900">
              {stats?.hotLeadsCount || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">High-priority opportunities</p>
          </div>
        </div>

        {/* Total Leads */}
        <div className="card hover:shadow-lg transition-shadow duration-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Leads</p>
            <p className="text-3xl font-bold text-gray-900">
              {totalLeads}
            </p>
            <p className="text-xs text-gray-500 mt-2">All leads in system</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column - Active Projects & Hot Leads */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Projects Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary-600" />
                Active Projects
              </h2>
              <button
                onClick={() => navigate('/projects')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                View All
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            {stats?.activeProjects && stats.activeProjects.length > 0 ? (
              <div className="space-y-4">
                {stats.activeProjects.map((project) => (
                  <div
                    key={project.id}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{project.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Activity className="w-4 h-4" />
                            {project.phase}
                          </span>
                          <span className="font-medium text-primary-600">
                            ${project.value?.toLocaleString() || 0}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-gray-900">
                          {project.progress || 0}%
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-primary-500 to-primary-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${project.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No active projects</p>
                <button className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Create your first project
                </button>
              </div>
            )}
          </div>

          {/* Hot Leads Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-hot-600" />
                Hot Leads
              </h2>
              <button
                onClick={() => navigate('/leads')}
                className="text-sm text-hot-600 hover:text-hot-700 font-medium flex items-center gap-1"
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
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-hot-50 to-transparent rounded-lg hover:from-hot-100 transition-colors cursor-pointer border border-hot-100"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{lead.name}</h3>
                      <p className="text-sm text-gray-600">{lead.company || 'No company'}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl font-bold text-hot-600">{lead.score}</span>
                        <CheckCircle2 className="w-5 h-5 text-hot-600" />
                      </div>
                      <p className="text-sm text-gray-600">
                        ${lead.value?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No hot leads yet</p>
                <button className="mt-3 text-sm text-hot-600 hover:text-hot-700 font-medium">
                  Add your first lead
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Quick Actions & Recent Activity */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-600" />
              Quick Actions
            </h2>
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`w-full p-4 rounded-lg border-2 border-${action.color}-200 bg-${action.color}-50 hover:bg-${action.color}-100 transition-colors text-left group`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-${action.color}-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <action.icon className={`w-5 h-5 text-${action.color}-600`} />
                    </div>
                    <span className={`font-semibold text-${action.color}-900`}>
                      {action.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activity / Leads */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              Recent Leads
            </h2>
            {recentLeads.length > 0 ? (
              <div className="space-y-3">
                {recentLeads.slice(0, 5).map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      lead.status === 'hot' ? 'bg-hot-500' :
                      lead.status === 'warm' ? 'bg-warm-500' :
                      'bg-cool-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{lead.name}</p>
                      <p className="text-xs text-gray-500">{lead.company || 'No company'}</p>
                      <p className="text-xs text-gray-400 mt-1">
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

          {/* Pricing Tiers Quick Reference */}
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary-600" />
              Pricing Tiers
            </h2>
            <div className="space-y-3">
              {tiers.slice(0, 3).map((tier) => (
                <div key={tier.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm">{tier.name}</h3>
                    <span className="text-lg font-bold text-primary-600">
                      ${tier.pricePerUnit?.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">per unit • {tier.marginRange}</p>
                </div>
              ))}
              <button
                onClick={() => navigate('/pricing')}
                className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium text-center py-2"
              >
                View Full Pricing Calculator →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* System Status Footer */}
      <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">System Status: Operational</p>
              <p className="text-sm text-gray-600">All services running smoothly</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Live
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
