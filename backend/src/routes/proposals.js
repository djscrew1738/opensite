/**
 * Proposal Routes
 * API endpoints for generating and managing PDF proposals
 */

import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { generateProposal } from '../services/proposal-generator.js';
import { db } from '../services/database.js';
import { authenticateToken } from '../middleware/auth-jwt.js';
import { requirePermission, PERMISSIONS } from '../middleware/rbac.js';
import { tryCatch, parsePagination, paginationMeta } from '../utils/response.js';
import { validateId } from '../middleware/validation.js';
import logger from '../services/logger.js';

const router = express.Router();

// All proposal routes require authentication
router.use(authenticateToken);

const PROPOSALS_DIR = './data/proposals';

// Ensure proposals directory exists
async function ensureProposalsDir() {
  try {
    await fs.mkdir(PROPOSALS_DIR, { recursive: true });
  } catch (err) {
    logger.error('Failed to create proposals directory:', err.message);
  }
}

// Initial setup
db.initializeProposalTables();
ensureProposalsDir();

/**
 * Generate a new proposal
 * POST /api/proposals/generate
 */
router.post('/generate', 
  requirePermission(PERMISSIONS.ESTIMATES_CREATE),
  tryCatch(async (req, res) => {
    const {
      clientName,
      projectAddress,
      projectType,
      items,
      materials,
      notes,
      taxRate,
      validityDays,
      paymentTerms,
      estimateId,
      totalAmount
    } = req.body;

    if (!clientName || !projectAddress) {
      return res.error('Client name and project address are required', 'VALIDATION_ERROR', null, 400);
    }

    // Get company settings
    const settings = await db.getAllSettings();
    
    // Generate proposal number
    const proposalNumber = `PROP-${Date.now()}`;
    
    const proposalData = {
      proposalNumber,
      clientName,
      projectAddress,
      projectType: projectType || 'New Construction Plumbing',
      items: items || [],
      materials: materials || [],
      notes,
      taxRate: taxRate || 0,
      validityDays: validityDays || 30,
      paymentTerms: paymentTerms || '50% deposit, 50% upon completion',
      warrantyMonths: 12,
      companyName: settings?.company_name || 'CTL Plumbing LLC',
      companyAddress: settings?.company_address || 'DFW Metroplex, Texas',
      companyPhone: settings?.company_phone || '(817) 555-0123',
      companyEmail: settings?.company_email || 'estimates@ctlplumbingllc.com'
    };

    const filename = `proposal-${proposalNumber}.pdf`;
    const outputPath = path.join(PROPOSALS_DIR, filename);

    // Generate PDF
    await generateProposal(proposalData, outputPath);

    // Store record in database
    const proposal = await db.createProposal({
      userId: req.user.id,
      estimateId,
      proposalNumber,
      clientName,
      projectAddress,
      projectType: proposalData.projectType,
      totalAmount: totalAmount || 0,
      status: 'generated',
      filename,
      filePath: outputPath,
      data: proposalData
    });

    logger.info('Proposal generated and saved', {
      proposalId: proposal.id,
      proposalNumber,
      userId: req.user.id
    });

    res.status(201).success(proposal, 'Proposal generated successfully');
  })
);

/**
 * List all proposals
 * GET /api/proposals
 */
router.get('/', 
  requirePermission(PERMISSIONS.ESTIMATES_READ),
  tryCatch(async (req, res) => {
    const { status, estimateId } = req.query;
    const { page, limit, offset } = parsePagination(req.query);
    
    const proposals = await db.getAllProposals({
      userId: req.user.id,
      status,
      estimateId,
      limit,
      offset
    });

    res.success({ proposals, total: proposals.length }, null, paginationMeta(page, limit, proposals.length));
  })
);

/**
 * Get single proposal
 * GET /api/proposals/:id
 */
router.get('/:id', 
  validateId,
  requirePermission(PERMISSIONS.ESTIMATES_READ),
  tryCatch(async (req, res) => {
    const proposal = await db.getProposal(req.params.id);
    
    if (!proposal) return res.error('Proposal not found', 'NOT_FOUND', null, 404);
    if (proposal.userId !== req.user.id && req.user.role !== 'admin') {
      return res.error('Access denied', 'FORBIDDEN', null, 403);
    }

    res.success(proposal);
  })
);

/**
 * Download a proposal PDF
 * GET /api/proposals/:id/download
 */
router.get('/:id/download', 
  validateId,
  requirePermission(PERMISSIONS.ESTIMATES_READ),
  tryCatch(async (req, res) => {
    const proposal = await db.getProposal(req.params.id);
    
    if (!proposal || !proposal.filePath) {
      return res.error('Proposal file not found', 'NOT_FOUND', null, 404);
    }

    try {
      await fs.access(proposal.filePath);
    } catch {
      return res.error('PDF file missing from storage', 'FILE_MISSING', null, 404);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${proposal.filename}"`);
    
    const fileContent = await fs.readFile(proposal.filePath);
    res.send(fileContent);
  })
);

/**
 * Update proposal status
 * PATCH /api/proposals/:id/status
 */
router.patch('/:id/status', 
  validateId,
  requirePermission(PERMISSIONS.ESTIMATES_UPDATE),
  tryCatch(async (req, res) => {
    const { status } = req.body;
    if (!status) return res.error('Status is required', 'VALIDATION_ERROR', null, 400);

    const updated = await db.updateProposal(req.params.id, { status });
    if (!updated) return res.error('Proposal not found', 'NOT_FOUND', null, 404);

    res.success(updated, 'Status updated');
  })
);

/**
 * Delete a proposal
 * DELETE /api/proposals/:id
 */
router.delete('/:id', 
  validateId,
  requirePermission(PERMISSIONS.ESTIMATES_DELETE),
  tryCatch(async (req, res) => {
    const proposal = await db.getProposal(req.params.id);
    if (!proposal) return res.error('Proposal not found', 'NOT_FOUND', null, 404);

    // Delete file if exists
    if (proposal.filePath) {
      try {
        await fs.unlink(proposal.filePath);
      } catch (e) {
        logger.warn(`Failed to delete PDF file: ${proposal.filePath}`);
      }
    }

    await db.deleteProposal(req.params.id);
    res.success({ id: req.params.id }, 'Proposal deleted successfully');
  })
);

/**
 * Preview template structure
 */
router.get('/config/template', 
  tryCatch(async (req, res) => {
    const sample = {
      clientName: 'Builder Name',
      projectAddress: '123 Site St',
      projectType: 'Plumbing Install',
      items: [{ description: 'Task', qty: 1, unitPrice: 100 }],
      materials: [{ name: 'Part', category: 'PVC' }],
      notes: 'Terms and conditions',
      taxRate: 0.0825,
      validityDays: 30,
      paymentTerms: 'Due on receipt'
    };
    res.success(sample);
  })
);

export default router;
