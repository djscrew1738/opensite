/**
 * Chunking Service
 * 
 * Advanced text chunking using Recursive Character Text Splitter.
 * Strategies:
 * - Recursive Character: Splits by hierarchy (paragraphs → sentences → words)
 * - Semantic: Uses sentence embeddings to find natural boundaries
 * - Fixed: Simple character-based with overlap
 * - Markdown: Respects headers and structure
 * - Code: Language-aware splitting
 * 
 * Based on LangChain's RecursiveCharacterTextSplitter with enhancements.
 */

import logger from './logger.js';

class ChunkingService {
  constructor() {
    // Default chunk sizes and overlap
    this.defaults = {
      chunkSize: 1000,
      chunkOverlap: 200,
      minChunkSize: 100
    };

    // Separators for recursive splitting (order matters)
    this.separators = {
      default: ['\n\n', '\n', '. ', '? ', '! ', ' ', ''],
      markdown: ['\n## ', '\n### ', '\n#### ', '\n\n', '\n', '. ', ' ', ''],
      code: ['\nclass ', '\nfunction ', '\ndef ', '\n\n', '\n', '; ', ' ', ''],
      json: ['}\n{', ',\n', ' ', ''],
      html: ['</div>', '</p>', '<br>', '\n', ' ', '']
    };
  }

  /**
   * Split text using recursive character strategy
   * Tries to split by largest separator first, recursively trying smaller ones
   * 
   * @param {string} text - Text to split
   * @param {Object} options - { chunkSize, chunkOverlap, separators, minChunkSize }
   * @returns {Array<Chunk>} Array of chunks with metadata
   */
  recursiveSplit(text, options = {}) {
    const opts = { ...this.defaults, ...options };
    const separators = options.separators || this.separators.default;

    if (!text || typeof text !== 'string') {
      return [];
    }

    const chunks = this._recursiveSplitInternal(
      text,
      separators,
      opts.chunkSize,
      opts.chunkOverlap,
      opts.minChunkSize
    );

    // Add metadata to chunks
    return chunks.map((content, index) => ({
      id: `chunk_${index}`,
      content: content.trim(),
      index,
      charCount: content.length,
      wordCount: content.split(/\s+/).filter(w => w).length
    }));
  }

  /**
   * Internal recursive splitting logic
   * @private
   */
  _recursiveSplitInternal(text, separators, chunkSize, chunkOverlap, minChunkSize) {
    const finalChunks = [];

    // Base case: if text is small enough, return it
    if (text.length <= chunkSize) {
      return text.length >= minChunkSize ? [text] : [];
    }

    // Try each separator in order
    for (let i = 0; i < separators.length; i++) {
      const separator = separators[i];
      const splits = separator ? text.split(separator) : text.split('');

      let currentChunk = '';
      
      for (const split of splits) {
        const candidate = currentChunk + (separator && currentChunk ? separator : '') + split;

        if (candidate.length > chunkSize && currentChunk) {
          // Save current chunk
          if (currentChunk.length >= minChunkSize) {
            finalChunks.push(currentChunk);
          }

          // Start new chunk with overlap
          if (chunkOverlap > 0) {
            // Find overlap by going back from end of current chunk
            const overlapStart = Math.max(0, currentChunk.length - chunkOverlap);
            currentChunk = currentChunk.slice(overlapStart) + (separator || '') + split;
          } else {
            currentChunk = split;
          }
        } else {
          currentChunk = candidate;
        }
      }

      // Don't forget the last chunk
      if (currentChunk.length >= minChunkSize) {
        finalChunks.push(currentChunk);
      }

      // If we got good chunks with this separator, return them
      if (finalChunks.length > 0) {
        // If chunks are still too big, recursively split them
        const result = [];
        for (const chunk of finalChunks) {
          if (chunk.length > chunkSize) {
            const subChunks = this._recursiveSplitInternal(
              chunk,
              separators.slice(i + 1),
              chunkSize,
              chunkOverlap,
              minChunkSize
            );
            result.push(...subChunks);
          } else {
            result.push(chunk);
          }
        }
        return result;
      }
    }

    // Fallback: hard split by character
    return this._hardSplit(text, chunkSize, chunkOverlap);
  }

  /**
   * Hard character-based split (last resort)
   * @private
   */
  _hardSplit(text, chunkSize, chunkOverlap) {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push(text.slice(start, end));
      start += chunkSize - chunkOverlap;
    }

