/**
 * Keyword Matcher Engine
 * Matches emails against keyword rules with support for exact, contains, and regex
 */

import logger from '../logger.js';

class KeywordMatcher {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Compile a regex pattern for performance
   */
  compilePattern(pattern, matchType) {
    const cacheKey = `${matchType}:${pattern}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.pattern;
      }
    }

    let regex;
    try {
      switch (matchType) {
        case 'exact':
          regex = new RegExp(`^${this.escapeRegex(pattern)}$`, 'i');
          break;
        case 'contains':
          regex = new RegExp(this.escapeRegex(pattern), 'i');
          break;
        case 'regex':
          regex = new RegExp(pattern, 'i');
          break;
        default:
          regex = new RegExp(this.escapeRegex(pattern), 'i');
      }
    } catch (error) {
      logger.error(`[keywordMatcher] Invalid regex pattern: ${pattern}`, error.message);
      // Fallback to contains
      regex = new RegExp(this.escapeRegex(pattern), 'i');
    }

    this.cache.set(cacheKey, {
      pattern: regex,
      timestamp: Date.now(),
    });

    return regex;
  }

  /**
   * Escape special regex characters
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Match text against a single rule
   */
  matchRule(text, rule) {
    if (!rule.active) return null;

    const searchText = text.toLowerCase();
    const keyword = rule.keyword.toLowerCase();
    const secondaryKeyword = rule.secondary_keyword ? rule.secondary_keyword.toLowerCase() : null;

    let primaryMatch = false;
    let secondaryMatch = false;

    // Check primary keyword
    switch (rule.match_type) {
      case 'exact':
        primaryMatch = searchText === keyword || 
          searchText.split(/\s+/).includes(keyword);
        break;
      case 'contains':
        primaryMatch = searchText.includes(keyword);
        break;
      case 'regex':
        try {
          const regex = new RegExp(rule.keyword, 'i');
          primaryMatch = regex.test(text);
        } catch (e) {
          logger.error(`[keywordMatcher] Invalid regex: ${rule.keyword}`);
          primaryMatch = searchText.includes(keyword);
        }
        break;
      default:
        primaryMatch = searchText.includes(keyword);
    }

    if (!primaryMatch) return null;

    // Check secondary keyword if present (AND logic)
    if (secondaryKeyword) {
      switch (rule.match_type) {
        case 'exact':
          secondaryMatch = searchText === secondaryKeyword || 
            searchText.split(/\s+/).includes(secondaryKeyword);
          break;
        case 'contains':
        case 'regex':
        default:
          secondaryMatch = searchText.includes(secondaryKeyword);
      }

      if (!secondaryMatch) return null;
    }

    return {
      matched: true,
      rule: rule,
      matchedKeywords: secondaryKeyword ? [rule.keyword, rule.secondary_keyword] : [rule.keyword],
    };
  }

  /**
   * Match email against all active rules
   */
  matchEmail(email, rules) {
    const results = [];
    const matchedRuleIds = new Set();

    // Combine email fields for searching
    const searchFields = [
      email.subject || '',
      email.bodyPreview || '',
      email.from?.emailAddress?.name || '',
      email.from?.emailAddress?.address || '',
      email.sender?.emailAddress?.name || '',
      email.sender?.emailAddress?.address || '',
    ];

    for (const rule of rules) {
      if (!rule.active) continue;
      if (matchedRuleIds.has(rule.id)) continue;

      // Try matching against each field
      for (const field of searchFields) {
        const match = this.matchRule(field, rule);
        if (match) {
          results.push(match);
          matchedRuleIds.add(rule.id);
          break; // Don't match same rule twice
        }
      }
    }

    return {
      matched: results.length > 0,
      matches: results,
      matchedKeywords: [...new Set(results.flatMap(r => r.matchedKeywords))],
      matchedRuleIds: [...matchedRuleIds],
    };
  }

  /**
   * Get priority emoji
   */
  getPriorityEmoji(priority) {
    switch (priority) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return 'ℹ️';
      default: return 'ℹ️';
    }
  }

  /**
   * Get priority label
   */
  getPriorityLabel(priority) {
    switch (priority) {
      case 'high': return 'HIGH';
      case 'medium': return 'MEDIUM';
      case 'low': return 'LOW';
      default: return 'MEDIUM';
    }
  }

  /**
   * Clear pattern cache
   */
  clearCache() {
    this.cache.clear();
    logger.debug('[keywordMatcher] Pattern cache cleared');
  }
}

export { KeywordMatcher };
export default new KeywordMatcher();
