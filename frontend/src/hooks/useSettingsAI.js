import { useSettings } from '../components/settings/SettingsContext';

/**
 * useSettingsAI Hook
 * 
 * DEPRECATED: Use `useSettings` from '../components/settings/SettingsContext' instead.
 * This hook now serves as a thin wrapper for backward compatibility.
 * 
 * Manages AI provider settings state. Returns a subset of settings
 * specifically related to AI configuration.
 */
export function useSettingsAI() {
  const ctx = useSettings();
  
  return {
    // Provider
    activeProvider: ctx.activeProvider,
    setActiveProvider: ctx.setActiveProvider,
    
    // Ollama
    ollamaUrl: ctx.ollamaUrl,
    setOllamaUrl: ctx.setOllamaUrl,
    temperature: ctx.temperature,
    setTemperature: ctx.setTemperature,
    
    // Groq
    groqKey: ctx.groqKey,
    setGroqKey: ctx.setGroqKey,
    showGroqKey: ctx.showGroqKey,
    setShowGroqKey: ctx.setShowGroqKey,
    groqTemperature: ctx.groqTemperature,
    setGroqTemperature: ctx.setGroqTemperature,
    
    // OpenAI
    openaiKey: ctx.openaiKey,
    setOpenaiKey: ctx.setOpenaiKey,
    showOpenaiKey: ctx.showOpenaiKey,
    setShowOpenaiKey: ctx.setShowOpenaiKey,
    openaiTemperature: ctx.openaiTemperature,
    setOpenaiTemperature: ctx.setOpenaiTemperature,
    
    // Anthropic
    anthropicKey: ctx.anthropicKey,
    setAnthropicKey: ctx.setAnthropicKey,
    showAnthropicKey: ctx.showAnthropicKey,
    setShowAnthropicKey: ctx.setShowAnthropicKey,
    anthropicTemperature: ctx.anthropicTemperature,
    setAnthropicTemperature: ctx.setAnthropicTemperature,
    
    // OpenClaw
    openclawUrl: ctx.openclawUrl,
    setOpenclawUrl: ctx.setOpenclawUrl,
    openclawToken: ctx.openclawToken,
    setOpenclawToken: ctx.setOpenclawToken,
    showOpenclawToken: ctx.showOpenclawToken,
    setShowOpenclawToken: ctx.setShowOpenclawToken,
    openclawTemperature: ctx.openclawTemperature,
    setOpenclawTemperature: ctx.setOpenclawTemperature,
    
    // Advanced
    maxTokens: ctx.maxTokens,
    setMaxTokens: ctx.setMaxTokens,
    topP: ctx.topP,
    setTopP: ctx.setTopP,
    streamingEnabled: ctx.streamingEnabled,
    setStreamingEnabled: ctx.setStreamingEnabled,
    systemPrompt: ctx.systemPrompt,
    setSystemPrompt: ctx.setSystemPrompt,
    
    // Model management
    pullModelName: ctx.pullModelName,
    setPullModelName: ctx.setPullModelName,
    deleteConfirm: ctx.deleteConfirm,
    setDeleteConfirm: ctx.setDeleteConfirm,
    
    // Loading states
    switchingProvider: ctx.switchingProvider,
    setSwitchingProvider: ctx.setSwitchingProvider,
    savingAI: ctx.savingAI,
    setSavingAI: ctx.setSavingAI,
    pullingModel: ctx.pullingModel,
    setPullingModel: ctx.setPullingModel,
    deletingModel: ctx.deletingModel,
    setDeletingModel: ctx.setDeletingModel,
    testingOllama: ctx.testingOllama,
    setTestingOllama: ctx.setTestingOllama,
    testingGroq: ctx.testingGroq,
    setTestingGroq: ctx.setTestingGroq,
    testingOpenai: ctx.testingOpenai,
    setTestingOpenai: ctx.setTestingOpenai,
    testingOpenClaw: ctx.testingOpenClaw,
    setTestingOpenClaw: ctx.setTestingOpenClaw,
    testingAnthropic: ctx.testingAnthropic,
    setTestingAnthropic: ctx.setTestingAnthropic,
    
    // Data
    settings: ctx.settings,
    availableModels: ctx.availableModels,
    metrics: ctx.metrics,
    config: ctx.config,
    connected: ctx.connected,
    model: ctx.model,
    
    // Utils
    showToast: ctx.showToast,
    refetchSettings: ctx.refetchSettings,
    refetchModels: ctx.refetchModels,
    refetchOllama: ctx.refetchOllama,
  };
}

export default useSettingsAI;
