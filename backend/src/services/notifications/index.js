/**
 * Notification Service
 * Multi-channel notification system for email, Slack, SMS, and in-app
 */

import { sendEmail } from './email.js';
import { sendSlackMessage } from './slack.js';
import { sendSMS } from './sms.js';
import { createInAppNotification } from './inapp.js';
import logger from '../logger.js';
import { db } from '../database.js';

/**
 * Send notification through configured channels
 * @param {Object} options
 * @param {string} options.type - Notification type: 'alert', 'info', 'warning', 'success'
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {Array<string>} options.channels - Channels to use: ['email', 'slack', 'sms', 'in_app']
 * @param {Object} options.recipients - Recipients by channel
 * @param {Object} options.data - Additional data for templates
 */
export async function sendNotification(options) {
  const { type = 'info', title, message, channels = [], recipients = {}, data = {} } = options;
  
  const results = {
    success: [],
    failed: [],
    timestamp: new Date().toISOString()
  };
  
  for (const channel of channels) {
    try {
      let result;
      
      switch (channel) {
        case 'email':
          if (recipients.email) {
            result = await sendEmail({
              to: recipients.email,
              subject: title,
              text: message,
              html: data.html || `<p>${message}</p>`,
              ...data.emailOptions
            });
          }
          break;
          
        case 'slack':
          if (recipients.slack) {
            result = await sendSlackMessage({
              webhook: recipients.slack,
              text: message,
              blocks: data.slackBlocks,
              ...data.slackOptions
            });
          }
          break;
          
        case 'sms':
          if (recipients.sms) {
            result = await sendSMS({
              to: recipients.sms,
              body: message,
              ...data.smsOptions
            });
          }
          break;
          
        case 'in_app':
          if (recipients.userId) {
            result = await createInAppNotification({
              userId: recipients.userId,
              type,
              title,
              message,
              data: data.inAppData
            });
          }
          break;
          
        default:
          logger.warn(`[notifications] Unknown channel: ${channel}`);
      }
      
      if (result) {
        results.success.push({ channel, result });
      }
    } catch (err) {
      logger.error(`[notifications] ${channel} failed:`, err.message);
      results.failed.push({ channel, error: err.message });
    }
  }
  
  // Log notification
  logger.info('[notifications] Notification sent', {
    type,
    title,
    channels: channels.join(','),
    success: results.success.length,
    failed: results.failed.length
  });
  
  return results;
}

/**
 * Send system alert (for critical issues)
 * @param {string} message - Alert message
 * @param {Object} options
 */
export async function sendSystemAlert(message, options = {}) {
  const settings = await db.getSettings();
  
  const channels = [];
  const recipients = {};
  
  // Check which channels are configured
  if (settings?.admin_email) {
    channels.push('email');
    recipients.email = settings.admin_email;
  }
  
  if (settings?.slack_webhook) {
    channels.push('slack');
    recipients.slack = settings.slack_webhook;
  }
  
  if (settings?.admin_phone && options.urgent) {
    channels.push('sms');
    recipients.sms = settings.admin_phone;
  }
  
  if (channels.length === 0) {
    logger.warn('[notifications] No notification channels configured for system alert');
    return { sent: false, reason: 'no_channels' };
  }
  
  return sendNotification({
    type: 'alert',
    title: options.title || 'OpenSite System Alert',
    message,
    channels,
    recipients,
    data: options.data || {}
  });
}

/**
 * Send lead notification
 * @param {Object} lead - Lead object
 * @param {string} event - Event type: 'new', 'hot', 'follow_up'
 */
export async function sendLeadNotification(lead, event) {
  const settings = await db.getSettings();
  
  let title, message;
  
  switch (event) {
    case 'new':
      title = `New Lead: ${lead.company || lead.name}`;
      message = `A new lead has been added from ${lead.city || 'Unknown location'}.`;
      break;
    case 'hot':
      title = `🔥 Hot Lead Alert: ${lead.company || lead.name}`;
      message = `Lead scored ${lead.score}/100 - High priority follow-up recommended.`;
      break;
    case 'follow_up':
      title = `Follow-up Reminder: ${lead.company || lead.name}`;
      message = `It's time to follow up with this lead. Last contact: ${lead.lastContactDate || 'Never'}`;
      break;
    default:
      title = `Lead Update: ${lead.company || lead.name}`;
      message = `There has been an update to this lead.`;
  }
  
  const channels = [];
  const recipients = {};
  
  if (settings?.lead_notification_email) {
    channels.push('email');
    recipients.email = settings.lead_notification_email;
  }
  
  if (settings?.slack_webhook) {
    channels.push('slack');
    recipients.slack = settings.slack_webhook;
  }
  
  return sendNotification({
    type: event === 'hot' ? 'warning' : 'info',
    title,
    message,
    channels,
    recipients,
    data: {
      lead,
      slackBlocks: buildLeadSlackBlocks(lead, event)
    }
  });
}

/**
 * Build Slack blocks for lead notification
 */
function buildLeadSlackBlocks(lead, event) {
  const emoji = event === 'hot' ? '🔥' : event === 'new' ? '✨' : '📋';
  
  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} ${event === 'hot' ? 'Hot Lead Alert' : event === 'new' ? 'New Lead' : 'Lead Update'}`,
        emoji: true
      }
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Company:*\n${lead.company || 'N/A'}`
        },
        {
          type: 'mrkdwn',
          text: `*Contact:*\n${lead.name || 'N/A'}`
        },
        {
          type: 'mrkdwn',
          text: `*Location:*\n${lead.city || 'N/A'}, ${lead.state || 'TX'}`
        },
        {
          type: 'mrkdwn',
          text: `*Score:*\n${lead.score || 'N/A'}/100`
        }
      ]
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Lead',
            emoji: true
          },
          url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/leads/${lead.id}`,
          action_id: 'view_lead'
        }
      ]
    }
  ];
}

/**
 * Test all configured notification channels
 */
export async function testNotificationChannels() {
  const settings = await db.getSettings();
  const results = {};
  
  // Test email
  if (settings?.smtp_host) {
    try {
      await sendEmail({
        to: settings.admin_email || 'test@example.com',
        subject: 'OpenSite Notification Test',
        text: 'This is a test notification from OpenSite.'
      });
      results.email = { status: 'ok' };
    } catch (err) {
      results.email = { status: 'error', error: err.message };
    }
  } else {
    results.email = { status: 'not_configured' };
  }
  
  // Test Slack
  if (settings?.slack_webhook) {
    try {
      await sendSlackMessage({
        webhook: settings.slack_webhook,
        text: '🔔 OpenSite notification test'
      });
      results.slack = { status: 'ok' };
    } catch (err) {
      results.slack = { status: 'error', error: err.message };
    }
  } else {
    results.slack = { status: 'not_configured' };
  }
  
  return results;
}

export default {
  sendNotification,
  sendSystemAlert,
  sendLeadNotification,
  testNotificationChannels
};
