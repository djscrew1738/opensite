import { memo } from 'react';
import {
  Key, Loader2, Save, Zap, Eye, EyeOff, ExternalLink
} from 'lucide-react';
import { Section, StatusPill, KeyInput } from '../primitives';

/**
 * API Keys management section.
 *
 * Props:
 * - settings: server settings (for masked keys / status pills)
 * - providers: grouped provider objects from useAPIKeySettings
 * - openai: { key, setKey, show, setShow, testing, test, save } — shared with AI tab
 */
function SettingsAPIKeys({ settings, providers, openai }) {
  const { serper, places, googleMaps, anthropic, twilio, sendgrid, stripe, telegram } = providers;

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
          value={serper.key} onChange={serper.setKey} show={serper.show} onToggleShow={() => serper.setShow(!serper.show)}
          placeholder={settings.serper_api_key_masked || 'Enter Serper API key'}
          onTest={serper.test} testing={serper.testing} onSave={serper.save} />

        <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
          <KeyInput label="Google Places API Key" description="Zone-based discovery with Nearby Search. " href="https://console.cloud.google.com" hrefLabel="console.cloud.google.com"
            value={places.key} onChange={places.setKey} show={places.show} onToggleShow={() => places.setShow(!places.show)}
            placeholder={settings.google_places_api_key_masked || 'Enter Google Places API key'}
            onSave={places.save} />
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
          <KeyInput label="Google Maps API Key" description="Geocoding, routing, and job site maps. " href="https://console.cloud.google.com/apis/credentials" hrefLabel="console.cloud.google.com"
            value={googleMaps.key} onChange={googleMaps.setKey} show={googleMaps.show} onToggleShow={() => googleMaps.setShow(!googleMaps.show)}
            placeholder={settings.google_maps_api_key_masked || 'Enter Google Maps API key'}
            onTest={googleMaps.test} testing={googleMaps.testing} onSave={googleMaps.save} />
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Premium AI Providers</p>
          <div className="space-y-5">
            <KeyInput label="Anthropic API Key" description="Claude AI for premium analysis. " href="https://console.anthropic.com" hrefLabel="console.anthropic.com"
              value={anthropic.key} onChange={anthropic.setKey} show={anthropic.show} onToggleShow={() => anthropic.setShow(!anthropic.show)}
              placeholder={settings.anthropic_api_key_masked || 'sk-ant-...'}
              onTest={anthropic.test} testing={anthropic.testing} onSave={anthropic.save} />
            <KeyInput label="OpenAI API Key" description="GPT models for alternative AI. " href="https://platform.openai.com" hrefLabel="platform.openai.com"
              value={openai.key} onChange={openai.setKey} show={openai.show} onToggleShow={() => openai.setShow(!openai.show)}
              placeholder={settings.openai_api_key_masked || 'sk-...'}
              onTest={openai.test} testing={openai.testing} onSave={openai.save} />
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Communications</p>
          <div className="space-y-5">
            <div>
              <label className="label">Twilio (SMS)</label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">SMS notifications. Get credentials at <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">console.twilio.com <ExternalLink className="w-3 h-3 inline" /></a></p>
              <div className="space-y-3">
                <input type="text" value={twilio.sid} onChange={e => twilio.setSid(e.target.value)} className="input font-mono text-sm" placeholder={settings.twilio_account_sid_masked || 'Account SID (AC...)'} />
                <div className="relative">
                  <input type={twilio.showToken ? 'text' : 'password'} value={twilio.token} onChange={e => twilio.setToken(e.target.value)} className="input pr-10 font-mono text-sm" placeholder={settings.twilio_auth_token_masked || 'Auth Token'} />
                  <button
                    type="button"
                    onClick={() => twilio.setShowToken(!twilio.showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={twilio.showToken ? 'Hide auth token' : 'Show auth token'}
                  >
                    {twilio.showToken ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                  </button>
                </div>
                <input type="text" value={twilio.phone} onChange={e => twilio.setPhone(e.target.value)} className="input font-mono text-sm" placeholder={settings.twilio_from_phone || 'From Number (+1...)'} />
                <div className="flex gap-2 justify-end">
                  <button onClick={twilio.test} disabled={twilio.testing} className="btn-secondary text-sm whitespace-nowrap">
                    {twilio.testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Test
                  </button>
                  <button onClick={twilio.save} disabled={!twilio.sid.trim() && !twilio.token.trim() && !twilio.phone.trim()} className="btn-primary text-sm whitespace-nowrap">
                    <Save className="w-4 h-4" /> Save
                  </button>
                </div>
              </div>
            </div>
            <KeyInput label="SendGrid API Key" description="Email outreach and notifications. " href="https://app.sendgrid.com" hrefLabel="app.sendgrid.com"
              value={sendgrid.key} onChange={sendgrid.setKey} show={sendgrid.show} onToggleShow={() => sendgrid.setShow(!sendgrid.show)}
              placeholder={settings.sendgrid_api_key_masked || 'SG....'}
              onTest={sendgrid.test} testing={sendgrid.testing} onSave={sendgrid.save} />

            <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Messaging</p>
              <div className="space-y-5">
                <div>
                  <label className="label">Telegram Bot Token</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Create a bot with <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">@BotFather <ExternalLink className="w-3 h-3 inline" /></a></p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={telegram.showToken ? 'text' : 'password'}
                        value={telegram.token}
                        onChange={e => telegram.setToken(e.target.value)}
                        className="input pr-10 font-mono text-sm"
                        placeholder={settings.telegram_bot_token_masked || 'Enter bot token'}
                      />
                      <button
                        type="button"
                        onClick={() => telegram.setShowToken(!telegram.showToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label={telegram.showToken ? 'Hide bot token' : 'Show bot token'}
                      >
                        {telegram.showToken ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                      </button>
                    </div>
                    <button onClick={telegram.test} disabled={telegram.testing} className="btn-secondary text-sm whitespace-nowrap">
                      {telegram.testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Test
                    </button>
                    <button onClick={telegram.save} disabled={!telegram.token.trim() && !telegram.chatId.trim()} className="btn-primary text-sm whitespace-nowrap">
                      <Save className="w-4 h-4" /> Save
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Telegram Chat ID</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Your personal chat ID or group chat ID</p>
                  <input
                    type="text"
                    value={telegram.chatId}
                    onChange={e => telegram.setChatId(e.target.value)}
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
            value={stripe.key} onChange={stripe.setKey} show={stripe.show} onToggleShow={() => stripe.setShow(!stripe.show)}
            placeholder={settings.stripe_api_key_masked || 'sk_live_... or sk_test_...'}
            onTest={stripe.test} testing={stripe.testing} onSave={stripe.save} />
        </div>
      </div>
    </Section>
  );
}

export default memo(SettingsAPIKeys);
