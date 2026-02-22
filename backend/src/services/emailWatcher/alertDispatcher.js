/**
 * Alert Dispatcher
 * Routes email alerts to appropriate channels (SMS, Telegram, or both)
 */

import logger from '../logger.js';
import { db } from '../database.js';
import { twilioAlert } from './twilioAlert.js';
import { telegramAlert } from './telegramAlert.js';

class AlertDispatcher {
  constructor() {
    this.channels = {
      sms: twilioAlert,
      telegram: telegramAlert,
    };
  }

  /**
   * Dispatch alert to configured channels based on rule
   */
  async dispatch(emailData, rule, processedEmailId) {
    const channels = this.getChannelsForRule(rule);
    const results = [];

    for (const channel of channels) {
      try {
        const result = await this.sendToChannel(channel, emailData, rule);
        
        // Log the alert
        const logEntry = db.logAlert({
          processed_email_id: processedEmailId,
          rule_id: rule.id,
          channel: channel,
          status: result.success ? 'sent' : 'failed',
          error_message: result.error || null,
        });

        results.push({
          channel,
          success: result.success,
          messageId: result.messageId,
          error: result.error,
          logId: logEntry.id,
        });

        if (result.success) {
          logger.info(`[alertDispatcher] Alert sent via ${channel} for rule ${rule.name}`);
        } else {
          logger.error(`[alertDispatcher] Failed to send via ${channel}:`, result.error);
        }
      } catch (error) {
        logger.error(`[alertDispatcher] Exception sending via ${channel}:`, error.message);
        
        // Log the failure
        db.logAlert({
          processed_email_id: processedEmailId,
          rule_id: rule.id,
          channel: channel,
          status: 'failed',
          error_message: error.message,
        });

        results.push({
          channel,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      processedEmailId,
      ruleId: rule.id,
      results,
      allSucceeded: results.every(r => r.success),
      anySucceeded: results.some(r => r.success),
    };
  }

  /**
   * Get list of channels to use based on rule configuration
   */
  getChannelsForRule(rule) {
    switch (rule.alert_channels) {
      case 'sms':
        return ['sms'];
      case 'telegram':
        return ['telegram'];
      case 'both':
      default:
        return ['sms', 'telegram'];
    }
  }

  /**
   * Send alert to a specific channel
   */
  async sendToChannel(channel, emailData, rule) {
    const alertData = {
      sender: emailData.from?.emailAddress?.name || emailData.sender,
      senderEmail: emailData.from?.emailAddress?.address || emailData.senderEmail,
      subject: emailData.subject,
      bodyPreview: emailData.bodyPreview,
      receivedAt: emailData.receivedDateTime || emailData.receivedAt,
      matchedKeywords: emailData.matchedKeywords,
      priority: rule.priority,
      outlookMessageId: emailData.id,
      messageUrl: this.generateOutlookWebUrl(emailData.id),
    };

    const sender = this.channels[channel];
    if (!sender) {
      throw new Error(`Unknown alert channel: ${channel}`);
    }

    return sender.send(alertData);
  }

  /**
   * Generate Outlook Web URL for message
   */
  generateOutlookWebUrl(messageId) {
    // Microsoft 365 Outlook Web URL format
    // Note: This requires the message to be accessible in the user's mailbox
    if (!messageId) return null;
    
    // Use a generic OWA URL that will open the inbox
    // Deep linking to specific messages requires additional Microsoft Graph APIs
    return 'https://outlook.office.com/mail/';
  }

  /**
   * Send test alerts to all configured channels
   */
  async sendTest(channels = ['sms', 'telegram']) {
    const results = [];

    for (const channel of channels) {
      try {
        let result;
        
        switch (channel) {
          case 'sms':
            result = await twilioAlert.sendTest();
            break;
          case 'telegram':
            result = await telegramAlert.sendTest();
            break;
          default:
            throw new Error(`Unknown channel: ${channel}`);
        }

        results.push({
          channel,
          success: true,
          ...result,
        });
      } catch (error) {
        results.push({
          channel,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Get status of all alert channels
   */
  getStatus() {
    return {
      sms: twilioAlert.getStatus(),
      telegram: telegramAlert.getStatus(),
    };
  }

  /**
   * Check if any channel is configured
   */
  isAnyChannelConfigured() {
    const status = this.getStatus();
    return status.sms.configured || status.telegram.configured;
  }
}

export const alertDispatcher = new AlertDispatcher();
export default alertDispatcher;
