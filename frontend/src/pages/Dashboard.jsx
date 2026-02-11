import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { DollarSign, Briefcase, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.dashboard.getStats()
  });

  const { data: tiersData } = useQuery({
    queryKey: ['pricing-tiers'],
    queryFn: () => api.dashboard.getTiers()
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const tiers = tiersData?.tiers || [];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pipeline Value</p>
              <p className="text-3xl font-bold text-gray-900">
                ${(stats?.pipelineValue || 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Projects</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.activeProjectsCount || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Hot Leads</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.hotLeadsCount || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-hot-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-hot-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Active Projects */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Active Projects</h2>
        {stats?.activeProjects && stats.activeProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.activeProjects.map((project) => (
              <div key={project.id} className="card">
                <h3 className="font-semibold text-gray-900 mb-2">{project.name}</h3>
                <p className="text-sm text-gray-600 mb-2">Phase: {project.phase}</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${project.progress || 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  ${project.value?.toLocaleString() || 0}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center text-gray-500">
            No active projects
          </div>
        )}
      </div>

      {/* Hot Leads */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Hot Leads</h2>
        {stats?.hotLeads && stats.hotLeads.length > 0 ? (
          <div className="space-y-3">
            {stats.hotLeads.map((lead) => (
              <div key={lead.id} className="card flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{lead.name}</h3>
                  <p className="text-sm text-gray-600">{lead.company}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-hot-600">{lead.score}</p>
                  <p className="text-xs text-gray-500">${lead.value?.toLocaleString() || 0}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center text-gray-500">
            No hot leads yet
          </div>
        )}
      </div>

      {/* Pricing Tiers Reference */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Pricing Tiers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tiers.map((tier) => (
            <div key={tier.id} className="card">
              <h3 className="font-semibold text-gray-900 mb-2">{tier.name}</h3>
              <p className="text-2xl font-bold text-primary-600 mb-2">
                ${tier.pricePerUnit?.toLocaleString()}/unit
              </p>
              <p className="text-sm text-gray-600 mb-2">Margin: {tier.marginRange}</p>
              <p className="text-xs text-gray-500">{tier.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
