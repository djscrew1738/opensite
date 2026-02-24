// Email Verification Service
// Validates email addresses found during lead enrichment
// Uses regex validation, domain MX lookup, and disposable email detection

import dns from 'dns';
import { promisify } from 'util';
import logger from '../logger.js';

const dnsResolveMx = promisify(dns.resolveMx);

// Disposable email domains (common throwaway services)
const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com', 'temp-mail.org', 'fakeinbox.com', 'sharklasers.com',
  'guerrillamail.com', 'throwawaymail.com', 'mailinator.com', 'yopmail.com',
  'trashmail.com', 'getairmail.com', '10minutemail.com', 'burnermail.io',
  'tempail.com', 'emailondeck.com', 'throwaway.email', 'mailnesia.com',
  'tempinbox.com', 'sharklazers.com', 'getnada.com', 'tempmailaddress.com',
  'burner.kiwi', 'discard.email', 'dispostable.com', 'maildrop.cc',
  'tempmailo.com', 'tmpmail.org', 'throwawaymail.org', 'fakeinbox.org',
]);

// Role-based email prefixes (less valuable for sales)
const ROLE_PREFIXES = new Set([
  'admin', 'administrator', 'support', 'help', 'info', 'contact',
  'sales', 'marketing', 'webmaster', 'postmaster', 'hostmaster',
  'abuse', 'noc', 'security', 'billing', 'orders', 'service',
  'customerservice', 'customercare', 'general', 'office', 'reception',
  'hello', 'team', 'staff', 'enquiries', 'inquiries',
]);

/**
 * Email verification result
 */
class VerificationResult {
  constructor(email) {
    this.email = email;
    this.isValid = false;
    this.isDeliverable = false;
    this.isDisposable = false;
    this.isRoleBased = false;
    this.domain = '';
    this.mxRecords = [];
    this.score = 0; // 0-100 quality score
    this.reason = '';
    this.checkedAt = new Date().toISOString();
  }
}

/**
 * Validate email format with regex
 */
function validateFormat(email) {
  // RFC 5322 compliant regex (simplified)
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return regex.test(email);
}

/**
 * Extract domain from email
 */
function extractDomain(email) {
  const atIndex = email.lastIndexOf('@');
  if (atIndex === -1) return null;
  return email.slice(atIndex + 1).toLowerCase();
}

/**
 * Check if domain is a disposable email service
 */
function isDisposable(domain) {
  return DISPOSABLE_DOMAINS.has(domain) ||
    DISPOSABLE_DOMAINS.has(domain.replace(/^www\./, ''));
}

/**
 * Check if email is role-based (admin@, support@, etc.)
 */
function isRoleBased(email) {
  const localPart = email.split('@')[0].toLowerCase();
  const prefix = localPart.split(/[.+]/)[0]; // Remove aliases like admin+sales@domain.com
  return ROLE_PREFIXES.has(prefix);
}

/**
 * Check MX records for domain
 */
async function checkMxRecords(domain) {
  try {
    const records = await dnsResolveMx(domain);
    return records.sort((a, b) => a.priority - b.priority);
  } catch (err) {
    return [];
  }
}

/**
 * Calculate email quality score
 */
function calculateScore(result) {
  let score = 0;

  // Base validity
  if (result.isValid) score += 20;

  // Deliverability
  if (result.isDeliverable) score += 30;

  // Not disposable (major boost)
  if (!result.isDisposable) score += 25;

  // Not role-based (prefer direct contacts)
  if (!result.isRoleBased) score += 15;

  // Has MX records
  if (result.mxRecords.length > 0) score += 10;

  return Math.min(100, score);
}

/**
 * Verify a single email address
 * @param {string} email - Email to verify
 * @param {object} options - Verification options
 * @returns {VerificationResult}
 */
