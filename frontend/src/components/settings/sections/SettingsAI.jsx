import { memo } from 'react';
import {
  Cpu, CheckCircle, Server, Zap, Cog, SlidersHorizontal,
  HardDrive, Download, Star, XCircle, Clock, Trash2,
  Loader2, Save, Eye, EyeOff
} from 'lucide-react';
import { Section, SliderField, SettingsRow, Toggle } from '../primitives';
import ConfirmDialog from '../../shared/ConfirmDialog';

// Static provider style maps — dynamic template literals break Tailwind purge
const PROVIDER_CARDS = [
  { id: 'ollama',   icon: Server, label: 'Ollama',   desc: 'Local private' },
  { id: 'groq',     icon: Zap,    label: 'Groq',     desc: 'Ultra-fast' },
  { id: 'openai',   icon: Cpu,    label: 'OpenAI',   desc: 'GPT-4o standard' },
  { id: 'openclaw', icon: Cog,    label: 'OpenClaw', desc: 'Premium local' },
];

const PROVIDER_STYLES = {
  ollama:   { active: 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20',       check: 'text-blue-500',    icon: 'text-blue-600 dark:text-blue-400',       dot: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  groq:     { active: 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20',  check: 'text-orange-500',  icon: 'text-orange-600 dark:text-orange-400',   dot: 'bg-orange-500',  badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  openai:   { active: 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20', check: 'text-emerald-500', icon: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  openclaw: { active: 'border-red-500 bg-red-50/50 dark:bg-red-950/20',           check: 'text-red-500',     icon: 'text-red-600 dark:text-red-400',         dot: 'bg-red-500',     badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  anthropic:{ active: 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20',     check: 'text-amber-500',   icon: 'text-amber-600 dark:text-amber-400',     dot: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
};

const PROVIDER_LABELS = {
  openclaw: 'OpenClaw', groq: 'Groq Cloud', anthropic: 'Anthropic',
  openai: 'OpenAI', ollama: 'Ollama Local',
};

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
      {/* Provider */}
      <Section icon={Cpu} title="AI Provider"
        badge={
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${ps.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${ps.dot}`} />
            {PROVIDER_LABELS[activeProvider] || activeProvider}
          </span>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PROVIDER_CARDS.map(({ id, icon: Icon, label, desc }) => {
              const style = PROVIDER_STYLES[id] || PROVIDER_STYLES.ollama;
              const isActive = activeProvider === id;
              return (
                <button key={id} onClick={() => handleSwitchProvider(id)} disabled={switchingProvider}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                    isActive
                      ? style.active
                      : 'border-[#1F2430] hover:border-[#2A3040]'
                  }`}
                >
                  {isActive && <div className="absolute top-2 right-2"><CheckCircle className={`w-5 h-5 ${style.check}`} /></div>}
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${style.icon}`} />
                    <span className="font-bold text-sm text-[#F1F5F9]">{label}</span>
                  </div>
                  <p className="text-[10px] text-[#64748B] uppercase font-bold tracking-tight">{desc}</p>
                </button>
              );
            })}
          </div>

          {/* Ollama */}
          {activeProvider === 'ollama' && (
            <>
              <div>
                <label className="label">Ollama Server URL</label>
                <div className="flex gap-2">
                  <input type="text" value={ollamaUrl} onChange={e => setOllamaUrl(e.target.value)} className="input flex-1 font-mono text-sm" placeholder="http://localhost:11434" />
                  <button onClick={handleTestOllama} disabled={testingOllama} className="btn-secondary text-sm whitespace-nowrap">
                    {testingOllama ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Test
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Default Model</label>
                <select value={defaultModel} onChange={e => handleSetDefaultModel(e.target.value)} className="input">
                  {availableModels.length === 0 && <option>{connected ? 'Loading...' : model || 'No models'}</option>}
                  {availableModels.map(m => <option key={m.name} value={m.name}>{m.name} {m.size ? `(${(m.size/(1024**3)).toFixed(1)} GB)` : ''}</option>)}
                </select>
              </div>
              <SliderField label="Temperature" value={temperature} onChange={setTemperature} min={0} max={1} step={0.05} unit={` — ${temperatureLabel(temperature)}`} markers={['Precise','Balanced','Creative']} />
            </>
          )}

          {/* Groq */}
          {activeProvider === 'groq' && (
            <>
              <div>
                <label className="label">Groq API Key</label>
                <p className="text-xs text-[#94A3B8] mb-2">Get a free key at console.groq.com</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input type={showGroqKey ? 'text' : 'password'} value={groqKey} onChange={e => setGroqKey(e.target.value)} className="input pr-10 font-mono text-sm" placeholder={settings.groq_api_key_masked || 'gsk_...'} />
                    <button
                      type="button"
                      onClick={() => setShowGroqKey(!showGroqKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#94A3B8]"
                      aria-label={showGroqKey ? 'Hide API key' : 'Show API key'}
                    >
                      {showGroqKey ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                    </button>
                  </div>
                  <button onClick={handleTestGroq} disabled={testingGroq} className="btn-secondary text-sm whitespace-nowrap">
                    {testingGroq ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Test
                  </button>
                  <button onClick={handleSaveGroqKey} disabled={!groqKey.trim()} className="btn-primary text-sm whitespace-nowrap">
                    <Save className="w-4 h-4" /> Save
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Default Model</label>
                <select value={defaultModel} onChange={e => handleSetDefaultModel(e.target.value)} className="input">
                  {availableModels.length === 0 && <option>Loading Groq models...</option>}
                  {availableModels.map(m => <option key={m.name} value={m.name}>{m.label || m.name} {m.context ? `(${Math.round(m.context/1000)}k ctx)` : ''}</option>)}
                </select>
              </div>
              <SliderField label="Temperature" value={groqTemperature} onChange={setGroqTemperature} min={0} max={1} step={0.05} unit={` — ${temperatureLabel(groqTemperature)}`} markers={['Precise','Balanced','Creative']} />
            </>
          )}

          {/* OpenAI */}
          {activeProvider === 'openai' && (
            <>
              <div>
                <label className="label">OpenAI API Key</label>
                <p className="text-xs text-[#94A3B8] mb-2">Get your key at platform.openai.com</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input type={showOpenaiKey ? 'text' : 'password'} value={openaiKey} onChange={e => setOpenaiKey(e.target.value)} className="input pr-10 font-mono text-sm" placeholder={settings.openai_api_key_masked || 'sk-...'} />
                    <button
                      type="button"
                      onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#94A3B8]"
                    >
                      {showOpenaiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button onClick={handleTestOpenai} disabled={testingOpenai} className="btn-secondary text-sm whitespace-nowrap">
                    {testingOpenai ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Test
                  </button>
                  <button onClick={handleSaveOpenaiKey} disabled={!openaiKey.trim()} className="btn-primary text-sm whitespace-nowrap">
                    <Save className="w-4 h-4" /> Save
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Default Model</label>
                <select value={defaultModel} onChange={e => handleSetDefaultModel(e.target.value)} className="input">
                  {availableModels.length === 0 && <option>gpt-4o-mini</option>}
                  {availableModels.map(m => <option key={m.id} value={m.id}>{m.name || m.id}</option>)}
                </select>
              </div>
              <SliderField label="Temperature" value={openaiTemperature} onChange={setOpenaiTemperature} min={0} max={1} step={0.05} unit={` — ${temperatureLabel(openaiTemperature)}`} markers={['Precise','Balanced','Creative']} />
            </>
          )}

          {/* OpenClaw */}
          {activeProvider === 'openclaw' && (
            <>
              <div>
                <label className="label">OpenClaw Gateway URL</label>
                <div className="flex gap-2">
                  <input type="text" value={openclawUrl} onChange={e => setOpenclawUrl(e.target.value)} className="input flex-1 font-mono text-sm" placeholder="http://localhost:18789" />
                  <button onClick={handleTestOpenClaw} disabled={testingOpenClaw} className="btn-secondary text-sm whitespace-nowrap">
                    {testingOpenClaw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Test
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Gateway Token (optional)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input type={showOpenclawToken ? 'text' : 'password'} value={openclawToken} onChange={e => setOpenclawToken(e.target.value)} className="input pr-10 font-mono text-sm" placeholder={settings.openclaw_token_masked || 'Enter token if configured'} />
                    <button
                      type="button"
                      onClick={() => setShowOpenclawToken(!showOpenclawToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#94A3B8]"
                      aria-label={showOpenclawToken ? 'Hide token' : 'Show token'}
                    >
                      {showOpenclawToken ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                    </button>
                  </div>
                  <button onClick={handleSaveOpenclawToken} disabled={!openclawToken.trim()} className="btn-primary text-sm whitespace-nowrap"><Save className="w-4 h-4" /> Save</button>
                </div>
              </div>
              <div>
                <label className="label">Default Agent</label>
                <select value={defaultModel} onChange={e => handleSetDefaultModel(e.target.value)} className="input">
                  {availableModels.length === 0 && <option>openclaw:main</option>}
                  {availableModels.map(m => <option key={m.name} value={m.name}>{m.label || m.name}</option>)}
                </select>
              </div>
              <SliderField label="Temperature" value={openclawTemperature} onChange={setOpenclawTemperature} min={0} max={1} step={0.05} unit={` — ${temperatureLabel(openclawTemperature)}`} markers={['Precise','Balanced','Creative']} />
            </>
          )}
        </div>
      </Section>

      {/* Advanced AI */}
      <Section icon={SlidersHorizontal} title="Advanced AI Parameters">
        <div className="space-y-5">
          <SliderField label="Max Tokens" value={maxTokens} onChange={setMaxTokens} min={256} max={8192} step={256} unit=" tokens" markers={['256','2048','4096','8192']} />
          <SliderField label="Top P (nucleus sampling)" value={topP} onChange={setTopP} min={0} max={1} step={0.05} markers={['Focused','Balanced','Diverse']} />
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

      {/* Model Library */}
      <Section icon={HardDrive} title="Model Library"
        badge={<span className="text-sm text-[#64748B] font-mono">{availableModels.length} model{availableModels.length !== 1 ? 's' : ''}</span>}
      >
        {activeProvider === 'ollama' && (
          <div className="mb-5 p-4 rounded-xl" style={{ background: '#111318', border: '1px solid #1F2430' }}>
            <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2 block">Pull New Model</label>
            <div className="flex gap-2">
              <input type="text" value={pullModelName} onChange={e => setPullModelName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePullModel()} className="input flex-1 font-mono text-sm" placeholder="e.g. llama3.1, qwen2.5-coder:7b" disabled={pullingModel} />
              <button onClick={handlePullModel} disabled={pullingModel || !pullModelName.trim()} className="btn-primary text-sm whitespace-nowrap">
                {pullingModel ? <><Loader2 className="w-4 h-4 animate-spin" />Pulling...</> : <><Download className="w-4 h-4" />Pull</>}
              </button>
            </div>
          </div>
        )}
        {activeProvider === 'groq' && (
          <div className="mb-5 p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
            <p className="text-sm text-orange-400 flex items-center gap-2"><Zap className="w-4 h-4" />Groq models are cloud-hosted. Select below.</p>
          </div>
        )}
        {(!connected && activeProvider === 'ollama') ? (
          <div className="text-center py-8 text-[#64748B]"><XCircle className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-sm">Connect to Ollama to manage models</p></div>
        ) : availableModels.length === 0 ? (
          <div className="text-center py-8 text-[#64748B]"><HardDrive className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-sm">No models found</p></div>
        ) : (
          <div className="space-y-3">
            {availableModels.map(m => {
              const isDefault = m.name === defaultModel || m.name === config?.defaultModel;
              const isCloud = activeProvider === 'groq' || activeProvider === 'openclaw';
              return (
                <div key={m.name} className={`relative p-4 rounded-xl border transition-all ${isDefault ? 'bg-accent-50/50 border-accent-200 dark:bg-accent-950/20 dark:border-accent-800/50' : 'border-[#1F2430]'}`} style={!isDefault ? { background: '#111318' } : undefined}>
                  {isDefault && <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-500 rounded-l-xl" />}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-mono text-sm font-bold text-[#F1F5F9] truncate">{m.label || m.name}</h3>
                        {isDefault && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300 text-xs font-bold rounded-full"><Star className="w-3 h-3" />Default</span>}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[#64748B]">
                        {isCloud ? (
                          <>{m.context && <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{Math.round(m.context/1000)}k context</span>}</>
                        ) : (
                          <><span className="flex items-center gap-1"><HardDrive className="w-3 h-3" />{(m.size/(1024**3)).toFixed(2)} GB</span>
                          {m.modified && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(m.modified).toLocaleDateString()}</span>}</>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!isDefault && <button onClick={() => handleSetDefaultModel(m.name)} className="btn-ghost text-xs px-3 py-1.5 min-h-0">Set Default</button>}
                      {!isCloud && (
                        <button onClick={() => setDeleteConfirm(m.name)} className="btn-ghost text-xs px-2 py-1.5 min-h-0 text-[#64748B] hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation */}
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

export default memo(SettingsAI);
