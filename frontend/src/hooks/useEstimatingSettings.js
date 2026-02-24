import { useState, useEffect } from 'react';
import { api } from '../api/client';

export function useEstimatingSettings({ settingsData, refetchSettings, showToast }) {
  const [laborRate, setLaborRate] = useState(85);
  const [materialMarkup, setMaterialMarkup] = useState(30);
  const [overheadFactor, setOverheadFactor] = useState(15);
  const [taxRate, setTaxRate] = useState(8.25);
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [depositPct, setDepositPct] = useState(25);
  const [expiryDays, setExpiryDays] = useState(30);
  const [includeTax, setIncludeTax] = useState(true);
  const [autoMarkup, setAutoMarkup] = useState(true);
  const [savingEstimating, setSavingEstimating] = useState(false);

  useEffect(() => {
    if (!settingsData) return;
    const s = settingsData;
    const bool = (v, fallback = false) => v === undefined ? fallback : String(v) === 'true';
    const num = (v, fallback) => v !== undefined ? parseFloat(v) || fallback : fallback;

    setLaborRate(num(s.estimate_labor_rate, 85));
    setMaterialMarkup(num(s.estimate_markup, 30));
    setOverheadFactor(num(s.estimate_overhead, 15));
    setTaxRate(num(s.estimate_tax_rate, 8.25));
    setPaymentTerms(s.estimate_terms || 'Net 30');
    setDepositPct(num(s.estimate_deposit_pct, 25));
    setExpiryDays(num(s.estimate_expiry_days, 30));
    setIncludeTax(bool(s.estimate_include_tax, true));
    setAutoMarkup(bool(s.estimate_auto_markup, true));
  }, [settingsData]);

  const handleSaveEstimating = async () => {
    setSavingEstimating(true);
    try {
      await api.settings.update({
        estimate_labor_rate: String(laborRate),
        estimate_markup: String(materialMarkup),
        estimate_overhead: String(overheadFactor),
        estimate_tax_rate: String(taxRate),
        estimate_terms: paymentTerms,
        estimate_deposit_pct: String(depositPct),
        estimate_expiry_days: String(expiryDays),
        estimate_include_tax: String(includeTax),
        estimate_auto_markup: String(autoMarkup),
      });
      refetchSettings();
      showToast('Estimating defaults saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    } finally {
      setSavingEstimating(false);
    }
  };

  return {
    laborRate, setLaborRate,
    materialMarkup, setMaterialMarkup,
    overheadFactor, setOverheadFactor,
    taxRate, setTaxRate,
    paymentTerms, setPaymentTerms,
    depositPct, setDepositPct,
    expiryDays, setExpiryDays,
    includeTax, setIncludeTax,
    autoMarkup, setAutoMarkup,
    savingEstimating, handleSaveEstimating,
  };
}
