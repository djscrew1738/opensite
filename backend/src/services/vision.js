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
   * Convert PDF first page to image using pdf.js
   * Strategy: extract embedded images (most blueprint PDFs are scans),
   * fall back to rendering text/vector content as SVG
   */
  async convertPdfToImage(pdfPath, outputDir) {
    const outputPath = path.join(outputDir, `page-${randomUUID()}.png`);

    try {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const pdfData = new Uint8Array(fs.readFileSync(pdfPath));
      const doc = await pdfjs.getDocument({ data: pdfData, useSystemFonts: true }).promise;
      const page = await doc.getPage(1);
      const pageCount = doc.numPages;

      // Try to extract the largest embedded image (blueprint PDFs are usually scans)
      const ops = await page.getOperatorList();
      let largestImage = null;
      let largestSize = 0;

      for (let i = 0; i < ops.fnArray.length; i++) {
        // OPS.paintImageXObject = 85
        if (ops.fnArray[i] === 85) {
          const imgName = ops.argsArray[i][0];
          try {
            const img = await page.objs.get(imgName);
            if (img && img.data && img.width && img.height) {
              const size = img.width * img.height;
              if (size > largestSize) {
                largestSize = size;
                largestImage = img;
              }
            }
          } catch (e) { /* skip this image */ }
        }
      }

      if (largestImage && largestImage.width > 100 && largestImage.height > 100) {
        // Convert embedded image to PNG via sharp
        const { data, width, height, kind } = largestImage;
        // Map PDF.js kind to channels (kind 1: RGB, kind 2: RGBA, etc)
        const channels = kind === 2 ? 4 : 3; 
        
        await sharp(Buffer.from(data), { 
          raw: { width, height, channels } 
        })
          .png()
          .toFile(outputPath);
      } else {
        // No useful embedded images — render page content as white image with text overlay
        const scale = 200 / 72;
        const viewport = page.getViewport({ scale });
        const w = Math.floor(viewport.width);
        const h = Math.floor(viewport.height);
        const textContent = await page.getTextContent();

        let svgText = '';
        for (const item of textContent.items) {
          if (!item.str || !item.str.trim()) continue;
          const tx = item.transform;
          const x = tx[4] * scale;
          const y = h - (tx[5] * scale);
          const fontSize = Math.max(8, Math.abs(tx[0]) * scale);
          const escaped = item.str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
          svgText += `<text x="${x}" y="${y}" font-size="${fontSize}" font-family="sans-serif" fill="black">${escaped}</text>\n`;
        }

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="white"/>${svgText}</svg>`;
        await sharp(Buffer.from(svg)).png().toFile(outputPath);
      }

      doc.destroy();
      const metadata = await sharp(outputPath).metadata();
      return { success: true, pages: [outputPath], pageCount, width: metadata.width, height: metadata.height };
    } catch (err) {
      logger.warn('PDF conversion failed', { error: err.message, stack: err.stack?.substring(0, 300) });
      return { success: false, error: 'PDF conversion failed. Please upload as PNG or JPG image instead.' };
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
   * Save a resized copy of the image for AI analysis (kept alongside tiles)
   * This avoids needing to reconstruct from tiles after original is deleted
   */
  async saveAnalysisImage(imagePath, projectId) {
    const projectDir = path.join(TILES_DIR, projectId);
    fs.mkdirSync(projectDir, { recursive: true });
    const analysisPath = path.join(projectDir, 'analysis.jpeg');

    await sharp(imagePath)
      .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toFile(analysisPath);

    return analysisPath;
  }

  /**
   * Get the analysis image path for a project
   */
  getAnalysisImagePath(projectId) {
    return path.join(TILES_DIR, projectId, 'analysis.jpeg');
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
