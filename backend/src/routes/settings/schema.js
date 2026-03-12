/**
 * Settings Validation Schemas
 * Zod schemas for settings validation
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// Base Schemas
// ═══════════════════════════════════════════════════════════════

export const temperatureSchema = z.number().min(0).max(2);
export const urlSchema = z.string().url();
export const apiKeySchema = z.string().min(1);

// ═══════════════════════════════════════════════════════════════
// AI Provider Schemas
// ═══════════════════════════════════════════════════════════════

export const AIProviderSchema = z.enum(['ollama', 'groq', 'anthropic', 'openai', 'openclaw']);

export const AISettingsSchema = z.object({
  provider: AIProviderSchema,
  ollama_url: urlSchema.optional(),
  ollama_model: z.string().optional(),
  ollama_temperature: temperatureSchema.optional(),
  
  groq_api_key: apiKeySchema.optional(),
  groq_model: z.string().optional(),
  groq_temperature: temperatureSchema.optional(),
  
  anthropic_api_key: apiKeySchema.optional(),
  anthropic_model: z.string().optional(),
  anthropic_temperature: temperatureSchema.optional(),
  
  openai_api_key: apiKeySchema.optional(),
  openai_model: z.string().optional(),
  openai_temperature: temperatureSchema.optional(),
  
  openclaw_url: urlSchema.optional(),
  openclaw_token: apiKeySchema.optional(),
  openclaw_model: z.string().optional(),
  openclaw_temperature: temperatureSchema.optional(),
  
  // Advanced settings
  ai_max_tokens: z.coerce.number().min(100).max(32000).optional(),
  ai_top_p: z.coerce.number().min(0).max(1).optional(),
  ai_streaming: z.coerce.boolean().optional(),
  ai_system_prompt: z.string().max(4000).optional(),
});

// ═══════════════════════════════════════════════════════════════
// Business Profile Schema
// ═══════════════════════════════════════════════════════════════

export const BusinessSettingsSchema = z.object({
  company_name: z.string().min(1).max(100).optional(),
  service_area: z.string().max(200).optional(),
  specialization: z.string().max(200).optional(),
  business_phone: z.string().max(20).optional(),
  business_email: z.string().email().optional(),
  business_website: z.string().url().optional().or(z.literal('')),
  business_license: z.string().max(50).optional(),
  business_insurance: z.string().max(50).optional(),
  business_state: z.string().length(2).optional(),
  business_zip: z.string().regex(/^\d{5}(-\d{4})?$/).optional(),
});

// ═══════════════════════════════════════════════════════════════
// Estimating Schema
// ═══════════════════════════════════════════════════════════════

export const EstimatingSettingsSchema = z.object({
  estimate_labor_rate: z.coerce.number().min(1).max(500).optional(),
  estimate_markup: z.coerce.number().min(0).max(100).optional(),
  estimate_overhead: z.coerce.number().min(0).max(100).optional(),
  estimate_tax_rate: z.coerce.number().min(0).max(20).optional(),
  estimate_terms: z.string().max(50).optional(),
  estimate_deposit_pct: z.coerce.number().min(0).max(100).optional(),
  estimate_expiry_days: z.coerce.number().min(1).max(365).optional(),
  estimate_include_tax: z.coerce.boolean().optional(),
  estimate_auto_markup: z.coerce.boolean().optional(),
});

// ═══════════════════════════════════════════════════════════════
// Discovery Schema
// ═══════════════════════════════════════════════════════════════

export const DiscoverySettingsSchema = z.object({
  discovery_max_results: z.coerce.number().min(1).max(500).optional(),
  discovery_min_score: z.coerce.number().min(1).max(10).optional(),
  discovery_auto_score: z.coerce.boolean().optional(),
  discovery_excluded_keywords: z.string().max(500).optional(),
  discovery_radius: z.coerce.number().min(1).max(500).optional(),
  discovery_auto_archive: z.coerce.boolean().optional(),
  discovery_archive_threshold: z.coerce.number().min(1).max(30).optional(),
  discovery_followup_days: z.coerce.number().min(1).max(90).optional(),
});

// ═══════════════════════════════════════════════════════════════
// Notifications Schema
// ═══════════════════════════════════════════════════════════════

export const NotificationSettingsSchema = z.object({
  notify_enabled: z.coerce.boolean().optional(),
  notify_email_enabled: z.coerce.boolean().optional(),
  notify_email_address: z.string().email().optional().or(z.literal('')),
  notify_sms_enabled: z.coerce.boolean().optional(),
  notify_admin_phone: z.string().max(20).optional(),
  notify_on_new_lead: z.coerce.boolean().optional(),
  notify_on_high_score: z.coerce.boolean().optional(),
  notify_on_permit: z.coerce.boolean().optional(),
  notify_digest_enabled: z.coerce.boolean().optional(),
  notify_digest_day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']).optional(),
  notify_digest_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
});

// ═══════════════════════════════════════════════════════════════
// Performance Schema
// ═══════════════════════════════════════════════════════════════

export const PerformanceSettingsSchema = z.object({
  perf_cache_ttl: z.coerce.number().min(0).max(60).optional(),
  perf_rate_limit_max: z.coerce.number().min(10).max(10000).optional(),
  perf_request_timeout: z.coerce.number().min(5).max(300).optional(),
  perf_cb_enabled: z.coerce.boolean().optional(),
  perf_cb_threshold: z.coerce.number().min(1).max(20).optional(),
  perf_low_memory: z.coerce.boolean().optional(),
  perf_bg_jobs: z.coerce.boolean().optional(),
});

// ═══════════════════════════════════════════════════════════════
// API Keys Schema
// ═══════════════════════════════════════════════════════════════

export const APIKeysSchema = z.object({
  serper_api_key: apiKeySchema.optional(),
  google_places_api_key: apiKeySchema.optional(),
  google_maps_api_key: apiKeySchema.optional(),
  twilio_account_sid: z.string().regex(/^AC[a-f0-9]{32}$/).optional(),
  twilio_auth_token: apiKeySchema.optional(),
  twilio_from_phone: z.string().max(20).optional(),
  sendgrid_api_key: apiKeySchema.startsWith('SG.').optional(),
  stripe_api_key: z.string().startsWith('sk_').optional(),
  telegram_bot_token: apiKeySchema.optional(),
  telegram_chat_id: z.string().optional(),
});

// ═══════════════════════════════════════════════════════════════
// Test Connection Schemas
// ═══════════════════════════════════════════════════════════════

export const TestConnectionSchema = z.object({
  url: urlSchema.optional(),
  key: apiKeySchema.optional(),
});

// ═══════════════════════════════════════════════════════════════
// Combined Settings Schema
// ═══════════════════════════════════════════════════════════════

export const SettingsUpdateSchema = z.object({})
  .merge(AISettingsSchema)
  .merge(BusinessSettingsSchema)
  .merge(EstimatingSettingsSchema)
  .merge(DiscoverySettingsSchema)
  .merge(NotificationSettingsSchema)
  .merge(PerformanceSettingsSchema)
  .merge(APIKeysSchema)
  .partial();

// ═══════════════════════════════════════════════════════════════
// Masked Keys List
// ═══════════════════════════════════════════════════════════════

export const SENSITIVE_KEYS = [
  'serper_api_key',
  'google_places_api_key',
  'groq_api_key',
  'openclaw_token',
  'anthropic_api_key',
  'openai_api_key',
  'twilio_auth_token',
  'sendgrid_api_key',
  'stripe_api_key',
  'google_maps_api_key',
  'microsoft_client_secret',
  'google_client_secret',
  'telegram_bot_token',
];

// ═══════════════════════════════════════════════════════════════
// Schema Type Exports
// ═══════════════════════════════════════════════════════════════

/**
 * @typedef {z.infer<typeof AISettingsSchema>} AISettings
 * @typedef {z.infer<typeof BusinessSettingsSchema>} BusinessSettings
 * @typedef {z.infer<typeof EstimatingSettingsSchema>} EstimatingSettings
 * @typedef {z.infer<typeof DiscoverySettingsSchema>} DiscoverySettings
 * @typedef {z.infer<typeof NotificationSettingsSchema>} NotificationSettings
 * @typedef {z.infer<typeof PerformanceSettingsSchema>} PerformanceSettings
 * @typedef {z.infer<typeof APIKeysSchema>} APIKeys
 * @typedef {z.infer<typeof SettingsUpdateSchema>} SettingsUpdate
 */
