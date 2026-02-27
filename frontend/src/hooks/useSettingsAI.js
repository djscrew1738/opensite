import { useState, useCallback } from 'react';

/**
 * useSettingsAI Hook
 * Manages AI provider settings state
 */
export function useSettingsAI() {
  const [activeProvider, setActiveProvider] = useState('ollama');
  
  // Ollama
  const [ollamaUrl, setOllamaUrl] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  
  // Groq
  const [groqKey, setGroqKey] = useState('');
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [groqTemperature, setGroqTemperature] = useState(0.7);
  
  // OpenAI
  const [openaiKey, setOpenaiKey] = useState('');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [openaiTemperature, setOpenaiTemperature] = useState(0.7);
  
  // Anthropic
  const [anthropicKey, setAnthropicKey] = useState('');
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [anthropicTemperature, setAnthropicTemperature] = useState(0.7);
  
  // OpenClaw
  const [openclawUrl, setOpenclawUrl] = useState('http://localhost:18789');
  const [openclawToken, setOpenclawToken] = useState('');
  const [showOpenclawToken, setShowOpenclawToken] = useState(false);
  const [openclawTemperature, setOpenclawTemperature] = useState(0.7);
  
  // Advanced
  const [maxTokens, setMaxTokens] = useState(2048);
  const [topP, setTopP] = useState(0.9);
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState('');
  
  // Model management
  const [pullModelName, setPullModelName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Loading states
  const [switchingProvider, setSwitchingProvider] = useState(false);
  const [savingAI, setSavingAI] = useState(false);
  const [pullingModel, setPullingModel] = useState(false);
  const [deletingModel, setDeletingModel] = useState(null);
  const [testingOllama, setTestingOllama] = useState(false);
  const [testingGroq, setTestingGroq] = useState(false);
  const [testingOpenai, setTestingOpenai] = useState(false);
  const [testingOpenClaw, setTestingOpenClaw] = useState(false);
  const [testingAnthropic, setTestingAnthropic] = useState(false);

  const temperatureLabel = useCallback((t) => {
    if (t <= 0.3) return 'Precise';
    if (t <= 0.7) return 'Balanced';
    return 'Creative';
  }, []);

  const syncFromSettings = useCallback((settings) => {
    if (!settings) return;
    const bool = (v, fallback = false) => v === undefined ? fallback : String(v) === 'true';
    const num = (v, fallback) => v !== undefined ? parseFloat(v) || fallback : fallback;

    setActiveProvider(settings.ai_provider || 'ollama');
    setOllamaUrl(settings.ollama_url || 'http://localhost:11434');
    setTemperature(num(settings.ollama_temperature, 0.7));
    setGroqTemperature(num(settings.groq_temperature, 0.7));
    setOpenaiTemperature(num(settings.openai_temperature, 0.7));
    setAnthropicTemperature(num(settings.anthropic_temperature, 0.7));
    setOpenclawUrl(settings.openclaw_url || 'http://localhost:18789');
    setOpenclawTemperature(num(settings.openclaw_temperature, 0.7));
    setMaxTokens(num(settings.ai_max_tokens, 2048));
    setTopP(num(settings.ai_top_p, 0.9));
    setStreamingEnabled(bool(settings.ai_streaming, true));
    setSystemPrompt(settings.ai_system_prompt || '');
  }, []);

  return {
    // Provider
    activeProvider,
    setActiveProvider,
    
    // Ollama
    ollamaUrl,
    setOllamaUrl,
    temperature,
    setTemperature,
    
    // Groq
    groqKey,
    setGroqKey,
    showGroqKey,
    setShowGroqKey,
    groqTemperature,
    setGroqTemperature,
    
    // OpenAI
    openaiKey,
    setOpenaiKey,
    showOpenaiKey,
    setShowOpenaiKey,
    openaiTemperature,
    setOpenaiTemperature,
    
    // Anthropic
    anthropicKey,
    setAnthropicKey,
    showAnthropicKey,
    setShowAnthropicKey,
    anthropicTemperature,
    setAnthropicTemperature,
    
    // OpenClaw
    openclawUrl,
    setOpenclawUrl,
    openclawToken,
    setOpenclawToken,
    showOpenclawToken,
    setShowOpenclawToken,
    openclawTemperature,
    setOpenclawTemperature,
    
    // Advanced
    maxTokens,
    setMaxTokens,
    topP,
    setTopP,
    streamingEnabled,
    setStreamingEnabled,
    systemPrompt,
    setSystemPrompt,
    
    // Model management
    pullModelName,
    setPullModelName,
    deleteConfirm,
    setDeleteConfirm,
    
    // Loading states
    switchingProvider,
    setSwitchingProvider,
    savingAI,
    setSavingAI,
    pullingModel,
    setPullingModel,
    deletingModel,
    setDeletingModel,
    testingOllama,
    setTestingOllama,
    testingGroq,
    setTestingGroq,
    testingOpenai,
    setTestingOpenai,
    testingOpenClaw,
    setTestingOpenClaw,
    testingAnthropic,
    setTestingAnthropic,
    
    // Helpers
    temperatureLabel,
    syncFromSettings,
  };
}
