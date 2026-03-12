/**
 * QuickBooks Online Integration
 * Syncs projects and estimates to QBO for invoicing
 */

import axios from 'axios';
import { db } from '../database.js';
import logger from '../logger.js';

const QBO_SANDBOX_URL = 'https://sandbox-quickbooks.api.intuit.com';
const QBO_PRODUCTION_URL = 'https://quickbooks.api.intuit.com';

class QuickBooksService {
  constructor() {
    this.clientId = process.env.QB_CLIENT_ID;
    this.clientSecret = process.env.QB_CLIENT_SECRET;
    this.redirectUri = process.env.QB_REDIRECT_URI || 'http://localhost:5001/api/integrations/qb/callback';
    this.environment = process.env.QB_ENVIRONMENT || 'sandbox';
    this.baseUrl = this.environment === 'production' ? QBO_PRODUCTION_URL : QBO_SANDBOX_URL;
    
    this.enabled = !!(this.clientId && this.clientSecret);
  }

  isAvailable() {
    return this.enabled;
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthorizationUrl() {
    if (!this.isAvailable()) {
      throw new Error('QuickBooks not configured');
    }

    const scopes = [
      'com.intuit.quickbooks.accounting'
    ];

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scopes.join(' '),
      response_type: 'code',
      state: this.generateState()
    });

    return `https://appcenter.intuit.com/connect/oauth2?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(code, realmId) {
    try {
      const response = await axios.post(
        'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri
        }),
        {
          auth: {
            username: this.clientId,
            password: this.clientSecret
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const tokens = {
        realmId,
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: new Date(Date.now() + response.data.expires_in * 1000).toISOString(),
        refreshExpiresAt: new Date(Date.now() + response.data.x_refresh_token_expires_in * 1000).toISOString()
      };

      // Save to database
      await this.saveTokens(tokens);

      return tokens;

    } catch (err) {
      logger.error('[quickbooks] Token exchange failed:', err.message);
      throw err;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken() {
    const account = await this.getActiveAccount();
    if (!account) {
      throw new Error('No QuickBooks account connected');
    }

    try {
      const response = await axios.post(
        'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: account.refreshToken
        }),
        {
          auth: {
            username: this.clientId,
            password: this.clientSecret
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const tokens = {
        realmId: account.realmId,
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || account.refreshToken,
        expiresAt: new Date(Date.now() + response.data.expires_in * 1000).toISOString(),
        refreshExpiresAt: account.refreshExpiresAt
      };

      await this.saveTokens(tokens);
      return tokens;

    } catch (err) {
      logger.error('[quickbooks] Token refresh failed:', err.message);
      throw err;
    }
  }

  /**
   * Make authenticated request to QBO API
   */
  async apiRequest(endpoint, method = 'GET', data = null) {
    let account = await this.getActiveAccount();
    if (!account) {
      throw new Error('QuickBooks not connected');
    }

    // Check if token needs refresh
    if (new Date(account.tokenExpiresAt) < new Date()) {
      await this.refreshToken();
      account = await this.getActiveAccount();
    }

    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}/v3/company/${account.realmId}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${account.accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        data
      });

      return response.data;

    } catch (err) {
      logger.error('[quickbooks] API request failed:', err.message);
      throw err;
    }
  }

  /**
   * Get company info
   */
  async getCompanyInfo() {
    return this.apiRequest('/companyinfo/' + (await this.getActiveAccount()).realmId);
  }

  /**
   * Create or get customer
   */
  async createCustomer(lead) {
    // Check if customer already exists
    const existing = await this.findCustomerByName(lead.company || lead.name);
    if (existing) return existing;

    const customer = {
      DisplayName: lead.company || lead.name,
      CompanyName: lead.company,
      PrimaryEmailAddr: lead.email ? { Address: lead.email } : undefined,
      PrimaryPhone: lead.phone ? { FreeFormNumber: lead.phone } : undefined,
      BillAddr: lead.address ? {
        Line1: lead.address,
        City: lead.city,
        CountrySubDivisionCode: lead.state,
        PostalCode: lead.zip
      } : undefined
    };

    const result = await this.apiRequest('/customer', 'POST', customer);
    return result.Customer;
  }

  /**
   * Find customer by name
   */
  async findCustomerByName(name) {
    try {
      const query = `SELECT * FROM Customer WHERE DisplayName = '${name.replace(/'/g, "\\'")}'`;
      const result = await this.apiRequest(`/query?query=${encodeURIComponent(query)}`);
      return result.QueryResponse.Customer?.[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * Create invoice from estimate
   */
  async createInvoice(estimate, lead) {
    // Create/get customer
    const customer = await this.createCustomer(lead);

    // Build line items
    const lineItems = estimate.items?.map(item => ({
      DetailType: 'SalesItemLineDetail',
      Amount: item.qty * item.unitPrice,
      SalesItemLineDetail: {
        Qty: item.qty,
        UnitPrice: item.unitPrice,
        ItemRef: {
          name: item.description
        }
      },
      Description: item.description
    })) || [];

    const invoice = {
      CustomerRef: {
        value: customer.Id
      },
      Line: lineItems,
      DueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
      PrivateNote: `Project: ${estimate.projectName || lead.projectAddress}`
    };

    const result = await this.apiRequest('/invoice', 'POST', invoice);
    
    logger.info('[quickbooks] Invoice created', {
      invoiceId: result.Invoice.Id,
      customer: customer.DisplayName,
      amount: result.Invoice.TotalAmt
    });

    return result.Invoice;
  }

  /**
   * Get invoices
   */
  async getInvoices(limit = 10) {
    const query = `SELECT * FROM Invoice ORDER BY TxnDate DESC MAXRESULTS ${limit}`;
    const result = await this.apiRequest(`/query?query=${encodeURIComponent(query)}`);
    return result.QueryResponse.Invoice || [];
  }

  /**
   * Create item (service/product)
   */
  async createItem(name, description, price) {
    const item = {
      Name: name,
      Description: description,
      UnitPrice: price,
      Type: 'Service',
      IncomeAccountRef: {
        name: 'Sales of Product Income'
      }
    };

    const result = await this.apiRequest('/item', 'POST', item);
    return result.Item;
  }

  // ═══════════════════════════════════════════════════════════════
  // Database Operations
  // ═══════════════════════════════════════════════════════════════

  async saveTokens(tokens) {
    const { randomUUID } = await import('crypto');
    const id = randomUUID();
    const now = new Date().toISOString();

    // Deactivate existing
    await db.query(`UPDATE quickbooks_accounts SET isActive = 0 WHERE isActive = 1`);

    // Insert new
    await db.query(`
      INSERT INTO quickbooks_accounts (id, realmId, accessToken, refreshToken, tokenExpiresAt, refreshExpiresAt, companyName, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `, [
      id, tokens.realmId, tokens.accessToken, tokens.refreshToken,
      tokens.expiresAt, tokens.refreshExpiresAt, 'Connected', now, now
    ]);

    return id;
  }

  async getActiveAccount() {
    const result = await db.queryOne('SELECT * FROM quickbooks_accounts WHERE isActive = 1 LIMIT 1');
    return result;
  }

  async disconnect() {
    await db.query('UPDATE quickbooks_accounts SET isActive = 0 WHERE isActive = 1');
    logger.info('[quickbooks] Account disconnected');
  }

  generateState() {
    return Math.random().toString(36).substring(2, 15);
  }
}

export const quickBooksService = new QuickBooksService();
export default QuickBooksService;
