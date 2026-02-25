import { memo } from 'react';
import {
  Cpu, CheckCircle, Server, Zap, Cog, SlidersHorizontal,
  HardDrive, Download, Star, XCircle, Clock, Trash2,
  Loader2, Save, Eye, EyeOff, Shield, Sparkles, Globe
} from 'lucide-react';
import { Section, SliderField, SettingsRow, Toggle } from '../primitives';
import ConfirmDialog from '../../shared/ConfirmDialog';

// All 5 backend-supported providers
const PROVIDER_CARDS = [
  { id: 'ollama',    icon: Server,   label: 'Ollama',    desc: 'Local private',    category: 'local' },
  { id: 'openclaw',  icon: Cog,      label: 'OpenClaw',  desc: 'Local gateway',    category: 'local' },
  { id: 'groq',      icon: Zap,      label: 'Groq',      desc: 'Ultra-fast cloud', category: 'cloud' },
  { id: 'openai',    icon: Globe,    label: 'OpenAI',    desc: 'GPT-4o / o1',     category: 'cloud' },
  { id: 'anthropic', icon: Sparkles, label: 'Anthropic', desc: 'Claude 4.6',      category: 'cloud' },
];

// Fully spelled-out Tailwind classes (template literals break purge)
const PROVIDER_STYLES = {
  ollama: {
    active: 'border-blue-500 bg-blue-500/5',
    check: 'text-blue-500',
    icon: 'text-blue-400',
    dot: 'bg-blue-500',
    badge: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20',
  },
  groq: {
    active: 'border-orange-500 bg-orange-500/5',
    check: 'text-orange-500',
    icon: 'text-orange-400',
    dot: 'bg-orange-500',
    badge: 'bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20',
  },
  openai: {
    active: 'border-emerald-500 bg-emerald-500/5',
    check: 'text-emerald-500',
    icon: 'text-emerald-400',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
  },
  openclaw: {
    active: 'border-violet-500 bg-violet-500/5',
    check: 'text-violet-500',
    icon: 'text-violet-400',
    dot: 'bg-violet-500',
    badge: 'bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20',
  },
  anthropic: {
    active: 'border-amber-500 bg-amber-500/5',
    check: 'text-amber-500',
    icon: 'text-amber-400',
    dot: 'bg-amber-500',
    badge: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20',
  },
};

const PROVIDER_LABELS = {
  openclaw: 'OpenClaw', groq: 'Groq Cloud', anthropic: 'Anthropic',
  openai: 'OpenAI', ollama: 'Ollama Local',
};

