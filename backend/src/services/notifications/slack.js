/**
 * Slack Notification Channel
 * Sends messages to Slack via incoming webhooks
 */

import axios from 'axios';
import logger from '../logger.js';

/**
 * Send Slack message
 * @param {Object} options
 * @param {string} options.webhook - Slack webhook URL
 * @param {string} options.text - Message text
 * @param {Array} [options.blocks] - Slack block kit blocks
 * @param {Array} [options.attachments] - Legacy attachments
 */
export async function sendSlackMessage(options) {
  const { webhook, text, blocks, attachments } = options;
  
  if (!webhook) {
    throw new Error('Slack webhook URL required');
  }
  
  if (!text && !blocks) {
    throw new Error('Message text or blocks required');
  }
  
  const payload = {
    text,
    ...(blocks && { blocks }),
    ...(attachments && { attachments })
  };
  
  try {
    const response = await axios.post(webhook, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    logger.info('[notifications:slack] Message sent', {
      status: response.status
    });
    
    return {
      success: true,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    logger.error('[notifications:slack] Failed to send:', err.message);
    throw err;
  }
}

export default { sendSlackMessage };
