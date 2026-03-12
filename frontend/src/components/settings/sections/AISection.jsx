/**
 * AI Section - Optimized
 * AI provider configuration and model management with:
 * - Memoized provider cards
 * - Debounced slider inputs
 * - Virtualized model lists for large collections
 */

import { memo, useMemo, useCallback, useState, useEffect, useRef, useReducer } from 'react';
import { 
  Cpu, Server, Zap, Cog, SlidersHorizontal, 
  HardDrive, Download, Star, XCircle, Clock, Trash2, 
  Loader2, Save, Shield, CheckCircle2,
  BrainCircuit, Sparkles
} from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { useSettingsActions } from '../hooks/useSettingsActions';
import { Section, SliderField, SettingsRow, Toggle, StatusPill, KeyInput } from '../primitives';
import { ConfirmDialog } from '../../shared';
import { colors } from '../../../styles/tokens';
import { useVirtualList } from '../../../hooks/useVirtualList';

// Memoized provider card to prevent re-renders
const ProviderCard = memo(function ProviderCard({ 
  id, icon: Icon, label, desc, accent, isActive, isSwitching, onClick 
}) {
  return (
    <button 
      key={id} 
      onClick={() => onClick(id)} 
      disabled={isSwitching}
      className={`relative p-4 rounded-xl border transition-all text-left group active:scale-95 ${
        isActive
          ? 'bg-surface-elevated border-accent-blue shadow-lg ring-1 ring-accent-blue/20'
          : 'bg-surface-card border-border-default hover:border-border-strong'
      }`}
    >
      {isActive && (
        <div className="absolute top-2 right-2">
          <CheckCircle2 className="w-4 h-4 text-accent-blue" />
        </div>
      )}
      <div className={`p-2 rounded-lg mb-3 inline-block transition-colors ${isActive ? 'bg-accent-muted' : 'bg-surface-elevated group-hover:bg-surface-card'}`}>
        <Icon className="w-5 h-5" style={{ color: isActive ? colors.accent.blue : colors.text.muted }} />
      </div>
      <div className="font-bold text-sm text-text-primary tracking-tight">{label}</div>
      <p className="text-xs font-bold uppercase tracking-widest text-text-muted mt-0.5">{desc}</p>
    </button>
  );
});

