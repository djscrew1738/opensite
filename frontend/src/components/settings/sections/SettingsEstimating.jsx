import { memo } from 'react';
import { DollarSign, FileText, Loader2, Save } from 'lucide-react';
import { Section, SliderField, SettingsRow, Toggle } from '../primitives';

function SettingsEstimating({
  laborRate,
  setLaborRate,
  materialMarkup,
  setMaterialMarkup,
  overheadFactor,
  setOverheadFactor,
  taxRate,
  setTaxRate,
  paymentTerms,
  setPaymentTerms,
  depositPct,
  setDepositPct,
  expiryDays,
  setExpiryDays,
  includeTax,
  setIncludeTax,
  autoMarkup,
  setAutoMarkup,
  savingEstimating,
  handleSaveEstimating,
}) {
  return (
    <div className="space-y-6">
      <Section icon={DollarSign} title="Pricing Defaults">
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Labor Rate</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-mono">$</span>
                <input type="number" value={laborRate} onChange={e => setLaborRate(Number(e.target.value))} className="input pl-7 font-mono text-sm" min="0" step="5" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">/hr</span>
              </div>
            </div>
            <div>
              <label className="label">Material Markup</label>
              <div className="relative">
                <input type="number" value={materialMarkup} onChange={e => setMaterialMarkup(Number(e.target.value))} className="input pr-7 font-mono text-sm" min="0" max="200" step="1" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
              </div>
            </div>
            <div>
              <label className="label">Overhead</label>
              <div className="relative">
                <input type="number" value={overheadFactor} onChange={e => setOverheadFactor(Number(e.target.value))} className="input pr-7 font-mono text-sm" min="0" max="100" step="1" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
              </div>
            </div>
            <div>
              <label className="label">Tax Rate</label>
              <div className="relative">
                <input type="number" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} className="input pr-7 font-mono text-sm" min="0" max="20" step="0.25" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Effective Rate Preview</p>
            <div className="flex gap-6 text-sm">
              <div><span className="text-gray-500">Labor:</span> <span className="font-mono font-bold">${laborRate}/hr</span></div>
              <div><span className="text-gray-500">Materials at cost + markup:</span> <span className="font-mono font-bold">{materialMarkup}%</span></div>
              <div><span className="text-gray-500">With overhead:</span> <span className="font-mono font-bold">{(laborRate * (1 + overheadFactor/100)).toFixed(0)}/hr eff.</span></div>
            </div>
          </div>
        </div>
      </Section>

      <Section icon={FileText} title="Quote Settings">
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Payment Terms</label>
              <select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className="input">
                {['Due on Receipt','Net 15','Net 30','Net 45','Net 60','2/10 Net 30'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Required Deposit</label>
              <div className="relative">
                <input type="number" value={depositPct} onChange={e => setDepositPct(Number(e.target.value))} className="input pr-7 font-mono text-sm" min="0" max="100" step="5" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
              </div>
            </div>
            <div>
              <label className="label">Quote Valid For</label>
              <div className="relative">
                <input type="number" value={expiryDays} onChange={e => setExpiryDays(Number(e.target.value))} className="input pr-12 font-mono text-sm" min="1" max="180" step="1" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">days</span>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            <SettingsRow label="Include Tax in Estimates" description="Automatically add tax line to all estimates">
              <Toggle enabled={includeTax} onChange={setIncludeTax} />
            </SettingsRow>
            <SettingsRow label="Auto-Apply Markup" description="Automatically apply material markup when adding line items">
              <Toggle enabled={autoMarkup} onChange={setAutoMarkup} />
            </SettingsRow>
          </div>
        </div>
      </Section>
      <div className="flex justify-end">
        <button onClick={handleSaveEstimating} disabled={savingEstimating} className="btn-primary text-sm">
          {savingEstimating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Estimating Config
        </button>
      </div>
    </div>
  );
}

export default memo(SettingsEstimating);
