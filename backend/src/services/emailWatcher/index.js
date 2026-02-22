/**
 * Email Watcher Services Index
 * Export all email watcher components
 */

export { OutlookClient } from './outlookClient.js';
export { GmailClient } from './gmailClient.js';
export { EmailProviderFactory } from './emailProviderFactory.js';
export { KeywordMatcher } from './keywordMatcher.js';
export { alertDispatcher } from './alertDispatcher.js';
export { twilioAlert } from './twilioAlert.js';
export { telegramAlert } from './telegramAlert.js';
export { emailWatcherService, default } from './EmailWatcherService.js';