export async function verifyEmail(email, options = {}) {
  const { checkMx = true, timeout = 5000 } = options;
  const result = new VerificationResult(email);

  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();
  result.email = normalizedEmail;

  // Step 1: Format validation
  if (!validateFormat(normalizedEmail)) {
    result.reason = 'Invalid email format';
    return result;
  }
  result.isValid = true;

  // Step 2: Extract and validate domain
  const domain = extractDomain(normalizedEmail);
  if (!domain) {
    result.reason = 'Invalid domain';
    return result;
  }
  result.domain = domain;

  // Step 3: Check for disposable email
  if (isDisposable(domain)) {
    result.isDisposable = true;
    result.reason = 'Disposable email domain';
  }

  // Step 4: Check if role-based
  if (isRoleBased(normalizedEmail)) {
    result.isRoleBased = true;
  }

  // Step 5: MX record check (optional, can be slow)
  if (checkMx) {
    try {
      const mxRecords = await Promise.race([
        checkMxRecords(domain),
        new Promise((_, reject) => setTimeout(() => reject(new Error('DNS timeout')), timeout))
      ]);

      result.mxRecords = mxRecords.map(r => r.exchange);

      if (mxRecords.length > 0) {
        result.isDeliverable = true;
      } else {
        result.reason = result.reason || 'No MX records found';
      }
    } catch (err) {
      result.reason = result.reason || `DNS check failed: ${err.message}`;
    }
  }

  // Calculate final score
  result.score = calculateScore(result);

  // Determine overall status
  if (result.score >= 80) {
    result.reason = result.reason || 'High quality email';
  } else if (result.score >= 50) {
    result.reason = result.reason || 'Acceptable with caveats';
  } else {
    result.reason = result.reason || 'Low quality or risky';
  }

  return result;
}

/**
 * Verify multiple emails in batch
 * @param {string[]} emails - Array of emails to verify
 * @param {object} options - Verification options
 * @returns {VerificationResult[]}
 */
export async function verifyEmails(emails, options = {}) {
  const results = [];
  const uniqueEmails = [...new Set(emails.map(e => e.toLowerCase().trim()))];

  logger.info(`Verifying ${uniqueEmails.length} unique emails`);

  // Process in batches to avoid DNS rate limits
  const batchSize = 5;
  for (let i = 0; i < uniqueEmails.length; i += batchSize) {
    const batch = uniqueEmails.slice(i, i + batchSize);

    const batchResults = await Promise.allSettled(
      batch.map(email => verifyEmail(email, options))
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        // Create failed result
        const failed = new VerificationResult(result.reason?.email || 'unknown');
        failed.reason = `Verification failed: ${result.reason}`;
        results.push(failed);
      }
    }

    // Small delay between batches
    if (i + batchSize < uniqueEmails.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  const highQuality = results.filter(r => r.score >= 80).length;
  const mediumQuality = results.filter(r => r.score >= 50 && r.score < 80).length;
  const lowQuality = results.filter(r => r.score < 50).length;

  logger.info(`Verification complete: ${highQuality} high, ${mediumQuality} medium, ${lowQuality} low quality`);

  return results;
}

/**
 * Filter and rank emails for outreach
 * Returns best emails first, filtered by minimum score
 */
export function filterBestEmails(verificationResults, minScore = 60) {
  return verificationResults
    .filter(r => r.score >= minScore && r.isValid)
    .sort((a, b) => b.score - a.score);
}

/**
 * Enrich discovery leads with verified emails
 */
export async function enrichWithVerifiedEmails(lead, options = {}) {
  if (!lead.emails || lead.emails.length === 0) {
    return lead;
  }

  const verifications = await verifyEmails(lead.emails, options);
  const bestEmails = filterBestEmails(verifications, options.minScore || 60);

  lead.verifiedEmails = verifications.map(v => ({
    email: v.email,
    score: v.score,
    isValid: v.isValid,
    isDeliverable: v.isDeliverable,
    isDisposable: v.isDisposable,
    isRoleBased: v.isRoleBased,
    reason: v.reason,
  }));

  // Replace emails with verified ones, sorted by quality
  lead.emails = bestEmails.map(v => v.email);
  lead.emailVerificationStatus = bestEmails.length > 0 ? 'verified' : 'failed';
  lead.bestEmail = bestEmails[0]?.email || null;
  lead.bestEmailScore = bestEmails[0]?.score || 0;

  return lead;
}

export default {
  verifyEmail,
  verifyEmails,
  filterBestEmails,
  enrichWithVerifiedEmails,
};
