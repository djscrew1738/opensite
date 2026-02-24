import { memo } from 'react';
import {
  Key, Loader2, Save, Zap, Eye, EyeOff, ExternalLink, CheckCircle
} from 'lucide-react';
import { Section, StatusPill, KeyInput } from '../primitives';

function SettingsAPIKeys({
  settings,
  serperKey,
  setSerperKey,
  showSerperKey,
  setShowSerperKey,
  testingSerper,
  handleTestSerper,
  handleSaveSerperKey,
  placesKey,
  setPlacesKey,
  showPlacesKey,
  setShowPlacesKey,
  handleSavePlacesKey,
  googleMapsKey,
  setGoogleMapsKey,
  showGoogleMapsKey,
  setShowGoogleMapsKey,
  testingGoogleMaps,
  handleTestGoogleMaps,
  handleSaveGoogleMapsKey,
  anthropicKey,
  setAnthropicKey,
  showAnthropicKey,
  setShowAnthropicKey,
  testingAnthropic,
  handleTestAnthropic,
  handleSaveAnthropicKey,
  openaiKey,
  setOpenaiKey,
  showOpenaiKey,
  setShowOpenaiKey,
  testingOpenai,
  handleTestOpenai,
  handleSaveOpenaiKey,
  twilioSid,
  setTwilioSid,
  twilioToken,
  setTwilioToken,
  showTwilioToken,
  setShowTwilioToken,
  twilioPhone,
  setTwilioPhone,
  testingTwilio,
  handleTestTwilio,
  handleSaveTwilio,
  sendgridKey,
  setSendgridKey,
  showSendgridKey,
  setShowSendgridKey,
  testingSendgrid,
  handleTestSendgrid,
  handleSaveSendgridKey,
  stripeKey,
  setStripeKey,
  showStripeKey,
  setShowStripeKey,
  testingStripe,
  handleTestStripe,
  handleSaveStripeKey,
  telegramToken,
  setTelegramToken,
  showTelegramToken,
  setShowTelegramToken,
  telegramChatId,
  setTelegramChatId,
  testingTelegram,
  handleTestTelegram,
  handleSaveTelegram,
}) {
  return (
    <Section icon={Key} title="API Keys"
      badge={
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'serper_api_key_configured', label: 'Serper' },
            { key: 'anthropic_api_key_configured', label: 'Anthropic' },
            { key: 'openai_api_key_configured', label: 'OpenAI' },
            { key: 'twilio_account_sid_configured', label: 'Twilio' },
            { key: 'sendgrid_api_key_configured', label: 'SendGrid' },
            { key: 'google_client_id_configured', label: 'Google' },
            { key: 'microsoft_client_id_configured', label: 'Microsoft' },
            { key: 'telegram_bot_token_configured', label: 'Telegram' },
          ].map(({ key, label }) => (
            <StatusPill key={key} connected={settings[key]} label={settings[key] ? label : `${label} N/A`} />
          ))}
        </div>
      }
    >
      <div className="space-y-6">
        <KeyInput label="Serper.dev API Key" description="Lead discovery via Google Maps search. " href="https://serper.dev" hrefLabel="serper.dev"
          value={serperKey} onChange={setSerperKey} show={showSerperKey} onToggleShow={() => setShowSerperKey(!showSerperKey)}
          placeholder={settings.serper_api_key_masked || 'Enter Serper API key'}
          onTest={handleTestSerper} testing={testingSerper} onSave={handleSaveSerperKey} />

        <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
          <KeyInput label="Google Places API Key" description="Zone-based discovery with Nearby Search. " href="https://console.cloud.google.com" hrefLabel="console.cloud.google.com"
            value={placesKey} onChange={setPlacesKey} show={showPlacesKey} onToggleShow={() => setShowPlacesKey(!showPlacesKey)}
            placeholder={settings.google_places_api_key_masked || 'Enter Google Places API key'}
            onSave={handleSavePlacesKey} />
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
          <KeyInput label="Google Maps API Key" description="Geocoding, routing, and job site maps. " href="https://console.cloud.google.com/apis/credentials" hrefLabel="console.cloud.google.com"
            value={googleMapsKey} onChange={setGoogleMapsKey} show={showGoogleMapsKey} onToggleShow={() => setShowGoogleMapsKey(!showGoogleMapsKey)}
            placeholder={settings.google_maps_api_key_masked || 'Enter Google Maps API key'}
            onTest={handleTestGoogleMaps} testing={testingGoogleMaps} onSave={handleSaveGoogleMapsKey} />
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Premium AI Providers</p>
          <div className="space-y-5">
            <KeyInput label="Anthropic API Key" description="Claude AI for premium analysis. " href="https://console.anthropic.com" hrefLabel="console.anthropic.com"
              value={anthropicKey} onChange={setAnthropicKey} show={showAnthropicKey} onToggleShow={() => setShowAnthropicKey(!showAnthropicKey)}
              placeholder={settings.anthropic_api_key_masked || 'sk-ant-...'}
              onTest={handleTestAnthropic} testing={testingAnthropic} onSave={handleSaveAnthropicKey} />
            <KeyInput label="OpenAI API Key" description="GPT models for alternative AI. " href="https://platform.openai.com" hrefLabel="platform.openai.com"
              value={openaiKey} onChange={setOpenaiKey} show={showOpenaiKey} onToggleShow={() => setShowOpenaiKey(!showOpenaiKey)}
              placeholder={settings.openai_api_key_masked || 'sk-...'}
              onTest={handleTestOpenai} testing={testingOpenai} onSave={handleSaveOpenaiKey} />
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Communications</p>
          <div className="space-y-5">
            <div>
              <label className="label">Twilio (SMS)</label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">SMS notifications. Get credentials at <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">console.twilio.com <ExternalLink className="w-3 h-3 inline" /></a></p>
              <div className="space-y-3">
                <input type="text" value={twilioSid} onChange={e => setTwilioSid(e.target.value)} className="input font-mono text-sm" placeholder={settings.twilio_account_sid_masked || 'Account SID (AC...)'} />
                <div className="relative">
                  <input type={showTwilioToken ? 'text' : 'password'} value={twilioToken} onChange={e => setTwilioToken(e.target.value)} className="input pr-10 font-mono text-sm" placeholder={settings.twilio_auth_token_masked || 'Auth Token'} />
                  <button 
                    type="button" 
                    onClick={() => setShowTwilioToken(!showTwilioToken)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showTwilioToken ? 'Hide auth token' : 'Show auth token'}
                  >
                    {showTwilioToken ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                  </button>
                </div>
                <input type="text" value={twilioPhone} onChange={e => setTwilioPhone(e.target.value)} className="input font-mono text-sm" placeholder={settings.twilio_from_phone || 'From Number (+1...)'} />
                <div className="flex gap-2 justify-end">
                  <button onClick={handleTestTwilio} disabled={testingTwilio} className="btn-secondary text-sm whitespace-nowrap">
                    {testingTwilio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Test
                  </button>
                  <button onClick={handleSaveTwilio} disabled={!twilioSid.trim() && !twilioToken.trim() && !twilioPhone.trim()} className="btn-primary text-sm whitespace-nowrap">
                    <Save className="w-4 h-4" /> Save
                  </button>
                </div>
              </div>
            </div>
            <KeyInput label="SendGrid API Key" description="Email outreach and notifications. " href="https://app.sendgrid.com" hrefLabel="app.sendgrid.com"
              value={sendgridKey} onChange={setSendgridKey} show={showSendgridKey} onToggleShow={() => setShowSendgridKey(!showSendgridKey)}
              placeholder={settings.sendgrid_api_key_masked || 'SG....'}
              onTest={handleTestSendgrid} testing={testingSendgrid} onSave={handleSaveSendgridKey} />

            <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Messaging</p>
              <div className="space-y-5">
                <div>
                  <label className="label">Telegram Bot Token</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Create a bot with <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">@BotFather <ExternalLink className="w-3 h-3 inline" /></a></p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showTelegramToken ? 'text' : 'password'}
                        value={telegramToken}
                        onChange={e => setTelegramToken(e.target.value)}
                        className="input pr-10 font-mono text-sm"
                        placeholder={settings.telegram_bot_token_masked || 'Enter bot token'}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowTelegramToken(!showTelegramToken)} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label={showTelegramToken ? 'Hide bot token' : 'Show bot token'}
                      >
                        {showTelegramToken ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                      </button>
                    </div>
                    <button onClick={handleTestTelegram} disabled={testingTelegram} className="btn-secondary text-sm whitespace-nowrap">
                      {testingTelegram ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Test
                    </button>
                    <button onClick={handleSaveTelegram} disabled={!telegramToken.trim() && !telegramChatId.trim()} className="btn-primary text-sm whitespace-nowrap">
                      <Save className="w-4 h-4" /> Save
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Telegram Chat ID</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Your personal chat ID or group chat ID</p>
                  <input
                    type="text"
                    value={telegramChatId}
                    onChange={e => setTelegramChatId(e.target.value)}
                    className="input font-mono text-sm"
                    placeholder={settings.telegram_chat_id || 'e.g. 123456789 or -1001234567890'}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Payments</p>
          <KeyInput label="Stripe API Key" description="Invoicing and payment processing. " href="https://dashboard.stripe.com/apikeys" hrefLabel="dashboard.stripe.com"
            value={stripeKey} onChange={setStripeKey} show={showStripeKey} onToggleShow={() => setShowStripeKey(!showStripeKey)}
            placeholder={settings.stripe_api_key_masked || 'sk_live_... or sk_test_...'}
            onTest={handleTestStripe} testing={testingStripe} onSave={handleSaveStripeKey} />
        </div>
      </div>
    </Section>
  );
}

export default memo(SettingsAPIKeys);
