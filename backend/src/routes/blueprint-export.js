/**
 * Blueprint Export Routes
 * API endpoints for exporting analysis results
 */

import express from 'express';
import path from 'path';
import { blueprintExportService } from '../services/blueprint-export.js';
import { blueprintOrchestrator } from '../services/blueprint-orchestrator.js';
import { tryCatch } from '../utils/response.js';
import logger from '../services/logger.js';

const router = express.Router();

/**
 * @route POST /api/blueprint/export/:jobId
 * @desc Export analysis results to specified format
 * @access Private
 */
router.post('/export/:jobId', tryCatch(async (req, res) => {
  const { jobId } = req.params;
  const { 
    format = 'pdf',
    includeVisualization = true,
    includeBreakdown = true
  } = req.body;

  // Get job results
  const job = blueprintOrchestrator.getJob(jobId);
  
  if (!job) {
    return res.error('Job not found', 'JOB_NOT_FOUND', null, 404);
  }

  if (job.status !== 'completed') {
    return res.error(
      'Analysis not complete',
      'ANALYSIS_INCOMPLETE',
      { status: job.status },
      400
    );
  }

  const validFormats = ['pdf', 'csv', 'excel', 'xlsx', 'json', 'quickbooks', 'iif'];
  if (!validFormats.includes(format.toLowerCase())) {
    return res.error(
      `Invalid format. Must be one of: ${validFormats.join(', ')}`,
      'VALIDATION_ERROR',
      null,
      400
    );
  }

  logger.info('Exporting analysis', { jobId, format });

  // Prepare analysis data
  const analysisData = {
    jobId: job.id,
    fileName: path.basename(job.filePath),
    ...job.results
  };

  // Export
  const { filepath, filename } = await blueprintExportService.export(
    analysisData,
    format,
    {
      includeVisualization,
      includeBreakdown,
      companyInfo: req.body.companyInfo || {}
    }
  );

  // Return download URL
  res.success({
    jobId,
    format,
    filename,
    downloadUrl: `/api/blueprint/exports/${filename}`,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }, 'Export created successfully');
}));

/**
 * @route GET /api/blueprint/exports/:filename
 * @desc Download exported file
 * @access Private
 */
router.get('/exports/:filename', tryCatch(async (req, res) => {
  const { filename } = req.params;
  const filepath = path.join(blueprintExportService.exportDir, filename);

  // Security check - ensure file is in export directory
  if (!filepath.startsWith(blueprintExportService.exportDir)) {
    return res.error('Invalid filename', 'VALIDATION_ERROR', null, 400);
  }

  // Check file exists
  if (!require('fs').existsSync(filepath)) {
    return res.error('File not found', 'FILE_NOT_FOUND', null, 404);
  }

  // Determine content type
  const ext = path.extname(filename).toLowerCase();
  const contentTypes = {
    '.pdf': 'application/pdf',
    '.csv': 'text/csv',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.json': 'application/json',
    '.iif': 'text/plain'
  };

  res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  
  res.sendFile(filepath);
}));

/**
 * @route GET /api/blueprint/formats
 * @desc Get available export formats
 * @access Private
 */
router.get('/formats', tryCatch(async (req, res) => {
  res.success({
    formats: [
      {
        id: 'pdf',
        name: 'PDF Document',
        description: 'Professional estimate document',
        extension: '.pdf'
      },
      {
        id: 'csv',
        name: 'CSV Spreadsheet',
        description: 'Comma-separated values for import',
        extension: '.csv'
      },
      {
        id: 'excel',
        name: 'Excel Workbook',
        description: 'Multi-sheet Excel file',
        extension: '.xlsx'
      },
      {
        id: 'json',
        name: 'JSON Data',
        description: 'Machine-readable format',
        extension: '.json'
      },
      {
        id: 'quickbooks',
        name: 'QuickBooks IIF',
        description: 'Import into QuickBooks',
        extension: '.iif'
      }
    ]
  }, 'Available export formats');
}));

/**
 * @route POST /api/blueprint/email/:jobId
 * @desc Email analysis results
 * @access Private
 */
router.post('/email/:jobId', tryCatch(async (req, res) => {
  const { jobId } = req.params;
  const { email, format = 'pdf', message = '' } = req.body;

  if (!email) {
    return res.error('Email is required', 'VALIDATION_ERROR', null, 400);
  }

  // Get job results
  const job = blueprintOrchestrator.getJob(jobId);
  
  if (!job || job.status !== 'completed') {
    return res.error('Analysis not complete', 'ANALYSIS_INCOMPLETE', null, 400);
  }

  // TODO: Implement email sending with nodemailer
  // For now, just export and return download URL
  
  const analysisData = {
    jobId: job.id,
    fileName: path.basename(job.filePath),
    ...job.results
  };

  const { filename } = await blueprintExportService.export(
    analysisData,
    format
  );

  res.success({
    jobId,
    email,
    message: 'Export prepared for email (email sending not yet implemented)',
    downloadUrl: `/api/blueprint/exports/${filename}`
  });
}));

export default router;