    return chunks;
  }

  /**
   * Markdown-aware chunking
   * Respects headers and preserves structure
   * @param {string} text - Markdown text
   * @param {Object} options - Chunking options
   */
  splitMarkdown(text, options = {}) {
    const opts = {
      ...this.defaults,
      separators: this.separators.markdown,
      ...options
    };

    const chunks = this.recursiveSplit(text, opts);

    // Extract headers for each chunk
    return chunks.map(chunk => {
      const headers = this._extractMarkdownHeaders(text, chunk.content);
      return {
        ...chunk,
        metadata: {
          ...chunk.metadata,
          headers,
          level: headers.length > 0 ? Math.min(...headers.map(h => h.level)) : 0
        }
      };
    });
  }

  /**
   * Extract markdown headers that precede a chunk
   * @private
   */
  _extractMarkdownHeaders(fullText, chunkContent) {
    const chunkIndex = fullText.indexOf(chunkContent);
    if (chunkIndex === -1) return [];

    const precedingText = fullText.slice(0, chunkIndex);
    const headerRegex = /^(#{1,6})\s+(.+)$/gm;
    const headers = [];
    let match;

    while ((match = headerRegex.exec(precedingText)) !== null) {
      headers.push({
        level: match[1].length,
        text: match[2].trim()
      });
    }

    return headers;
  }

  /**
   * Code-aware chunking
   * Tries to split at function/class boundaries
   * @param {string} text - Code text
   * @param {string} language - Programming language (js, python, etc.)
   * @param {Object} options - Chunking options
   */
  splitCode(text, language = 'javascript', options = {}) {
    const opts = {
      ...this.defaults,
      chunkSize: 1500, // Larger chunks for code
      ...options
    };

    // Language-specific separators
    if (['javascript', 'typescript', 'java', 'cpp', 'c', 'csharp'].includes(language)) {
      opts.separators = ['\nclass ', '\nfunction ', '\nconst ', '\nlet ', '\nvar ', '\n\n', '\n', '; ', ' ', ''];
    } else if (['python'].includes(language)) {
      opts.separators = ['\ndef ', '\nclass ', '\n\n', '\n', ': ', ' ', ''];
    }

    const chunks = this.recursiveSplit(text, opts);

    // Try to identify function/class boundaries
    return chunks.map(chunk => {
      const entities = this._extractCodeEntities(chunk.content, language);
      return {
        ...chunk,
        metadata: {
          ...chunk.metadata,
          entities,
          language
        }
      };
    });
  }

  /**
   * Extract code entities (functions, classes) from chunk
   * @private
   */
  _extractCodeEntities(text, language) {
    const entities = [];
    
    // Simple regex patterns (could be enhanced with AST parsing)
    const patterns = {
      javascript: [
        { type: 'function', regex: /(?:function|const|let|var)\s+(\w+)\s*[\(=]/g },
        { type: 'class', regex: /class\s+(\w+)/g },
        { type: 'arrow', regex: /const\s+(\w+)\s*=\s*(?:async\s*)?\(/g }
      ],
      python: [
        { type: 'function', regex: /def\s+(\w+)\s*\(/g },
        { type: 'class', regex: /class\s+(\w+)[\(:]/g }
      ]
    };

    const langPatterns = patterns[language] || patterns.javascript;

    for (const { type, regex } of langPatterns) {
      let match;
      while ((match = regex.exec(text)) !== null) {
        entities.push({ type, name: match[1] });
      }
    }

    return entities;
  }

  /**
   * Semantic chunking using sentence boundaries
   * Attempts to create chunks that preserve semantic meaning
   * @param {string} text - Text to split
   * @param {Object} options - { targetTokens, maxSentences }
   */
  splitSemantic(text, options = {}) {
    const { targetTokens = 200, maxSentences = 5 } = options;

    // Split into sentences
    const sentences = this._splitSentences(text);
    const chunks = [];
    let currentChunk = [];
    let currentTokens = 0;

    for (const sentence of sentences) {
      const sentenceTokens = sentence.split(/\s+/).length;

      if (currentTokens + sentenceTokens > targetTokens && currentChunk.length > 0) {
        // Save current chunk
        const chunkText = currentChunk.join(' ');
        chunks.push({
          id: `chunk_${chunks.length}`,
          content: chunkText,
          sentences: currentChunk.length,
          tokens: currentTokens
        });

        // Start new chunk with overlap
        const overlapSize = Math.min(2, currentChunk.length);
        currentChunk = currentChunk.slice(-overlapSize);
        currentTokens = currentChunk.join(' ').split(/\s+/).length;
      }

      currentChunk.push(sentence);
      currentTokens += sentenceTokens;

      // Force break at max sentences
      if (currentChunk.length >= maxSentences) {
        const chunkText = currentChunk.join(' ');
        chunks.push({
          id: `chunk_${chunks.length}`,
          content: chunkText,
          sentences: currentChunk.length,
          tokens: currentTokens
        });
        currentChunk = [];
        currentTokens = 0;
      }
    }

    // Don't forget the last chunk
    if (currentChunk.length > 0) {
      chunks.push({
        id: `chunk_${chunks.length}`,
        content: currentChunk.join(' '),
        sentences: currentChunk.length,
        tokens: currentTokens
      });
    }

    return chunks;
  }

  /**
   * Split text into sentences
   * @private
   */
  _splitSentences(text) {
    // Enhanced sentence splitting
    return text
      .replace(/([.!?])\s+/g, '$1\n')
      .replace(/([.!?])"\s+/g, '$1"\n')
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * JSON-aware chunking
   * Tries to split at object boundaries
   * @param {string|Object} json - JSON string or object
   * @param {Object} options - Chunking options
   */
  splitJSON(json, options = {}) {
    let data;
    try {
      data = typeof json === 'string' ? JSON.parse(json) : json;
    } catch (error) {
      logger.error('[ChunkingService] Invalid JSON:', error.message);
      return [];
    }

    // If it's an array, chunk by items
    if (Array.isArray(data)) {
      const chunks = [];
      const itemsPerChunk = options.itemsPerChunk || 10;

      for (let i = 0; i < data.length; i += itemsPerChunk) {
        const chunk = data.slice(i, i + itemsPerChunk);
        chunks.push({
          id: `chunk_${chunks.length}`,
          content: JSON.stringify(chunk, null, 2),
          index: chunks.length,
          itemCount: chunk.length,
          startIndex: i,
          endIndex: Math.min(i + itemsPerChunk, data.length)
        });
      }

      return chunks;
    }

    // For objects, convert to string and use standard chunking
    const text = typeof json === 'string' ? json : JSON.stringify(data, null, 2);
    return this.recursiveSplit(text, {
      ...options,
      separators: this.separators.json
    });
  }

  /**
   * Auto-detect content type and use appropriate strategy
   * @param {string} text - Text to analyze
   * @param {Object} options - Chunking options
   */
  autoChunk(text, options = {}) {
    // Detect content type
    const isMarkdown = /^#{1,6}\s/m.test(text) || /\[.*?\]\(.*?\)/.test(text);
    const isJSON = text.trim().startsWith('{') || text.trim().startsWith('[');
    const isCode = /^(const|let|var|function|class|def|import|from|#include)/m.test(text);
    const isHTML = text.trim().startsWith('<') && text.trim().includes('</');

    if (isMarkdown) {
      logger.debug('[ChunkingService] Detected Markdown content');
      return this.splitMarkdown(text, options);
    } else if (isJSON) {
      logger.debug('[ChunkingService] Detected JSON content');
      return this.splitJSON(text, options);
    } else if (isCode) {
      logger.debug('[ChunkingService] Detected Code content');
      return this.splitCode(text, options.language || 'javascript', options);
    } else if (isHTML) {
      logger.debug('[ChunkingService] Detected HTML content');
      return this.recursiveSplit(text, { ...options, separators: this.separators.html });
    } else {
      logger.debug('[ChunkingService] Using default recursive splitting');
      return this.recursiveSplit(text, options);
    }
  }

  /**
   * Calculate statistics for chunks
   * @param {Array<Chunk>} chunks
   */
  getStats(chunks) {
    if (!chunks.length) return null;

    const charCounts = chunks.map(c => c.content.length);
    const wordCounts = chunks.map(c => c.content.split(/\s+/).filter(w => w).length);

    return {
      totalChunks: chunks.length,
      totalChars: charCounts.reduce((a, b) => a + b, 0),
      totalWords: wordCounts.reduce((a, b) => a + b, 0),
      avgChunkSize: Math.round(charCounts.reduce((a, b) => a + b, 0) / chunks.length),
      minChunkSize: Math.min(...charCounts),
      maxChunkSize: Math.max(...charCounts),
      avgWordsPerChunk: Math.round(wordCounts.reduce((a, b) => a + b, 0) / chunks.length)
    };
  }
}

// Export singleton
export const chunkingService = new ChunkingService();
export default chunkingService;
