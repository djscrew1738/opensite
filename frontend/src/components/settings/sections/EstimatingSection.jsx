/**
 * Estimating Section
 * Financial defaults and markup logic
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator, DollarSign, Percent, TrendingUp,
  Clock, ShieldCheck, FileCheck, Save, Loader2,
  BadgeDollarSign
} from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { useSettingsActions } from '../hooks/useSettingsActions';
import { Section, SliderField, SettingsRow, Toggle } from '../primitives';

export default memo(function EstimatingSection() {
  const ctx = useSettings();
  const { handleSaveEstimating } = useSettingsActions();

  return (
    <div className="space-y-6 page-transition-wrapper">
      <Section 
        icon={Calculator} 
        title="Estimating Defaults"
        description="Standard rates and financial parameters for project pricing"
      >
        <div className="space-y-6 mt-4">
          <div className="grid md:grid-cols-2 gap-6 p-5 rounded-2xl bg-surface-elevated border border-border-default">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-text-muted flex items-center gap-2">
                <Clock className="w-3 h-3" /> Standard Labor Rate
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-bold">$</span>
                <input 
                  type="number" 
                  value={ctx.laborRate} 
                  onChange={e => ctx.setLaborRate(parseFloat(e.target.value))} 
                  className="input pl-8 h-11 font-mono font-bold" 
                  placeholder="85.00" 
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted uppercase">/ hour</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-text-muted flex items-center gap-2">
                <Percent className="w-3 h-3" /> Default Material Markup
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  value={ctx.materialMarkup} 
                  onChange={e => ctx.setMaterialMarkup(parseFloat(e.target.value))} 
                  className="input pr-8 h-11 font-mono font-bold" 
                  placeholder="30" 
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted font-bold">%</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-text-muted flex items-center gap-2">
                <TrendingUp className="w-3 h-3" /> Overhead Factor
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  value={ctx.overheadFactor} 
                  onChange={e => ctx.setOverheadFactor(parseFloat(e.target.value))} 
                  className="input pr-8 h-11 font-mono font-bold" 
                  placeholder="15" 
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted font-bold">%</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-text-muted flex items-center gap-2">
                <DollarSign className="w-3 h-3" /> Tax Rate
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  value={ctx.taxRate} 
                  onChange={e => ctx.setTaxRate(parseFloat(e.target.value))} 
                  className="input pr-8 h-11 font-mono font-bold" 
                  placeholder="8.25" 
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted font-bold">%</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-5 rounded-2xl bg-surface-elevated border border-border-default">
            <SettingsRow 
              label="Automatic Pricing Markup" 
              description="Apply material markup automatically to detected items"
              icon={BadgeDollarSign}
            >
              <Toggle enabled={ctx.autoMarkup} onChange={ctx.setAutoMarkup} />
            </SettingsRow>

            <SettingsRow 
              label="Include Tax by Default" 
              description="Calculate and display tax on all new estimates"
              icon={ShieldCheck}
            >
              <Toggle enabled={ctx.includeTax} onChange={ctx.setIncludeTax} />
            </SettingsRow>
          </div>

          <div className="grid md:grid-cols-3 gap-6 p-5 rounded-2xl bg-surface-elevated border border-border-default">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Payment Terms</label>
              <select 
                value={ctx.paymentTerms} 
                onChange={e => ctx.setPaymentTerms(e.target.value)} 
                className="input h-11 font-bold text-sm"
              >
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 60">Net 60</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Required Deposit</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={ctx.depositPct} 
                  onChange={e => ctx.setDepositPct(parseFloat(e.target.value))} 
                  className="input pr-8 h-11 font-mono font-bold" 
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted font-bold">%</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Expiry Period</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={ctx.expiryDays} 
                  onChange={e => ctx.setExpiryDays(parseInt(e.target.value))} 
                  className="input pr-12 h-11 font-mono font-bold" 
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted uppercase">days</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border-default">
            <motion.button
              onClick={handleSaveEstimating}
              disabled={ctx.savingEstimating}
              whileTap={!ctx.savingEstimating ? { scale: 0.95 } : undefined}
              transition={{ type: 'spring', stiffness: 700, damping: 35 }}
              className="btn-primary h-11 px-8 text-xs font-semibold uppercase tracking-[0.2em] shadow-lg shadow-accent-blue/20"
            >
              {ctx.savingEstimating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Estimating Defaults
            </motion.button>
          </div>
        </div>
      </Section>
    </div>
  );
});
