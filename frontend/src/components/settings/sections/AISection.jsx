/**
 * AI Section
 * AI provider configuration and model management
 */

import { 
  Cpu, CheckCircle, Server, Zap, Cog, SlidersHorizontal, 
  HardDrive, Download, Star, XCircle, Clock, Trash2, 
  Loader2, Save, Eye, EyeOff
} from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { useSettingsActions } from '../hooks/useSettingsActions';
import { Section, SliderField, SettingsRow, Toggle } from '../primitives';

export default function AISection() {
  const ctx = useSettings();
  const actions = useSettingsActions();
  
  const {
    activeProvider, settings, availableModels, connected, 
    defaultModel, config, switchingProvider, testingOllama,
    testingGroq, testingOpenClaw, savingAI, maxTokens, topP,
    streamingEnabled, systemPrompt, pullModelName, pullingModel,
    deleteConfirm, deletingModel, showGroqKey, showOpenclawToken,
    temperature, groqKey, groqTemperature, ollamaUrl, openclawUrl,
    openclawToken, openclawTemperature
  } = ctx;
  
  const {
    handleSwitchProvider, handleSaveAIConfig, handleTestOllama,
    handleTestGroq, handleSaveGroqKey, handleTestOpenClaw,
    handleSaveOpenclawToken, handleSetDefaultModel, handlePullModel,
    handleDeleteModel, temperatureLabel
  } = actions;

  const providerBadge = (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
      activeProvider === 'openclaw' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
      : activeProvider === 'groq' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
      : activeProvider === 'anthropic' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
        activeProvider === 'openclaw' ? 'bg-red-500' 
        : activeProvider === 'groq' ? 'bg-orange-500' 
        : activeProvider === 'anthropic' ? 'bg-amber-500' 
        : 'bg-blue-500'
      }`} />
      {{ openclaw: 'OpenClaw', groq: 'Groq Cloud', anthropic: 'Anthropic', ollama: 'Ollama Local' }[activeProvider] || activeProvider}
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <Section icon={Cpu} title="AI Provider" badge={providerBadge}>
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'ollama', icon: Server, label: 'Ollama', desc: 'Local, private, no limits', accent: 'blue' },
              { id: 'groq', icon: Zap, label: 'Groq', desc: 'Ultra-fast cloud inference', accent: 'orange' },
              { id: 'openclaw', icon: Cog, label: 'OpenClaw', desc: 'Local AI gateway — 200k ctx, no API cost', accent: 'red' },
            ].map(({ id, icon: Icon, label, desc, accent }) => {
              const isActive = activeProvider === id;
              return (
                <button 
                  key={id} 
                  onClick={() => handleSwitchProvider(id)} 
                  disabled={switchingProvider}
                  className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                    isActive
                      ? `border-${accent}-500 bg-${accent}-50/50 dark:bg-${accent}-950/20`
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {isActive && <div className="absolute top-2 right-2"><CheckCircle className={`w-5 h-5 text-${accent}-500`} /></div>}
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 text-${accent}-600 dark:text-${accent}-400`} />
                    <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{label}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                </button>
              );
            })}
          </div>

          {/* Provider-specific settings */}
          {activeProvider === 'ollama' && (
            <>
              <div>
                <label className="label">Ollama Server URL</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={ollamaUrl} 
                    onChange={e => ctx.setOllamaUrl(e.target.value)} 
                    className="input flex-1 font-mono text-sm" 
                    placeholder="http://localhost:11434" 
                  />
                  <button onClick={handleTestOllama} disabled={testingOllama} className="btn-secondary text-sm whitespace-nowrap">
                    {testingOllama ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Test
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Default Model</label>
                <select 
                  value={defaultModel} 
                  onChange={e => handleSetDefaultModel(e.target.value)} 
                  className="input"
                >
                  {availableModels.length === 0 && <option>{connected ? 'Loading...' : 'No models'}</option>}
                  {availableModels.map(m => (
                    <option key={m.name} value={m.name}>
                      {m.name} {m.size ? `(${(m.size/(1024**3)).toFixed(1)} GB)` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <SliderField 
                label="Temperature" 
                value={temperature} 
                onChange={ctx.setTemperature} 
                min={0} max={1} step={0.05} 
                unit={` — ${temperatureLabel(temperature)}`} 
                markers={['Precise','Balanced','Creative']} 
              />
            </>
          )}

          {activeProvider === 'groq' && (
            <>
              <div>
                <label className="label">Groq API Key</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Get a free key at console.groq.com</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type={showGroqKey ? 'text' : 'password'} 
                      value={groqKey} 
                      onChange={e => ctx.setGroqKey(e.target.value)} 
                      className="input pr-10 font-mono text-sm" 
                      placeholder={settings.groq_api_key_masked || 'gsk_...'} 
                    />
                    <button 
                      type="button" 
                      onClick={() => ctx.setShowGroqKey(!showGroqKey)} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showGroqKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                  {availableModels.map(m => (
                    <option key={m.name} value={m.name}>
                      {m.label || m.name} {m.context ? `(${Math.round(m.context/1000)}k ctx)` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <SliderField 
                label="Temperature" 
                value={groqTemperature} 
                onChange={ctx.setGroqTemperature} 
                min={0} max={1} step={0.05} 
                unit={` — ${temperatureLabel(groqTemperature)}`} 
                markers={['Precise','Balanced','Creative']} 
              />
            </>
          )}

          {activeProvider === 'openclaw' && (
            <>
              <div>
                <label className="label">OpenClaw Gateway URL</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={openclawUrl} 
                    onChange={e => ctx.setOpenclawUrl(e.target.value)} 
                    className="input flex-1 font-mono text-sm" 
                    placeholder="http://localhost:18789" 
                  />
                  <button onClick={handleTestOpenClaw} disabled={testingOpenClaw} className="btn-secondary text-sm whitespace-nowrap">
                    {testingOpenClaw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Test
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Gateway Token (optional)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type={showOpenclawToken ? 'text' : 'password'} 
                      value={openclawToken} 
                      onChange={e => ctx.setOpenclawToken(e.target.value)} 
                      className="input pr-10 font-mono text-sm" 
                      placeholder={settings.openclaw_token_masked || 'Enter token if configured'} 
                    />
                    <button 
                      type="button" 
                      onClick={() => ctx.setShowOpenclawToken(!showOpenclawToken)} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showOpenclawToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button onClick={handleSaveOpenclawToken} disabled={!openclawToken.trim()} className="btn-primary text-sm whitespace-nowrap">
                    <Save className="w-4 h-4" /> Save
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Default Agent</label>
                <select value={defaultModel} onChange={e => handleSetDefaultModel(e.target.value)} className="input">
                  {availableModels.length === 0 && <option>openclaw:main</option>}
                  {availableModels.map(m => <option key={m.name} value={m.name}>{m.label || m.name}</option>)}
                </select>
              </div>
              <SliderField 
                label="Temperature" 
                value={openclawTemperature} 
                onChange={ctx.setOpenclawTemperature} 
                min={0} max={1} step={0.05} 
                unit={` — ${temperatureLabel(openclawTemperature)}`} 
                markers={['Precise','Balanced','Creative']} 
              />
            </>
          )}
        </div>
      </Section>

      {/* Advanced AI */}
      <Section icon={SlidersHorizontal} title="Advanced AI Parameters">
        <div className="space-y-5">
          <SliderField label="Max Tokens" value={maxTokens} onChange={ctx.setMaxTokens} min={256} max={8192} step={256} unit=" tokens" markers={['256','2048','4096','8192']} />
          <SliderField label="Top P (nucleus sampling)" value={topP} onChange={ctx.setTopP} min={0} max={1} step={0.05} markers={['Focused','Balanced','Diverse']} />
          <SettingsRow label="Streaming Responses" description="Stream tokens as they generate — better UX, slight overhead">
            <Toggle enabled={streamingEnabled} onChange={ctx.setStreamingEnabled} />
          </SettingsRow>
          <div>
            <label className="label">System Prompt Prefix</label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Prepended to every AI request. Use to inject business context or persona.</p>
            <textarea
              value={systemPrompt}
              onChange={e => ctx.setSystemPrompt(e.target.value)}
              rows={4}
              className="input font-mono text-sm resize-none"
              placeholder="You are an expert plumbing estimator for CTL Plumbing LLC in the DFW area..."
            />
            <p className="text-xs text-gray-400 mt-1">{systemPrompt.length} characters</p>
          </div>
          <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
            <button onClick={handleSaveAIConfig} disabled={savingAI} className="btn-primary text-sm">
              {savingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save AI Config
            </button>
          </div>
        </div>
      </Section>

      {/* Model Library */}
      <Section 
        icon={HardDrive} 
        title="Model Library"
        badge={<span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{availableModels.length} model{availableModels.length !== 1 ? 's' : ''}</span>}
      >
        {activeProvider === 'ollama' && (
          <div className="mb-5 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Pull New Model</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={pullModelName} 
                onChange={e => ctx.setPullModelName(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handlePullModel()} 
                className="input flex-1 font-mono text-sm" 
                placeholder="e.g. llama3.1, qwen2.5-coder:7b" 
                disabled={pullingModel} 
              />
              <button onClick={handlePullModel} disabled={pullingModel || !pullModelName.trim()} className="btn-primary text-sm whitespace-nowrap">
                {pullingModel ? <><Loader2 className="w-4 h-4 animate-spin" />Pulling...</> : <><Download className="w-4 h-4" />Pull</>}
              </button>
            </div>
          </div>
        )}
        
        {activeProvider === 'groq' && (
          <div className="mb-5 p-4 bg-orange-50/50 dark:bg-orange-950/10 rounded-xl border border-orange-200/60 dark:border-orange-800/40">
            <p className="text-sm text-orange-700 dark:text-orange-300 flex items-center gap-2">
              <Zap className="w-4 h-4" />Groq models are cloud-hosted. Select below.
            </p>
          </div>
        )}
        
        {(!connected && activeProvider === 'ollama') ? (
          <div className="text-center py-8 text-gray-500">
            <XCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Connect to Ollama to manage models</p>
          </div>
        ) : availableModels.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <HardDrive className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No models found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {availableModels.map(m => {
              const isDefault = m.name === defaultModel || m.name === config.defaultModel;
              const isGroq = activeProvider === 'groq';
              const isOC = activeProvider === 'openclaw';
              return (
                <div 
                  key={m.name} 
                  className={`relative p-4 rounded-xl border transition-all ${
                    isDefault 
                      ? 'bg-accent-50/50 border-accent-200 dark:bg-accent-950/20 dark:border-accent-800/50' 
                      : 'bg-gray-50 border-gray-200/60 dark:bg-gray-800/40 dark:border-gray-700/60'
                  }`}
                >
                  {isDefault && <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-500 rounded-l-xl" />}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{m.label || m.name}</h3>
                        {isDefault && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300 text-xs font-bold rounded-full">
                            <Star className="w-3 h-3" />Default
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        {isGroq || isOC ? (
                          <>{m.context && <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{Math.round(m.context/1000)}k context</span>}</>
                        ) : (
                          <>
                            <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" />{(m.size/(1024**3)).toFixed(2)} GB</span>
                            {m.modified && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(m.modified).toLocaleDateString()}</span>}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!isDefault && (
                        <button onClick={() => handleSetDefaultModel(m.name)} className="btn-ghost text-xs px-3 py-1.5 min-h-0">
                          Set Default
                        </button>
                      )}
                      {!isGroq && !isOC && (
                        deleteConfirm === m.name ? (
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => handleDeleteModel(m.name)} 
                              disabled={deletingModel === m.name} 
                              className="btn-danger text-xs px-3 py-1.5 min-h-0"
                            >
                              {deletingModel === m.name ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
                            </button>
                            <button onClick={() => ctx.setDeleteConfirm(null)} className="btn-ghost text-xs px-2 py-1.5 min-h-0">Cancel</button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => ctx.setDeleteConfirm(m.name)} 
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
    </div>
  );
}
