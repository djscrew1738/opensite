/**
 * Estimating Section
 * Pricing and estimation defaults
 */

import { Calculator, DollarSign, Percent, CalendarDays, Loader2, Save } from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { useSettingsActions } from '../hooks/useSettingsActions';
import { Section, SliderField, SettingsRow, Toggle } from '../primitives';

export default function EstimatingSection() {
  const ctx = useSettings();
  const { handleSaveEstimating } = useSettingsActions();
  
  const {
    laborRate, setLaborRate, materialMarkup, setMaterialMarkup,
    overheadFactor, setOverheadFactor, taxRate, setTaxRate,
    paymentTerms, setPaymentTerms, depositPct, setDepositPct,
    expiryDays, setExpiryDays, includeTax, setIncludeTax,
    autoMarkup, setAutoMarkup, savingEstimating
  } = ctx;

  return (
    <Section icon={Calculator} title="Estimating Defaults">
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SliderField 
            label="Labor Rate" 
            value={laborRate} 
            onChange={setLaborRate} 
            min={50} max={150} step={5} 
            unit=" $/hr" 
          />
          <SliderField 
            label="Material Markup" 
            value={materialMarkup} 
            onChange={setMaterialMarkup} 
            min={0} max={100} step={5} 
            unit="%" 
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SliderField 
            label="Overhead Factor" 
            value={overheadFactor} 
            onChange={setOverheadFactor} 
            min={0} max={50} step={1} 
            unit="%" 
          />
          <SliderField 
            label="Tax Rate" 
            value={taxRate} 
            onChange={setTaxRate} 
            min={0} max={15} step={0.25} 
            unit="%" 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div>
            <label className="label flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-gray-400" /> Payment Terms
            </label>
            <select value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className="input">
              <option>Net 15</option>
              <option>Net 30</option>
              <option>Net 45</option>
              <option>Due on Receipt</option>
            </select>
          </div>
          <div>
            <label className="label flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-400" /> Deposit %
            </label>
            <input 
              type="number" 
              value={depositPct} 
              onChange={e => setDepositPct(Number(e.target.value))} 
              className="input" 
              min="0" max="100"
            />
          </div>
          <div>
            <label className="label flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-gray-400" /> Quote Expiry (days)
            </label>
            <input 
              type="number" 
              value={expiryDays} 
              onChange={e => setExpiryDays(Number(e.target.value))} 
              className="input" 
              min="1" max="90"
            />
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <SettingsRow label="Include Tax in Quotes" description="Automatically add tax to estimate totals">
            <Toggle enabled={includeTax} onChange={setIncludeTax} />
          </SettingsRow>
          <SettingsRow label="Auto-apply Markup" description="Automatically apply material markup to estimates">
            <Toggle enabled={autoMarkup} onChange={setAutoMarkup} />
          </SettingsRow>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
          <button onClick={handleSaveEstimating} disabled={savingEstimating} className="btn-primary text-sm">
            {savingEstimating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Estimating Defaults
          </button>
        </div>
      </div>
    </Section>
  );
}
