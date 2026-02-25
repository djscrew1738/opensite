/**
 * Structural Element Detector Client
 * Node.js wrapper for the YOLOv8 structural detection Python service
 * Detects walls, doors, windows, columns, stairs, railings in floor plans
 */

import axios from 'axios';
import FormData from 'form-data';
import { createReadStream } from 'fs';
import logger from './logger.js';

const STRUCTURAL_URL = process.env.STRUCTURAL_DETECTOR_URL || 'http://localhost:8004';
const DEFAULT_TIMEOUT = 120000; // 2 minutes for CV processing

/**
 * Client for the structural element detection Python service
 */
class StructuralDetectorClient {
  constructor(baseURL = STRUCTURAL_URL) {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: DEFAULT_TIMEOUT,
      headers: {
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Check if the structural detector service is healthy
   * @returns {Promise<Object>} Health status
   */
  async health() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      logger.error('Structural detector health check failed', { error: error.message });
      return {
        status: 'unavailable',
        model_loaded: false,
        device: 'unknown',
        classes: [],
        error: error.message
      };
    }
  }

  /**
   * Check if service is available and model is loaded
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    const health = await this.health();
    return health.status === 'healthy' && health.model_loaded;
  }

  /**
   * Run structural element detection on a floor plan
   * @param {string} filePath - Path to image or PDF file
   * @param {Object} options - Detection options
   * @returns {Promise<Object>} Detection results
   */
  async detect(filePath, options = {}) {
    const {
      confidence = 0.40,
      size = 1280
    } = options;

    const form = new FormData();
    form.append('file', createReadStream(filePath));
    form.append('confidence', confidence.toString());
    form.append('size', size.toString());

    try {
      const response = await this.client.post('/detect', form, {
        headers: form.getHeaders()
      });
      return response.data;
    } catch (error) {
      logger.error('Structural detection failed', {
        filePath,
        error: error.message,
        response: error.response?.data
      });
      throw new Error(`Structural detection failed: ${error.message}`);
    }
  }

  /**
   * Full structural analysis with spatial metrics
   * @param {string} filePath - Path to image or PDF file
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis results with structural summary and spatial metrics
   */
  async analyze(filePath, options = {}) {
    const {
      confidence = 0.40,
      pixelToFeet = 0.5,
      size = 1280
    } = options;

    const form = new FormData();
    form.append('file', createReadStream(filePath));
    form.append('confidence', confidence.toString());
    form.append('pixel_to_feet', pixelToFeet.toString());
    form.append('size', size.toString());

    try {
      const response = await this.client.post('/analyze', form, {
        headers: form.getHeaders()
      });
      return response.data;
    } catch (error) {
      logger.error('Structural analysis failed', {
        filePath,
        error: error.message,
        response: error.response?.data
      });
      throw new Error(`Structural analysis failed: ${error.message}`);
    }
  }

  /**
   * Get available detection classes
   * @returns {Promise<Object>} Available classes
   */
  async getClasses() {
    try {
      const response = await this.client.get('/models/classes');
      return response.data;
    } catch (error) {
      logger.error('Failed to get structural classes', { error: error.message });
      return { classes: [] };
    }
  }
}

// Export singleton instance
export const structuralDetectorClient = new StructuralDetectorClient();
export { StructuralDetectorClient };
