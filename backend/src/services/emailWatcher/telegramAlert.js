/**
 * Telegram Bot Alert Sender
 */

import logger from '../logger.js';
import { db } from '../database.js';

class TelegramAlert {
  constructor() {
    this.bot = null;
    this.chatId = null;
    this.initialized = false;
    this.pendingUrgent = new Map(); // Track urgent messages for follow-up
  }

  /**
   * Initialize Telegram bot
   */
  init() {
    if (this.initialized) return true;

    const token = db.getSetting('telegram_bot_token') || process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = db.getSetting('telegram_chat_id') || process.env.TELEGRAM_CHAT_ID;

    if (!token) {
      logger.warn('[telegramAlert] Telegram bot token not configured');
      return false;
    }

    if (!this.chatId) {
      logger.warn('[telegramAlert] Telegram chat ID not configured');
      return false;
    }

    // Dynamic import for node-telegram-bot-api
    try {
      // We'll use axios to send messages directly to avoid dependency issues
      this.token = token;
      this.initialized = true;
      return true;
    } catch (error) {
      logger.error('[telegramAlert] Failed to initialize:', error.message);
      return false;
    }
  }

  /**
   * Send message via Telegram Bot API
   */
  async sendMessage(text, options = {}) {
    if (!this.init()) {
      throw new Error('Telegram not configured');
    }

    const url = `https://api.telegram.org/bot${this.token}/sendMessage`;
    
    const body = {
      chat_id: this.chatId,
      text: text,
      parse_mode: options.parse_mode || 'Markdown',
      disable_web_page_preview: options.disable_web_page_preview !== false,
    };

    if (options.reply_markup) {
      body.reply_markup = options.reply_markup;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.description || 'Telegram API error');
    }

