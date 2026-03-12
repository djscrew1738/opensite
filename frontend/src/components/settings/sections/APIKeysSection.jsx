/**
 * API Keys Section
 * Third-party service integrations
 */

import { memo } from 'react';
import { 
  Key, ExternalLink, Loader2, Save, Zap, 
  MessageSquare, Globe, Map as MapIcon, CreditCard,
  Mail, Smartphone, ShieldCheck
} from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { useSettingsActions } from '../hooks/useSettingsActions';
import { Section, StatusPill, KeyInput } from '../primitives';
import { colors } from '../../../styles/tokens';

export default memo(function APIKeysSection() {
  const ctx = useSettings();
  const actions = useSettingsActions();
  
  const { settings } = ctx;
  
  const apiKeyStatuses = [
    { key: 'serper_api_key_configured', label: 'Serper' },
    { key: 'anthropic_api_key_configured', label: 'Anthropic' },
    { key: 'openai_api_key_configured', label: 'OpenAI' },
    { key: 'twilio_account_sid_configured', label: 'Twilio' },
    { key: 'sendgrid_api_key_configured', label: 'SendGrid' },
  ];

  return (
    <div className="space-y-6 page-transition-wrapper">
      <Section 
        icon={Key} 
        title="API Integration Center"
        badge={
          <div className="flex flex-wrap gap-2">
            {apiKeyStatuses.map(({ key, label }) => (
              <StatusPill key={key} connected={settings[key]} label={label} />
            ))}
          </div>
        }
        description="Manage secure connections to external intelligence and communication services"
      >
        <div className="space-y-8 mt-4">
          {/* Discovery Group */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-accent-muted text-accent-blue">
                <Globe className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-text-primary">Discovery & Intelligence</h3>
            </div>
            
            <div className="grid gap-6 p-5 rounded-2xl bg-surface-elevated border border-border-default">
              <KeyInput 
                label="Serper.dev API Key" 
                description="Powers Google Maps search for automated lead discovery." 
                href="https://serper.dev" 
                hrefLabel="serper.dev"
                value={ctx.serperKey} 
                onChange={ctx.setSerperKey} 
                show={ctx.showSerperKey} 
                onToggleShow={() => ctx.setShowSerperKey(!ctx.showSerperKey)}
                placeholder={settings.serper_api_key_masked || 'Enter Serper API key'}
                onTest={actions.handleTestSerper} 
                testing={ctx.testingSerper} 
                onSave={actions.handleSaveSerperKey} 
              />

              <div className="border-t border-border-muted pt-6">
                <KeyInput 
                  label="Google Places API Key" 
                  description="Enables zone-based discovery with Nearby Search functionality." 
                  href="https://console.cloud.google.com" 
                  hrefLabel="console.cloud.google.com"
                  value={ctx.placesKey} 
                  onChange={ctx.setPlacesKey} 
                  show={ctx.showPlacesKey} 
                  onToggleShow={() => ctx.setShowPlacesKey(!ctx.showPlacesKey)}
                  placeholder={settings.google_places_api_key_masked || 'Enter Google Places API key'}
                  onSave={actions.handleSavePlacesKey} 
                />
              </div>

              <div className="border-t border-border-muted pt-6">
                <KeyInput 
                  label="Google Maps Platform Key" 
                  description="Used for geocoding, distance matrix, and interactive job site maps." 
                  href="https://console.cloud.google.com/apis/credentials" 
                  hrefLabel="console.cloud.google.com"
                  value={ctx.googleMapsKey} 
                  onChange={ctx.setGoogleMapsKey} 
                  show={ctx.showGoogleMapsKey} 
                  onToggleShow={() => ctx.setShowGoogleMapsKey(!ctx.showGoogleMapsKey)}
                  placeholder={settings.google_maps_api_key_masked || 'Enter Google Maps API key'}
                  onTest={actions.handleTestGoogleMaps} 
                  testing={ctx.testingGoogleMaps} 
                  onSave={actions.handleSaveGoogleMapsKey} 
                />
              </div>
            </div>
          </div>

          {/* Communication Group */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-success-muted text-success-light">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-text-primary">Communication Services</h3>
            </div>
            
            <div className="grid gap-6 p-5 rounded-2xl bg-surface-elevated border border-border-default">
              {/* Twilio */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-text-primary tracking-tight">Twilio (SMS Gateway)</label>
                  <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="text-xs font-bold uppercase tracking-widest text-accent-blue hover:text-accent-light flex items-center gap-1">
                    console.twilio.com <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                
                <p className="text-xs text-text-muted leading-relaxed">
                  Required for automated SMS notifications and lead alerts.
                </p>

                <div className="space-y-3">
                  <input 
                    type="text" 
                    value={ctx.twilioSid} 
                    onChange={e => ctx.setTwilioSid(e.target.value)} 
                    className="input font-mono text-sm tracking-tight h-11" 
                    placeholder={settings.twilio_account_sid_masked || 'Account SID (AC...)'} 
                  />
                  <div className="relative">
                    <input 
                      type={ctx.showTwilioToken ? 'text' : 'password'} 
                      value={ctx.twilioToken} 
                      onChange={e => ctx.setTwilioToken(e.target.value)} 
                      className="input pr-10 font-mono text-sm tracking-tight h-11" 
                      placeholder={settings.twilio_auth_token_masked || 'Auth Token'} 
                    />
                    <button 
                      type="button" 
                      onClick={() => ctx.setShowTwilioToken(!ctx.showTwilioToken)} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1"
                    >
                      {ctx.showTwilioToken ? <Zap className="w-4 h-4 fill-current" /> : <Zap className="w-4 h-4" />}
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={ctx.twilioPhone} 
                    onChange={e => ctx.setTwilioPhone(e.target.value)} 
                    className="input font-mono text-sm tracking-tight h-11" 
                    placeholder={settings.twilio_from_phone || 'Twilio Phone Number (+1...)'} 
                  />
                  <div className="flex gap-2 justify-end pt-2">
                    <button onClick={actions.handleTestTwilio} disabled={ctx.testingTwilio} className="btn-secondary h-10 px-5 text-xs font-semibold uppercase tracking-widest">
                      {ctx.testingTwilio ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Zap className="w-3.5 h-3.5 mr-2" />} Test
                    </button>
                    <button 
                      onClick={actions.handleSaveTwilio} 
                      disabled={!ctx.twilioSid.trim() && !ctx.twilioToken.trim() && !ctx.twilioPhone.trim()} 
                      className="btn-primary h-10 px-5 text-xs font-semibold uppercase tracking-widest"
                    >
                      <Save className="w-3.5 h-3.5 mr-2" /> Save
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-border-muted pt-6">
                <KeyInput 
                  label="SendGrid API Key" 
                  description="Powers professional email outreach and automated reports." 
                  href="https://app.sendgrid.com" 
                  hrefLabel="app.sendgrid.com"
                  value={ctx.sendgridKey} 
                  onChange={ctx.setSendgridKey} 
                  show={ctx.showSendgridKey} 
                  onToggleShow={() => ctx.setShowSendgridKey(!ctx.showSendgridKey)}
                  placeholder={settings.sendgrid_api_key_masked || 'SG....'}
                  onTest={actions.handleTestSendgrid} 
                  testing={ctx.testingSendgrid} 
                  onSave={actions.handleSaveSendgridKey} 
                />
              </div>
            </div>
          </div>

          {/* Payments Group */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-amber-muted text-warning-DEFAULT">
                <CreditCard className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-text-primary">Financial Services</h3>
            </div>
            
            <div className="grid gap-6 p-5 rounded-2xl bg-surface-elevated border border-border-default">
              <KeyInput 
                label="Stripe Secret Key" 
                description="Securely process payments and manage customer subscriptions." 
                href="https://dashboard.stripe.com/apikeys" 
                hrefLabel="dashboard.stripe.com"
                value={ctx.stripeKey} 
                onChange={ctx.setStripeKey} 
                show={ctx.showStripeKey} 
                onToggleShow={() => ctx.setShowStripeKey(!ctx.showStripeKey)}
                placeholder={settings.stripe_api_key_masked || 'sk_live_... or sk_test_...'}
                onTest={actions.handleTestStripe} 
                testing={ctx.testingStripe} 
                onSave={actions.handleSaveStripeKey} 
              />
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
});
