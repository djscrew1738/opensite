// Vision Service — Image processing and DZI tile generation for deep-zoom blueprint viewing

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import logger from './logger.js';

const TOOL_DIR = path.join(process.cwd(), '../../tool');
const TILES_DIR = path.join(TOOL_DIR, 'vision-tiles');
const UPLOADS_DIR = path.join(TOOL_DIR, 'vision-uploads');

// Ensure directories exist
fs.mkdirSync(TILES_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const TILE_SIZE = 256;
const TILE_OVERLAP = 1;
const JPEG_QUALITY = 85;

class VisionService {
  /**
   * Generate DZI tile pyramid from an image
   * @param {string} imagePath - Path to source image
   * @param {string} projectId - Unique project ID
   * @param {Function} progressCallback - Optional progress callback
   * @returns {object} { dziPath, tileDir, width, height }
   */
  async generateTiles(imagePath, projectId, progressCallback) {
    const tileDir = path.join(TILES_DIR, projectId);
    const filesDir = path.join(tileDir, `${projectId}_files`);
    const dziPath = path.join(tileDir, `${projectId}.dzi`);

    fs.mkdirSync(filesDir, { recursive: true });

    // Get image metadata
    const metadata = await sharp(imagePath).metadata();
    const { width, height } = metadata;

    if (progressCallback) progressCallback(10);

    // Calculate number of zoom levels
    const maxDimension = Math.max(width, height);
    const maxLevel = Math.ceil(Math.log2(maxDimension));

    // Generate tiles for each zoom level
    const totalLevels = maxLevel + 1;
    let levelsProcessed = 0;

    for (let level = 0; level <= maxLevel; level++) {
      const scale = Math.pow(2, level - maxLevel);
      const levelWidth = Math.max(1, Math.ceil(width * scale));
      const levelHeight = Math.max(1, Math.ceil(height * scale));

      const levelDir = path.join(filesDir, String(level));
      fs.mkdirSync(levelDir, { recursive: true });

      // Resize image for this level
      const resized = sharp(imagePath)
        .resize(levelWidth, levelHeight, { fit: 'fill' });

      // Calculate number of tiles
      const cols = Math.ceil(levelWidth / TILE_SIZE);
      const rows = Math.ceil(levelHeight / TILE_SIZE);

      // Extract each tile
      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows; row++) {
          const left = Math.max(0, col * TILE_SIZE - (col > 0 ? TILE_OVERLAP : 0));
          const top = Math.max(0, row * TILE_SIZE - (row > 0 ? TILE_OVERLAP : 0));
          const tileWidth = Math.min(
            TILE_SIZE + (col > 0 ? TILE_OVERLAP : 0) + (col < cols - 1 ? TILE_OVERLAP : 0),
            levelWidth - left
          );
          const tileHeight = Math.min(
            TILE_SIZE + (row > 0 ? TILE_OVERLAP : 0) + (row < rows - 1 ? TILE_OVERLAP : 0),
            levelHeight - top
          );

          if (tileWidth <= 0 || tileHeight <= 0) continue;

          const tilePath = path.join(levelDir, `${col}_${row}.jpeg`);

          await sharp(imagePath)
            .resize(levelWidth, levelHeight, { fit: 'fill' })
            .extract({ left, top, width: tileWidth, height: tileHeight })
            .jpeg({ quality: JPEG_QUALITY })
            .toFile(tilePath);
        }
      }

      levelsProcessed++;
      if (progressCallback) {
        const progress = 10 + Math.round((levelsProcessed / totalLevels) * 80);
        progressCallback(progress);
      }
    }

    // Write DZI descriptor
    const dziXml = `<?xml version="1.0" encoding="UTF-8"?>
<Image xmlns="http://schemas.microsoft.com/deepzoom/2008"
  Format="jpeg"
  Overlap="${TILE_OVERLAP}"
  TileSize="${TILE_SIZE}">
  <Size Width="${width}" Height="${height}"/>
</Image>`;

    fs.writeFileSync(dziPath, dziXml);

    if (progressCallback) progressCallback(95);

    logger.info('DZI tiles generated', { projectId, width, height, levels: maxLevel + 1 });

    return {
      dziPath,
      tileDir,
      width,
      height,
      levels: maxLevel + 1
    };
  }

  /**
   * Get image metadata
   * @param {string} imagePath - Path to image
   * @returns {object} { width, height, format, size }
   */
  async getImageMetadata(imagePath) {
    const metadata = await sharp(imagePath).metadata();
    const stats = fs.statSync(imagePath);
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: stats.size,
      channels: metadata.channels,
      density: metadata.density
    };
  }

  /**
   * Convert PDF pages to images (first page only for MVP)
   * Sharp doesn't natively handle PDFs, so we convert page 1 to PNG
   * For multi-page PDF support, the user can upload individual page images
   */
  async convertPdfToImage(pdfPath, outputDir) {
    // Sharp can handle PDFs with libvips built-in poppler support
    // If not available, we return an error suggesting image upload
    try {
      const outputPath = path.join(outputDir, `page-1.png`);
      await sharp(pdfPath, { page: 0, density: 200 })
        .png()
        .toFile(outputPath);

      const metadata = await sharp(outputPath).metadata();
      return {
        success: true,
        pages: [outputPath],
        pageCount: 1,
        width: metadata.width,
        height: metadata.height
      };
    } catch (err) {
      logger.warn('PDF to image conversion failed (libvips poppler may not be available)', {
        error: err.message
      });
      return {
        success: false,
        error: 'PDF conversion not supported. Please upload images (PNG/JPG/TIFF) directly.'
      };
    }
  }

  /**
   * Create a thumbnail for a project
   */
  async createThumbnail(imagePath, projectId) {
    const thumbDir = path.join(TILES_DIR, projectId);
    fs.mkdirSync(thumbDir, { recursive: true });
    const thumbPath = path.join(thumbDir, 'thumbnail.jpeg');

    await sharp(imagePath)
      .resize(400, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(thumbPath);

    return thumbPath;
  }

  /**
   * Delete all tiles for a project
   */
  deleteProjectTiles(projectId) {
    const tileDir = path.join(TILES_DIR, projectId);
    if (fs.existsSync(tileDir)) {
      fs.rmSync(tileDir, { recursive: true, force: true });
      logger.info('Deleted vision project tiles', { projectId });
    }
  }

  /**
   * Get paths
   */
  get tilesDir() { return TILES_DIR; }
  get uploadsDir() { return UPLOADS_DIR; }
}

export const visionService = new VisionService();
export default visionService;
