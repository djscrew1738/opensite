/**
 * API Keys Section
 * Third-party service integrations
 */

import { Key, ExternalLink, Loader2, Save, Zap, Eye, EyeOff } from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { useSettingsActions } from '../hooks/useSettingsActions';
import { Section, StatusPill, KeyInput } from '../primitives';

export default function APIKeysSection() {
  const ctx = useSettings();
  const actions = useSettingsActions();
  
  const { settings } = ctx;
  
  const apiKeyStatuses = [
    { key: 'serper_api_key_configured', label: 'Serper' },
    { key: 'anthropic_api_key_configured', label: 'Anthropic' },
    { key: 'openai_api_key_configured', label: 'OpenAI' },
    { key: 'twilio_account_sid_configured', label: 'Twilio' },
    { key: 'sendgrid_api_key_configured', label: 'SendGrid' },
    { key: 'google_client_id_configured', label: 'Google' },
    { key: 'microsoft_client_id_configured', label: 'Microsoft' },
    { key: 'telegram_bot_token_configured', label: 'Telegram' },
  ];

  return (
    <Section 
      icon={Key} 
      title="API Keys"
      badge={
        <div className="flex flex-wrap gap-2">
          {apiKeyStatuses.map(({ key, label }) => (
            <StatusPill key={key} connected={settings[key]} label={settings[key] ? label : `${label} N/A`} />
          ))}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Discovery */}
        <KeyInput 
          label="Serper.dev API Key" 
          description="Lead discovery via Google Maps search." 
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

        <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
          <KeyInput 
            label="Google Places API Key" 
            description="Zone-based discovery with Nearby Search." 
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

        <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
          <KeyInput 
            label="Google Maps API Key" 
            description="Geocoding, routing, and job site maps." 
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

        {/* Premium AI */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Premium AI Providers</p>
          <div className="space-y-5">
            <KeyInput 
              label="Anthropic API Key" 
              description="Claude AI for premium analysis." 
              href="https://console.anthropic.com" 
              hrefLabel="console.anthropic.com"
              value={ctx.anthropicKey} 
              onChange={ctx.setAnthropicKey} 
              show={ctx.showAnthropicKey} 
              onToggleShow={() => ctx.setShowAnthropicKey(!ctx.showAnthropicKey)}
              placeholder={settings.anthropic_api_key_masked || 'sk-ant-...'}
              onTest={actions.handleTestAnthropic} 
              testing={ctx.testingAnthropic} 
              onSave={actions.handleSaveAnthropicKey} 
            />
            <KeyInput 
              label="OpenAI API Key" 
              description="GPT models for alternative AI." 
              href="https://platform.openai.com" 
              hrefLabel="platform.openai.com"
              value={ctx.openaiKey} 
              onChange={ctx.setOpenaiKey} 
              show={ctx.showOpenaiKey} 
              onToggleShow={() => ctx.setShowOpenaiKey(!ctx.showOpenaiKey)}
              placeholder={settings.openai_api_key_masked || 'sk-...'}
              onTest={actions.handleTestOpenai} 
              testing={ctx.testingOpenai} 
              onSave={actions.handleSaveOpenaiKey} 
            />
          </div>
        </div>

        {/* Communications */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Communications</p>
          <div className="space-y-5">
            {/* Twilio */}
            <div>
              <label className="label">Twilio (SMS)</label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                SMS notifications. Get credentials at{' '}
                <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                  console.twilio.com <ExternalLink className="w-3 h-3 inline" />
                </a>
              </p>
              <div className="space-y-3">
                <input 
                  type="text" 
                  value={ctx.twilioSid} 
                  onChange={e => ctx.setTwilioSid(e.target.value)} 
                  className="input font-mono text-sm" 
                  placeholder={settings.twilio_account_sid_masked || 'Account SID (AC...)'} 
                />
                <div className="relative">
                  <input 
                    type={ctx.showTwilioToken ? 'text' : 'password'} 
                    value={ctx.twilioToken} 
                    onChange={e => ctx.setTwilioToken(e.target.value)} 
                    className="input pr-10 font-mono text-sm" 
                    placeholder={settings.twilio_auth_token_masked || 'Auth Token'} 
                  />
                  <button 
                    type="button" 
                    onClick={() => ctx.setShowTwilioToken(!ctx.showTwilioToken)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {ctx.showTwilioToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <input 
                  type="text" 
                  value={ctx.twilioPhone} 
                  onChange={e => ctx.setTwilioPhone(e.target.value)} 
                  className="input font-mono text-sm" 
                  placeholder={settings.twilio_from_phone || 'From Number (+1...)'} 
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={actions.handleTestTwilio} disabled={ctx.testingTwilio} className="btn-secondary text-sm whitespace-nowrap">
                    {ctx.testingTwilio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Test
                  </button>
                  <button 
                    onClick={actions.handleSaveTwilio} 
                    disabled={!ctx.twilioSid.trim() && !ctx.twilioToken.trim() && !ctx.twilioPhone.trim()} 
                    className="btn-primary text-sm whitespace-nowrap"
                  >
                    <Save className="w-4 h-4" /> Save
                  </button>
                </div>
              </div>
            </div>

            <KeyInput 
              label="SendGrid API Key" 
              description="Email outreach and notifications." 
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
            
            {/* Telegram */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Messaging</p>
              <div className="space-y-5">
                <div>
                  <label className="label">Telegram Bot Token</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Create a bot with{' '}
                    <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                      @BotFather <ExternalLink className="w-3 h-3 inline" />
                    </a>
                  </p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input 
                        type={ctx.showTelegramToken ? 'text' : 'password'} 
                        value={ctx.telegramToken} 
                        onChange={e => ctx.setTelegramToken(e.target.value)} 
                        className="input pr-10 font-mono text-sm" 
                        placeholder={settings.telegram_bot_token_masked || 'Enter bot token'} 
                      />
                      <button 
                        type="button" 
                        onClick={() => ctx.setShowTelegramToken(!ctx.showTelegramToken)} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {ctx.showTelegramToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <button onClick={actions.handleTestTelegram} disabled={ctx.testingTelegram} className="btn-secondary text-sm whitespace-nowrap">
                      {ctx.testingTelegram ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Test
                    </button>
                    <button 
                      onClick={actions.handleSaveTelegram} 
                      disabled={!ctx.telegramToken.trim() && !ctx.telegramChatId.trim()} 
                      className="btn-primary text-sm whitespace-nowrap"
                    >
                      <Save className="w-4 h-4" /> Save
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Telegram Chat ID</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Your personal chat ID or group chat ID</p>
                  <input 
                    type="text" 
                    value={ctx.telegramChatId} 
                    onChange={e => ctx.setTelegramChatId(e.target.value)} 
                    className="input font-mono text-sm" 
                    placeholder={settings.telegram_chat_id || 'e.g. 123456789 or -1001234567890'} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payments */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Payments</p>
          <KeyInput 
            label="Stripe API Key" 
            description="Invoicing and payment processing." 
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
    </Section>
  );
}