    return data.result;
  }

  /**
   * Send email alert
   */
  async send(alertData) {
    if (!this.init()) {
      return {
        success: false,
        error: 'Telegram not configured',
        channel: 'telegram',
      };
    }

    const {
      sender,
      senderEmail,
      subject,
      matchedKeywords,
      priority = 'medium',
      bodyPreview = '',
      receivedAt,
      messageUrl,
    } = alertData;

    const chatId = alertData.chatId || this.chatId;

    // Format message with Markdown
    const priorityEmoji = priority === 'high' ? '🚨' : priority === 'medium' ? '⚠️' : 'ℹ️';
    const priorityLabel = priority.toUpperCase();
    const keywordStr = Array.isArray(matchedKeywords) 
      ? matchedKeywords.map(k => `\`${k}\``).join(', ') 
      : `\`${matchedKeywords}\``;

    // Escape markdown special characters
    const escapeMd = (text) => {
      if (!text) return '';
      return text.replace(/[_*\[\]()~`>#+=|{}.!-]/g, '\\$&');
    };

    let messageText = `${priorityEmoji} *${priorityLabel} PRIORITY ALERT*\n\n`;
    messageText += `*From:* ${escapeMd(sender || 'Unknown')}`;
    if (senderEmail) {
      messageText += ` \(${escapeMd(senderEmail)}\)`;
    }
    messageText += `\n`;
    messageText += `*Subject:* ${escapeMd(subject)}\n`;
    messageText += `*Matched Keywords:* ${keywordStr}\n`;
    
    if (bodyPreview) {
      const preview = bodyPreview.length > 200 
        ? bodyPreview.substring(0, 197) + '...' 
        : bodyPreview;
      messageText += `\n*Preview:*\n${escapeMd(preview)}\n`;
    }

    messageText += `\n🕐 ${receivedAt ? new Date(receivedAt).toLocaleString() : new Date().toLocaleString()}`;
    
    if (messageUrl) {
      messageText += `\n\n[Open in Outlook](${messageUrl})`;
    }

    try {
      const result = await this.sendMessage(messageText, {
        parse_mode: 'MarkdownV2',
      });

      logger.info(`[telegramAlert] Message sent: ${result.message_id}`);

      // Schedule urgent follow-up for high priority
      if (priority === 'high') {
        this.scheduleUrgentFollowUp(result.message_id, alertData);
      }

      return {
        success: true,
        messageId: result.message_id,
        channel: 'telegram',
      };
    } catch (error) {
      logger.error('[telegramAlert] Send failed:', error.message);
      
      // Try sending without Markdown on parse error
      if (error.message?.includes('parse')) {
        try {
          const plainText = messageText.replace(/[*_`[\]]/g, '');
          const result = await this.sendMessage(plainText, { parse_mode: undefined });
          return {
            success: true,
            messageId: result.message_id,
            channel: 'telegram',
            warning: 'Sent as plain text due to markdown parsing error',
          };
        } catch (retryError) {
          logger.error('[telegramAlert] Retry failed:', retryError.message);
        }
      }

      return {
        success: false,
        error: error.message,
        channel: 'telegram',
      };
    }
  }

  /**
   * Schedule urgent follow-up for high priority alerts
   */
  scheduleUrgentFollowUp(originalMessageId, alertData) {
    const followUpKey = `${alertData.outlookMessageId}_${originalMessageId}`;
    
    // Clear any existing timeout for this message
    if (this.pendingUrgent.has(followUpKey)) {
      clearTimeout(this.pendingUrgent.get(followUpKey));
    }

    // Schedule follow-up in 30 seconds
    const timeout = setTimeout(async () => {
      try {
        await this.sendUrgentFollowUp(alertData);
      } catch (error) {
        logger.error('[telegramAlert] Urgent follow-up failed:', error.message);
      } finally {
        this.pendingUrgent.delete(followUpKey);
      }
    }, 30000);

    this.pendingUrgent.set(followUpKey, timeout);
    logger.debug(`[telegramAlert] Scheduled urgent follow-up for ${followUpKey}`);
  }

  /**
   * Send urgent follow-up message
   */
  async sendUrgentFollowUp(alertData) {
    const { sender, subject } = alertData;

    const messageText = `🚨 *URGENT FOLLOW-UP*\n\n` +
      `The following high-priority email has not been acknowledged:\n\n` +
      `*From:* ${sender || 'Unknown'}\n` +
      `*Subject:* ${subject}\n\n` +
      `Please review this email as soon as possible.`;

    const result = await this.sendMessage(messageText, {
      parse_mode: 'MarkdownV2',
    });

    logger.info(`[telegramAlert] Urgent follow-up sent: ${result.message_id}`);
    return result;
  }

  /**
   * Cancel urgent follow-up (called when user acknowledges)
   */
  cancelUrgentFollowUp(outlookMessageId, telegramMessageId) {
    const followUpKey = `${outlookMessageId}_${telegramMessageId}`;
    if (this.pendingUrgent.has(followUpKey)) {
      clearTimeout(this.pendingUrgent.get(followUpKey));
      this.pendingUrgent.delete(followUpKey);
      logger.debug(`[telegramAlert] Cancelled urgent follow-up for ${followUpKey}`);
      return true;
    }
    return false;
  }

  /**
   * Send test message
   */
  async sendTest(chatId) {
    if (!this.init()) {
      throw new Error('Telegram not configured');
    }

    const messageText = `🔧 *OpenSite Email Alert Test*\n\n` +
      `Your Telegram alerts are configured correctly!\n\n` +
      `🕐 ${new Date().toLocaleString()}`;

    const result = await this.sendMessage(messageText, {
      parse_mode: 'MarkdownV2',
      chatId: chatId || this.chatId,
    });

    return {
      messageId: result.message_id,
      chatId: result.chat.id,
    };
  }

  /**
   * Check configuration status
   */
  getStatus() {
    const token = db.getSetting('telegram_bot_token') || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = db.getSetting('telegram_chat_id') || process.env.TELEGRAM_CHAT_ID;

    return {
      configured: !!(token && chatId),
      hasToken: !!token,
      hasChatId: !!chatId,
      chatId: chatId || null,
    };
  }

  /**
   * Get bot info
   */
  async getBotInfo() {
    if (!this.init()) {
      throw new Error('Telegram not configured');
    }

    const url = `https://api.telegram.org/bot${this.token}/getMe`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.description || 'Failed to get bot info');
    }

    return data.result;
  }
}

export const telegramAlert = new TelegramAlert();
export default telegramAlert;
