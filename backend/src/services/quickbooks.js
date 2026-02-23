/**
 * QuickBooks Online Integration Service
 * Handles OAuth2 and API interactions with Intuit QBO
 */

import OAuthClient from 'intuit-oauth';
import axios from 'axios';
import { db } from './database.js';
import logger from './logger.js';

class QuickBooksService {
  constructor() {
    this.oauthClient = null;
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://quickbooks.api.intuit.com/v3/company' 
      : 'https://sandbox-quickbooks.api.intuit.com/v3/company';
  }

  /**
   * Initialize OAuth client with latest credentials
   */
  async _initClient() {
    const clientId = await db.getSetting('qbo_client_id') || process.env.QBO_CLIENT_ID;
    const clientSecret = await db.getSetting('qbo_client_secret') || process.env.QBO_CLIENT_SECRET;
    const redirectUri = await db.getSetting('qbo_redirect_uri') || process.env.QBO_REDIRECT_URI || 'http://localhost:5001/api/quickbooks/callback';

    if (!clientId || !clientSecret) {
      throw new Error('QuickBooks Client ID or Secret not configured');
    }

    this.oauthClient = new OAuthClient({
      clientId,
      clientSecret,
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
      redirectUri
    });
  }

  /**
   * Get Authorization URL
   */
  async getAuthUrl() {
    await this._initClient();
    return this.oauthClient.authorizeUri({
      scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
      state: 'opensite-qbo-auth'
    });
  }

  /**
   * Exchange code for tokens
   */
  async exchangeCode(url) {
    await this._initClient();
    const authResponse = await this.oauthClient.createToken(url);
    const token = authResponse.getJson();
    
    // Get company info to get real name
    const realmId = this.oauthClient.token.realmId;
    
    await db.upsertQuickBooksAccount({
      realmId,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      tokenExpiresAt: new Date(Date.now() + token.expires_in * 1000).toISOString(),
      refreshExpiresAt: new Date(Date.now() + token.x_refresh_token_expires_in * 1000).toISOString(),
      companyName: 'QuickBooks Connected'
    });

    // Try to update company name
    try {
      const companyInfo = await this.request('query?query=select * from CompanyInfo', realmId);
      if (companyInfo.QueryResponse?.CompanyInfo?.[0]) {
        const name = companyInfo.QueryResponse.CompanyInfo[0].CompanyName;
        await db.upsertQuickBooksAccount({ realmId, companyName: name });
      }
    } catch (e) {
      logger.warn('[qbo] Could not fetch company info after auth', { error: e.message });
    }

    return token;
  }

  /**
   * Get valid access token (refreshes if needed)
   */
  async getAccessToken() {
    const account = await db.getQuickBooksAccount();
    if (!account) throw new Error('QuickBooks not connected');

    const now = new Date();
    if (new Date(account.tokenExpiresAt) <= new Date(now.getTime() + 60000)) {
      logger.info('[qbo] Token expired, refreshing...');
      await this._initClient();
      this.oauthClient.setToken(account.accessToken, account.refreshToken, account.realmId);
      
      const authResponse = await this.oauthClient.refresh();
      const token = authResponse.getJson();
      
      await db.upsertQuickBooksAccount({
        realmId: account.realmId,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        tokenExpiresAt: new Date(Date.now() + token.expires_in * 1000).toISOString(),
        refreshExpiresAt: new Date(Date.now() + token.x_refresh_token_expires_in * 1000).toISOString(),
      });
      
      return token.access_token;
    }

    return account.accessToken;
  }

  /**
   * Make authenticated request to QBO API
   */
  async request(endpoint, realmId, method = 'GET', data = null) {
    const accessToken = await this.getAccessToken();
    const url = `${this.baseUrl}/${realmId}/${endpoint}`;

    try {
      const response = await axios({
        url,
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        data
      });
      return response.data;
    } catch (error) {
      logger.error('[qbo] API Request failed', { 
        endpoint, 
        error: error.response?.data || error.message 
      });
      throw error;
    }
  }

  /**
   * Sync an Estimate to QuickBooks
   */
  async syncEstimate(estimateId) {
    const estimate = await db.getEstimate(estimateId);
    const account = await db.getQuickBooksAccount();
    if (!estimate || !account) throw new Error('Estimate or QBO account missing');

    // 1. Get or Create Customer
    const lead = await db.getLead(estimate.leadId);
    let qboCustomerId = (await db.getQuickBooksMapping(lead.id, 'customer'))?.qboId;

    if (!qboCustomerId) {
      const customer = await this.createCustomer({
        DisplayName: lead.company || lead.name,
        PrimaryEmailAddr: { Address: lead.email },
        PrimaryPhone: { FreeFormNumber: lead.phone }
      }, account.realmId);
      qboCustomerId = customer.Customer.Id;
      await db.setQuickBooksMapping(lead.id, qboCustomerId, 'customer');
    }

    // 2. Build Line Items
    const lines = [];
    if (estimate.breakdown) {
      for (const [key, phase] of Object.entries(estimate.breakdown)) {
        lines.push({
          Description: `${phase.name} Phase - ${estimate.sqft} sqft`,
          Amount: phase.amount,
          DetailType: 'SalesItemLineDetail',
          SalesItemLineDetail: {
            ItemRef: { value: '1', name: 'Services' }, // Default item
            Qty: 1,
            UnitPrice: phase.amount
          }
        });
      }
    }

    // 3. Send Estimate to QBO
    const qboEstimate = await this.request('estimate', account.realmId, 'POST', {
      CustomerRef: { value: qboCustomerId },
      Line: lines,
      TotalAmt: estimate.total,
      PrivateNote: `OpenSite Ref: ${estimate.id}`
    });

    await db.setQuickBooksMapping(estimate.id, qboEstimate.Estimate.Id, 'estimate');
    return qboEstimate;
  }

  async createCustomer(customerData, realmId) {
    return this.request('customer', realmId, 'POST', customerData);
  }

  async getStatus() {
    const account = await db.getQuickBooksAccount();
    if (!account) return { connected: false };
    
    const isExpired = new Date(account.refreshExpiresAt) <= new Date();
    return {
      connected: !isExpired,
      companyName: account.companyName,
      lastSync: account.updatedAt,
      realmId: account.realmId
    };
  }
}

export const quickbooksService = new QuickBooksService();
export default quickbooksService;
