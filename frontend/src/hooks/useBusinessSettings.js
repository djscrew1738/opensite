import { useState, useEffect } from 'react';
import { api } from '../api/client';

export function useBusinessSettings({ settingsData, refetchSettings, showToast }) {
  const [companyName, setCompanyName] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessWebsite, setBusinessWebsite] = useState('');
  const [businessLicense, setBusinessLicense] = useState('');
  const [businessInsurance, setBusinessInsurance] = useState('');
  const [businessState, setBusinessState] = useState('');
  const [businessZip, setBusinessZip] = useState('');
  const [savingBusiness, setSavingBusiness] = useState(false);

  useEffect(() => {
    if (!settingsData) return;
    const s = settingsData;
    setCompanyName(s.company_name || '');
    setServiceArea(s.service_area || '');
    setSpecialization(s.specialization || '');
    setBusinessPhone(s.business_phone || '');
    setBusinessEmail(s.business_email || '');
    setBusinessWebsite(s.business_website || '');
    setBusinessLicense(s.business_license || '');
    setBusinessInsurance(s.business_insurance || '');
    setBusinessState(s.business_state || '');
    setBusinessZip(s.business_zip || '');
  }, [settingsData]);

  const handleSaveBusiness = async () => {
    setSavingBusiness(true);
    try {
      await api.settings.update({
        company_name: companyName,
        service_area: serviceArea,
        specialization,
        business_phone: businessPhone,
        business_email: businessEmail,
        business_website: businessWebsite,
        business_license: businessLicense,
        business_insurance: businessInsurance,
        business_state: businessState,
        business_zip: businessZip,
      });
      refetchSettings();
      showToast('Business profile saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    } finally {
      setSavingBusiness(false);
    }
  };

  return {
    companyName, setCompanyName,
    businessPhone, setBusinessPhone,
    businessEmail, setBusinessEmail,
    businessWebsite, setBusinessWebsite,
    serviceArea, setServiceArea,
    businessState, setBusinessState,
    businessZip, setBusinessZip,
    specialization, setSpecialization,
    businessLicense, setBusinessLicense,
    businessInsurance, setBusinessInsurance,
    savingBusiness, handleSaveBusiness,
  };
}
