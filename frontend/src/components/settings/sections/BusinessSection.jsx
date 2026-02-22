/**
 * Business Section
 * Company profile and contact information
 */

import { Building2, Phone, Mail, Globe, MapPin, Shield, Loader2, Save } from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { useSettingsActions } from '../hooks/useSettingsActions';
import { Section } from '../primitives';

export default function BusinessSection() {
  const ctx = useSettings();
  const { handleSaveBusiness } = useSettingsActions();
  
  const { 
    companyName, setCompanyName, serviceArea, setServiceArea,
    specialization, setSpecialization, businessPhone, setBusinessPhone,
    businessEmail, setBusinessEmail, businessWebsite, setBusinessWebsite,
    businessLicense, setBusinessLicense, businessInsurance, setBusinessInsurance,
    businessState, setBusinessState, businessZip, setBusinessZip,
    savingBusiness
  } = ctx;

  return (
    <Section icon={Building2} title="Business Profile">
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Company Name</label>
            <input 
              type="text" 
              value={companyName} 
              onChange={e => setCompanyName(e.target.value)} 
              className="input" 
              placeholder="CTL Plumbing LLC" 
            />
          </div>
          <div>
            <label className="label flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" /> Phone Number
            </label>
            <input 
              type="tel" 
              value={businessPhone} 
              onChange={e => setBusinessPhone(e.target.value)} 
              className="input" 
              placeholder="(555) 123-4567" 
            />
          </div>
          <div>
            <label className="label flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" /> Email Address
            </label>
            <input 
              type="email" 
              value={businessEmail} 
              onChange={e => setBusinessEmail(e.target.value)} 
              className="input" 
              placeholder="contact@company.com" 
            />
          </div>
          <div className="md:col-span-2">
            <label className="label flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-400" /> Website
            </label>
            <input 
              type="url" 
              value={businessWebsite} 
              onChange={e => setBusinessWebsite(e.target.value)} 
              className="input" 
              placeholder="https://company.com" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div>
            <label className="label flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" /> Service Area
            </label>
            <input 
              type="text" 
              value={serviceArea} 
              onChange={e => setServiceArea(e.target.value)} 
              className="input" 
              placeholder="DFW Metroplex" 
            />
          </div>
          <div>
            <label className="label">State</label>
            <input 
              type="text" 
              value={businessState} 
              onChange={e => setBusinessState(e.target.value)} 
              className="input" 
              placeholder="TX" 
            />
          </div>
          <div>
            <label className="label">ZIP Code</label>
            <input 
              type="text" 
              value={businessZip} 
              onChange={e => setBusinessZip(e.target.value)} 
              className="input" 
              placeholder="75034" 
            />
          </div>
          <div>
            <label className="label">Specialization</label>
            <input 
              type="text" 
              value={specialization} 
              onChange={e => setSpecialization(e.target.value)} 
              className="input" 
              placeholder="Residential & Commercial Plumbing" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div>
            <label className="label flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-400" /> License Number
            </label>
            <input 
              type="text" 
              value={businessLicense} 
              onChange={e => setBusinessLicense(e.target.value)} 
              className="input" 
              placeholder="TACLB12345E" 
            />
          </div>
          <div>
            <label className="label flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-400" /> Insurance Policy
            </label>
            <input 
              type="text" 
              value={businessInsurance} 
              onChange={e => setBusinessInsurance(e.target.value)} 
              className="input" 
              placeholder="INS-123456789" 
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
          <button onClick={handleSaveBusiness} disabled={savingBusiness} className="btn-primary text-sm">
            {savingBusiness ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Business Profile
          </button>
        </div>
      </div>
    </Section>
  );
}