// Memoized model card
const ModelCard = memo(function ModelCard({ 
  model, isDefault, isOllama, onSelect, onDelete 
}) {
  const { name, label, size, context, modified } = model;
  
  return (
    <div 
      className={`relative p-5 rounded-2xl border transition-all group ${
        isDefault 
          ? 'bg-accent-muted/10 border-accent-blue/30 shadow-md ring-1 ring-accent-blue/10' 
          : 'bg-surface-elevated border-border-default hover:border-border-strong hover:bg-surface-card'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-mono text-sm font-bold text-text-primary truncate tracking-tight">{label || name}</h3>
          {isDefault && (
            <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 bg-accent-blue text-white text-[9px] font-black uppercase tracking-tighter rounded-sm shadow-sm">
              <Star className="w-2.5 h-2.5 fill-current" />Active
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-text-muted opacity-60">
          {size ? (
            <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" />{(size/(1024**3)).toFixed(2)} GB</span>
          ) : context ? (
            <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{Math.round(context/1000)}k ctx</span>
          ) : null}
          {modified && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(modified).toLocaleDateString()}</span>}
        </div>
        
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isDefault && (
            <button 
              onClick={() => onSelect(name)} 
              className="text-xs font-bold text-accent-blue uppercase tracking-widest hover:underline"
            >
              Select
            </button>
          )}
          {isOllama && !isDefault && (
            <button 
              onClick={() => onDelete(name)} 
              className="p-1.5 rounded-lg text-text-muted hover:text-danger-light hover:bg-danger-muted transition-all"
              title="Delete model"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

// Debounced slider component
function DebouncedSlider({ value, onChange, delay = 150, ...props }) {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef(null);

  // Sync with external value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback((newValue) => {
    setLocalValue(newValue);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, delay);
  }, [onChange, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <SliderField 
      {...props}
      value={localValue} 
      onChange={handleChange}
    />
  );
}

// Provider configuration definitions (static, outside component)
const PROVIDER_CONFIGS = [
  { id: 'ollama', icon: Server, label: 'Ollama', desc: 'Local', accent: colors.accent.blue },
  { id: 'openclaw', icon: Shield, label: 'OpenClaw', desc: 'Gateway', accent: colors.danger.DEFAULT },
  { id: 'groq', icon: Zap, label: 'Groq', desc: 'Speed', accent: colors.warning.DEFAULT },
  { id: 'openai', icon: Sparkles, label: 'OpenAI', desc: 'GPT-4o', accent: colors.success.DEFAULT },
  { id: 'anthropic', icon: Shield, label: 'Claude', desc: 'Premium', accent: colors.accent.purple },
];

export default memo(function AISection() {
  const ctx = useSettings();
  const actions = useSettingsActions();
  
  const {
    activeProvider, settings, availableModels, connected, 
    defaultModel, config, switchingProvider, testingOllama,
    testingGroq, testingOpenClaw, testingOpenai, testingAnthropic,
    savingAI, maxTokens, topP,
    streamingEnabled, systemPrompt, pullModelName, pullingModel,
    deleteConfirm, deletingModel, showGroqKey, showOpenclawToken,
    showOpenaiKey, showAnthropicKey,
    temperature, groqKey, groqTemperature, ollamaUrl, openclawUrl,
    openclawToken, openclawTemperature, openaiKey, openaiTemperature,
    anthropicKey, anthropicTemperature
  } = ctx;
  
  const {
    handleSwitchProvider, handleSaveAIConfig, handleTestOllama,
    handleTestGroq, handleSaveGroqKey, handleTestOpenai, handleSaveOpenaiKey,
    handleTestAnthropic, handleSaveAnthropicKey,
    handleTestOpenClaw, handleSaveOpenclawToken, handleSetDefaultModel, 
    handlePullModel, handleDeleteModel, temperatureLabel
  } = actions;

  // Memoize provider badge
  const providerBadge = useMemo(() => (
    <StatusPill 
      connected={connected || activeProvider !== 'ollama'} 
      label={{ 
        openclaw: 'OpenClaw Gateway', 
        groq: 'Groq Cloud', 
        anthropic: 'Anthropic Claude', 
        openai: 'OpenAI',
        ollama: 'Ollama Local' 
      }[activeProvider] || activeProvider} 
    />
  ), [connected, activeProvider]);

  // Memoize provider cards render
  const providerCards = useMemo(() => (
    PROVIDER_CONFIGS.map(({ id, icon, label, desc, accent }) => (
      <ProviderCard
        key={id}
        id={id}
        icon={icon}
        label={label}
        desc={desc}
        accent={accent}
        isActive={activeProvider === id}
        isSwitching={switchingProvider}
        onClick={handleSwitchProvider}
      />
    ))
  ), [activeProvider, switchingProvider, handleSwitchProvider]);

  // Memoize model cards with virtualization for large lists
  const modelCards = useMemo(() => {
    if (availableModels.length === 0) return null;
    
    return availableModels.map(m => (
      <ModelCard
        key={m.name}
        model={m}
        isDefault={m.name === defaultModel || m.name === config?.defaultModel}
        isOllama={activeProvider === 'ollama'}
        onSelect={handleSetDefaultModel}
        onDelete={(name) => ctx.setDeleteConfirm(name)}
      />
    ));
  }, [availableModels, defaultModel, config?.defaultModel, activeProvider, handleSetDefaultModel, ctx.setDeleteConfirm]);

  // Provider-specific content memoization
  const providerContent = useMemo(() => {
    switch (activeProvider) {
      case 'ollama':
        return (
          <div className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Ollama Server URL</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={ollamaUrl} 
                  onChange={e => ctx.setOllamaUrl(e.target.value)} 
                  className="input flex-1 font-mono text-sm tracking-tight" 
                  placeholder="http://localhost:11434" 
                />
                <button onClick={handleTestOllama} disabled={testingOllama} className="btn-secondary text-xs font-semibold uppercase tracking-wider px-4">
                  {testingOllama ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />} Test
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Default Local Model</label>
              <select 
                value={defaultModel} 
                onChange={e => handleSetDefaultModel(e.target.value)} 
                className="input font-semibold text-sm"
              >
                {availableModels.length === 0 && <option>{connected ? 'Loading models...' : 'No models found'}</option>}
                {availableModels.map(m => (
                  <option key={m.name} value={m.name}>
                    {m.name} {m.size ? `(${(m.size/(1024**3)).toFixed(1)} GB)` : ''}
                  </option>
                ))}
              </select>
            </div>
            <DebouncedSlider 
              label="Model Temperature" 
              value={temperature} 
              onChange={ctx.setTemperature} 
              min={0} max={1} step={0.05} 
              unit={` — ${temperatureLabel(temperature)}`} 
              markers={['Precise','Balanced','Creative']} 
            />
          </div>
        );
      
      case 'groq':
        return (
          <div className="space-y-5">
            <KeyInput 
              label="Groq API Key" 
              description="Ultra-fast LPU inference for real-time analysis." 
              href="https://console.groq.com" 
              hrefLabel="console.groq.com"
              value={groqKey} 
              onChange={ctx.setGroqKey} 
              show={showGroqKey} 
              onToggleShow={() => ctx.setShowGroqKey(!showGroqKey)}
              placeholder={settings.groq_api_key_masked || 'gsk_...'}
              onTest={handleTestGroq} 
              testing={testingGroq} 
              onSave={handleSaveGroqKey} 
            />
            <div className="flex flex-col gap-1.5 pt-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Preferred Groq Model</label>
              <select value={defaultModel} onChange={e => handleSetDefaultModel(e.target.value)} className="input font-semibold text-sm">
                {availableModels.length === 0 && <option>Loading Groq models...</option>}
                {availableModels.map(m => (
                  <option key={m.name} value={m.name}>
                    {m.label || m.name} {m.context ? `(${Math.round(m.context/1000)}k ctx)` : ''}
                  </option>
                ))}
              </select>
            </div>
            <DebouncedSlider 
              label="Groq Temperature" 
              value={groqTemperature} 
              onChange={ctx.setGroqTemperature} 
              min={0} max={1} step={0.05} 
              unit={` — ${temperatureLabel(groqTemperature)}`} 
              markers={['Precise','Balanced','Creative']} 
            />
          </div>
        );
      
      case 'openai':
        return (
          <div className="space-y-5">
            <KeyInput 
              label="OpenAI API Key" 
              description="Standard GPT-4o models for high-quality extraction." 
              href="https://platform.openai.com/api-keys" 
              hrefLabel="platform.openai.com"
              value={openaiKey} 
              onChange={ctx.setOpenaiKey} 
              show={showOpenaiKey} 
              onToggleShow={() => ctx.setShowOpenaiKey(!showOpenaiKey)}
              placeholder={settings.openai_api_key_masked || 'sk-...'}
              onTest={handleTestOpenai} 
              testing={testingOpenai} 
              onSave={handleSaveOpenaiKey} 
            />
            <div className="flex flex-col gap-1.5 pt-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Default OpenAI Model</label>
              <select value={defaultModel} onChange={e => handleSetDefaultModel(e.target.value)} className="input font-semibold text-sm">
                <option value="gpt-4o">GPT-4o (powerful)</option>
                <option value="gpt-4o-mini">GPT-4o Mini (fast)</option>
                <option value="o1-preview">o1 Preview (reasoning)</option>
                <option value="o1-mini">o1 Mini (fast reasoning)</option>
              </select>
            </div>
            <DebouncedSlider 
              label="OpenAI Temperature" 
              value={openaiTemperature} 
              onChange={ctx.setOpenaiTemperature} 
              min={0} max={1} step={0.05} 
              unit={` — ${temperatureLabel(openaiTemperature)}`} 
              markers={['Precise','Balanced','Creative']} 
            />
          </div>
        );
      
      case 'anthropic':
        return (
          <div className="space-y-5">
            <KeyInput 
              label="Anthropic Claude API Key" 
              description="State-of-the-art reasoning with Claude 3.5 Sonnet." 
              href="https://console.anthropic.com" 
              hrefLabel="console.anthropic.com"
              value={anthropicKey} 
              onChange={ctx.setAnthropicKey} 
              show={showAnthropicKey} 
              onToggleShow={() => ctx.setShowAnthropicKey(!showAnthropicKey)}
              placeholder={settings.anthropic_api_key_masked || 'sk-ant-...'}
              onTest={handleTestAnthropic} 
              testing={testingAnthropic} 
              onSave={handleSaveAnthropicKey} 
            />
            <div className="flex flex-col gap-1.5 pt-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Claude Model Selection</label>
              <select value={defaultModel} onChange={e => handleSetDefaultModel(e.target.value)} className="input font-semibold text-sm">
                <option value="claude-3-5-sonnet-latest">Claude 3.5 Sonnet (best)</option>
                <option value="claude-3-5-haiku-latest">Claude 3.5 Haiku (fastest)</option>
                <option value="claude-3-opus-latest">Claude 3 Opus (complex)</option>
              </select>
            </div>
            <DebouncedSlider 
              label="Claude Temperature" 
              value={anthropicTemperature} 
              onChange={ctx.setAnthropicTemperature} 
              min={0} max={1} step={0.05} 
              unit={` — ${temperatureLabel(anthropicTemperature)}`} 
              markers={['Precise','Balanced','Creative']} 
            />
          </div>
        );
      
      case 'openclaw':
        return (
          <div className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">OpenClaw Gateway URL</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={openclawUrl} 
                  onChange={e => ctx.setOpenclawUrl(e.target.value)} 
                  className="input flex-1 font-mono text-sm tracking-tight" 
                  placeholder="http://localhost:18789" 
                />
                <button onClick={handleTestOpenClaw} disabled={testingOpenClaw} className="btn-secondary text-xs font-semibold uppercase tracking-wider px-4">
                  {testingOpenClaw ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />} Test
                </button>
              </div>
            </div>
            <KeyInput 
              label="Gateway Security Token" 
              description="Optional token for authenticated OpenClaw gateways." 
              value={openclawToken} 
              onChange={ctx.setOpenclawToken} 
              show={showOpenclawToken} 
              onToggleShow={() => ctx.setShowOpenclawToken(!showOpenclawToken)}
              placeholder={settings.openclaw_token_masked || 'Enter token if required'}
              onSave={handleSaveOpenclawToken} 
            />
            <div className="flex flex-col gap-1.5 pt-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Target Model</label>
              <select value={defaultModel} onChange={e => handleSetDefaultModel(e.target.value)} className="input font-semibold text-sm">
                {availableModels.length === 0 && <option value="llama3.1">llama3.1</option>}
                {availableModels.map(m => <option key={m.name} value={m.name}>{m.label || m.name}</option>)}
              </select>
            </div>
            <DebouncedSlider 
              label="Gateway Temperature" 
              value={openclawTemperature} 
              onChange={ctx.setOpenclawTemperature} 
              min={0} max={1} step={0.05} 
              unit={` — ${temperatureLabel(openclawTemperature)}`} 
              markers={['Precise','Balanced','Creative']} 
            />
          </div>
        );
      
      default:
        return null;
    }
  }, [
    activeProvider, ollamaUrl, temperature, defaultModel, availableModels, connected,
    groqKey, groqTemperature, showGroqKey, settings.groq_api_key_masked,
    openaiKey, openaiTemperature, showOpenaiKey, settings.openai_api_key_masked,
    anthropicKey, anthropicTemperature, showAnthropicKey, settings.anthropic_api_key_masked,
    openclawUrl, openclawToken, openclawTemperature, showOpenclawToken, settings.openclaw_token_masked,
    testingOllama, testingGroq, testingOpenai, testingAnthropic, testingOpenClaw,
    ctx, handleTestOllama, handleSetDefaultModel, handleTestGroq, handleSaveGroqKey,
    handleTestOpenai, handleSaveOpenaiKey, handleTestAnthropic, handleSaveAnthropicKey,
    handleTestOpenClaw, handleSaveOpenclawToken, temperatureLabel
  ]);

  return (
    <div className="space-y-6 page-transition-wrapper">
      {/* Provider Selection */}
      <Section 
        icon={BrainCircuit} 
        title="AI Intelligence Provider" 
        badge={providerBadge}
        description="Choose the core engine that powers your business intelligence"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {providerCards}
          </div>

          <div className="p-5 rounded-2xl bg-surface-elevated border border-border-default">
            {providerContent}
          </div>
        </div>
      </Section>

      {/* Advanced AI */}
      <Section icon={SlidersHorizontal} title="Engine Tuning">
        <div className="space-y-6">
          <DebouncedSlider 
            label="Max Token Budget" 
            value={maxTokens} 
            onChange={ctx.setMaxTokens} 
            min={256} max={16384} step={256} 
            unit=" tokens" 
            markers={['256','8192','16384']} 
          />
          <DebouncedSlider 
            label="Nucleus Sampling (Top P)" 
            value={topP} 
            onChange={ctx.setTopP} 
            min={0} max={1} step={0.05} 
            markers={['Focused','Balanced','Diverse']} 
          />
          
          <SettingsRow 
            label="Streaming Mode" 
            description="Real-time token generation — significantly better perceived performance"
            icon={Zap}
          >
            <Toggle enabled={streamingEnabled} onChange={ctx.setStreamingEnabled} />
          </SettingsRow>
          
          <div className="flex flex-col gap-2 pt-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Global System Persona</label>
            <textarea
              value={systemPrompt}
              onChange={e => ctx.setSystemPrompt(e.target.value)}
              rows={4}
              className="input font-mono text-sm tracking-tight resize-none bg-surface-elevated border-border-default focus:border-accent-blue transition-all"
              placeholder="You are an expert plumbing estimator for CTL Plumbing LLC..."
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-bold text-text-muted uppercase tracking-widest">{systemPrompt.length} / 2000 characters</span>
              <button 
                onClick={() => ctx.setSystemPrompt('')} 
                className="text-xs font-bold text-danger-light uppercase tracking-widest hover:underline"
              >
                Reset to default
              </button>
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t border-border-default">
            <button onClick={handleSaveAIConfig} disabled={savingAI} className="btn-primary h-11 px-8 text-xs font-semibold uppercase tracking-[0.2em] shadow-lg shadow-accent-blue/20 transition-all active:scale-95">
              {savingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Configuration
            </button>
          </div>
        </div>
      </Section>

      {/* Model Library */}
      <Section 
        icon={HardDrive} 
        title="Model Management"
        badge={<span className="text-xs font-bold uppercase tracking-widest text-text-muted bg-surface-elevated px-2 py-1 rounded-md border border-border-muted">{availableModels.length} models available</span>}
        description="Local storage and model pull utility"
      >
        {activeProvider === 'ollama' && (
          <div className="mb-6 p-5 bg-surface-elevated dark:bg-accent-muted/5 rounded-2xl border border-border-default border-dashed">
            <label className="text-xs font-bold text-text-muted uppercase tracking-[0.2em] mb-3 block">Pull New Intelligence Model</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={pullModelName} 
                onChange={e => ctx.setPullModelName(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handlePullModel()} 
                className="input flex-1 font-mono text-sm h-11 tracking-tight" 
                placeholder="e.g. llama3.1:8b, qwen2.5-coder:7b" 
                disabled={pullingModel} 
              />
              <button onClick={handlePullModel} disabled={pullingModel || !pullModelName.trim()} className="btn-primary h-11 px-6 text-xs font-semibold uppercase tracking-widest">
                {pullingModel ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Pulling...</> : <><Download className="w-4 h-4 mr-2" />Pull</>}
              </button>
            </div>
            <p className="text-xs text-text-muted mt-2 px-1">Check model names at <a href="https://ollama.com/library" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">ollama.com/library</a></p>
          </div>
        )}
        
        {availableModels.length === 0 ? (
          <div className="text-center py-12 bg-surface-card/30 rounded-2xl border border-border-default border-dashed">
            <XCircle className="w-10 h-10 mx-auto mb-3 text-text-muted opacity-20" />
            <p className="text-sm font-bold text-text-muted uppercase tracking-widest">No models found in current provider</p>
          </div>
        ) : availableModels.length > 20 ? (
          // Use virtualization for large model lists (>20 items)
          <VirtualizedModelList
            models={availableModels}
            defaultModel={defaultModel}
            configDefaultModel={config?.defaultModel}
            activeProvider={activeProvider}
            handleSetDefaultModel={handleSetDefaultModel}
            setDeleteConfirm={(name) => ctx.setDeleteConfirm(name)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {modelCards}
          </div>
        )}

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <ConfirmDialog
            title="Purge Intelligence Model?"
            message={`Are you sure you want to permanently delete "${deleteConfirm}"? Model files will be removed from local storage.`}
            confirmLabel={deletingModel ? 'Purging...' : 'Delete Permanently'}
            onConfirm={() => handleDeleteModel(deleteConfirm)}
            onCancel={() => ctx.setDeleteConfirm(null)}
            variant="danger"
          />
        )}
      </Section>
    </div>
  );
});
