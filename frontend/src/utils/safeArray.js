/**
 * Safe Array Utilities
 * Defensive programming helpers for working with arrays that might come from APIs
 */

/**
 * Ensure a value is an array
 * @param {*} value - The value to check
 * @returns {Array} - The value if it's an array, or an empty array
 */
export function ensureArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  // Handle edge case where value might be an array-like object
  if (typeof value === 'object' && value.length !== undefined) {
    try {
      return Array.from(value);
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Safely map over an array
 * @param {*} value - The value to map over
 * @param {Function} fn - The mapping function
 * @returns {Array} - Mapped array or empty array if value is not array
 */
export function safeMap(value, fn) {
  const arr = ensureArray(value);
  return arr.map(fn);
}

/**
 * Safely filter an array
 * @param {*} value - The value to filter
 * @param {Function} fn - The filter function
 * @returns {Array} - Filtered array or empty array if value is not array
 */
export function safeFilter(value, fn) {
  const arr = ensureArray(value);
  return arr.filter(fn);
}

/**
 * Safely reduce an array
 * @param {*} value - The value to reduce
 * @param {Function} fn - The reducer function
 * @param {*} initialValue - The initial value
 * @returns {*} - Reduced value or initial value if value is not array
 */
export function safeReduce(value, fn, initialValue) {
  const arr = ensureArray(value);
  return arr.reduce(fn, initialValue);
}

/**
 * Safely get array length
 * @param {*} value - The value to check
 * @returns {number} - Array length or 0 if value is not array
 */
export function safeLength(value) {
  return Array.isArray(value) ? value.length : 0;
}

/**
 * Safely check if array includes a value
 * @param {*} value - The array to check
 * @param {*} searchElement - The element to search for
 * @returns {boolean} - True if included, false otherwise
 */
export function safeIncludes(value, searchElement) {
  const arr = ensureArray(value);
  return arr.includes(searchElement);
}

/**
 * Safely get first element
 * @param {*} value - The array
 * @param {*} defaultValue - Default value if array is empty or not an array
 * @returns {*} - First element or default value
 */
export function safeFirst(value, defaultValue = null) {
  const arr = ensureArray(value);
  return arr.length > 0 ? arr[0] : defaultValue;
}

/**
 * Safely get last element
 * @param {*} value - The array
 * @param {*} defaultValue - Default value if array is empty or not an array
 * @returns {*} - Last element or default value
 */
export function safeLast(value, defaultValue = null) {
  const arr = ensureArray(value);
  return arr.length > 0 ? arr[arr.length - 1] : defaultValue;
}

/**
 * Safely slice an array
 * @param {*} value - The array
 * @param {number} start - Start index
 * @param {number} end - End index
 * @returns {Array} - Sliced array or empty array
 */
export function safeSlice(value, start, end) {
  const arr = ensureArray(value);
  return arr.slice(start, end);
}

/**
 * Create a defensive array getter for API responses
 * @param {Object} response - API response object
 * @param {string} path - Dot-notation path to the array (e.g., 'data.projects')
 * @returns {Array} - The array or empty array
 */
export function getArrayFromResponse(response, path) {
  if (!response || typeof response !== 'object') return [];
  
  const keys = path.split('.');
  let current = response;
  
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return [];
    current = current[key];
  }
  
  return ensureArray(current);
}

export default {
  ensureArray,
  safeMap,
  safeFilter,
  safeReduce,
  safeLength,
  safeIncludes,
  safeFirst,
  safeLast,
  safeSlice,
  getArrayFromResponse
};
