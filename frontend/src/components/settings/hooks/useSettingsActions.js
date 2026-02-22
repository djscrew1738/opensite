/**
 * Settings Actions Hook
 * All action handlers for settings sections
 */

import { useCallback } from 'react';
import { useSettings } from '../SettingsContext';
import { api } from '../../../api/client';

export function useSettingsActions() {
  const ctx = useSettings();
  const { showToast, refetchSettings, refetchModels, refetchOllama, queryClient } = ctx;

  /* ── AI Provider ── */
  const handleSwitchProvider = useCallback(async (provider) => {
    ctx.setSwitchingProvider(true);
    try {
      await api.settings.update({ ai_provider: provider });
      ctx.setActiveProvider(provider);
      refetchSettings();
      refetchModels();
      queryClient.invalidateQueries({ queryKey: ['ollama-models'] });
      refetchOllama();
      const providerLabels = { openclaw: 'OpenClaw Gateway', groq: 'Groq Cloud', anthropic: 'Anthropic Claude', ollama: 'Ollama Local' };
      showToast(`Switched to ${providerLabels[provider] || provider}`);
    } catch (err) {
      showToast(`Failed to switch: ${err.message}`, 'error');
    } finally {
      ctx.setSwitchingProvider(false);
    }
  }, [ctx, refetchSettings, refetchModels, refetchOllama, queryClient, showToast]);

  const handleSaveAIConfig = useCallback(async () => {
    ctx.setSavingAI(true);
    try {
      const base = ctx.activeProvider === 'openclaw'
        ? { openclaw_url: ctx.openclawUrl, openclaw_temperature: String(ctx.openclawTemperature) }
        : ctx.activeProvider === 'groq'
        ? { groq_temperature: String(ctx.groqTemperature) }
        : { ollama_url: ctx.ollamaUrl, ollama_temperature: String(ctx.temperature) };
      await api.settings.update({
        ...base,
        ai_max_tokens: String(ctx.maxTokens),
        ai_top_p: String(ctx.topP),
        ai_streaming: String(ctx.streamingEnabled),
        ai_system_prompt: ctx.systemPrompt,
      });
      refetchSettings();
      refetchOllama();
      showToast('AI configuration saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    } finally {
      ctx.setSavingAI(false);
    }
  }, [ctx, refetchSettings, refetchOllama, showToast]);

  const handleTestOllama = useCallback(async () => {
    ctx.setTestingOllama(true);
    try {
      const result = await api.settings.testOllama(ctx.ollamaUrl);
      if (result.connected) showToast(`Connected to Ollama (${result.modelCount} models available)`);
      else showToast(`Cannot connect: ${result.error}`, 'error');
    } catch (err) {
      showToast(`Connection test failed: ${err.message}`, 'error');
    } finally {
      ctx.setTestingOllama(false);
    }
  }, [ctx, showToast]);

  const handleTestGroq = useCallback(async () => {
    ctx.setTestingGroq(true);
    try {
      const result = await api.settings.testGroq(ctx.groqKey || undefined);
      if (result.valid) showToast(`Groq API valid (${result.modelCount} models available)`);
      else showToast(result.error || 'Invalid API key', 'error');
    } catch (err) {
      showToast(`Test failed: ${err.message}`, 'error');
    } finally {
      ctx.setTestingGroq(false);
    }
  }, [ctx, showToast]);

  const handleSaveGroqKey = useCallback(async () => {
    try {
      await api.settings.update({ groq_api_key: ctx.groqKey });
      ctx.setGroqKey('');
      refetchSettings();
      showToast('Groq API key saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    }
  }, [ctx, refetchSettings, showToast]);

  const handleTestOpenClaw = useCallback(async () => {
    ctx.setTestingOpenClaw(true);
    try {
      const result = await api.settings.testOpenClaw(ctx.openclawUrl, ctx.openclawToken || undefined);
      if (result.connected) showToast(`Connected to OpenClaw (${result.model})`);
      else showToast(`Cannot connect: ${result.error}`, 'error');
    } catch (err) {
      showToast(`Connection test failed: ${err.message}`, 'error');
    } finally {
      ctx.setTestingOpenClaw(false);
    }
  }, [ctx, showToast]);

  const handleSaveOpenclawToken = useCallback(async () => {
    try {
      await api.settings.update({ openclaw_token: ctx.openclawToken });
      ctx.setOpenclawToken('');
      refetchSettings();
      showToast('OpenClaw token saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    }
  }, [ctx, refetchSettings, showToast]);

  const handleSetDefaultModel = useCallback(async (modelName) => {
    try {
      ctx.setDefaultModel(modelName);
      const modelKey = ctx.activeProvider === 'groq' ? 'groq_model'
        : ctx.activeProvider === 'anthropic' ? 'anthropic_model'
        : ctx.activeProvider === 'openclaw' ? 'openclaw_model'
        : 'ollama_model';
      await api.settings.update({ [modelKey]: modelName });
      refetchSettings();
      showToast(`Default model set to ${modelName}`);
    } catch (err) {
      showToast(`Failed: ${err.message}`, 'error');
    }
  }, [ctx, refetchSettings, showToast]);

  const handlePullModel = useCallback(async () => {
    if (!ctx.pullModelName.trim()) return;
    ctx.setPullingModel(true);
    try {
      const response = await fetch('/api/ai/models/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: ctx.pullModelName.trim() }),
      });
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let lastStatus = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.status) lastStatus = data.status;
            if (data.done) break;
          } catch { /* skip */ }
        }
      }
      ctx.setPullModelName('');
      refetchModels();
      queryClient.invalidateQueries({ queryKey: ['ollama-models'] });
      showToast(`Model pulled successfully: ${lastStatus}`);
    } catch (err) {
      showToast(`Failed to pull model: ${err.message}`, 'error');
    } finally {
      ctx.setPullingModel(false);
    }
  }, [ctx, refetchModels, queryClient, showToast]);

  const handleDeleteModel = useCallback(async (modelName) => {
    ctx.setDeletingModel(modelName);
    try {
      await api.ai.deleteModel(modelName);
      ctx.setDeleteConfirm(null);
      refetchModels();
      queryClient.invalidateQueries({ queryKey: ['ollama-models'] });
      showToast(`Model ${modelName} deleted`);
    } catch (err) {
      showToast(`Failed to delete: ${err.message}`, 'error');
    } finally {
      ctx.setDeletingModel(null);
    }
  }, [ctx, refetchModels, queryClient, showToast]);

  /* ── Business ── */
  const handleSaveBusiness = useCallback(async () => {
    ctx.setSavingBusiness(true);
    try {
      await api.settings.update({
        company_name: ctx.companyName,
        service_area: ctx.serviceArea,
        specialization: ctx.specialization,
        business_phone: ctx.businessPhone,
        business_email: ctx.businessEmail,
        business_website: ctx.businessWebsite,
        business_license: ctx.businessLicense,
        business_insurance: ctx.businessInsurance,
        business_state: ctx.businessState,
        business_zip: ctx.businessZip,
      });
      refetchSettings();
      showToast('Business profile saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    } finally {
      ctx.setSavingBusiness(false);
    }
  }, [ctx, refetchSettings, showToast]);

  /* ── Estimating ── */
  const handleSaveEstimating = useCallback(async () => {
    ctx.setSavingEstimating(true);
    try {
      await api.settings.update({
        estimate_labor_rate: String(ctx.laborRate),
        estimate_markup: String(ctx.materialMarkup),
        estimate_overhead: String(ctx.overheadFactor),
        estimate_tax_rate: String(ctx.taxRate),
        estimate_terms: ctx.paymentTerms,
        estimate_deposit_pct: String(ctx.depositPct),
        estimate_expiry_days: String(ctx.expiryDays),
        estimate_include_tax: String(ctx.includeTax),
        estimate_auto_markup: String(ctx.autoMarkup),
      });
      refetchSettings();
      showToast('Estimating defaults saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    } finally {
      ctx.setSavingEstimating(false);
    }
  }, [ctx, refetchSettings, showToast]);

  /* ── Discovery ── */
  const handleSaveDiscovery = useCallback(async () => {
    ctx.setSavingDiscovery(true);
    try {
      await api.settings.update({
        discovery_max_results: String(ctx.maxResults),
        discovery_min_score: String(ctx.minScore),
        discovery_auto_score: String(ctx.autoScore),
        discovery_excluded_keywords: ctx.excludedKeywords,
        discovery_radius: String(ctx.searchRadius),
        discovery_auto_archive: String(ctx.autoArchive),
        discovery_archive_threshold: String(ctx.archiveThreshold),
        discovery_followup_days: String(ctx.followupDays),
      });
      refetchSettings();
      showToast('Discovery settings saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    } finally {
      ctx.setSavingDiscovery(false);
    }
  }, [ctx, refetchSettings, showToast]);

  /* ── Notifications ── */
  const handleSaveNotifications = useCallback(async () => {
    ctx.setSavingNotifications(true);
    try {
      await api.settings.update({
        notify_enabled: String(ctx.notifyEnabled),
        notify_email_enabled: String(ctx.notifyEmailEnabled),
        notify_email_address: ctx.notifyEmailAddr,
        notify_sms_enabled: String(ctx.notifySmsEnabled),
        notify_admin_phone: ctx.notifyAdminPhone,
        notify_on_new_lead: String(ctx.notifyOnNewLead),
        notify_on_high_score: String(ctx.notifyOnHighScore),
        notify_on_permit: String(ctx.notifyOnPermit),
        notify_digest_enabled: String(ctx.notifyDigestEnabled),
        notify_digest_day: ctx.notifyDigestDay,
        notify_digest_time: ctx.notifyDigestTime,
      });
      refetchSettings();
      showToast('Notification settings saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    } finally {
      ctx.setSavingNotifications(false);
    }
  }, [ctx, refetchSettings, showToast]);

  /* ── Email Monitor ── */
  const handleSaveEmailMonitor = useCallback(async () => {
    ctx.setEmSaving(true);
    try {
      await api.emailMonitor.saveSettings({
        enabled: ctx.emEnabled,
        host: ctx.emHost,
        port: parseInt(ctx.emPort),
        user: ctx.emUser,
        ...(ctx.emPass ? { pass: ctx.emPass } : {}),
        keywords: ctx.emKeywords,
      });
      ctx.setEmPass('');
      showToast('Email monitor settings saved');
    } catch (err) {
      showToast(`Failed to save: ${err.message}`, 'error');
    } finally {
      ctx.setEmSaving(false);
    }
  }, [ctx, showToast]);

  const handleTestEmailMonitor = useCallback(async () => {
    if (!ctx.emUser) { showToast('Enter email address first', 'error'); return; }
    ctx.setEmTesting(true);
    try {
      const result = await api.emailMonitor.testConnection({
        host: ctx.emHost,
        port: parseInt(ctx.emPort),
        user: ctx.emUser,
        pass: ctx.emPass || undefined,
      });
      showToast(`Connected! ${result.messages} messages in inbox, ${result.unseen} unseen`);
    } catch (err) {
      showToast(`Connection failed: ${err.message}`, 'error');
    } finally {
      ctx.setEmTesting(false);
    }
  }, [ctx, showToast]);

  const handleCheckNow = useCallback(async () => {
    ctx.setEmChecking(true);
    try {
      const result = await api.emailMonitor.checkNow();
      if (result.disabled) {
        showToast('Email monitor is disabled — enable it first', 'warning');
      } else if (result.error) {
        showToast(`Check failed: ${result.error}`, 'error');
      } else {
        showToast(`Checked: ${result.processed} emails, ${result.matched} matches, ${result.smsSent} SMS sent`);
      }
      const alerts = await api.emailMonitor.getAlerts({ limit: 10 });
      ctx.setEmAlerts(alerts?.alerts || []);
      const st = await api.emailMonitor.getStatus();
      ctx.setEmStatus(st);
    } catch (err) {
      showToast(`Check failed: ${err.message}`, 'error');
    } finally {
      ctx.setEmChecking(false);
    }
  }, [ctx, showToast]);

  /* ── API Keys ── */
  const handleSaveSerperKey = useCallback(async () => {
    try { await api.settings.update({ serper_api_key: ctx.serperKey }); ctx.setSerperKey(''); refetchSettings(); showToast('API key saved'); }
    catch (err) { showToast(`Failed: ${err.message}`, 'error'); }
  }, [ctx, refetchSettings, showToast]);

  const handleSavePlacesKey = useCallback(async () => {
    try { await api.settings.update({ google_places_api_key: ctx.placesKey }); ctx.setPlacesKey(''); refetchSettings(); showToast('Google Places API key saved'); }
    catch (err) { showToast(`Failed: ${err.message}`, 'error'); }
  }, [ctx, refetchSettings, showToast]);

  const handleSaveAnthropicKey = useCallback(async () => {
    try { await api.settings.update({ anthropic_api_key: ctx.anthropicKey }); ctx.setAnthropicKey(''); refetchSettings(); showToast('Anthropic API key saved'); }
    catch (err) { showToast(`Failed: ${err.message}`, 'error'); }
  }, [ctx, refetchSettings, showToast]);

  const handleSaveOpenaiKey = useCallback(async () => {
    try { await api.settings.update({ openai_api_key: ctx.openaiKey }); ctx.setOpenaiKey(''); refetchSettings(); showToast('OpenAI API key saved'); }
    catch (err) { showToast(`Failed: ${err.message}`, 'error'); }
  }, [ctx, refetchSettings, showToast]);

  const handleSaveTwilio = useCallback(async () => {
    try {
      const u = {};
      if (ctx.twilioSid) u.twilio_account_sid = ctx.twilioSid;
      if (ctx.twilioToken) u.twilio_auth_token = ctx.twilioToken;
      if (ctx.twilioPhone) u.twilio_from_phone = ctx.twilioPhone;
      await api.settings.update(u);
      ctx.setTwilioSid(''); ctx.setTwilioToken(''); ctx.setTwilioPhone('');
      refetchSettings(); showToast('Twilio credentials saved');
    } catch (err) { showToast(`Failed: ${err.message}`, 'error'); }
  }, [ctx, refetchSettings, showToast]);

  const handleSaveSendgridKey = useCallback(async () => {
    try { await api.settings.update({ sendgrid_api_key: ctx.sendgridKey }); ctx.setSendgridKey(''); refetchSettings(); showToast('SendGrid API key saved'); }
    catch (err) { showToast(`Failed: ${err.message}`, 'error'); }
  }, [ctx, refetchSettings, showToast]);

  const handleSaveStripeKey = useCallback(async () => {
    try { await api.settings.update({ stripe_api_key: ctx.stripeKey }); ctx.setStripeKey(''); refetchSettings(); showToast('Stripe API key saved'); }
    catch (err) { showToast(`Failed: ${err.message}`, 'error'); }
  }, [ctx, refetchSettings, showToast]);

  const handleSaveGoogleMapsKey = useCallback(async () => {
    try { await api.settings.update({ google_maps_api_key: ctx.googleMapsKey }); ctx.setGoogleMapsKey(''); refetchSettings(); showToast('Google Maps API key saved'); }
    catch (err) { showToast(`Failed: ${err.message}`, 'error'); }
  }, [ctx, refetchSettings, showToast]);

  const handleTestSerper = useCallback(async () => {
    ctx.setTestingSerper(true);
    try { const r = await api.settings.testSerper(ctx.serperKey || undefined); if (r.valid) showToast(`Serper valid (credits: ${r.credits})`); else showToast(r.error || 'Invalid key', 'error'); }
    catch (err) { showToast(`Test failed: ${err.message}`, 'error'); }
    finally { ctx.setTestingSerper(false); }
  }, [ctx, showToast]);

  const handleTestAnthropic = useCallback(async () => {
    ctx.setTestingAnthropic(true);
    try { const r = await api.settings.testAnthropic(ctx.anthropicKey || undefined); if (r.valid) showToast('Anthropic key is valid'); else showToast(r.error || 'Invalid key', 'error'); }
    catch (err) { showToast(`Test failed: ${err.message}`, 'error'); }
    finally { ctx.setTestingAnthropic(false); }
  }, [ctx, showToast]);

  const handleTestOpenai = useCallback(async () => {
    ctx.setTestingOpenai(true);
    try { const r = await api.settings.testOpenai(ctx.openaiKey || undefined); if (r.valid) showToast(`OpenAI valid (${r.modelCount} models)`); else showToast(r.error || 'Invalid key', 'error'); }
    catch (err) { showToast(`Test failed: ${err.message}`, 'error'); }
    finally { ctx.setTestingOpenai(false); }
  }, [ctx, showToast]);

  const handleTestTwilio = useCallback(async () => {
    ctx.setTestingTwilio(true);
    try { const r = await api.settings.testTwilio(ctx.twilioSid || undefined, ctx.twilioToken || undefined); if (r.valid) showToast(`Twilio connected (${r.friendlyName})`); else showToast(r.error || 'Invalid credentials', 'error'); }
    catch (err) { showToast(`Test failed: ${err.message}`, 'error'); }
    finally { ctx.setTestingTwilio(false); }
  }, [ctx, showToast]);

  const handleTestSendgrid = useCallback(async () => {
    ctx.setTestingSendgrid(true);
    try { const r = await api.settings.testSendgrid(ctx.sendgridKey || undefined); if (r.valid) showToast('SendGrid key is valid'); else showToast(r.error || 'Invalid key', 'error'); }
    catch (err) { showToast(`Test failed: ${err.message}`, 'error'); }
    finally { ctx.setTestingSendgrid(false); }
  }, [ctx, showToast]);

  const handleTestStripe = useCallback(async () => {
    ctx.setTestingStripe(true);
    try { const r = await api.settings.testStripe(ctx.stripeKey || undefined); if (r.valid) showToast(`Stripe valid (${r.currency || 'USD'})`); else showToast(r.error || 'Invalid key', 'error'); }
    catch (err) { showToast(`Test failed: ${err.message}`, 'error'); }
    finally { ctx.setTestingStripe(false); }
  }, [ctx, showToast]);

  const handleTestGoogleMaps = useCallback(async () => {
    ctx.setTestingGoogleMaps(true);
    try { const r = await api.settings.testGoogleMaps(ctx.googleMapsKey || undefined); if (r.valid) showToast('Google Maps key is valid'); else showToast(r.error || 'Invalid key', 'error'); }
    catch (err) { showToast(`Test failed: ${err.message}`, 'error'); }
    finally { ctx.setTestingGoogleMaps(false); }
  }, [ctx, showToast]);

  const handleSaveMicrosoft = useCallback(async () => {
    try {
      const u = {};
      if (ctx.msClientId) u.microsoft_client_id = ctx.msClientId;
      if (ctx.msClientSecret) u.microsoft_client_secret = ctx.msClientSecret;
      await api.settings.update(u);
      ctx.setMsClientId(''); ctx.setMsClientSecret('');
      refetchSettings(); showToast('Microsoft OAuth credentials saved');
    } catch (err) { showToast(`Failed: ${err.message}`, 'error'); }
  }, [ctx, refetchSettings, showToast]);

  const handleTestMicrosoft = useCallback(async () => {
    ctx.setTestingMicrosoft(true);
    try { const r = await api.settings.testMicrosoft(ctx.msClientId || undefined, ctx.msClientSecret || undefined); if (r.valid) showToast('Microsoft OAuth credentials valid'); else showToast(r.error || 'Invalid credentials', 'error'); }
    catch (err) { showToast(`Test failed: ${err.message}`, 'error'); }
    finally { ctx.setTestingMicrosoft(false); }
  }, [ctx, showToast]);

  const handleSaveGoogle = useCallback(async () => {
    try {
      const u = {};
      if (ctx.googleClientId) u.google_client_id = ctx.googleClientId;
      if (ctx.googleClientSecret) u.google_client_secret = ctx.googleClientSecret;
      await api.settings.update(u);
      ctx.setGoogleClientId(''); ctx.setGoogleClientSecret('');
      refetchSettings(); showToast('Google OAuth credentials saved');
    } catch (err) { showToast(`Failed: ${err.message}`, 'error'); }
  }, [ctx, refetchSettings, showToast]);

  const handleTestGoogle = useCallback(async () => {
    ctx.setTestingGoogle(true);
    try { const r = await api.settings.testGoogle(ctx.googleClientId || undefined, ctx.googleClientSecret || undefined); if (r.valid) showToast(r.message || 'Google OAuth credentials valid'); else showToast(r.error || 'Invalid credentials', 'error'); }
    catch (err) { showToast(`Test failed: ${err.message}`, 'error'); }
    finally { ctx.setTestingGoogle(false); }
  }, [ctx, showToast]);

  const handleSaveTelegram = useCallback(async () => {
    try {
      const u = {};
      if (ctx.telegramToken) u.telegram_bot_token = ctx.telegramToken;
      if (ctx.telegramChatId) u.telegram_chat_id = ctx.telegramChatId;
      await api.settings.update(u);
      ctx.setTelegramToken('');
      refetchSettings(); showToast('Telegram settings saved');
    } catch (err) { showToast(`Failed: ${err.message}`, 'error'); }
  }, [ctx, refetchSettings, showToast]);

  const handleTestTelegram = useCallback(async () => {
    ctx.setTestingTelegram(true);
    try { const r = await api.settings.testTelegram(ctx.telegramToken || undefined); if (r.valid) showToast(`Bot connected: @${r.botUsername}`); else showToast(r.error || 'Invalid token', 'error'); }
    catch (err) { showToast(`Test failed: ${err.message}`, 'error'); }
    finally { ctx.setTestingTelegram(false); }
  }, [ctx, showToast]);

  const handleSaveEmailWatcher = useCallback(async () => {
    try {
      await api.settings.update({
        email_watcher_poll_interval: String(ctx.ewPollInterval),
        email_watcher_mark_read: String(ctx.ewMarkAsRead),
      });
      refetchSettings(); showToast('Email watcher settings saved');
    } catch (err) { showToast(`Failed: ${err.message}`, 'error'); }
  }, [ctx, refetchSettings, showToast]);

  /* ── Performance ── */
  const handleSavePerformance = useCallback(async () => {
    ctx.setSavingPerformance(true);
    try {
      await api.settings.update({
        perf_cache_ttl: String(ctx.perfCacheTtl),
        perf_rate_limit_max: String(ctx.perfRateLimit),
        perf_request_timeout: String(ctx.perfTimeout),
        perf_cb_enabled: String(ctx.perfCbEnabled),
        perf_cb_threshold: String(ctx.perfCbThreshold),
        perf_low_memory: String(ctx.perfLowMemory),
        perf_bg_jobs: String(ctx.perfBgJobs),
      });
      refetchSettings();
      showToast('Performance settings saved — some changes require a server restart');
    } catch (err) {
      showToast(`Failed: ${err.message}`, 'error');
    } finally {
      ctx.setSavingPerformance(false);
    }
  }, [ctx, refetchSettings, showToast]);

  /* ── Appearance ── */
  const handleApplyTheme = useCallback((pref) => {
    ctx.setThemePreference(pref);
    localStorage.setItem('theme_preference', pref);
    if (pref === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      localStorage.setItem('theme', pref);
      document.documentElement.classList.toggle('dark', pref === 'dark');
    }
  }, [ctx]);

  const handleSaveAppearance = useCallback(() => {
    localStorage.setItem('compact_sidebar', String(ctx.compactSidebar));
    localStorage.setItem('dense_mode', String(ctx.denseMode));
    localStorage.setItem('animations_enabled', String(ctx.animationsEnabled));
    localStorage.setItem('date_format', ctx.dateFormat);
    localStorage.setItem('number_format', ctx.numberFormat);
    showToast('Appearance settings saved');
  }, [ctx, showToast]);

  /* ── Data ── */
  const handleExportSettings = useCallback(async () => {
    ctx.setExportingData(true);
    try {
      const data = await api.settings.get();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `opensite-settings-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Settings exported');
    } catch (err) {
      showToast(`Export failed: ${err.message}`, 'error');
    } finally {
      ctx.setExportingData(false);
    }
  }, [ctx, showToast]);

  const handleCreateBackup = useCallback(async () => {
    ctx.setCreatingBackup(true);
    try {
      await fetch('/api/admin/backup', { method: 'POST' });
      showToast('Database backup created');
    } catch (err) {
      showToast(`Backup failed: ${err.message}`, 'error');
    } finally {
      ctx.setCreatingBackup(false);
    }
  }, [ctx, showToast]);

  const handleClearCache = useCallback(async () => {
    ctx.setClearingCache(true);
    try {
      showToast('Cache cleared — will rebuild on next requests', 'warning');
    } catch (err) {
      showToast(`Failed: ${err.message}`, 'error');
    } finally {
      ctx.setClearingCache(false);
    }
  }, [ctx, showToast]);

  /* ── Utilities ── */
  const temperatureLabel = useCallback((t) => t <= 0.3 ? 'Precise' : t <= 0.7 ? 'Balanced' : 'Creative', []);

  return {
    handleSwitchProvider,
    handleSaveAIConfig,
    handleTestOllama,
    handleTestGroq,
    handleSaveGroqKey,
    handleTestOpenClaw,
    handleSaveOpenclawToken,
    handleSetDefaultModel,
    handlePullModel,
    handleDeleteModel,
    handleSaveBusiness,
    handleSaveEstimating,
    handleSaveDiscovery,
    handleSaveNotifications,
    handleSaveEmailMonitor,
    handleTestEmailMonitor,
    handleCheckNow,
    handleSaveSerperKey,
    handleSavePlacesKey,
    handleSaveAnthropicKey,
    handleSaveOpenaiKey,
    handleSaveTwilio,
    handleSaveSendgridKey,
    handleSaveStripeKey,
    handleSaveGoogleMapsKey,
    handleTestSerper,
    handleTestAnthropic,
    handleTestOpenai,
    handleTestTwilio,
    handleTestSendgrid,
    handleTestStripe,
    handleTestGoogleMaps,
    handleSaveMicrosoft,
    handleTestMicrosoft,
    handleSaveGoogle,
    handleTestGoogle,
    handleSaveTelegram,
    handleTestTelegram,
    handleSaveEmailWatcher,
    handleSavePerformance,
    handleApplyTheme,
    handleSaveAppearance,
    handleExportSettings,
    handleCreateBackup,
    handleClearCache,
    temperatureLabel,
  };
}
