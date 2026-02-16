import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useOllama } from '../hooks/useOllama';
import { useModelPreference } from '../hooks/useModelPreference';
import {
  CheckCircle, XCircle, RefreshCw, Building2, MapPin, Wrench,
  Cpu, Shield, Key, Download, Trash2, Star, Activity,
  Server, Thermometer, AlertTriangle, Loader2, Eye, EyeOff,
  HardDrive, Clock, Zap, CircuitBoard, Save, ExternalLink
} from 'lucide-react';

// ── Toast notification ──
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl border text-sm font-semibold transition-all animate-in slide-in-from-bottom-4 ${
      type === 'success'
        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200'
        : type === 'error'
        ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200'
        : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200'
    }`}>
      {type === 'success' && <CheckCircle className="w-4 h-4" />}
      {type === 'error' && <XCircle className="w-4 h-4" />}
      {type === 'warning' && <AlertTriangle className="w-4 h-4" />}
      {message}
    </div>
  );
}

// ── Section wrapper ──
function Section({ icon: Icon, title, badge, children }) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">{title}</h2>
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}

// ── Status pill ──
function StatusPill({ connected, label }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
      connected
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
      {label || (connected ? 'Connected' : 'Disconnected')}
    </span>
  );
}

// ── Metric box ──
function MetricBox({ label, value, sub, icon: Icon }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-200/60 dark:border-gray-700/60">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-bold text-gray-900 dark:text-gray-100 font-mono tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Settings() {
  const queryClient = useQueryClient();
  const { connected, model, available, isLoading: ollamaLoading, refetch: refetchOllama } = useOllama();
  const { defaultModel, setDefaultModel } = useModelPreference();

  // Toast state
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = 'success') => setToast({ message, type }), []);

  // ── Settings data ──
  const { data: settingsData, refetch: refetchSettings } = useQuery({
    queryKey: ['app-settings'],
    queryFn: () => api.settings.get(),
  });

  const { data: modelsData, refetch: refetchModels } = useQuery({
    queryKey: ['ollama-models'],
    queryFn: () => api.ai.getModels(),
    enabled: connected,
    retry: false
  });

  const { data: metricsData, refetch: refetchMetrics } = useQuery({
    queryKey: ['ollama-metrics'],
    queryFn: () => api.settings.getMetrics(),
    refetchInterval: 15000,
  });

  const { data: healthData } = useQuery({
    queryKey: ['health-data'],
    queryFn: () => api.health(),
    refetchInterval: 30000,
  });

  const availableModels = modelsData?.models || [];
  const settings = settingsData || {};
  const metrics = metricsData?.metrics || {};
  const config = metricsData?.config || {};

  // ── Local form state ──
  const [ollamaUrl, setOllamaUrl] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [companyName, setCompanyName] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [serperKey, setSerperKey] = useState('');
  const [showSerperKey, setShowSerperKey] = useState(false);
  const [pullModelName, setPullModelName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Loading states
  const [testingOllama, setTestingOllama] = useState(false);
  const [testingSerper, setTestingSerper] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingAI, setSavingAI] = useState(false);
  const [pullingModel, setPullingModel] = useState(false);
  const [deletingModel, setDeletingModel] = useState(null);

  // Sync settings data to form
  useEffect(() => {
    if (settingsData) {
      setOllamaUrl(settingsData.ollama_url || 'http://localhost:11434');
      setTemperature(parseFloat(settingsData.ollama_temperature) || 0.7);
      setCompanyName(settingsData.company_name || '');
      setServiceArea(settingsData.service_area || '');
      setSpecialization(settingsData.specialization || '');
    }
  }, [settingsData]);

  // ── Handlers ──

  const handleTestOllama = async () => {
    setTestingOllama(true);
    try {
      const result = await api.settings.testOllama(ollamaUrl);
      if (result.connected) {
        showToast(`Connected to Ollama (${result.modelCount} models available)`);
      } else {
        showToast(`Cannot connect: ${result.error}`, 'error');
      }
    } catch (err) {
      showToast(`Connection test failed: ${err.message}`, 'error');
    } finally {
      setTestingOllama(false);
    }
  };

  const handleSaveAI = async () => {
    setSavingAI(true);
    try {
      await api.settings.update({
        ollama_url: ollamaUrl,
        ollama_temperature: String(temperature),
      });
      refetchSettings();
      refetchOllama();
      showToast('AI configuration saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    } finally {
      setSavingAI(false);
    }
  };

  const handleSetDefaultModel = async (modelName) => {
    try {
      setDefaultModel(modelName);
      await api.settings.update({ ollama_model: modelName });
      refetchSettings();
      showToast(`Default model set to ${modelName}`);
    } catch (err) {
      showToast(`Failed: ${err.message}`, 'error');
    }
  };

  const handleSaveBusiness = async () => {
    setSavingBusiness(true);
    try {
      await api.settings.update({
        company_name: companyName,
        service_area: serviceArea,
        specialization: specialization,
      });
      refetchSettings();
      showToast('Business profile saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    } finally {
      setSavingBusiness(false);
    }
  };

  const handleSaveSerperKey = async () => {
    try {
      await api.settings.update({ serper_api_key: serperKey });
      setSerperKey('');
      refetchSettings();
      showToast('API key saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    }
  };

  const handleTestSerper = async () => {
    setTestingSerper(true);
    try {
      const result = await api.settings.testSerper(serperKey || undefined);
      if (result.valid) {
        showToast(`Serper API key is valid (credits: ${result.credits})`);
      } else {
        showToast(result.error || 'Invalid API key', 'error');
      }
    } catch (err) {
      showToast(`Test failed: ${err.message}`, 'error');
    } finally {
      setTestingSerper(false);
    }
  };

  const handlePullModel = async () => {
    if (!pullModelName.trim()) return;
    setPullingModel(true);
    try {
      // Use fetch directly for SSE
      const response = await fetch('/api/ai/models/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: pullModelName.trim() }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let lastStatus = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.status) lastStatus = data.status;
            if (data.done) break;
          } catch { /* skip */ }
        }
      }

      setPullModelName('');
      refetchModels();
      queryClient.invalidateQueries({ queryKey: ['ollama-models'] });
      showToast(`Model pulled successfully: ${lastStatus}`);
    } catch (err) {
      showToast(`Failed to pull model: ${err.message}`, 'error');
    } finally {
      setPullingModel(false);
    }
  };

  const handleDeleteModel = async (modelName) => {
    setDeletingModel(modelName);
    try {
      await api.ai.deleteModel(modelName);
      setDeleteConfirm(null);
      refetchModels();
      queryClient.invalidateQueries({ queryKey: ['ollama-models'] });
      showToast(`Model ${modelName} deleted`);
    } catch (err) {
      showToast(`Failed to delete: ${err.message}`, 'error');
    } finally {
      setDeletingModel(null);
    }
  };

  // ── Computed values ──
  const temperatureLabel = temperature <= 0.3 ? 'Precise' : temperature <= 0.7 ? 'Balanced' : 'Creative';
  const successRate = metrics.totalRequests > 0
    ? ((metrics.successCount / metrics.totalRequests) * 100).toFixed(1)
    : '0.0';
  const uptimeFormatted = metrics.uptimeMs
    ? `${Math.floor(metrics.uptimeMs / 3600000)}h ${Math.floor((metrics.uptimeMs % 3600000) / 60000)}m`
    : '--';
  const cbState = metrics.circuitBreaker || 'closed';

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="command-header mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-1">Settings</h1>
            <p className="text-sm text-blue-200/70">Configure AI, business profile, and system preferences</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusPill connected={connected} />
          </div>
        </div>
      </div>

      <div className="space-y-6">

        {/* ═══ Section 1: AI Configuration ═══ */}
        <Section
          icon={Cpu}
          title="AI Configuration"
          badge={
            cbState !== 'closed' && (
              <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                <Shield className="w-3 h-3" />
                Circuit Breaker: {cbState}
              </span>
            )
          }
        >
          <div className="space-y-5">
            {/* Ollama URL */}
            <div>
              <label className="label">Ollama Server URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  className="input flex-1 font-mono text-sm"
                  placeholder="http://localhost:11434"
                />
                <button
                  onClick={handleTestOllama}
                  disabled={testingOllama}
                  className="btn-secondary text-sm whitespace-nowrap"
                >
                  {testingOllama ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Test
                </button>
              </div>
            </div>

            {/* Default Model */}
            <div>
              <label className="label">Default Model</label>
              <select
                value={defaultModel}
                onChange={(e) => handleSetDefaultModel(e.target.value)}
                className="input"
              >
                {availableModels.length === 0 && (
                  <option>{connected ? 'Loading models...' : model || 'No models'}</option>
                )}
                {availableModels.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({(m.size / (1024 ** 3)).toFixed(1)} GB)
                  </option>
                ))}
              </select>
            </div>

            {/* Temperature Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Temperature</label>
                <span className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100">
                  {temperature.toFixed(2)}
                  <span className="ml-2 text-xs font-sans text-gray-500 dark:text-gray-400">({temperatureLabel})</span>
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent-500"
              />
              <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1 px-0.5">
                <span>Precise</span>
                <span>Balanced</span>
                <span>Creative</span>
              </div>
            </div>

            {/* Connection info row */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5" />
                  {config.baseUrl || ollamaUrl}
                </span>
                <span className="flex items-center gap-1.5">
                  <CircuitBoard className="w-3.5 h-3.5" />
                  {config.defaultModel || model}
                </span>
              </div>
              <button
                onClick={handleSaveAI}
                disabled={savingAI}
                className="btn-primary text-sm"
              >
                {savingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save AI Config
              </button>
            </div>
          </div>
        </Section>

        {/* ═══ Section 2: Business Profile ═══ */}
        <Section icon={Building2} title="Business Profile">
          <div className="space-y-4">
            <div>
              <label className="label">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="input"
                placeholder="CTL Plumbing LLC"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Service Area</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={serviceArea}
                    onChange={(e) => setServiceArea(e.target.value)}
                    className="input pl-10"
                    placeholder="DFW Metroplex"
                  />
                </div>
              </div>
              <div>
                <label className="label">Specialization</label>
                <div className="relative">
                  <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="input pl-10"
                    placeholder="Commercial and Multi-family Plumbing"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveBusiness}
                disabled={savingBusiness}
                className="btn-primary text-sm"
              >
                {savingBusiness ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Profile
              </button>
            </div>
          </div>
        </Section>

        {/* ═══ Section 3: API Keys ═══ */}
        <Section
          icon={Key}
          title="API Keys"
          badge={
            <StatusPill
              connected={settings.serper_api_key_configured}
              label={settings.serper_api_key_configured ? 'Configured' : 'Not Set'}
            />
          }
        >
          <div className="space-y-4">
            <div>
              <label className="label">Serper.dev API Key</label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Used for premium lead discovery via Google Maps search. Get a key at serper.dev
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showSerperKey ? 'text' : 'password'}
                    value={serperKey}
                    onChange={(e) => setSerperKey(e.target.value)}
                    className="input pr-10 font-mono text-sm"
                    placeholder={settings.serper_api_key_masked || 'Enter your Serper API key'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSerperKey(!showSerperKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showSerperKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={handleTestSerper}
                  disabled={testingSerper}
                  className="btn-secondary text-sm whitespace-nowrap"
                >
                  {testingSerper ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Test
                </button>
                <button
                  onClick={handleSaveSerperKey}
                  disabled={!serperKey.trim()}
                  className="btn-primary text-sm whitespace-nowrap"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══ Section 4: Model Library ═══ */}
        <Section
          icon={HardDrive}
          title="Model Library"
          badge={
            connected && (
              <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                {availableModels.length} model{availableModels.length !== 1 ? 's' : ''} installed
              </span>
            )
          }
        >
          {/* Pull new model */}
          <div className="mb-5 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
              Pull New Model
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={pullModelName}
                onChange={(e) => setPullModelName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePullModel()}
                className="input flex-1 font-mono text-sm"
                placeholder="e.g. llama3.1, qwen2.5-coder:7b, deepseek-r1:1.5b"
                disabled={pullingModel}
              />
              <button
                onClick={handlePullModel}
                disabled={pullingModel || !pullModelName.trim()}
                className="btn-primary text-sm whitespace-nowrap"
              >
                {pullingModel ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Pulling...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Pull
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Model cards */}
          {!connected ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <XCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Connect to Ollama to manage models</p>
            </div>
          ) : availableModels.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <HardDrive className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No models installed. Pull one above to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableModels.map((m) => {
                const isDefault = m.name === defaultModel || m.name === config.defaultModel;
                const isDeleting = deletingModel === m.name;

                return (
                  <div
                    key={m.name}
                    className={`relative p-4 rounded-xl border transition-all ${
                      isDefault
                        ? 'bg-accent-50/50 border-accent-200 dark:bg-accent-950/20 dark:border-accent-800/50'
                        : 'bg-gray-50 border-gray-200/60 dark:bg-gray-800/40 dark:border-gray-700/60'
                    }`}
                  >
                    {/* Default indicator edge */}
                    {isDefault && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-500 rounded-l-xl" />
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                            {m.name}
                          </h3>
                          {isDefault && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300 text-xs font-bold rounded-full">
                              <Star className="w-3 h-3" />
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <HardDrive className="w-3 h-3" />
                            {(m.size / (1024 ** 3)).toFixed(2)} GB
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(m.modified).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {!isDefault && (
                          <button
                            onClick={() => handleSetDefaultModel(m.name)}
                            className="btn-ghost text-xs px-3 py-1.5 min-h-0"
                          >
                            Set Default
                          </button>
                        )}

                        {deleteConfirm === m.name ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteModel(m.name)}
                              disabled={isDeleting}
                              className="btn-danger text-xs px-3 py-1.5 min-h-0"
                            >
                              {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="btn-ghost text-xs px-2 py-1.5 min-h-0"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(m.name)}
                            className="btn-ghost text-xs px-2 py-1.5 min-h-0 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* ═══ Section 5: System Info & Metrics ═══ */}
        <Section icon={Activity} title="System & Metrics">
          {/* Metrics grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <MetricBox
              label="Requests"
              value={metrics.totalRequests?.toLocaleString() || '0'}
              icon={Zap}
            />
            <MetricBox
              label="Success Rate"
              value={`${successRate}%`}
              sub={`${metrics.successCount || 0} / ${metrics.totalRequests || 0}`}
              icon={CheckCircle}
            />
            <MetricBox
              label="Avg Response"
              value={metrics.avgResponseMs ? `${metrics.avgResponseMs}ms` : '--'}
              icon={Thermometer}
            />
            <MetricBox
              label="Uptime"
              value={uptimeFormatted}
              icon={Clock}
            />
          </div>

          {/* System info table */}
          <div className="space-y-0 divide-y divide-gray-100 dark:divide-gray-800">
            {[
              ['Application Version', '2.0.0'],
              ['Backend API', 'http://localhost:5001'],
              ['Frontend Port', '3000'],
              ['Circuit Breaker', cbState],
              ['Last Error', metrics.lastError || 'None'],
              ['Last Error At', metrics.lastErrorAt ? new Date(metrics.lastErrorAt).toLocaleString() : 'N/A'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                <span className={`text-sm font-mono font-medium text-gray-900 dark:text-gray-100 ${
                  label === 'Circuit Breaker' && value !== 'closed'
                    ? 'text-amber-600 dark:text-amber-400'
                    : ''
                }`}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Refresh button */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 dark:text-gray-500">Metrics auto-refresh every 15s</p>
            <button
              onClick={() => {
                refetchMetrics();
                refetchOllama();
                showToast('Metrics refreshed');
              }}
              className="btn-secondary text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </Section>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
