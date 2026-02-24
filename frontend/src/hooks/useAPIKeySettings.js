import { useState, useEffect } from 'react';
import { api } from '../api/client';

/**
 * Manages all API key provider state, test handlers, and save handlers.
 * Returns grouped provider objects instead of flat props.
 *
 * Note: OpenAI key is shared with SettingsAI and managed in Settings.jsx.
 */
export function useAPIKeySettings({ settingsData, refetchSettings, showToast }) {
  // ── Serper ──
  const [serperKey, setSerperKey] = useState('');
  const [showSerperKey, setShowSerperKey] = useState(false);
  const [testingSerper, setTestingSerper] = useState(false);

  // ── Google Places ──
  const [placesKey, setPlacesKey] = useState('');
  const [showPlacesKey, setShowPlacesKey] = useState(false);

  // ── Google Maps ──
  const [googleMapsKey, setGoogleMapsKey] = useState('');
  const [showGoogleMapsKey, setShowGoogleMapsKey] = useState(false);
  const [testingGoogleMaps, setTestingGoogleMaps] = useState(false);

  // ── Anthropic ──
  const [anthropicKey, setAnthropicKey] = useState('');
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [testingAnthropic, setTestingAnthropic] = useState(false);

  // ── Twilio ──
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [showTwilioToken, setShowTwilioToken] = useState(false);
  const [twilioPhone, setTwilioPhone] = useState('');
  const [testingTwilio, setTestingTwilio] = useState(false);

  // ── SendGrid ──
  const [sendgridKey, setSendgridKey] = useState('');
  const [showSendgridKey, setShowSendgridKey] = useState(false);
  const [testingSendgrid, setTestingSendgrid] = useState(false);

  // ── Stripe ──
  const [stripeKey, setStripeKey] = useState('');
  const [showStripeKey, setShowStripeKey] = useState(false);
  const [testingStripe, setTestingStripe] = useState(false);

  // ── Telegram ──
  const [telegramToken, setTelegramToken] = useState('');
  const [showTelegramToken, setShowTelegramToken] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState('');
  const [testingTelegram, setTestingTelegram] = useState(false);

  // ── Initialize non-secret fields from settings ──
  useEffect(() => {
    if (!settingsData) return;
    if (settingsData.twilio_from_phone) setTwilioPhone(settingsData.twilio_from_phone);
    if (settingsData.telegram_chat_id) setTelegramChatId(settingsData.telegram_chat_id);
  }, [settingsData]);

  // ── Generic helpers ──
  const testKey = async (name, setTesting, testFn) => {
    setTesting(true);
    try {
      const result = await testFn();
      if (result.valid) showToast(result.message || `${name} is valid`);
      else showToast(result.error || 'Invalid credentials', 'error');
    } catch (err) {
      showToast(`Test failed: ${err.message}`, 'error');
    } finally {
      setTesting(false);
    }
  };

  const saveKey = async (label, payload, clearFn) => {
    try {
      await api.settings.update(payload);
      if (clearFn) clearFn();
      refetchSettings();
      showToast(`${label} saved`);
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    }
  };

  // ── Grouped provider objects ──
  const serper = {
    key: serperKey, setKey: setSerperKey,
    show: showSerperKey, setShow: setShowSerperKey,
    testing: testingSerper,
    test: () => testKey('Serper API key', setTestingSerper, () => api.settings.testSerper(serperKey || undefined)),
    save: () => saveKey('Serper API key', { serper_api_key: serperKey }, () => setSerperKey('')),
  };

  const places = {
    key: placesKey, setKey: setPlacesKey,
    show: showPlacesKey, setShow: setShowPlacesKey,
    save: () => saveKey('Google Places API key', { google_places_api_key: placesKey }, () => setPlacesKey('')),
  };

  const googleMaps = {
    key: googleMapsKey, setKey: setGoogleMapsKey,
    show: showGoogleMapsKey, setShow: setShowGoogleMapsKey,
    testing: testingGoogleMaps,
    test: () => testKey('Google Maps API key', setTestingGoogleMaps, () => api.settings.testGoogleMaps(googleMapsKey || undefined)),
    save: () => saveKey('Google Maps API key', { google_maps_api_key: googleMapsKey }, () => setGoogleMapsKey('')),
  };

  const anthropic = {
    key: anthropicKey, setKey: setAnthropicKey,
    show: showAnthropicKey, setShow: setShowAnthropicKey,
    testing: testingAnthropic,
    test: () => testKey('Anthropic API key', setTestingAnthropic, () => api.settings.testAnthropic(anthropicKey || undefined)),
    save: () => saveKey('Anthropic API key', { anthropic_api_key: anthropicKey }, () => setAnthropicKey('')),
  };

  const twilio = {
    sid: twilioSid, setSid: setTwilioSid,
    token: twilioToken, setToken: setTwilioToken,
    showToken: showTwilioToken, setShowToken: setShowTwilioToken,
    phone: twilioPhone, setPhone: setTwilioPhone,
    testing: testingTwilio,
    test: () => testKey('Twilio credentials', setTestingTwilio, () => api.settings.testTwilio(twilioSid || undefined, twilioToken || undefined)),
    save: async () => {
      const u = {};
      if (twilioSid) u.twilio_account_sid = twilioSid;
      if (twilioToken) u.twilio_auth_token = twilioToken;
      if (twilioPhone) u.twilio_from_number = twilioPhone;
      await saveKey('Twilio settings', u, () => { setTwilioSid(''); setTwilioToken(''); });
    },
  };

  const sendgrid = {
    key: sendgridKey, setKey: setSendgridKey,
    show: showSendgridKey, setShow: setShowSendgridKey,
    testing: testingSendgrid,
    test: () => testKey('SendGrid API key', setTestingSendgrid, () => api.settings.testSendgrid(sendgridKey || undefined)),
    save: () => saveKey('SendGrid API key', { sendgrid_api_key: sendgridKey }, () => setSendgridKey('')),
  };

  const stripe = {
    key: stripeKey, setKey: setStripeKey,
    show: showStripeKey, setShow: setShowStripeKey,
    testing: testingStripe,
    test: () => testKey('Stripe API key', setTestingStripe, () => api.settings.testStripe(stripeKey || undefined)),
    save: () => saveKey('Stripe API key', { stripe_api_key: stripeKey }, () => setStripeKey('')),
  };

  const telegram = {
    token: telegramToken, setToken: setTelegramToken,
    showToken: showTelegramToken, setShowToken: setShowTelegramToken,
    chatId: telegramChatId, setChatId: setTelegramChatId,
    testing: testingTelegram,
    test: async () => {
      setTestingTelegram(true);
      try {
        const r = await api.settings.testTelegram(telegramToken || undefined);
        if (r.valid) showToast(`Bot connected: @${r.botUsername}`);
        else showToast(r.error || 'Invalid token', 'error');
      } catch (err) {
        showToast(`Test failed: ${err.message}`, 'error');
      } finally {
        setTestingTelegram(false);
      }
    },
    save: async () => {
      const u = {};
      if (telegramToken) u.telegram_bot_token = telegramToken;
      if (telegramChatId) u.telegram_chat_id = telegramChatId;
      await saveKey('Telegram settings', u, () => setTelegramToken(''));
    },
  };

  return { serper, places, googleMaps, anthropic, twilio, sendgrid, stripe, telegram };
}