// Shared key input with visibility toggle
function SecretInput({ value, onChange, show, onToggleShow, placeholder, label }) {
  return (
    <div className="relative flex-1">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="input pr-10 font-mono text-sm"
        placeholder={placeholder}
        aria-label={label}
      />
      <button
        type="button"
        onClick={onToggleShow}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#94A3B8]"
        aria-label={show ? `Hide ${label}` : `Show ${label}`}
      >
        {show ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
      </button>
    </div>
  );
}

function SettingsAI({
  activeProvider,
  settings,
  availableModels: rawAvailableModels,
  connected,
  defaultModel,
  config,
  switchingProvider,
  testingOllama,
  testingGroq,
  testingOpenai,
  testingOpenClaw,
  testingAnthropic,
  savingAI,
  maxTokens,
  setMaxTokens,
  topP,
  setTopP,
  streamingEnabled,
  setStreamingEnabled,
  systemPrompt,
  setSystemPrompt,
  pullModelName,
  setPullModelName,
  pullingModel,
  deleteConfirm,
  setDeleteConfirm,
  deletingModel,
  showGroqKey,
  setShowGroqKey,
  showOpenaiKey,
  setShowOpenaiKey,
  showOpenclawToken,
  setShowOpenclawToken,
  showAnthropicKey,
  setShowAnthropicKey,
  temperature,
  setTemperature,
  groqKey,
  setGroqKey,
  groqTemperature,
  setGroqTemperature,
  openaiKey,
  setOpenaiKey,
  openaiTemperature,
  setOpenaiTemperature,
  anthropicKey,
  setAnthropicKey,
  anthropicTemperature,
  setAnthropicTemperature,
  ollamaUrl,
  setOllamaUrl,
  openclawUrl,
  setOpenclawUrl,
  openclawToken,
  setOpenclawToken,
  openclawTemperature,
  setOpenclawTemperature,
  model,
  handleSwitchProvider,
  handleSaveAIConfig,
  handleTestOllama,
  handleTestGroq,
  handleSaveGroqKey,
  handleTestOpenai,
  handleSaveOpenaiKey,
  handleTestAnthropic,
  handleSaveAnthropicKey,
  handleTestOpenClaw,
  handleSaveOpenclawToken,
  handleSetDefaultModel,
  handlePullModel,
  handleDeleteModel,
  temperatureLabel,
}) {
  const availableModels = Array.isArray(rawAvailableModels) ? rawAvailableModels : [];
  const ps = PROVIDER_STYLES[activeProvider] || PROVIDER_STYLES.ollama;

  return (
    <div className="space-y-6">
      {/* ── Provider Selection ── */}
      <Section icon={Cpu} title="AI Provider"
        badge={
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${ps.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${ps.dot}`} />
            {PROVIDER_LABELS[activeProvider] || activeProvider}
          </span>
        }
      >
        <div className="space-y-5">
          {/* Category headers + grid */}
          <div>
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-2">Local</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {PROVIDER_CARDS.filter(c => c.category === 'local').map(card => (
                <ProviderCard key={card.id} card={card} activeProvider={activeProvider}
                  switchingProvider={switchingProvider} onSwitch={handleSwitchProvider} />
              ))}
            </div>
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-2">Cloud</p>
            <div className="grid grid-cols-3 gap-3">
              {PROVIDER_CARDS.filter(c => c.category === 'cloud').map(card => (
                <ProviderCard key={card.id} card={card} activeProvider={activeProvider}
                  switchingProvider={switchingProvider} onSwitch={handleSwitchProvider} />
              ))}
            </div>
          </div>

          {/* ── Ollama Config ── */}
          {activeProvider === 'ollama' && (
            <>
              <div>
                <label className="label">Ollama Server URL</label>
                <div className="flex gap-2">
                  <input type="text" value={ollamaUrl} onChange={e => setOllamaUrl(e.target.value)}
                    className="input flex-1 font-mono text-sm" placeholder="http://localhost:11434" />
                  <button onClick={handleTestOllama} disabled={testingOllama} className="btn-secondary text-sm whitespace-nowrap">
                    {testingOllama ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Test
                  </button>
                </div>
              </div>
              <ModelSelect value={defaultModel} models={availableModels} onChange={handleSetDefaultModel}
                emptyLabel={connected ? 'Loading...' : model || 'No models'} showSize />
              <SliderField label="Temperature" value={temperature} onChange={setTemperature}
                min={0} max={1} step={0.05} unit={` — ${temperatureLabel(temperature)}`}
                markers={['Precise', 'Balanced', 'Creative']} />
            </>
          )}

          {/* ── Groq Config ── */}
          {activeProvider === 'groq' && (
            <>
              <div>
                <label className="label">Groq API Key</label>
                <p className="text-xs text-[#94A3B8] mb-2">Get a free key at console.groq.com</p>
                <div className="flex gap-2">
                  <SecretInput value={groqKey} onChange={setGroqKey} show={showGroqKey}
                    onToggleShow={() => setShowGroqKey(!showGroqKey)}
                    placeholder={settings.groq_api_key_masked || 'gsk_...'} label="Groq API key" />
                  <button onClick={handleTestGroq} disabled={testingGroq} className="btn-secondary text-sm whitespace-nowrap">
                    {testingGroq ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Test
                  </button>
                  <button onClick={handleSaveGroqKey} disabled={!groqKey.trim()} className="btn-primary text-sm whitespace-nowrap">
                    <Save className="w-4 h-4" /> Save
                  </button>
                </div>
              </div>
              <ModelSelect value={defaultModel} models={availableModels} onChange={handleSetDefaultModel}
                emptyLabel="Loading Groq models..." showContext />
              <SliderField label="Temperature" value={groqTemperature} onChange={setGroqTemperature}
                min={0} max={1} step={0.05} unit={` — ${temperatureLabel(groqTemperature)}`}
                markers={['Precise', 'Balanced', 'Creative']} />
            </>
          )}

          {/* ── OpenAI Config ── */}
          {activeProvider === 'openai' && (
            <>
              <div>
                <label className="label">OpenAI API Key</label>
                <p className="text-xs text-[#94A3B8] mb-2">Get your key at platform.openai.com</p>
                <div className="flex gap-2">
                  <SecretInput value={openaiKey} onChange={setOpenaiKey} show={showOpenaiKey}
                    onToggleShow={() => setShowOpenaiKey(!showOpenaiKey)}
                    placeholder={settings.openai_api_key_masked || 'sk-...'} label="OpenAI API key" />
                  <button onClick={handleTestOpenai} disabled={testingOpenai} className="btn-secondary text-sm whitespace-nowrap">
                    {testingOpenai ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Test
                  </button>
                  <button onClick={handleSaveOpenaiKey} disabled={!openaiKey.trim()} className="btn-primary text-sm whitespace-nowrap">
                    <Save className="w-4 h-4" /> Save
                  </button>
                </div>
              </div>
              <ModelSelect value={defaultModel} models={availableModels} onChange={handleSetDefaultModel}
                emptyLabel="gpt-4o-mini" useIdKey />
              <SliderField label="Temperature" value={openaiTemperature} onChange={setOpenaiTemperature}
                min={0} max={1} step={0.05} unit={` — ${temperatureLabel(openaiTemperature)}`}
                markers={['Precise', 'Balanced', 'Creative']} />
            </>
          )}

          {/* ── Anthropic Config ── */}
          {activeProvider === 'anthropic' && (
            <>
              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-[#F1F5F9] mb-1">Anthropic Claude</h4>
                    <p className="text-xs text-[#94A3B8]">
                      Premium AI with 200k context window. Requires API key from console.anthropic.com
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <label className="label">Claude API Key</label>
                <div className="flex gap-2">
                  <SecretInput value={anthropicKey} onChange={setAnthropicKey} show={showAnthropicKey}
                    onToggleShow={() => setShowAnthropicKey(!showAnthropicKey)}
                    placeholder={settings.anthropic_api_key_masked || 'sk-ant-...'} label="Anthropic API key" />
                  <button onClick={handleTestAnthropic} disabled={testingAnthropic} className="btn-secondary text-sm whitespace-nowrap">
                    {testingAnthropic ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Test
                  </button>
                  <button onClick={handleSaveAnthropicKey} disabled={!anthropicKey.trim()} className="btn-primary text-sm whitespace-nowrap">
                    <Save className="w-4 h-4" /> Save
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Default Model</label>
                {availableModels.length > 0 ? (
                  <select value={defaultModel} onChange={e => handleSetDefaultModel(e.target.value)} className="input">
                    {availableModels.map(m => (
                      <option key={m.name} value={m.name}>{m.label || m.name}</option>
                    ))}
                  </select>
                ) : (
                  <select value={defaultModel} onChange={e => handleSetDefaultModel(e.target.value)} className="input">
                    <option value="claude-sonnet-4-6-20250514">Claude Sonnet 4.6 (balanced)</option>
                    <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (fast)</option>
                    <option value="claude-opus-4-6-20250612">Claude Opus 4.6 (powerful)</option>
                    <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (legacy)</option>
                    <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (legacy)</option>
                  </select>
                )}
              </div>
              <SliderField label="Temperature" value={anthropicTemperature} onChange={setAnthropicTemperature}
                min={0} max={1} step={0.05} unit={` — ${temperatureLabel(anthropicTemperature)}`}
                markers={['Precise', 'Balanced', 'Creative']} />
            </>
          )}

          {/* ── OpenClaw Config ── */}
          {activeProvider === 'openclaw' && (
            <>
              <div>
                <label className="label">OpenClaw Gateway URL</label>
                <div className="flex gap-2">
                  <input type="text" value={openclawUrl} onChange={e => setOpenclawUrl(e.target.value)}
                    className="input flex-1 font-mono text-sm" placeholder="http://localhost:18789" />
                  <button onClick={handleTestOpenClaw} disabled={testingOpenClaw} className="btn-secondary text-sm whitespace-nowrap">
                    {testingOpenClaw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Test
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Gateway Token (optional)</label>
                <div className="flex gap-2">
                  <SecretInput value={openclawToken} onChange={setOpenclawToken} show={showOpenclawToken}
                    onToggleShow={() => setShowOpenclawToken(!showOpenclawToken)}
                    placeholder={settings.openclaw_token_masked || 'Enter token if configured'} label="OpenClaw token" />
                  <button onClick={handleSaveOpenclawToken} disabled={!openclawToken.trim()} className="btn-primary text-sm whitespace-nowrap">
                    <Save className="w-4 h-4" /> Save
                  </button>
                </div>
              </div>
              <ModelSelect value={defaultModel} models={availableModels} onChange={handleSetDefaultModel}
                emptyLabel="openclaw:main" label="Default Agent" />
              <SliderField label="Temperature" value={openclawTemperature} onChange={setOpenclawTemperature}
                min={0} max={1} step={0.05} unit={` — ${temperatureLabel(openclawTemperature)}`}
                markers={['Precise', 'Balanced', 'Creative']} />
            </>
          )}
        </div>
      </Section>

      {/* ── Advanced AI Parameters ── */}
      <Section icon={SlidersHorizontal} title="Advanced AI Parameters">
        <div className="space-y-5">
          <SliderField label="Max Tokens" value={maxTokens} onChange={setMaxTokens}
            min={256} max={8192} step={256} unit=" tokens" markers={['256', '2048', '4096', '8192']} />
          <SliderField label="Top P (nucleus sampling)" value={topP} onChange={setTopP}
            min={0} max={1} step={0.05} markers={['Focused', 'Balanced', 'Diverse']} />
          <SettingsRow label="Streaming Responses" description="Stream tokens as they generate — better UX, slight overhead">
            <Toggle enabled={streamingEnabled} onChange={setStreamingEnabled} />
          </SettingsRow>
          <div>
            <label className="label">System Prompt Prefix</label>
            <p className="text-xs text-[#94A3B8] mb-2">Prepended to every AI request. Use to inject business context or persona.</p>
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              rows={4}
              className="input font-mono text-sm resize-none"
              placeholder="You are an expert plumbing estimator for CTL Plumbing LLC in the DFW area..."
            />
            <p className="text-xs text-[#64748B] mt-1">{systemPrompt.length} characters</p>
          </div>
          <div className="flex justify-end pt-2 border-t border-[#1F2430]">
            <button onClick={handleSaveAIConfig} disabled={savingAI} className="btn-primary text-sm">
              {savingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save AI Config
            </button>
          </div>
        </div>
      </Section>

      {/* ── Model Library ── */}
      <Section icon={HardDrive} title="Model Library"
        badge={<span className="text-sm text-[#64748B] font-mono">{availableModels.length} model{availableModels.length !== 1 ? 's' : ''}</span>}
      >
        {activeProvider === 'ollama' && (
          <div className="mb-5 p-4 rounded-xl" style={{ background: '#111318', border: '1px solid #1F2430' }}>
            <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2 block">Pull New Model</label>
            <div className="flex gap-2">
              <input type="text" value={pullModelName} onChange={e => setPullModelName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePullModel()}
                className="input flex-1 font-mono text-sm" placeholder="e.g. llama3.1, qwen2.5-coder:7b" disabled={pullingModel} />
              <button onClick={handlePullModel} disabled={pullingModel || !pullModelName.trim()} className="btn-primary text-sm whitespace-nowrap">
                {pullingModel ? <><Loader2 className="w-4 h-4 animate-spin" />Pulling...</> : <><Download className="w-4 h-4" />Pull</>}
              </button>
            </div>
          </div>
        )}

        {activeProvider === 'groq' && (
          <div className="mb-5 p-4 rounded-xl border border-orange-500/20 bg-orange-500/5">
            <p className="text-sm text-orange-400 flex items-center gap-2"><Zap className="w-4 h-4" />Groq models are cloud-hosted. Select below.</p>
          </div>
        )}

        {activeProvider === 'anthropic' && (
          <div className="mb-5 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
            <p className="text-sm text-amber-400 flex items-center gap-2"><Sparkles className="w-4 h-4" />Claude models are managed by Anthropic. Select your preferred model above.</p>
          </div>
        )}

        {activeProvider === 'openai' && (
          <div className="mb-5 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <p className="text-sm text-emerald-400 flex items-center gap-2"><Globe className="w-4 h-4" />OpenAI models are cloud-hosted. Select below.</p>
          </div>
        )}

        {activeProvider === 'openclaw' && (
          <div className="mb-5 p-4 rounded-xl border border-violet-500/20 bg-violet-500/5">
            <p className="text-sm text-violet-400 flex items-center gap-2"><Shield className="w-4 h-4" />OpenClaw agents are managed via the gateway. Configure URL above.</p>
          </div>
        )}

        {(!connected && activeProvider === 'ollama') ? (
          <div className="text-center py-8 text-[#64748B]">
            <XCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Connect to Ollama to manage models</p>
          </div>
        ) : availableModels.length === 0 ? (
          <div className="text-center py-8 text-[#64748B]">
            <HardDrive className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No models found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {availableModels.map(m => {
              const modelKey = m.name || m.id;
              const isDefault = modelKey === defaultModel || modelKey === config?.defaultModel;
              const isCloud = activeProvider !== 'ollama';
              return (
                <div key={modelKey}
                  className={`relative p-4 rounded-xl border transition-all ${
                    isDefault
                      ? `${ps.active} border-opacity-60`
                      : 'border-[#1F2430]'
                  }`}
                  style={!isDefault ? { background: '#111318' } : undefined}
                >
                  {isDefault && <div className={`absolute left-0 top-0 bottom-0 w-1 ${ps.dot} rounded-l-xl`} />}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-mono text-sm font-bold text-[#F1F5F9] truncate">{m.label || m.name || m.id}</h3>
                        {isDefault && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold rounded-full ${ps.badge}`}>
                            <Star className="w-3 h-3" />Default
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[#64748B]">
                        {isCloud ? (
                          <>{m.context && <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{Math.round(m.context / 1000)}k context</span>}</>
                        ) : (
                          <>
                            {m.size && <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" />{(m.size / (1024 ** 3)).toFixed(2)} GB</span>}
                            {m.modified && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(m.modified).toLocaleDateString()}</span>}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!isDefault && (
                        <button onClick={() => handleSetDefaultModel(modelKey)} className="btn-ghost text-xs px-3 py-1.5 min-h-0">
                          Set Default
                        </button>
                      )}
                      {activeProvider === 'ollama' && (
                        <button onClick={() => setDeleteConfirm(modelKey)}
                          className="btn-ghost text-xs px-2 py-1.5 min-h-0 text-[#64748B] hover:text-red-500">
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

        {deleteConfirm && (
          <ConfirmDialog
            title="Delete AI Model?"
            message={`Are you sure you want to delete the model "${deleteConfirm}"? This will remove the model files from your local Ollama storage.`}
            confirmLabel={deletingModel ? 'Deleting...' : 'Delete Model'}
            onConfirm={() => handleDeleteModel(deleteConfirm)}
            onCancel={() => setDeleteConfirm(null)}
            variant="danger"
          />
        )}
      </Section>
    </div>
  );
}

// ── Provider Card ──
function ProviderCard({ card, activeProvider, switchingProvider, onSwitch }) {
  const { id, icon: Icon, label, desc } = card;
  const style = PROVIDER_STYLES[id] || PROVIDER_STYLES.ollama;
  const isActive = activeProvider === id;

  return (
    <button
      onClick={() => onSwitch(id)}
      disabled={switchingProvider}
      className={`relative p-4 rounded-xl border-2 transition-all text-left ${
        isActive ? style.active : 'border-[#1F2430] hover:border-[#2A3040]'
      }`}
    >
      {isActive && (
        <div className="absolute top-2 right-2">
          <CheckCircle className={`w-5 h-5 ${style.check}`} />
        </div>
      )}
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${style.icon}`} />
        <span className="font-bold text-sm text-[#F1F5F9]">{label}</span>
      </div>
      <p className="text-[10px] text-[#64748B] uppercase font-bold tracking-tight">{desc}</p>
    </button>
  );
}

// ── Model Select ──
function ModelSelect({ value, models, onChange, emptyLabel, showSize, showContext, useIdKey, label = 'Default Model' }) {
  return (
    <div>
      <label className="label">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="input">
        {models.length === 0 && <option>{emptyLabel}</option>}
        {models.map(m => {
          const key = useIdKey ? (m.id || m.name) : m.name;
          const display = m.label || m.name || m.id;
          const meta = showSize && m.size
            ? ` (${(m.size / (1024 ** 3)).toFixed(1)} GB)`
            : showContext && m.context
            ? ` (${Math.round(m.context / 1000)}k ctx)`
            : '';
          return <option key={key} value={key}>{display}{meta}</option>;
        })}
      </select>
    </div>
  );
}

export default memo(SettingsAI);
