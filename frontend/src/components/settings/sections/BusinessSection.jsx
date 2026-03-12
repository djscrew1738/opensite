/**
 * Business Section
 * Company profile and service specialization
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Phone, Mail, Globe, MapPin,
  Briefcase, FileText, ShieldCheck, Save, Loader2
} from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { useSettingsActions } from '../hooks/useSettingsActions';
import { Section, SettingsRow } from '../primitives';

export default memo(function BusinessSection() {
  const ctx = useSettings();
  const { handleSaveBusiness } = useSettingsActions();

  return (
    <div className="space-y-6 page-transition-wrapper">
      <Section 
        icon={Building2} 
        title="Company Profile"
        description="Core business details used for automated estimations and AI context"
      >
        <div className="space-y-6 mt-4">
          <div className="grid md:grid-cols-2 gap-6 p-5 rounded-2xl bg-surface-elevated border border-border-default">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Legal Entity Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted opacity-50" />
                <input 
                  type="text" 
                  value={ctx.companyName} 
                  onChange={e => ctx.setCompanyName(e.target.value)} 
                  className="input pl-10 font-semibold h-11" 
                  placeholder="e.g. CTL Plumbing LLC" 
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Primary Service Area</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted opacity-50" />
                <input 
                  type="text" 
                  value={ctx.serviceArea} 
                  onChange={e => ctx.setServiceArea(e.target.value)} 
                  className="input pl-10 h-11" 
                  placeholder="e.g. DFW Metroplex" 
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Business Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted opacity-50" />
                <input 
                  type="tel" 
                  value={ctx.businessPhone} 
                  onChange={e => ctx.setBusinessPhone(e.target.value)} 
                  className="input pl-10 h-11" 
                  placeholder="+1 (000) 000-0000" 
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Public Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted opacity-50" />
                <input 
                  type="email" 
                  value={ctx.businessEmail} 
                  onChange={e => ctx.setBusinessEmail(e.target.value)} 
                  className="input pl-10 h-11" 
                  placeholder="info@company.com" 
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Company Website</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted opacity-50" />
                <input 
                  type="url" 
                  value={ctx.businessWebsite} 
                  onChange={e => ctx.setBusinessWebsite(e.target.value)} 
                  className="input pl-10 h-11" 
                  placeholder="https://www.company.com" 
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 p-5 rounded-2xl bg-surface-elevated border border-border-default">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">State License #</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted opacity-50" />
                <input 
                  type="text" 
                  value={ctx.businessLicense} 
                  onChange={e => ctx.setBusinessLicense(e.target.value)} 
                  className="input pl-10 h-11 font-mono uppercase" 
                  placeholder="MPL-00000" 
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Insurance Policy #</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted opacity-50" />
                <input 
                  type="text" 
                  value={ctx.businessInsurance} 
                  onChange={e => ctx.setBusinessInsurance(e.target.value)} 
                  className="input pl-10 h-11 font-mono" 
                  placeholder="POL-123456789" 
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Service Specialization</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3 w-4 h-4 text-text-muted opacity-50" />
                <textarea 
                  value={ctx.specialization} 
                  onChange={e => ctx.setSpecialization(e.target.value)} 
                  className="input pl-10 py-2.5 min-h-[100px] resize-none" 
                  placeholder="Describe your primary services, e.g. Commercial New Construction, Residential Service, etc." 
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border-default">
            <motion.button
              onClick={handleSaveBusiness}
              disabled={ctx.savingBusiness}
              whileTap={!ctx.savingBusiness ? { scale: 0.95 } : undefined}
              transition={{ type: 'spring', stiffness: 700, damping: 35 }}
              className="btn-primary h-11 px-8 text-xs font-semibold uppercase tracking-[0.2em] shadow-lg shadow-accent-blue/20"
            >
              {ctx.savingBusiness ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Profile
            </motion.button>
          </div>
        </div>
      </Section>
    </div>
  );
});
