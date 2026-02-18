import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useOllama } from '../hooks/useOllama';
import { useModelPreference } from '../hooks/useModelPreference';
import {
  CheckCircle, XCircle, RefreshCw, Building2, MapPin, Wrench,
  Cpu, Shield, Key, Download, Trash2, Star, Activity,
  Server, Thermometer, AlertTriangle, Loader2, Eye, EyeOff,
  HardDrive, Clock, Zap, CircuitBoard, Save, ExternalLink, Cog
} from 'lucide-react';

// ── Toast notification ──
function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl border text-sm font-semibold backdrop-blur-lg transition-all animate-in slide-in-from-bottom-4 ${
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
          <div className="w-8 h-8 rounded-lg bg-copper-50 dark:bg-copper-950/30 flex items-center justify-center">
            <Icon className="w-4 h-4 text-copper-600 dark:text-copper-400" />
          </div>
          <h2 className="text-lg font-bold text-surface-900 dark:text-surface-100 tracking-tight">{title}</h2>
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
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
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
    <div className="bg-surface-50 dark:bg-surface-850/60 rounded-xl p-4 border border-surface-200/60 dark:border-surface-700/60 border-l-2 border-l-copper-400/30 dark:border-l-copper-600/20">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
        <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-bold text-surface-900 dark:text-surface-100 font-mono tabular-nums">{value}</p>
      {sub && <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{sub}</p>}
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

  // ── Local form state (must be declared before queries that reference them) ──
  const [activeProvider, setActiveProvider] = useState('ollama');
  const [ollamaUrl, setOllamaUrl] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [groqKey, setGroqKey] = useState('');
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [groqTemperature, setGroqTemperature] = useState(0.7);
  const [openclawUrl, setOpenclawUrl] = useState('http://localhost:18789');
  const [openclawToken, setOpenclawToken] = useState('');
  const [showOpenclawToken, setShowOpenclawToken] = useState(false);
  const [openclawTemperature, setOpenclawTemperature] = useState(0.7);
  const [companyName, setCompanyName] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [serperKey, setSerperKey] = useState('');
  const [showSerperKey, setShowSerperKey] = useState(false);
  const [placesKey, setPlacesKey] = useState('');
  const [showPlacesKey, setShowPlacesKey] = useState(false);
  const [anthropicKey, setAnthropicKey] = useState('');
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [openaiKey, setOpenaiKey] = useState('');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [showTwilioToken, setShowTwilioToken] = useState(false);
  const [twilioPhone, setTwilioPhone] = useState('');
  const [sendgridKey, setSendgridKey] = useState('');
  const [showSendgridKey, setShowSendgridKey] = useState(false);
  const [stripeKey, setStripeKey] = useState('');
  const [showStripeKey, setShowStripeKey] = useState(false);
  const [googleMapsKey, setGoogleMapsKey] = useState('');
  const [showGoogleMapsKey, setShowGoogleMapsKey] = useState(false);
  const [pullModelName, setPullModelName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Loading states
  const [testingOllama, setTestingOllama] = useState(false);
  const [testingGroq, setTestingGroq] = useState(false);
  const [testingOpenClaw, setTestingOpenClaw] = useState(false);
  const [testingSerper, setTestingSerper] = useState(false);
  const [testingAnthropic, setTestingAnthropic] = useState(false);
  const [testingOpenai, setTestingOpenai] = useState(false);
  const [testingTwilio, setTestingTwilio] = useState(false);
  const [testingSendgrid, setTestingSendgrid] = useState(false);
  const [testingStripe, setTestingStripe] = useState(false);
  const [testingGoogleMaps, setTestingGoogleMaps] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingAI, setSavingAI] = useState(false);
  const [switchingProvider, setSwitchingProvider] = useState(false);
  const [pullingModel, setPullingModel] = useState(false);
  const [deletingModel, setDeletingModel] = useState(null);

  // ── Settings data ──
  const { data: settingsData, refetch: refetchSettings } = useQuery({
    queryKey: ['app-settings'],
    queryFn: () => api.settings.get(),
  });

  const { data: modelsData, refetch: refetchModels } = useQuery({
    queryKey: ['ollama-models', activeProvider],
    queryFn: () => api.ai.getModels(),
    enabled: connected || activeProvider === 'groq' || activeProvider === 'openclaw',
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

  // Sync settings data to form
  useEffect(() => {
    if (settingsData) {
      setActiveProvider(settingsData.ai_provider || 'ollama');
      setOllamaUrl(settingsData.ollama_url || 'http://localhost:11434');
      setTemperature(parseFloat(settingsData.ollama_temperature) || 0.7);
      setGroqTemperature(parseFloat(settingsData.groq_temperature) || 0.7);
      setOpenclawUrl(settingsData.openclaw_url || 'http://localhost:18789');
      setOpenclawTemperature(parseFloat(settingsData.openclaw_temperature) || 0.7);
      setCompanyName(settingsData.company_name || '');
      setServiceArea(settingsData.service_area || '');
      setSpecialization(settingsData.specialization || '');
    }
  }, [settingsData]);

  // ── Handlers ──

  const handleSwitchProvider = async (provider) => {
    setSwitchingProvider(true);
    try {
      await api.settings.update({ ai_provider: provider });
      setActiveProvider(provider);
      refetchSettings();
      refetchModels();
      queryClient.invalidateQueries({ queryKey: ['ollama-models'] });
      refetchOllama();
      showToast(`Switched to ${provider === 'openclaw' ? 'OpenClaw' : provider === 'groq' ? 'Groq Cloud' : 'Ollama Local'}`);
    } catch (err) {
      showToast(`Failed to switch: ${err.message}`, 'error');
    } finally {
      setSwitchingProvider(false);
    }
  };

  const handleTestGroq = async () => {
    setTestingGroq(true);
    try {
      const result = await api.settings.testGroq(groqKey || undefined);
      if (result.valid) {
        showToast(`Groq API valid (${result.modelCount} models available)`);
      } else {
        showToast(result.error || 'Invalid API key', 'error');
      }
    } catch (err) {
      showToast(`Test failed: ${err.message}`, 'error');
    } finally {
      setTestingGroq(false);
    }
  };

  const handleSaveGroqKey = async () => {
    try {
      await api.settings.update({ groq_api_key: groqKey });
      setGroqKey('');
      refetchSettings();
      showToast('Groq API key saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    }
  };

  const handleTestOpenClaw = async () => {
    setTestingOpenClaw(true);
    try {
      const result = await api.settings.testOpenClaw(openclawUrl, openclawToken || undefined);
      if (result.connected) {
        showToast(`Connected to OpenClaw (${result.model})`);
      } else {
        showToast(`Cannot connect: ${result.error}`, 'error');
      }
    } catch (err) {
      showToast(`Connection test failed: ${err.message}`, 'error');
    } finally {
      setTestingOpenClaw(false);
    }
  };

  const handleSaveOpenclawToken = async () => {
    try {
      await api.settings.update({ openclaw_token: openclawToken });
      setOpenclawToken('');
      refetchSettings();
      showToast('OpenClaw token saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    }
  };

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

  const handleSavePlacesKey = async () => {
    try {
      await api.settings.update({ google_places_api_key: placesKey });
      setPlacesKey('');
      refetchSettings();
      showToast('Google Places API key saved');
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

  const handleSaveAnthropicKey = async () => {
    try {
      await api.settings.update({ anthropic_api_key: anthropicKey });
      setAnthropicKey('');
      refetchSettings();
      showToast('Anthropic API key saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    }
  };

  const handleTestAnthropic = async () => {
    setTestingAnthropic(true);
    try {
      const result = await api.settings.testAnthropic(anthropicKey || undefined);
      if (result.valid) {
        showToast('Anthropic API key is valid');
      } else {
        showToast(result.error || 'Invalid API key', 'error');
      }
    } catch (err) {
      showToast(`Test failed: ${err.message}`, 'error');
    } finally {
      setTestingAnthropic(false);
    }
  };

  const handleSaveOpenaiKey = async () => {
    try {
      await api.settings.update({ openai_api_key: openaiKey });
      setOpenaiKey('');
      refetchSettings();
      showToast('OpenAI API key saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    }
  };

  const handleTestOpenai = async () => {
    setTestingOpenai(true);
    try {
      const result = await api.settings.testOpenai(openaiKey || undefined);
      if (result.valid) {
        showToast(`OpenAI API key is valid (${result.modelCount} models)`);
      } else {
        showToast(result.error || 'Invalid API key', 'error');
      }
    } catch (err) {
      showToast(`Test failed: ${err.message}`, 'error');
    } finally {
      setTestingOpenai(false);
    }
  };

  const handleSaveTwilio = async () => {
    try {
      const updates = {};
      if (twilioSid) updates.twilio_account_sid = twilioSid;
      if (twilioToken) updates.twilio_auth_token = twilioToken;
      if (twilioPhone) updates.twilio_from_phone = twilioPhone;
      await api.settings.update(updates);
      setTwilioSid('');
      setTwilioToken('');
      setTwilioPhone('');
      refetchSettings();
      showToast('Twilio credentials saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    }
  };

  const handleTestTwilio = async () => {
    setTestingTwilio(true);
    try {
      const result = await api.settings.testTwilio(twilioSid || undefined, twilioToken || undefined);
      if (result.valid) {
        showToast(`Twilio connected (${result.friendlyName})`);
      } else {
        showToast(result.error || 'Invalid credentials', 'error');
      }
    } catch (err) {
      showToast(`Test failed: ${err.message}`, 'error');
    } finally {
      setTestingTwilio(false);
    }
  };

  const handleSaveSendgridKey = async () => {
    try {
      await api.settings.update({ sendgrid_api_key: sendgridKey });
      setSendgridKey('');
      refetchSettings();
      showToast('SendGrid API key saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    }
  };

  const handleTestSendgrid = async () => {
    setTestingSendgrid(true);
    try {
      const result = await api.settings.testSendgrid(sendgridKey || undefined);
      if (result.valid) {
        showToast('SendGrid API key is valid');
      } else {
        showToast(result.error || 'Invalid API key', 'error');
      }
    } catch (err) {
      showToast(`Test failed: ${err.message}`, 'error');
    } finally {
      setTestingSendgrid(false);
    }
  };

  const handleSaveStripeKey = async () => {
    try {
      await api.settings.update({ stripe_api_key: stripeKey });
      setStripeKey('');
      refetchSettings();
      showToast('Stripe API key saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    }
  };

  const handleTestStripe = async () => {
    setTestingStripe(true);
    try {
      const result = await api.settings.testStripe(stripeKey || undefined);
      if (result.valid) {
        showToast(`Stripe API key is valid (${result.currency || 'USD'})`);
      } else {
        showToast(result.error || 'Invalid API key', 'error');
      }
    } catch (err) {
      showToast(`Test failed: ${err.message}`, 'error');
    } finally {
      setTestingStripe(false);
    }
  };

  const handleSaveGoogleMapsKey = async () => {
    try {
      await api.settings.update({ google_maps_api_key: googleMapsKey });
      setGoogleMapsKey('');
      refetchSettings();
      showToast('Google Maps API key saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    }
  };

  const handleTestGoogleMaps = async () => {
    setTestingGoogleMaps(true);
    try {
      const result = await api.settings.testGoogleMaps(googleMapsKey || undefined);
      if (result.valid) {
        showToast('Google Maps API key is valid');
      } else {
        showToast(result.error || 'Invalid API key', 'error');
      }
    } catch (err) {
      showToast(`Test failed: ${err.message}`, 'error');
    } finally {
      setTestingGoogleMaps(false);
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

        {/* ═══ Section 1: AI Provider ═══ */}
        <Section
          icon={Cpu}
          title="AI Configuration"
          badge={
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                activeProvider === 'openclaw'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                  : activeProvider === 'groq'
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${activeProvider === 'openclaw' ? 'bg-red-500' : activeProvider === 'groq' ? 'bg-orange-500' : 'bg-blue-500'} animate-pulse`} />
                {activeProvider === 'openclaw' ? 'OpenClaw' : activeProvider === 'groq' ? 'Groq Cloud' : 'Ollama Local'}
              </span>
              {cbState !== 'closed' && (
                <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  <Shield className="w-3 h-3" />
                  CB: {cbState}
                </span>
              )}
            </div>
          }
        >
          <div className="space-y-5">
            {/* Provider Toggle */}
            <div>
              <label className="label">AI Provider</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleSwitchProvider('ollama')}
                  disabled={switchingProvider}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                    activeProvider === 'ollama'
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {activeProvider === 'ollama' && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <Server className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-bold text-sm text-gray-900 dark:text-gray-100">Ollama</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Local models, private, no API limits</p>
                </button>

                <button
                  onClick={() => handleSwitchProvider('groq')}
                  disabled={switchingProvider}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                    activeProvider === 'groq'
                      ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {activeProvider === 'groq' && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-5 h-5 text-orange-500" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span className="font-bold text-sm text-gray-900 dark:text-gray-100">Groq Cloud</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ultra-fast cloud inference, Llama 3.3 70B</p>
                </button>

                <button
                  onClick={() => handleSwitchProvider('openclaw')}
                  disabled={switchingProvider}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                    activeProvider === 'openclaw'
                      ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {activeProvider === 'openclaw' && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-5 h-5 text-red-500" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <Cog className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="font-bold text-sm text-gray-900 dark:text-gray-100">OpenClaw</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Local AI gateway, multi-model agent</p>
                </button>
              </div>
            </div>

            {/* Ollama Settings (shown when Ollama is active) */}
            {activeProvider === 'ollama' && (
              <>
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
                        {m.name} {m.size ? `(${(m.size / (1024 ** 3)).toFixed(1)} GB)` : ''}
                      </option>
                    ))}
                  </select>
                </div>

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
              </>
            )}

            {/* Groq Settings (shown when Groq is active) */}
            {activeProvider === 'groq' && (
              <>
                <div>
                  <label className="label">Groq API Key</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Get a free API key at console.groq.com
                  </p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showGroqKey ? 'text' : 'password'}
                        value={groqKey}
                        onChange={(e) => setGroqKey(e.target.value)}
                        className="input pr-10 font-mono text-sm"
                        placeholder={settings.groq_api_key_masked || 'Enter your Groq API key'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowGroqKey(!showGroqKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showGroqKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <button
                      onClick={handleTestGroq}
                      disabled={testingGroq}
                      className="btn-secondary text-sm whitespace-nowrap"
                    >
                      {testingGroq ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      Test
                    </button>
                    <button
                      onClick={handleSaveGroqKey}
                      disabled={!groqKey.trim()}
                      className="btn-primary text-sm whitespace-nowrap"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">Default Model</label>
                  <select
                    value={defaultModel}
                    onChange={(e) => {
                      handleSetDefaultModel(e.target.value);
                      api.settings.update({ groq_model: e.target.value });
                    }}
                    className="input"
                  >
                    {availableModels.length === 0 && (
                      <option>Loading Groq models...</option>
                    )}
                    {availableModels.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.label || m.name} {m.context ? `(${Math.round(m.context / 1000)}k ctx)` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="label mb-0">Temperature</label>
                    <span className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100">
                      {groqTemperature.toFixed(2)}
                      <span className="ml-2 text-xs font-sans text-gray-500 dark:text-gray-400">
                        ({groqTemperature <= 0.3 ? 'Precise' : groqTemperature <= 0.7 ? 'Balanced' : 'Creative'})
                      </span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={groqTemperature}
                    onChange={(e) => setGroqTemperature(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1 px-0.5">
                    <span>Precise</span>
                    <span>Balanced</span>
                    <span>Creative</span>
                  </div>
                </div>
              </>
            )}

            {/* OpenClaw Settings (shown when OpenClaw is active) */}
            {activeProvider === 'openclaw' && (
              <>
                <div>
                  <label className="label">OpenClaw Gateway URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={openclawUrl}
                      onChange={(e) => setOpenclawUrl(e.target.value)}
                      className="input flex-1 font-mono text-sm"
                      placeholder="http://localhost:18789"
                    />
                    <button
                      onClick={handleTestOpenClaw}
                      disabled={testingOpenClaw}
                      className="btn-secondary text-sm whitespace-nowrap"
                    >
                      {testingOpenClaw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      Test
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">Gateway Token (optional)</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Set via OPENCLAW_GATEWAY_TOKEN or in openclaw.json
                  </p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showOpenclawToken ? 'text' : 'password'}
                        value={openclawToken}
                        onChange={(e) => setOpenclawToken(e.target.value)}
                        className="input pr-10 font-mono text-sm"
                        placeholder={settings.openclaw_token_masked || 'Enter gateway token (if configured)'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowOpenclawToken(!showOpenclawToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showOpenclawToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <button
                      onClick={handleSaveOpenclawToken}
                      disabled={!openclawToken.trim()}
                      className="btn-primary text-sm whitespace-nowrap"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">Default Model / Agent</label>
                  <select
                    value={defaultModel}
                    onChange={(e) => {
                      handleSetDefaultModel(e.target.value);
                      api.settings.update({ openclaw_model: e.target.value });
                    }}
                    className="input"
                  >
                    {availableModels.length === 0 && (
                      <option>openclaw:main</option>
                    )}
                    {availableModels.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.label || m.name} {m.context ? `(${Math.round(m.context / 1000)}k ctx)` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="label mb-0">Temperature</label>
                    <span className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100">
                      {openclawTemperature.toFixed(2)}
                      <span className="ml-2 text-xs font-sans text-gray-500 dark:text-gray-400">
                        ({openclawTemperature <= 0.3 ? 'Precise' : openclawTemperature <= 0.7 ? 'Balanced' : 'Creative'})
                      </span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={openclawTemperature}
                    onChange={(e) => setOpenclawTemperature(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1 px-0.5">
                    <span>Precise</span>
                    <span>Balanced</span>
                    <span>Creative</span>
                  </div>
                </div>
              </>
            )}

            {/* Save row */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  {activeProvider === 'openclaw' ? <Cog className="w-3.5 h-3.5" /> : activeProvider === 'groq' ? <Zap className="w-3.5 h-3.5" /> : <Server className="w-3.5 h-3.5" />}
                  {activeProvider === 'openclaw' ? (config.baseUrl || openclawUrl) : activeProvider === 'groq' ? 'Groq Cloud' : (config.baseUrl || ollamaUrl)}
                </span>
                <span className="flex items-center gap-1.5">
                  <CircuitBoard className="w-3.5 h-3.5" />
                  {config.defaultModel || model}
                </span>
              </div>
              <button
                onClick={async () => {
                  setSavingAI(true);
                  try {
                    const updates = activeProvider === 'openclaw'
                      ? { openclaw_url: openclawUrl, openclaw_temperature: String(openclawTemperature) }
                      : activeProvider === 'groq'
                      ? { groq_temperature: String(groqTemperature) }
                      : { ollama_url: ollamaUrl, ollama_temperature: String(temperature) };
                    await api.settings.update(updates);
                    refetchSettings();
                    refetchOllama();
                    showToast('AI configuration saved');
                  } catch (err) {
                    showToast(`Failed to save: ${err.message}`, 'error');
                  } finally {
                    setSavingAI(false);
                  }
                }}
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
            <div className="flex items-center gap-2 flex-wrap">
              <StatusPill
                connected={settings.serper_api_key_configured}
                label={settings.serper_api_key_configured ? 'Serper' : 'Serper N/A'}
              />
              <StatusPill
                connected={settings.google_places_api_key_configured}
                label={settings.google_places_api_key_configured ? 'Places' : 'Places N/A'}
              />
              <StatusPill
                connected={settings.anthropic_api_key_configured}
                label={settings.anthropic_api_key_configured ? 'Anthropic' : 'Anthropic N/A'}
              />
              <StatusPill
                connected={settings.openai_api_key_configured}
                label={settings.openai_api_key_configured ? 'OpenAI' : 'OpenAI N/A'}
              />
              <StatusPill
                connected={settings.twilio_account_sid_configured}
                label={settings.twilio_account_sid_configured ? 'Twilio' : 'Twilio N/A'}
              />
              <StatusPill
                connected={settings.sendgrid_api_key_configured}
                label={settings.sendgrid_api_key_configured ? 'SendGrid' : 'SendGrid N/A'}
              />
              <StatusPill
                connected={settings.stripe_api_key_configured}
                label={settings.stripe_api_key_configured ? 'Stripe' : 'Stripe N/A'}
              />
              <StatusPill
                connected={settings.google_maps_api_key_configured}
                label={settings.google_maps_api_key_configured ? 'Maps' : 'Maps N/A'}
              />
            </div>
          }
        >
          <div className="space-y-5">
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

            <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
              <label className="label">Google Places API Key</label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Used for zone-based gatekeeper discovery with Nearby Search. Get a key at console.cloud.google.com
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPlacesKey ? 'text' : 'password'}
                    value={placesKey}
                    onChange={(e) => setPlacesKey(e.target.value)}
                    className="input pr-10 font-mono text-sm"
                    placeholder={settings.google_places_api_key_masked || 'Enter your Google Places API key'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPlacesKey(!showPlacesKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPlacesKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={handleSavePlacesKey}
                  disabled={!placesKey.trim()}
                  className="btn-primary text-sm whitespace-nowrap"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>

            {/* ── Premium AI Providers ── */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
              <label className="label">Anthropic API Key</label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Claude AI for premium analysis. Get a key at{' '}
                <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-copper-600 dark:text-copper-400 hover:underline inline-flex items-center gap-1">
                  console.anthropic.com <ExternalLink className="w-3 h-3" />
                </a>
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showAnthropicKey ? 'text' : 'password'}
                    value={anthropicKey}
                    onChange={(e) => setAnthropicKey(e.target.value)}
                    className="input pr-10 font-mono text-sm"
                    placeholder={settings.anthropic_api_key_masked || 'Enter your Anthropic API key'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showAnthropicKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={handleTestAnthropic}
                  disabled={testingAnthropic}
                  className="btn-secondary text-sm whitespace-nowrap"
                >
                  {testingAnthropic ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Test
                </button>
                <button
                  onClick={handleSaveAnthropicKey}
                  disabled={!anthropicKey.trim()}
                  className="btn-primary text-sm whitespace-nowrap"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
              <label className="label">OpenAI API Key</label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                GPT models for alternative AI. Get a key at{' '}
                <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" className="text-copper-600 dark:text-copper-400 hover:underline inline-flex items-center gap-1">
                  platform.openai.com <ExternalLink className="w-3 h-3" />
                </a>
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showOpenaiKey ? 'text' : 'password'}
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    className="input pr-10 font-mono text-sm"
                    placeholder={settings.openai_api_key_masked || 'Enter your OpenAI API key'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showOpenaiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={handleTestOpenai}
                  disabled={testingOpenai}
                  className="btn-secondary text-sm whitespace-nowrap"
                >
                  {testingOpenai ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Test
                </button>
                <button
                  onClick={handleSaveOpenaiKey}
                  disabled={!openaiKey.trim()}
                  className="btn-primary text-sm whitespace-nowrap"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>

            {/* ── Communications ── */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
              <label className="label">Twilio (SMS Notifications)</label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                SMS notifications and alerts. Get credentials at{' '}
                <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="text-copper-600 dark:text-copper-400 hover:underline inline-flex items-center gap-1">
                  console.twilio.com <ExternalLink className="w-3 h-3" />
                </a>
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Account SID</label>
                  <input
                    type="text"
                    value={twilioSid}
                    onChange={(e) => setTwilioSid(e.target.value)}
                    className="input font-mono text-sm"
                    placeholder={settings.twilio_account_sid_masked || 'Enter your Twilio Account SID'}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Auth Token</label>
                  <div className="relative">
                    <input
                      type={showTwilioToken ? 'text' : 'password'}
                      value={twilioToken}
                      onChange={(e) => setTwilioToken(e.target.value)}
                      className="input pr-10 font-mono text-sm"
                      placeholder={settings.twilio_auth_token_masked || 'Enter your Twilio Auth Token'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowTwilioToken(!showTwilioToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showTwilioToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">From Phone Number</label>
                  <input
                    type="text"
                    value={twilioPhone}
                    onChange={(e) => setTwilioPhone(e.target.value)}
                    className="input font-mono text-sm"
                    placeholder={settings.twilio_from_phone || '+1234567890'}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={handleTestTwilio}
                    disabled={testingTwilio}
                    className="btn-secondary text-sm whitespace-nowrap"
                  >
                    {testingTwilio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Test
                  </button>
                  <button
                    onClick={handleSaveTwilio}
                    disabled={!twilioSid.trim() && !twilioToken.trim() && !twilioPhone.trim()}
                    className="btn-primary text-sm whitespace-nowrap"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
              <label className="label">SendGrid API Key</label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Email outreach and notifications. Get a key at{' '}
                <a href="https://app.sendgrid.com" target="_blank" rel="noopener noreferrer" className="text-copper-600 dark:text-copper-400 hover:underline inline-flex items-center gap-1">
                  app.sendgrid.com <ExternalLink className="w-3 h-3" />
                </a>
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showSendgridKey ? 'text' : 'password'}
                    value={sendgridKey}
                    onChange={(e) => setSendgridKey(e.target.value)}
                    className="input pr-10 font-mono text-sm"
                    placeholder={settings.sendgrid_api_key_masked || 'Enter your SendGrid API key'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSendgridKey(!showSendgridKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showSendgridKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={handleTestSendgrid}
                  disabled={testingSendgrid}
                  className="btn-secondary text-sm whitespace-nowrap"
                >
                  {testingSendgrid ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Test
                </button>
                <button
                  onClick={handleSaveSendgridKey}
                  disabled={!sendgridKey.trim()}
                  className="btn-primary text-sm whitespace-nowrap"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>
            {/* ── Payments & Mapping ── */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
              <label className="label">Stripe API Key</label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Invoicing and payment processing for clients. Get a key at{' '}
                <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-copper-600 dark:text-copper-400 hover:underline inline-flex items-center gap-1">
                  dashboard.stripe.com <ExternalLink className="w-3 h-3" />
                </a>
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showStripeKey ? 'text' : 'password'}
                    value={stripeKey}
                    onChange={(e) => setStripeKey(e.target.value)}
                    className="input pr-10 font-mono text-sm"
                    placeholder={settings.stripe_api_key_masked || 'Enter your Stripe secret key (sk_...)'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowStripeKey(!showStripeKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showStripeKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={handleTestStripe}
                  disabled={testingStripe}
                  className="btn-secondary text-sm whitespace-nowrap"
                >
                  {testingStripe ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Test
                </button>
                <button
                  onClick={handleSaveStripeKey}
                  disabled={!stripeKey.trim()}
                  className="btn-primary text-sm whitespace-nowrap"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
              <label className="label">Google Maps API Key</label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Job site mapping, geocoding, and route planning. Get a key at{' '}
                <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-copper-600 dark:text-copper-400 hover:underline inline-flex items-center gap-1">
                  console.cloud.google.com <ExternalLink className="w-3 h-3" />
                </a>
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showGoogleMapsKey ? 'text' : 'password'}
                    value={googleMapsKey}
                    onChange={(e) => setGoogleMapsKey(e.target.value)}
                    className="input pr-10 font-mono text-sm"
                    placeholder={settings.google_maps_api_key_masked || 'Enter your Google Maps API key'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowGoogleMapsKey(!showGoogleMapsKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showGoogleMapsKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={handleTestGoogleMaps}
                  disabled={testingGoogleMaps}
                  className="btn-secondary text-sm whitespace-nowrap"
                >
                  {testingGoogleMaps ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Test
                </button>
                <button
                  onClick={handleSaveGoogleMapsKey}
                  disabled={!googleMapsKey.trim()}
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
            (connected || activeProvider === 'groq' || activeProvider === 'openclaw') && (
              <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                {availableModels.length} model{availableModels.length !== 1 ? 's' : ''} {activeProvider === 'groq' || activeProvider === 'openclaw' ? 'available' : 'installed'}
              </span>
            )
          }
        >
          {/* Pull new model (Ollama only) */}
          {activeProvider === 'ollama' && (
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
          )}

          {activeProvider === 'groq' && (
            <div className="mb-5 p-4 bg-orange-50/50 dark:bg-orange-950/10 rounded-xl border border-orange-200/60 dark:border-orange-800/40">
              <p className="text-sm text-orange-700 dark:text-orange-300 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Groq models are cloud-hosted. Select a model from the cards below.
              </p>
            </div>
          )}

          {activeProvider === 'openclaw' && (
            <div className="mb-5 p-4 bg-red-50/50 dark:bg-red-950/10 rounded-xl border border-red-200/60 dark:border-red-800/40">
              <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                <Cog className="w-4 h-4" />
                OpenClaw agents are managed via the OpenClaw CLI. The main agent is shown below.
              </p>
            </div>
          )}

          {/* Model cards */}
          {(!connected && activeProvider === 'ollama') ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <XCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Connect to Ollama to manage models</p>
            </div>
          ) : availableModels.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <HardDrive className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">
                {activeProvider === 'openclaw' ? 'No OpenClaw agents found. Make sure the gateway is running.' : activeProvider === 'groq' ? 'No Groq models found. Check your API key.' : 'No models installed. Pull one above to get started.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableModels.map((m) => {
                const isDefault = m.name === defaultModel || m.name === config.defaultModel;
                const isDeleting = deletingModel === m.name;
                const isGroq = activeProvider === 'groq';
                const isOpenClaw = activeProvider === 'openclaw';

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
                            {m.label || m.name}
                          </h3>
                          {isDefault && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300 text-xs font-bold rounded-full">
                              <Star className="w-3 h-3" />
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          {isGroq || isOpenClaw ? (
                            <>
                              {m.context && (
                                <span className="flex items-center gap-1">
                                  <Zap className="w-3 h-3" />
                                  {Math.round(m.context / 1000)}k context
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                {isOpenClaw ? <Cog className="w-3 h-3" /> : <Server className="w-3 h-3" />}
                                {isOpenClaw ? 'Local gateway' : 'Cloud hosted'}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="flex items-center gap-1">
                                <HardDrive className="w-3 h-3" />
                                {(m.size / (1024 ** 3)).toFixed(2)} GB
                              </span>
                              {m.modified && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(m.modified).toLocaleDateString()}
                                </span>
                              )}
                            </>
                          )}
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

                        {/* Delete button - Ollama only */}
                        {!isGroq && !isOpenClaw && (
                          deleteConfirm === m.name ? (
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
                          )
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
