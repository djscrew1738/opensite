import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useOllama } from '../hooks/useOllama';
import { useModelPreference } from '../hooks/useModelPreference';
import ModelSelector from '../components/ai/ModelSelector';
import { CheckCircle, XCircle, RefreshCw, DollarSign, Building2, MapPin } from 'lucide-react';

export default function Settings() {
  const { connected, model, available, isLoading, refetch } = useOllama();
  const { defaultModel, setDefaultModel } = useModelPreference();

  const { data: tiersData } = useQuery({
    queryKey: ['pricing-tiers'],
    queryFn: () => api.estimates.getTiers()
  });

  const { data: modelsData } = useQuery({
    queryKey: ['ollama-models'],
    queryFn: () => api.ai.getModels(),
    enabled: connected, // Only fetch if connected
    retry: false
  });

  const tiers = tiersData?.tiers || [];
  const availableModels = modelsData?.models || [];
  const recommendations = modelsData?.recommendations || {};

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="space-y-6">
        {/* User Preferences */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">User Preferences</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default AI Model
              </label>
              <ModelSelector
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value)}
                showSizes={true}
              />
              <p className="text-sm text-gray-500 mt-2">
                This model will be used by default for AI features
              </p>
            </div>
          </div>
        </div>

        {/* Ollama Connection Status */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Ollama AI Status</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-700">Connection Status</span>
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <span className="text-gray-500">Checking...</span>
                ) : connected ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-600 font-medium">Connected</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-600 font-medium">Disconnected</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-700">Model</span>
              <span className="font-mono text-sm font-medium text-gray-900">{model}</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-700">Model Available</span>
              <span className={available ? 'text-green-600' : 'text-red-600'}>
                {available ? 'Yes' : 'No'}
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-gray-700">Last Checked</span>
              <button
                onClick={() => refetch()}
                className="btn-secondary text-sm flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Test Connection
              </button>
            </div>
          </div>

          {!connected && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Ollama is not connected. Make sure Ollama is running on your system.
                Run: <code className="bg-yellow-100 px-2 py-1 rounded">ollama serve</code>
              </p>
            </div>
          )}
        </div>

        {/* Available Models */}
        {connected && availableModels.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Available Models ({availableModels.length})
            </h2>

            <div className="space-y-3">
              {availableModels.map((model) => (
                <div key={model.name} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-mono text-sm font-semibold text-gray-900 mb-1">
                        {model.name}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span>
                          Size: {(model.size / (1024 ** 3)).toFixed(2)} GB
                        </span>
                        <span>
                          Modified: {new Date(model.modified).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {model.name === modelsData?.defaultModel && (
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full font-medium">
                        Default
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Model Recommendations */}
            {Object.keys(recommendations).length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Recommended Models for Tasks
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(recommendations).map(([task, models]) => (
                    <div key={task} className="p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs font-semibold text-blue-900 capitalize mb-1">
                        {task}
                      </p>
                      <p className="text-xs text-blue-700 font-mono">
                        {models.join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Business Configuration */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Information</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Company Name</p>
                <p className="text-lg font-semibold text-gray-900">CTL Plumbing LLC</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Service Area</p>
                <p className="text-lg font-semibold text-gray-900">DFW Metroplex</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Specialization</p>
                <p className="text-lg font-semibold text-gray-900">Commercial and Multi-family Plumbing</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Pricing Tiers</h2>

          <div className="space-y-4">
            {tiers.map((tier) => (
              <div key={tier.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{tier.name}</h3>
                  <span className="text-xl font-bold text-primary-600">
                    ${tier.pricePerUnit?.toLocaleString()}/unit
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Margin: {tier.marginRange}</p>
                  <p className="text-xs">{tier.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Information */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System Information</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-700">Application Version</span>
              <span className="font-mono text-sm text-gray-900">1.0.0</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-700">Backend API</span>
              <span className="font-mono text-sm text-gray-900">http://localhost:5001</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-700">Frontend Port</span>
              <span className="font-mono text-sm text-gray-900">3000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
