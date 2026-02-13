/**
 * Format currency values
 */
export function formatCurrency(value) {
  if (value === null || value === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Format date strings
 */
export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  } catch {
    return dateString;
  }
}

/**
 * Format numbers with abbreviations (e.g., 1.2k, 3.5M)
 */
export function formatNumber(num, decimals = 1) {
  if (num === null || num === undefined) return 'N/A';

  const abbrev = ['', 'k', 'M', 'B', 'T'];
  const tier = Math.log10(Math.abs(num)) / 3 | 0;

  if (tier === 0) return num.toString();

  const suffix = abbrev[tier];
  const scale = Math.pow(10, tier * 3);
  const scaled = num / scale;

  return scaled.toFixed(decimals) + suffix;
}
