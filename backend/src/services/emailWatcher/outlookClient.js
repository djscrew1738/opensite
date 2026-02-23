/**
 * Microsoft Graph API Client for Outlook
 * Handles OAuth2 authentication and inbox fetching
 */

import axios from 'axios';
import logger from '../logger.js';
import { db } from '../database.js';

class OutlookClient {
  constructor(accountId = null) {
    this.accountId = accountId;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;
    
    // Microsoft Graph endpoints
    this.baseUrl = 'https://graph.microsoft.com/v1.0';
    this.authUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0';
    
    this.redirectUri = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:5001/api/email-alerts/auth/callback';
    
    // Scopes needed for reading emails
    this.scopes = [
      'https://graph.microsoft.com/Mail.Read',
      'https://graph.microsoft.com/Mail.ReadWrite',
      'https://graph.microsoft.com/User.Read',
      'offline_access'
    ];
  }

  /**
   * Load account credentials from database
   */
  async loadAccount() {
    // OAuth2 credentials from env or settings
    this.clientId = process.env.MICROSOFT_CLIENT_ID || (await db.getSetting('microsoft_client_id'));
    this.clientSecret = process.env.MICROSOFT_CLIENT_SECRET || (await db.getSetting('microsoft_client_secret'));

    if (!this.accountId) {
      // Use default/first active account
      const allAccounts = await db.getActiveEmailWatcherAccounts();
      if (allAccounts.length === 0) {
        throw new Error('No active email watcher accounts configured');
      }
      this.accountId = allAccounts[0].id;
    }

    const allAccounts = await db.getActiveEmailWatcherAccounts();
    const account = allAccounts.find(a => a.id === this.accountId);
    
    if (!account) {
      throw new Error(`Email watcher account ${this.accountId} not found`);
    }

    // Get full account data with tokens
    const fullAccount = await db.get('SELECT * FROM email_watcher_accounts WHERE id = ?', [this.accountId]);
    
    this.accessToken = fullAccount.access_token;
    this.refreshToken = fullAccount.refresh_token;
    this.tokenExpiresAt = fullAccount.token_expires_at;
    this.emailAddress = fullAccount.email_address;

    // Refresh token if needed
    if (this.tokenExpiresAt && new Date(this.tokenExpiresAt) <= new Date()) {
      await this.refreshAccessToken();
    }

    return this;
  }

  /**
   * Get OAuth2 authorization URL
   */
  async getAuthUrl() {
    if (!this.clientId) {
      this.clientId = process.env.MICROSOFT_CLIENT_ID || (await db.getSetting('microsoft_client_id'));
    }
    
    if (!this.clientId) {
      throw new Error('Microsoft Client ID not configured');
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(' '),
      response_mode: 'query',
      state: Math.random().toString(36).substring(7),
    });

    return `${this.authUrl}/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code) {
    if (!this.clientId) {
      this.clientId = process.env.MICROSOFT_CLIENT_ID || (await db.getSetting('microsoft_client_id'));
    }
    if (!this.clientSecret) {
      this.clientSecret = process.env.MICROSOFT_CLIENT_SECRET || (await db.getSetting('microsoft_client_secret'));
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Microsoft OAuth credentials not configured');
    }

    try {
      const response = await axios.post(`${this.authUrl}/token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const { access_token, refresh_token, expires_in } = response.data;
      
      this.accessToken = access_token;
      this.refreshToken = refresh_token;
      this.tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

      return {
        access_token,
        refresh_token,
        expires_at: this.tokenExpiresAt,
      };
    } catch (error) {
      logger.error('[outlookClient] Token exchange failed:', error.response?.data || error.message);
      throw new Error(`Token exchange failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    if (!this.clientId) {
      this.clientId = process.env.MICROSOFT_CLIENT_ID || (await db.getSetting('microsoft_client_id'));
    }
    if (!this.clientSecret) {
      this.clientSecret = process.env.MICROSOFT_CLIENT_SECRET || (await db.getSetting('microsoft_client_secret'));
    }

    try {
      const response = await axios.post(`${this.authUrl}/token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token',
        scope: this.scopes.join(' '),
      }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const { access_token, refresh_token, expires_in } = response.data;
      
      this.accessToken = access_token;
      // Microsoft may return a new refresh token
      if (refresh_token) {
        this.refreshToken = refresh_token;
      }
      this.tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

      // Update database
      if (this.accountId) {
        await db.updateEmailWatcherAccountTokens(this.accountId, {
          access_token: this.accessToken,
          refresh_token: this.refreshToken,
          expires_at: this.tokenExpiresAt,
        });
      }

      logger.debug('[outlookClient] Access token refreshed');
      return true;
    } catch (error) {
      logger.error('[outlookClient] Token refresh failed:', error.response?.data || error.message);
      throw new Error(`Token refresh failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Make authenticated request to Microsoft Graph
   */
  async request(endpoint, options = {}) {
    if (!this.accessToken) {
      await this.loadAccount();
    }

    // Check token expiration
    if (this.tokenExpiresAt && new Date(this.tokenExpiresAt) <= new Date(Date.now() + 60000)) {
      await this.refreshAccessToken();
    }

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await axios({
        url,
        method: options.method || 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        data: options.body,
        params: options.params,
        timeout: options.timeout || 30000,
      });

      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        // Token expired, try refresh once
        await this.refreshAccessToken();
        return this.request(endpoint, options);
      }
      
      logger.error('[outlookClient] Graph API request failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get unread messages from inbox
   */
  async getUnreadMessages(options = {}) {
    const {
      top = 25,
      skip = 0,
      since,
      select = 'id,from,sender,subject,bodyPreview,receivedDateTime,createdDateTime,internetMessageId',
    } = options;

    let filter = 'isRead eq false';
    if (since) {
      filter += ` and receivedDateTime ge ${since}`;
    }

    const params = {
      $filter: filter,
      $select: select,
      $top: top,
      $skip: skip,
      $orderby: 'receivedDateTime desc',
    };

    const data = await this.request('/me/mailFolders/inbox/messages', { params });
    return data.value || [];
  }

  /**
   * Get full message content
   */
  async getMessage(messageId) {
    return this.request(`/me/messages/${messageId}`);
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId) {
    return this.request(`/me/messages/${messageId}`, {
      method: 'PATCH',
      body: { isRead: true },
    });
  }

  /**
   * Get user profile
   */
  async getProfile() {
    return this.request('/me');
  }

  /**
   * Check connection health
   */
  async healthCheck() {
    try {
      if (!this.accessToken) {
        await this.loadAccount();
      }

      const profile = await this.getProfile();
      return {
        connected: true,
        email: profile.mail || profile.userPrincipalName,
        displayName: profile.displayName,
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
      };
    }
  }
}

export { OutlookClient };
export default OutlookClient;
