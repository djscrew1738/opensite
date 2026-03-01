import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

/**
 * Manages all AI provider form state, loading flags, and save/test handlers.
 * Keeps the AI domain isolated so changes here don't re-render other sections.
 */
export function useAIProviderSettings({
  settingsData,
  refetchSettings,
  showToast,
  connected,
  refetchOllama,
  queryClient,
  defaultModel,
  setDefaultModel,
}) {
  /* ── Provider selection ── */
  const [activeProvider, setActiveProvider] = useState('ollama');

  /* ── Ollama ── */
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [temperature, setTemperature] = useState(0.7);

  /* ── Groq ── */
  const [groqKey, setGroqKey] = useState('');
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [groqTemperature, setGroqTemperature] = useState(0.7);

  /* ── OpenAI ── */
  const [openaiKey, setOpenaiKey] = useState('');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [openaiTemperature, setOpenaiTemperature] = useState(0.7);

  /* ── Anthropic ── */
  const [anthropicKey, setAnthropicKey] = useState('');
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [anthropicTemperature, setAnthropicTemperature] = useState(0.7);

  /* ── OpenClaw ── */
  const [openclawUrl, setOpenclawUrl] = useState('http://localhost:18789');
  const [openclawToken, setOpenclawToken] = useState('');
  const [showOpenclawToken, setShowOpenclawToken] = useState(false);
  const [openclawTemperature, setOpenclawTemperature] = useState(0.7);

  /* ── Advanced ── */
  const [maxTokens, setMaxTokens] = useState(2048);
  const [topP, setTopP] = useState(0.9);
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState('');

  /* ── Model management ── */
  const [pullModelName, setPullModelName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  /* ── Models query (owned here, activeProvider drives it) ── */
  const { data: modelsData, refetch: refetchModels } = useQuery({
    queryKey: ['ollama-models', activeProvider],
    queryFn: () => api.ai.getModels(),
    enabled: connected || ['groq', 'openclaw', 'anthropic', 'openai'].includes(activeProvider),
    retry: false,
  });
  const availableModels = modelsData?.models || [];

  /* ── Loading flags ── */
  const [testingOllama, setTestingOllama] = useState(false);
  const [testingGroq, setTestingGroq] = useState(false);
  const [testingOpenai, setTestingOpenai] = useState(false);
  const [testingOpenClaw, setTestingOpenClaw] = useState(false);
  const [testingAnthropic, setTestingAnthropic] = useState(false);
  const [savingAI, setSavingAI] = useState(false);
  const [switchingProvider, setSwitchingProvider] = useState(false);
  const [pullingModel, setPullingModel] = useState(false);
  const [deletingModel, setDeletingModel] = useState(null);

  /* ── Sync from server ── */
  useEffect(() => {
    if (!settingsData) return;
    const s = settingsData;
    const num = (v, fallback) => v !== undefined ? parseFloat(v) || fallback : fallback;

    setActiveProvider(s.ai_provider || 'ollama');
    setOllamaUrl(s.ollama_url || 'http://localhost:11434');
    setTemperature(num(s.ollama_temperature, 0.7));
    setGroqTemperature(num(s.groq_temperature, 0.7));
    setOpenaiTemperature(num(s.openai_temperature, 0.7));
    setAnthropicTemperature(num(s.anthropic_temperature, 0.7));
    setOpenclawUrl(s.openclaw_url || 'http://localhost:18789');
    setOpenclawTemperature(num(s.openclaw_temperature, 0.7));
    setMaxTokens(num(s.ai_max_tokens, 2048));
    setTopP(num(s.ai_top_p, 0.9));
    setStreamingEnabled(s.ai_streaming === undefined ? true : String(s.ai_streaming) === 'true');
    setSystemPrompt(s.ai_system_prompt || '');
  }, [settingsData]);

  /* ── Handlers ── */
  const handleSwitchProvider = async (provider) => {
    setSwitchingProvider(true);
    try {
      await api.settings.update({ ai_provider: provider });
      setActiveProvider(provider);
      refetchSettings();
      refetchModels();
      queryClient.invalidateQueries({ queryKey: ['ollama-models'] });
      refetchOllama();
      const labels = { openclaw: 'OpenClaw Gateway', groq: 'Groq Cloud', anthropic: 'Anthropic Claude', openai: 'OpenAI', ollama: 'Ollama Local' };
      showToast(`Switched to ${labels[provider] || provider}`);
    } catch (err) {
      showToast(`Failed to switch: ${err.message}`, 'error');
    } finally {
      setSwitchingProvider(false);
    }
  };

  const handleSaveAIConfig = async () => {
    setSavingAI(true);
    try {
      const base = activeProvider === 'openclaw'
        ? { openclaw_url: openclawUrl, openclaw_temperature: String(openclawTemperature) }
        : activeProvider === 'groq'   ? { groq_temperature: String(groqTemperature) }
        : activeProvider === 'openai' ? { openai_temperature: String(openaiTemperature) }
        : activeProvider === 'anthropic' ? { anthropic_temperature: String(anthropicTemperature) }
        : { ollama_url: ollamaUrl, ollama_temperature: String(temperature) };
      await api.settings.update({
        ...base,
        ai_max_tokens: String(maxTokens),
        ai_top_p: String(topP),
        ai_streaming: String(streamingEnabled),
        ai_system_prompt: systemPrompt,
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

  const handleTestOllama = async () => {
    setTestingOllama(true);
    try {
      const r = await api.settings.testOllama(ollamaUrl);
      if (r.connected) showToast(`Connected to Ollama (${r.modelCount} models available)`);
      else showToast(`Cannot connect: ${r.error}`, 'error');
    } catch (err) {
      showToast(`Connection test failed: ${err.message}`, 'error');
    } finally {
      setTestingOllama(false);
    }
  };

  const handleTestGroq = async () => {
    setTestingGroq(true);
    try {
      const r = await api.settings.testGroq(groqKey || undefined);
      if (r.valid) showToast(`Groq API valid (${r.modelCount} models available)`);
      else showToast(r.error || 'Invalid API key', 'error');
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

  const handleTestOpenai = async () => {
    setTestingOpenai(true);
    try {
      const r = await api.settings.testOpenai(openaiKey || undefined);
      if (r.valid) showToast(`OpenAI API valid (${r.modelCount} models available)`);
      else showToast(r.error || 'Invalid API key', 'error');
    } catch (err) {
      showToast(`Test failed: ${err.message}`, 'error');
    } finally {
      setTestingOpenai(false);
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

  const handleTestAnthropic = async () => {
    setTestingAnthropic(true);
    try {
      const r = await api.settings.testAnthropic(anthropicKey || undefined);
      if (r.valid) showToast('Anthropic API key is valid');
      else showToast(r.error || 'Invalid API key', 'error');
    } catch (err) {
      showToast(`Test failed: ${err.message}`, 'error');
    } finally {
      setTestingAnthropic(false);
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

  const handleTestOpenClaw = async () => {
    setTestingOpenClaw(true);
    try {
      const r = await api.settings.testOpenClaw(openclawUrl, openclawToken || undefined);
      if (r.connected) showToast(`Connected to OpenClaw (${r.model})`);
      else showToast(`Cannot connect: ${r.error}`, 'error');
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

  const handleSetDefaultModel = async (modelName) => {
    try {
      setDefaultModel(modelName);
      const modelKey = activeProvider === 'groq'      ? 'groq_model'
        : activeProvider === 'anthropic' ? 'anthropic_model'
        : activeProvider === 'openai'    ? 'openai_model'
        : activeProvider === 'openclaw'  ? 'openclaw_model'
        : 'ollama_model';
      await api.settings.update({ [modelKey]: modelName });
      refetchSettings();
      showToast(`Default model set to ${modelName}`);
    } catch (err) {
      showToast(`Failed: ${err.message}`, 'error');
    }
  };

  const handlePullModel = async () => {
    if (!pullModelName.trim()) return;
    setPullingModel(true);
    try {
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
        for (const line of text.split('\n').filter(l => l.startsWith('data: '))) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.status) lastStatus = data.status;
            if (data.done) break;
          } catch { /* skip malformed chunk */ }
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

  const temperatureLabel = (t) => t <= 0.3 ? 'Precise' : t <= 0.7 ? 'Balanced' : 'Creative';

  return {
    activeProvider, setActiveProvider,
    ollamaUrl, setOllamaUrl,
    temperature, setTemperature,
    groqKey, setGroqKey, showGroqKey, setShowGroqKey,
    groqTemperature, setGroqTemperature,
    openaiKey, setOpenaiKey, showOpenaiKey, setShowOpenaiKey,
    openaiTemperature, setOpenaiTemperature,
    anthropicKey, setAnthropicKey, showAnthropicKey, setShowAnthropicKey,
    anthropicTemperature, setAnthropicTemperature,
    openclawUrl, setOpenclawUrl,
    openclawToken, setOpenclawToken, showOpenclawToken, setShowOpenclawToken,
    openclawTemperature, setOpenclawTemperature,
    maxTokens, setMaxTokens,
    topP, setTopP,
    streamingEnabled, setStreamingEnabled,
    systemPrompt, setSystemPrompt,
    pullModelName, setPullModelName,
    deleteConfirm, setDeleteConfirm,
    availableModels, refetchModels,
    testingOllama, testingGroq, testingOpenai, testingOpenClaw, testingAnthropic,
    savingAI, switchingProvider, pullingModel, deletingModel,
    handleSwitchProvider, handleSaveAIConfig,
    handleTestOllama, handleTestGroq, handleSaveGroqKey,
    handleTestOpenai, handleSaveOpenaiKey,
    handleTestAnthropic, handleSaveAnthropicKey,
    handleTestOpenClaw, handleSaveOpenclawToken,
    handleSetDefaultModel, handlePullModel, handleDeleteModel,
    temperatureLabel,
  };
}
