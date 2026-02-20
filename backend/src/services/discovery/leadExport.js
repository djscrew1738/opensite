// Lead Export Service
// Exports leads to CSV and other formats for outreach campaigns

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const logger = {
  info: (msg, data) => console.log(`[lead-export] ${msg}`, data || ''),
  warn: (msg, data) => console.warn(`[lead-export] ${msg}`, data || ''),
  error: (msg, data) => console.error(`[lead-export] ${msg}`, data || ''),
};

// Export directory
const EXPORT_DIR = process.env.LEAD_EXPORT_DIR || path.join(process.cwd(), '../../tool/exports');

// Ensure export directory exists
function ensureExportDir() {
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
  }
  return EXPORT_DIR;
}

/**
 * Escape CSV field value
 */
function escapeCsv(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert array to CSV row
 */
function toCsvRow(values) {
  return values.map(escapeCsv).join(',');
}

/**
 * Standard CSV headers for lead export
 */
const STANDARD_HEADERS = [
  'business_name',
  'category',
  'address',
  'city',
  'zip_code',
  'phone',
  'website',
  'email',
  'verified_email',
  'email_score',
  'rating',
  'review_count',
  'icp_score',
  'icp_tier',
  'icp_reasoning',
  'plumbing_relevance',
  'services_offered',
  'about_summary',
  'is_property_manager',
  'is_contractor',
  'is_commercial',
  'service_area',
  'contact_status',
  'enrichment_status',
  'discovery_source',
  'created_at',
  'outreach_subject',
  'outreach_body',
];

/**
 * Format lead data for export
 */
function formatLeadForExport(lead) {
  // Extract city from address if available
  let city = '';
  let zipCode = '';
  if (lead.address) {
    const parts = lead.address.split(',');
    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1].trim();
      const zipMatch = lastPart.match(/(\d{5}(-\d{4})?)$/);
      if (zipMatch) {
        zipCode = zipMatch[1];
        city = lastPart.replace(zipMatch[0], '').trim();
      }
    }
  }

  return {
    business_name: lead.businessName || '',
    category: lead.category || '',
    address: lead.address || '',
    city: city,
    zip_code: zipCode,
    phone: lead.phone || lead.extractedPhones?.[0] || '',
    website: lead.website || '',
    email: lead.emails?.[0] || '',
    verified_email: lead.bestEmail || lead.emails?.[0] || '',
    email_score: lead.bestEmailScore || 0,
    rating: lead.rating || '',
    review_count: lead.reviewCount || '',
    icp_score: lead.icpScore || 0,
    icp_tier: lead.icpTier || 'unscored',
    icp_reasoning: lead.icpReasoning || '',
    plumbing_relevance: lead.plumbingRelevance || 0,
    services_offered: Array.isArray(lead.servicesOffered) ? lead.servicesOffered.join('; ') : '',
    about_summary: lead.aboutSummary || '',
    is_property_manager: lead.isPropertyManager ? 'Yes' : 'No',
    is_contractor: lead.isContractor ? 'Yes' : 'No',
    is_commercial: lead.isCommercial ? 'Yes' : 'No',
    service_area: lead.serviceArea || '',
    contact_status: lead.contactStatus || 'new',
    enrichment_status: lead.enrichmentStatus || 'pending',
    discovery_source: lead.runId || '',
    created_at: lead.createdAt || '',
    outreach_subject: lead.outreachSubject || '',
    outreach_body: lead.outreachBody || '',
  };
}

/**
 * Export leads to CSV
 * @param {Array} leads - Array of lead objects
 * @param {object} options - Export options
 * @returns {object} Export result with file path and stats
 */
export function exportToCsv(leads, options = {}) {
  const {
    filename = null,
    includeHeaders = true,
    tier = null, // Filter by tier: hot, warm, cold
    minScore = 0,
    columns = STANDARD_HEADERS,
  } = options;

  try {
    ensureExportDir();

    // Filter leads
    let filteredLeads = leads;
    if (tier) {
      filteredLeads = filteredLeads.filter(l => l.icpTier === tier);
    }
    if (minScore > 0) {
      filteredLeads = filteredLeads.filter(l => (l.icpScore || 0) >= minScore);
    }

    if (filteredLeads.length === 0) {
      return {
        success: false,
        error: 'No leads match the filter criteria',
        count: 0,
      };
    }

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const exportFilename = filename || `leads_${tier || 'all'}_${timestamp}.csv`;
    const filePath = path.join(EXPORT_DIR, exportFilename);

    // Build CSV content
    const lines = [];

    if (includeHeaders) {
      lines.push(toCsvRow(columns));
    }

    for (const lead of filteredLeads) {
      const formatted = formatLeadForExport(lead);
      const values = columns.map(col => formatted[col] || '');
      lines.push(toCsvRow(values));
    }

    // Write file
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');

    logger.info(`Exported ${filteredLeads.length} leads to ${exportFilename}`);

    return {
      success: true,
      filePath,
      filename: exportFilename,
      count: filteredLeads.length,
      tier,
      minScore,
    };

  } catch (err) {
    logger.error('CSV export failed', err);
    return {
      success: false,
      error: err.message,
      count: 0,
    };
  }
}

