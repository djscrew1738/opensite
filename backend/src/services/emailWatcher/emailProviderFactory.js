/**
 * Email Provider Factory
 * Creates appropriate email client based on provider type (gmail/outlook)
 */

import { OutlookClient } from './outlookClient.js';
import { GmailClient } from './gmailClient.js';
import logger from '../logger.js';

class EmailProviderFactory {
  /**
   * Create email client for given provider
   */
  static create(provider, accountId = null) {
    switch (provider) {
      case 'gmail':
        return new GmailClient(accountId);
      case 'outlook':
        return new OutlookClient(accountId);
      default:
        throw new Error(`Unknown email provider: ${provider}`);
    }
  }

  /**
   * Get OAuth URL for provider
   */
  static getAuthUrl(provider, state = null) {
    switch (provider) {
      case 'gmail': {
        const client = new GmailClient();
        return client.getAuthUrl(state);
      }
      case 'outlook': {
        const client = new OutlookClient();
        return client.getAuthUrl();
      }
      default:
        throw new Error(`Unknown email provider: ${provider}`);
    }
  }

  /**
   * Exchange code for tokens
   */
  static async exchangeCode(provider, code) {
    const client = this.create(provider);
    return client.exchangeCodeForTokens(code);
  }

  /**
   * Get provider configuration status
   */
  static getProviderStatus(provider) {
    const { db } = require('../database.js');
    
    switch (provider) {
      case 'gmail': {
        const clientId = db.getSetting('google_client_id') || process.env.GOOGLE_CLIENT_ID;
        const clientSecret = db.getSetting('google_client_secret') || process.env.GOOGLE_CLIENT_SECRET;
        return {
          provider: 'gmail',
          configured: !!(clientId && clientSecret),
          hasClientId: !!clientId,
          hasClientSecret: !!clientSecret,
        };
      }
      case 'outlook': {
        const clientId = db.getSetting('microsoft_client_id') || process.env.MICROSOFT_CLIENT_ID;
        const clientSecret = db.getSetting('microsoft_client_secret') || process.env.MICROSOFT_CLIENT_SECRET;
        return {
          provider: 'outlook',
          configured: !!(clientId && clientSecret),
          hasClientId: !!clientId,
          hasClientSecret: !!clientSecret,
        };
      }
      default:
        return { provider, configured: false, error: 'Unknown provider' };
    }
  }

  /**
   * Get all provider statuses
   */
  static getAllProviderStatuses() {
    return {
      gmail: this.getProviderStatus('gmail'),
      outlook: this.getProviderStatus('outlook'),
    };
  }
}

export { EmailProviderFactory };
export default EmailProviderFactory;
