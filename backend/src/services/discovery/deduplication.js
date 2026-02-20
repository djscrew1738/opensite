// Cross-Source Lead Deduplication Service
// Deduplicates leads from multiple sources (permits, discovery, manual entry)

import crypto from 'crypto';

const logger = {
  info: (msg, data) => console.log(`[deduplication] ${msg}`, data || ''),
  warn: (msg, data) => console.warn(`[deduplication] ${msg}`, data || ''),
  error: (msg, data) => console.error(`[deduplication] ${msg}`, data || ''),
};

/**
 * Normalize text for comparison
 */
function normalize(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate domain hash from URL
 */
function domainHash(url) {
  if (!url) return null;
  try {
    const domain = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    return crypto.createHash('sha256').update(domain).digest('hex').slice(0, 16);
  } catch {
    return null;
  }
}

/**
 * Generate phone hash (normalized)
 */
function phoneHash(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return null;
  return digits.slice(-10); // Last 10 digits
}

/**
 * Generate address hash (simplified)
 */
function addressHash(address) {
  if (!address) return null;
  // Extract street number and name, ignore suite/apt numbers
  const normalized = normalize(address)
    .replace(/\b(suite|ste|unit|apt|apartment|#|floor|fl)\b.*$/i, '')
    .trim();
  return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

/**
 * Calculate string similarity (Levenshtein distance based)
 */
function similarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const s1 = normalize(str1);
  const s2 = normalize(str2);

  if (s1 === s2) return 1;

  const len1 = s1.length;
  const len2 = s2.length;

  // Simple Levenshtein distance
  const matrix = [];
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const maxLen = Math.max(len1, len2);
  return maxLen === 0 ? 1 : 1 - matrix[len1][len2] / maxLen;
}

/**
 * Calculate match score between two leads
 * Returns 0-1 where 1 is perfect match
 */
function calculateMatchScore(lead1, lead2) {
  let score = 0;
  let factors = 0;

  // Domain match (strong indicator)
  if (lead1.website && lead2.website) {
    const d1 = domainHash(lead1.website);
    const d2 = domainHash(lead2.website);
    if (d1 && d2 && d1 === d2) {
      score += 1.0;
      factors++;
    }
  }

  // Phone match
  if (lead1.phone && lead2.phone) {
    const p1 = phoneHash(lead1.phone);
    const p2 = phoneHash(lead2.phone);
    if (p1 && p2 && p1 === p2) {
      score += 0.9;
      factors++;
    }
  }

  // Address match
  if (lead1.address && lead2.address) {
    const a1 = addressHash(lead1.address);
    const a2 = addressHash(lead2.address);
    if (a1 && a2 && a1 === a2) {
      score += 0.8;
      factors++;
    }
  }

  // Business name similarity
  if (lead1.businessName && lead2.businessName) {
    const nameSim = similarity(lead1.businessName, lead2.businessName);
    if (nameSim > 0.8) {
      score += nameSim * 0.7;
      factors++;
    }
  }

  // Email domain match
  if (lead1.emails?.length > 0 && lead2.emails?.length > 0) {
    const domains1 = new Set(lead1.emails.map(e => e.split('@')[1]?.toLowerCase()));
    const domains2 = new Set(lead2.emails.map(e => e.split('@')[1]?.toLowerCase()));
    const intersection = [...domains1].filter(d => domains2.has(d));
    if (intersection.length > 0) {
      score += 0.8;
      factors++;
    }
  }

  return factors > 0 ? score / factors : 0;
}

/**
 * Find duplicates within a single lead set
 * @param {Array} leads - Array of leads to deduplicate
 * @param {number} threshold - Match threshold (0-1)
 * @returns {object} Deduplication result with unique leads and duplicates
 */
export function deduplicateLeads(leads, threshold = 0.7) {
  const uniqueLeads = [];
  const duplicates = [];
  const mergeGroups = [];

  for (const lead of leads) {
    let matched = false;
    let bestMatch = null;
    let bestScore = 0;

    for (const unique of uniqueLeads) {
      const score = calculateMatchScore(lead, unique);
      if (score >= threshold && score > bestScore) {
        bestScore = score;
        bestMatch = unique;
      }
    }

    if (bestMatch) {
      // Mark as duplicate
      duplicates.push({
        lead,
        duplicateOf: bestMatch,
        matchScore: bestScore,
      });

      // Track merge group
      const group = mergeGroups.find(g => g.master === bestMatch);
      if (group) {
        group.duplicates.push(lead);
      } else {
        mergeGroups.push({
          master: bestMatch,
          duplicates: [lead],
        });
      }
    } else {
      uniqueLeads.push(lead);
    }
  }

  logger.info(`Deduplication: ${uniqueLeads.length} unique, ${duplicates.length} duplicates from ${leads.length} total`);

  return {
    unique: uniqueLeads,
    duplicates,
    mergeGroups,
    stats: {
      total: leads.length,
      unique: uniqueLeads.length,
      duplicates: duplicates.length,
      reductionPercent: ((duplicates.length / leads.length) * 100).toFixed(1),
    },
  };
}

/**
 * Merge duplicate leads, keeping the best data from each
 */
export function mergeDuplicateLeads(leads) {
  if (!leads || leads.length === 0) return null;
  if (leads.length === 1) return leads[0];

  // Sort by enrichment status (enriched first), then by ICP score
  const sorted = [...leads].sort((a, b) => {
    if (a.enrichmentStatus === 'enriched' && b.enrichmentStatus !== 'enriched') return -1;
    if (b.enrichmentStatus === 'enriched' && a.enrichmentStatus !== 'enriched') return 1;
    return (b.icpScore || 0) - (a.icpScore || 0);
  });

  const master = sorted[0];
  const merged = { ...master };

  // Collect all unique values
  const allEmails = new Set();
  const allPhones = new Set();

  for (const lead of sorted) {
    // Merge emails
    if (lead.emails) {
      lead.emails.forEach(e => allEmails.add(e.toLowerCase()));
    }
    if (lead.bestEmail) {
      allEmails.add(lead.bestEmail.toLowerCase());
    }

    // Merge phones
    if (lead.phone) allPhones.add(phoneHash(lead.phone));
    if (lead.extractedPhones) {
      lead.extractedPhones.forEach(p => allPhones.add(phoneHash(p)));
    }

    // Keep highest score
    if ((lead.icpScore || 0) > (merged.icpScore || 0)) {
      merged.icpScore = lead.icpScore;
      merged.icpTier = lead.icpTier;
      merged.icpReasoning = lead.icpReasoning;
    }

    // Keep best enrichment data
    if (lead.enrichmentStatus === 'enriched') {
      merged.aboutSummary = lead.aboutSummary || merged.aboutSummary;
      merged.servicesOffered = lead.servicesOffered || merged.servicesOffered;
      merged.isPropertyManager = lead.isPropertyManager || merged.isPropertyManager;
      merged.isContractor = lead.isContractor || merged.isContractor;
      merged.isCommercial = lead.isCommercial || merged.isCommercial;
    }

    // Keep best outreach content
    if (lead.outreachSubject && (!merged.outreachSubject || lead.icpScore > master.icpScore)) {
      merged.outreachSubject = lead.outreachSubject;
      merged.outreachBody = lead.outreachBody;
    }
  }

  // Update merged arrays
  merged.emails = [...allEmails];
  merged.mergedPhoneCount = allPhones.size;
  merged.mergedFrom = sorted.length;
  merged.mergedAt = new Date().toISOString();

  return merged;
}

/**
 * Cross-source deduplication
 * Deduplicates leads from different sources (permits vs discovery)
 */
export function crossSourceDeduplicate(sourceA, sourceB, threshold = 0.7) {
  const matches = [];
  const uniqueInA = [];
  const uniqueInB = [...sourceB]; // Copy

  for (const leadA of sourceA) {
    let matched = false;

    for (let i = uniqueInB.length - 1; i >= 0; i--) {
      const leadB = uniqueInB[i];
      const score = calculateMatchScore(leadA, leadB);

      if (score >= threshold) {
        matches.push({
          leadA,
          leadB,
          matchScore: score,
          merged: mergeDuplicateLeads([leadA, leadB]),
        });
        uniqueInB.splice(i, 1);
        matched = true;
        break;
      }
    }

    if (!matched) {
      uniqueInA.push(leadA);
    }
  }

  logger.info(`Cross-source dedup: ${matches.length} matches, ${uniqueInA.length} unique in A, ${uniqueInB.length} unique in B`);

  return {
    matches,
    uniqueInA,
    uniqueInB,
    allUnique: [...uniqueInA, ...uniqueInB],
    merged: matches.map(m => m.merged),
    stats: {
      matches: matches.length,
      uniqueInA: uniqueInA.length,
      uniqueInB: uniqueInB.length,
      totalUnique: uniqueInA.length + uniqueInB.length,
    },
  };
}

/**
 * Generate fingerprint for a lead
 */
export function generateLeadFingerprint(lead) {
  const components = [
    domainHash(lead.website),
    phoneHash(lead.phone),
    addressHash(lead.address),
    normalize(lead.businessName),
  ].filter(Boolean);

  if (components.length === 0) return null;

  const fingerprint = crypto
    .createHash('sha256')
    .update(components.join('|'))
    .digest('hex');

  return fingerprint;
}

/**
 * Batch deduplication with database storage
 * Stores fingerprints for future deduplication
 */
export async function batchDeduplicateWithStorage(leads, db, threshold = 0.7) {
  const results = {
    newLeads: [],
    duplicates: [],
    updated: [],
  };

  for (const lead of leads) {
    const fingerprint = generateLeadFingerprint(lead);
    if (!fingerprint) {
      results.newLeads.push(lead);
      continue;
    }

    // Check for existing by fingerprint
    const existing = db.getDiscoveryLeadByFingerprint?.(fingerprint);

    if (existing) {
      // Check if significant update
      const score = calculateMatchScore(lead, existing);
      if (score >= threshold) {
        // Update existing with new info
        const merged = mergeDuplicateLeads([existing, lead]);
        results.updated.push({
          existing,
          new: lead,
          merged,
        });
      } else {
        results.duplicates.push({ lead, existing, score });
      }
    } else {
      lead.fingerprint = fingerprint;
      results.newLeads.push(lead);
    }
  }

  return results;
}

export default {
  deduplicateLeads,
  mergeDuplicateLeads,
  crossSourceDeduplicate,
  generateLeadFingerprint,
  batchDeduplicateWithStorage,
  calculateMatchScore,
};
