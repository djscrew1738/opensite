import { memo } from 'react';
import {
  Building2, Phone, Mail, Globe, MapPin, Wrench,
  Loader2, Save
} from 'lucide-react';
import { Section } from '../primitives';

function SettingsBusiness({
  companyName,
  setCompanyName,
  businessPhone,
  setBusinessPhone,
  businessEmail,
  setBusinessEmail,
  businessWebsite,
  setBusinessWebsite,
  serviceArea,
  setServiceArea,
  businessState,
  setBusinessState,
  businessZip,
  setBusinessZip,
  specialization,
  setSpecialization,
  businessLicense,
  setBusinessLicense,
  businessInsurance,
  setBusinessInsurance,
  savingBusiness,
  handleSaveBusiness,
}) {
  return (
    <Section icon={Building2} title="Business Profile">
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Company Name</label>
            <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="input" placeholder="CTL Plumbing LLC" />
          </div>
          <div>
            <label className="label">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="tel" value={businessPhone} onChange={e => setBusinessPhone(e.target.value)} className="input pl-10" placeholder="(817) 555-0100" />
            </div>
          </div>
          <div>
            <label className="label">Business Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="email" value={businessEmail} onChange={e => setBusinessEmail(e.target.value)} className="input pl-10" placeholder="info@ctlplumbing.com" />
            </div>
          </div>
          <div>
            <label className="label">Website</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="url" value={businessWebsite} onChange={e => setBusinessWebsite(e.target.value)} className="input pl-10" placeholder="https://ctlplumbing.com" />
            </div>
          </div>
          <div>
            <label className="label">Service Area</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={serviceArea} onChange={e => setServiceArea(e.target.value)} className="input pl-10" placeholder="DFW Metroplex" />
            </div>
          </div>
          <div>
            <label className="label">State</label>
            <select value={businessState} onChange={e => setBusinessState(e.target.value)} className="input">
              <option value="">Select state...</option>
              {['TX','OK','NM','AR','LA','CO','KS','MO'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">ZIP Code</label>
            <input type="text" value={businessZip} onChange={e => setBusinessZip(e.target.value)} className="input font-mono" placeholder="76001" maxLength={10} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Specialization</label>
            <div className="relative">
              <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={specialization} onChange={e => setSpecialization(e.target.value)} className="input pl-10" placeholder="Commercial and Multi-family Plumbing" />
            </div>
          </div>
        </div>
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Licensing & Insurance</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Contractor License #</label>
              <input type="text" value={businessLicense} onChange={e => setBusinessLicense(e.target.value)} className="input font-mono text-sm" placeholder="M-12345" />
            </div>
            <div>
              <label className="label">Insurance Company</label>
              <input type="text" value={businessInsurance} onChange={e => setBusinessInsurance(e.target.value)} className="input text-sm" placeholder="State Farm Commercial" />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={handleSaveBusiness} disabled={savingBusiness} className="btn-primary text-sm">
            {savingBusiness ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Profile
          </button>
        </div>
      </div>
    </Section>
  );
}

export default memo(SettingsBusiness);
