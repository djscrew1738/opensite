/**
 * OCR Preprocessing Service
 * 
 * Image preprocessing for improved OCR accuracy using Sharp.
 * Applies various image enhancements before OCR/vision API calls.
 * 
 * Processing pipeline:
 * 1. Resize to optimal dimensions
 * 2. Convert to grayscale
 * 3. Apply contrast enhancement
 * 4. Denoise
 * 5. Sharpen
 * 6. Binarization (optional)
 * 7. Deskew (optional)
 */

import sharp from 'sharp';
import logger from './logger.js';
import { AppError } from '../utils/errors.js';

class OCRPreprocessingService {
  constructor() {
    this.config = {
      // Target dimensions (OpenAI Vision works best with these)
      maxWidth: 2048,
      maxHeight: 2048,
      minWidth: 512,
      minHeight: 512,
      
      // Quality settings
      jpegQuality: 90,
      
      // Enhancement settings
      contrastMultiplier: 1.2,
      brightnessAdjustment: 5,
      sharpenSigma: 1.0,
      sharpenFlat: 1.0,
      sharpenJagged: 2.0,
      
      // Threshold for binarization (0-255)
      binarizationThreshold: 128,
      
      // Normalization
      normalize: true
    };
  }

  /**
   * Preprocess image for OCR
   * @param {Buffer} imageBuffer - Raw image buffer
   * @param {Object} options - Processing options
   * @returns {Promise<Buffer>} Processed image buffer
   */
  async preprocess(imageBuffer, options = {}) {
    const startTime = Date.now();
    const opts = { ...this.config, ...options };

    try {
      let pipeline = sharp(imageBuffer);

      // Get image metadata
      const metadata = await pipeline.metadata();
      logger.debug(`[OCRPreprocess] Input: ${metadata.width}x${metadata.height}, ${metadata.format}`);

      // 1. Auto-orient based on EXIF
      pipeline = pipeline.rotate();

      // 2. Resize if too large (maintain aspect ratio)
      if (metadata.width > opts.maxWidth || metadata.height > opts.maxHeight) {
        pipeline = pipeline.resize({
          width: Math.min(metadata.width, opts.maxWidth),
          height: Math.min(metadata.height, opts.maxHeight),
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // 3. Convert to grayscale for OCR
      if (options.grayscale !== false) {
        pipeline = pipeline.grayscale();
      }

      // 4. Apply enhancements
      if (opts.normalize) {
        pipeline = pipeline.normalize();
      }

      if (opts.contrastMultiplier !== 1) {
        pipeline = pipeline.modulate({
          brightness: 1 + (opts.brightnessAdjustment / 100),
          contrast: opts.contrastMultiplier
        });
      }

      // 5. Sharpen
      if (opts.sharpenSigma > 0) {
        pipeline = pipeline.sharpen({
          sigma: opts.sharpenSigma,
          flat: opts.sharpenFlat,
          jagged: opts.sharpenJagged
        });
      }

      // 6. Denoise (if enabled)
      if (options.denoise) {
        pipeline = pipeline.median(3);
      }

      // 7. Binarization (optional, for high-contrast text)
      if (options.binarize) {
        pipeline = pipeline.threshold(opts.binarizationThreshold);
      }

      // 8. Output as JPEG (good compression, widely supported)
      const outputBuffer = await pipeline
        .jpeg({
          quality: opts.jpegQuality,
          progressive: true,
          force: true
        })
        .toBuffer();

      const endTime = Date.now();
      const outputMetadata = await sharp(outputBuffer).metadata();
      
      logger.info(`[OCRPreprocess] Processed in ${endTime - startTime}ms: ${outputMetadata.width}x${outputMetadata.height}, ${Math.round(outputBuffer.length / 1024)}KB`);

      return outputBuffer;
    } catch (error) {
      logger.error('[OCRPreprocess] Preprocessing failed:', error.message);
      throw new AppError(
        'Failed to preprocess image',
        500,
        'OCR_PREPROCESS_ERROR',
        { originalError: error.message }
      );
    }
  }

  /**
   * Preprocess for document/blueprint analysis
   * Optimized for technical drawings and blueprints
   * @param {Buffer} imageBuffer - Raw image buffer
   * @returns {Promise<Buffer>} Processed image buffer
   */
  async preprocessBlueprint(imageBuffer) {
    return this.preprocess(imageBuffer, {
      grayscale: true,
      contrastMultiplier: 1.3,
      brightnessAdjustment: 10,
      sharpenSigma: 1.5,
      sharpenFlat: 2,
      sharpenJagged: 3,
      denoise: true,
      binarize: false, // Keep grayscale for blueprints
      jpegQuality: 95
    });
  }

  /**
   * Preprocess for receipt/invoice OCR
   * Optimized for small text and faded prints
   * @param {Buffer} imageBuffer - Raw image buffer
   * @returns {Promise<Buffer>} Processed image buffer
   */
  async preprocessReceipt(imageBuffer) {
    return this.preprocess(imageBuffer, {
      grayscale: true,
      contrastMultiplier: 1.4,
      brightnessAdjustment: 8,
      sharpenSigma: 2,
      sharpenFlat: 1,
      sharpenJagged: 2,
      denoise: false,
      binarize: true,
      binarizationThreshold: 150,
      jpegQuality: 92
    });
  }

  /**
   * Preprocess for handwritten text
   * @param {Buffer} imageBuffer - Raw image buffer
   * @returns {Promise<Buffer>} Processed image buffer
   */
  async preprocessHandwritten(imageBuffer) {
    return this.preprocess(imageBuffer, {
      grayscale: true,
      contrastMultiplier: 1.1,
      brightnessAdjustment: 0,
      sharpenSigma: 0.5,
      sharpenFlat: 1,
      sharpenJagged: 1,
      denoise: true,
      binarize: false,
      jpegQuality: 95
    });
  }

  /**
   * Detect and fix image rotation/deskew
   * @param {Buffer} imageBuffer - Raw image buffer
   * @returns {Promise<Buffer>} Deskewed image buffer
   */
  async deskew(imageBuffer) {
    try {
      // This is a simplified deskew
      // In production, use a proper skew detection algorithm (e.g., Hough transform)
      
      const processed = await sharp(imageBuffer)
        .rotate() // Auto-orient from EXIF
        .jpeg({ quality: 95 })
        .toBuffer();

      return processed;
    } catch (error) {
      logger.error('[OCRPreprocess] Deskew failed:', error.message);
      return imageBuffer; // Return original on error
    }
  }

  /**
   * Extract image metadata
   * @param {Buffer} imageBuffer - Raw image buffer
   */
  async getMetadata(imageBuffer) {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        hasAlpha: metadata.hasAlpha,
        dpi: metadata.density,
        colorSpace: metadata.space,
        size: imageBuffer.length
      };
    } catch (error) {
      logger.error('[OCRPreprocess] Metadata extraction failed:', error.message);
      return null;
    }
  }

  /**
   * Compare before/after preprocessing
   * @param {Buffer} originalBuffer - Original image
   * @param {Buffer} processedBuffer - Processed image
   */
  async compare(originalBuffer, processedBuffer) {
    const [originalMeta, processedMeta] = await Promise.all([
      this.getMetadata(originalBuffer),
      this.getMetadata(processedBuffer)
    ]);

    return {
      original: originalMeta,
      processed: processedMeta,
      compressionRatio: originalMeta.size / processedMeta.size,
      dimensionsChanged: 
        originalMeta.width !== processedMeta.width ||
        originalMeta.height !== processedMeta.height
    };
  }

  /**
   * Batch process multiple images
   * @param {Array<{id, buffer}>} images - Array of image objects
   * @param {Object} options - Processing options
   * @param {Function} onProgress - Progress callback
   */
  async batchProcess(images, options = {}, onProgress = null) {
    const results = [];
    const total = images.length;

    for (let i = 0; i < images.length; i++) {
      try {
        const processed = await this.preprocess(images[i].buffer, options);
        results.push({
          id: images[i].id,
          success: true,
          buffer: processed
        });
      } catch (error) {
        results.push({
          id: images[i].id,
          success: false,
          error: error.message
        });
      }

      if (onProgress) {
        onProgress(i + 1, total);
      }
    }

    return results;
  }
}

// Export singleton
export const ocrPreprocessingService = new OCRPreprocessingService();
export default ocrPreprocessingService;
