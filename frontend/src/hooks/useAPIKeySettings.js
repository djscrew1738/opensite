import { useState } from 'react';
import { api } from '../api/client';

export function useAPIKeySettings({ refetchSettings, showToast }) {
  // Serper
  const [serperKey, setSerperKey] = useState('');
  const [showSerperKey, setShowSerperKey] = useState(false);
  const [testingSerper, setTestingSerper] = useState(false);

  // Google Places
  const [placesKey, setPlacesKey] = useState('');
  const [showPlacesKey, setShowPlacesKey] = useState(false);

  // Google Maps
  const [googleMapsKey, setGoogleMapsKey] = useState('');
  const [showGoogleMapsKey, setShowGoogleMapsKey] = useState(false);
  const [testingGoogleMaps, setTestingGoogleMaps] = useState(false);

  // Anthropic
  const [anthropicKey, setAnthropicKey] = useState('');
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [testingAnthropic, setTestingAnthropic] = useState(false);

  // Twilio
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [showTwilioToken, setShowTwilioToken] = useState(false);
  const [twilioPhone, setTwilioPhone] = useState('');
  const [testingTwilio, setTestingTwilio] = useState(false);

  // SendGrid
  const [sendgridKey, setSendgridKey] = useState('');
  const [showSendgridKey, setShowSendgridKey] = useState(false);
  const [testingSendgrid, setTestingSendgrid] = useState(false);

  // Stripe
  const [stripeKey, setStripeKey] = useState('');
  const [showStripeKey, setShowStripeKey] = useState(false);
  const [testingStripe, setTestingStripe] = useState(false);

  // Handlers
  const handleTestSerper = async () => {
    setTestingSerper(true);
    try {
      const result = await api.settings.testSerper(serperKey || undefined);
      if (result.valid) showToast('Serper API key is valid');
      else showToast(result.error || 'Invalid API key', 'error');
    } catch (err) {
      showToast(`Test failed: ${err.message}`, 'error');
    } finally {
      setTestingSerper(false);
    }
  };

  const handleSaveSerperKey = async () => {
    try {
      await api.settings.update({ serper_api_key: serperKey });
      setSerperKey('');
      refetchSettings();
      showToast('Serper API key saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    }
  };

  const handleSavePlacesKey = async () => {
    try {
      await api.settings.update({ google_places_api_key: placesKey });
      setPlacesKey('');
      refetchSettings();
      showToast('Google Places API key saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    }
  };

  const handleTestGoogleMaps = async () => {
    setTestingGoogleMaps(true);
    try {
      const result = await api.settings.testGoogleMaps(googleMapsKey || undefined);
      if (result.valid) showToast('Google Maps API key is valid');
      else showToast(result.error || 'Invalid API key', 'error');
    } catch (err) {
      showToast(`Test failed: ${err.message}`, 'error');
    } finally {
      setTestingGoogleMaps(false);
    }
  };

  const handleSaveGoogleMapsKey = async () => {
    try {
      await api.settings.update({ google_maps_api_key: googleMapsKey });
      setGoogleMapsKey('');
      refetchSettings();
      showToast('Google Maps API key saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    }
  };

  const handleTestAnthropic = async () => {
    setTestingAnthropic(true);
    try {
      const result = await api.settings.testAnthropic(anthropicKey || undefined);
      if (result.valid) showToast('Anthropic API key is valid');
      else showToast(result.error || 'Invalid API key', 'error');
    } catch (err) {
      showToast(`Test failed: ${err.message}`, 'error');
    } finally {
      setTestingAnthropic(false);
    }
  };

  const handleSaveAnthropicKey = async () => {
    try {
      await api.settings.update({ anthropic_api_key: anthropicKey });
      setAnthropicKey('');
      refetchSettings();
      showToast('Anthropic API key saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    }
  };

  const handleTestTwilio = async () => {
    setTestingTwilio(true);
    try {
      const result = await api.settings.testTwilio(twilioSid || undefined, twilioToken || undefined);
      if (result.valid) showToast('Twilio credentials are valid');
      else showToast(result.error || 'Invalid credentials', 'error');
    } catch (err) {
      showToast(`Test failed: ${err.message}`, 'error');
    } finally {
      setTestingTwilio(false);
    }
  };

  const handleSaveTwilio = async () => {
    try {
      const u = {};
      if (twilioSid) u.twilio_account_sid = twilioSid;
      if (twilioToken) u.twilio_auth_token = twilioToken;
      if (twilioPhone) u.twilio_from_number = twilioPhone;
      await api.settings.update(u);
      setTwilioSid(''); setTwilioToken('');
      refetchSettings();
      showToast('Twilio settings saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    }
  };

  const handleTestSendgrid = async () => {
    setTestingSendgrid(true);
    try {
      const result = await api.settings.testSendgrid(sendgridKey || undefined);
      if (result.valid) showToast('SendGrid API key is valid');
      else showToast(result.error || 'Invalid API key', 'error');
    } catch (err) {
      showToast(`Test failed: ${err.message}`, 'error');
    } finally {
      setTestingSendgrid(false);
    }
  };

  const handleSaveSendgridKey = async () => {
    try {
      await api.settings.update({ sendgrid_api_key: sendgridKey });
      setSendgridKey('');
      refetchSettings();
      showToast('SendGrid API key saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    }
  };

  const handleTestStripe = async () => {
    setTestingStripe(true);
    try {
      const result = await api.settings.testStripe(stripeKey || undefined);
      if (result.valid) showToast('Stripe API key is valid');
      else showToast(result.error || 'Invalid API key', 'error');
    } catch (err) {
      showToast(`Test failed: ${err.message}`, 'error');
    } finally {
      setTestingStripe(false);
    }
  };

  const handleSaveStripeKey = async () => {
    try {
      await api.settings.update({ stripe_api_key: stripeKey });
      setStripeKey('');
      refetchSettings();
      showToast('Stripe API key saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    }
  };

  return {
    serperKey, setSerperKey,
    showSerperKey, setShowSerperKey,
    testingSerper, handleTestSerper, handleSaveSerperKey,
    placesKey, setPlacesKey,
    showPlacesKey, setShowPlacesKey,
    handleSavePlacesKey,
    googleMapsKey, setGoogleMapsKey,
    showGoogleMapsKey, setShowGoogleMapsKey,
    testingGoogleMaps, handleTestGoogleMaps, handleSaveGoogleMapsKey,
    anthropicKey, setAnthropicKey,
    showAnthropicKey, setShowAnthropicKey,
    testingAnthropic, handleTestAnthropic, handleSaveAnthropicKey,
    twilioSid, setTwilioSid,
    twilioToken, setTwilioToken,
    showTwilioToken, setShowTwilioToken,
    twilioPhone, setTwilioPhone,
    testingTwilio, handleTestTwilio, handleSaveTwilio,
    sendgridKey, setSendgridKey,
    showSendgridKey, setShowSendgridKey,
    testingSendgrid, handleTestSendgrid, handleSaveSendgridKey,
    stripeKey, setStripeKey,
    showStripeKey, setShowStripeKey,
    testingStripe, handleTestStripe, handleSaveStripeKey,
  };
}
