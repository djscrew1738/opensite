/**
 * Date Utilities
 * Shared date formatting and manipulation functions
 */

/**
 * Format a date relative to now (e.g., "just now", "5 minutes ago")
 * @param {Date|string} date - Date to format
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
  if (!date) return 'never';
  const now = new Date();
  const diff = Math.floor((now - new Date(date)) / 1000);
  
  if (isNaN(diff)) return 'unknown';
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  return `${Math.floor(diff / 3600)} hours ago`;
}

/**
 * Format date to local string
 * @param {Date|string} date 
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string}
 */
export function formatDate(date, options = {}) {
  const d = new Date(date);
  if (isNaN(d)) return 'Invalid date';
  
  const defaults = { 
    month: 'short', 
    day: 'numeric',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined 
  };
  
  return d.toLocaleDateString('en-US', { ...defaults, ...options });
}

/**
 * Format date with time
 * @param {Date|string} date
 * @returns {string}
 */
export function formatDateTime(date) {
  const d = new Date(date);
  if (isNaN(d)) return 'Invalid date';
  
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Get days between two dates
 * @param {Date|string} start 
 * @param {Date|string} end 
 * @returns {number}
 */
export function getDaysBetween(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate - startDate;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if date is today
 * @param {Date|string} date
 * @returns {boolean}
 */
export function isToday(date) {
  const d = new Date(date);
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

/**
 * Check if date is overdue (past due date)
 * @param {Date|string} dueDate
 * @returns {boolean}
 */
export function isOverdue(dueDate) {
  return new Date(dueDate) < new Date();
}