/**
 * Export leads grouped by tier (hot/warm/cold)
 * Creates separate CSV files for each tier
 */
export function exportByTier(leads, options = {}) {
  const results = {
    hot: null,
    warm: null,
    cold: null,
    all: null,
  };

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  // Export all leads
  results.all = exportToCsv(leads, {
    ...options,
    filename: `leads_all_${timestamp}.csv`,
  });

  // Export by tier
  for (const tier of ['hot', 'warm', 'cold']) {
    const tierLeads = leads.filter(l => l.icpTier === tier);
    if (tierLeads.length > 0) {
      results[tier] = exportToCsv(tierLeads, {
        ...options,
        filename: `leads_${tier}_${timestamp}.csv`,
        tier,
      });
    }
  }

  return results;
}

/**
 * Export to JSON format (for programmatic use)
 */
export function exportToJson(leads, options = {}) {
  const {
    filename = null,
    tier = null,
    minScore = 0,
    pretty = false,
  } = options;

  try {
    ensureExportDir();

    // Filter leads
    let filteredLeads = leads;
    if (tier) {
      filteredLeads = filteredLeads.filter(l => l.icpTier === tier);
    }
    if (minScore > 0) {
      filteredLeads = filteredLeads.filter(l => (l.icpScore || 0) >= minScore);
    }

    const formattedLeads = filteredLeads.map(formatLeadForExport);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const exportFilename = filename || `leads_${tier || 'all'}_${timestamp}.json`;
    const filePath = path.join(EXPORT_DIR, exportFilename);

    const jsonContent = pretty
      ? JSON.stringify(formattedLeads, null, 2)
      : JSON.stringify(formattedLeads);

    fs.writeFileSync(filePath, jsonContent, 'utf-8');

    logger.info(`Exported ${formattedLeads.length} leads to ${exportFilename}`);

    return {
      success: true,
      filePath,
      filename: exportFilename,
      count: formattedLeads.length,
    };

  } catch (err) {
    logger.error('JSON export failed', err);
    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * Get list of available exports
 */
export function listExports() {
  try {
    ensureExportDir();
    const files = fs.readdirSync(EXPORT_DIR)
      .filter(f => f.endsWith('.csv') || f.endsWith('.json'))
      .map(f => {
        const stats = fs.statSync(path.join(EXPORT_DIR, f));
        return {
          filename: f,
          size: stats.size,
          createdAt: stats.birthtime.toISOString(),
          type: f.endsWith('.csv') ? 'csv' : 'json',
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return files;
  } catch (err) {
    logger.error('Failed to list exports', err);
    return [];
  }
}

/**
 * Read export file
 */
export function readExport(filename) {
  try {
    const filePath = path.join(EXPORT_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'File not found' };
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return {
      success: true,
      content,
      filename,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Delete export file
 */
export function deleteExport(filename) {
  try {
    const filePath = path.join(EXPORT_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'File not found' };
    }

    fs.unlinkSync(filePath);
    return { success: true, filename };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Generate Mailchimp/CRM compatible CSV
 */
export function exportToCrmFormat(leads, options = {}) {
  const CRM_HEADERS = [
    'Email Address',
    'First Name',
    'Last Name',
    'Company',
    'Phone Number',
    'Website',
    'Address',
    'City',
    'State',
    'Zip Code',
    'Tags',
    'Notes',
  ];

  const crmLeads = leads.map(lead => {
    const formatted = formatLeadForExport(lead);
    const nameParts = formatted.business_name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
      'Email Address': formatted.verified_email || formatted.email,
      'First Name': firstName,
      'Last Name': lastName,
      'Company': formatted.business_name,
      'Phone Number': formatted.phone,
      'Website': formatted.website,
      'Address': formatted.address,
      'City': formatted.city,
      'State': 'TX',
      'Zip Code': formatted.zip_code,
      'Tags': `icp_${formatted.icp_tier},lead_gen`,
      'Notes': `${formatted.icp_reasoning} | Score: ${formatted.icp_score}`,
    };
  });

  return exportToCsv(crmLeads, {
    ...options,
    columns: CRM_HEADERS,
  });
}

export default {
  exportToCsv,
  exportByTier,
  exportToJson,
  exportToCrmFormat,
  listExports,
  readExport,
  deleteExport,
};
