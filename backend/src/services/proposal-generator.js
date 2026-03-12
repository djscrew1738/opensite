/**
 * PDF Proposal Generator
 * Creates professional, branded PDF proposals for clients
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Brand colors
const BRAND = {
  primary: '#1E3A5F',    // Deep navy
  secondary: '#3B82F6',  // Electric blue
  accent: '#10B981',     // Success green
  warning: '#F59E0B',    // Warning orange
  text: '#1F2937',       // Dark gray
  textLight: '#6B7280',  // Medium gray
  bgLight: '#F3F4F6',    // Light gray
  white: '#FFFFFF'
};

/**
 * Generate a professional PDF proposal
 * @param {Object} data - Proposal data
 * @param {string} outputPath - Output file path
 * @returns {Promise<string>} - Path to generated PDF
 */
export async function generateProposal(data, outputPath) {
  const startTime = Date.now();
  
  try {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);
    
    // Get company settings
    const companyName = data.companyName || 'CTL Plumbing LLC';
    const companyAddress = data.companyAddress || 'DFW Metroplex, Texas';
    const companyPhone = data.companyPhone || '(817) 555-0123';
    const companyEmail = data.companyEmail || 'estimates@ctlplumbingllc.com';
    
    // ===== COVER PAGE =====
    generateCoverPage(doc, {
      companyName,
      companyAddress,
      proposalNumber: data.proposalNumber || `PROP-${Date.now()}`,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      clientName: data.clientName,
      projectAddress: data.projectAddress,
      projectType: data.projectType || 'New Construction Plumbing'
    });
    
    // ===== TERMS & SCOPE =====
    doc.addPage();
    generateTermsPage(doc, {
      validityDays: data.validityDays || 30,
      paymentTerms: data.paymentTerms || '50% deposit, 50% upon completion',
      warrantyMonths: data.warrantyMonths || 12
    });
    
    // ===== COST BREAKDOWN =====
    doc.addPage();
    generateCostBreakdownPage(doc, data);
    
    // ===== MATERIAL SPECIFICATIONS =====
    if (data.materials && data.materials.length > 0) {
      doc.addPage();
      generateMaterialsPage(doc, data.materials);
    }
    
    // ===== SIGNATURE PAGE =====
    doc.addPage();
    generateSignaturePage(doc, {
      companyName,
      companyAddress,
      companyPhone,
      companyEmail,
      clientName: data.clientName,
      proposalNumber: data.proposalNumber || `PROP-${Date.now()}`
    });
    
    doc.end();
    
    // Wait for stream to finish
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
    
    const duration = Date.now() - startTime;
    logger.info('[proposal-generator] PDF generated', { 
      path: outputPath, 
      duration: `${duration}ms`,
      pages: doc.bufferedPageRange().count 
    });
    
    return outputPath;
    
  } catch (err) {
    logger.error('[proposal-generator] Failed:', err.message);
    throw err;
  }
}

/**
 * Generate cover page
 */
function generateCoverPage(doc, data) {
  // Header background
  doc.rect(0, 0, doc.page.width, 200).fill(BRAND.primary);
  
  // Company name in header
  doc.fillColor(BRAND.white)
    .fontSize(32)
    .font('Helvetica-Bold')
    .text(data.companyName.toUpperCase(), 50, 60);
  
  doc.fontSize(12)
    .font('Helvetica')
    .text(data.companyAddress, 50, 100);
  
  // Proposal title
  doc.fillColor(BRAND.text)
    .fontSize(28)
    .font('Helvetica-Bold')
    .text('PLUMBING PROPOSAL', 50, 250);
  
  // Proposal details box
  const boxY = 320;
  doc.rect(50, boxY, 250, 140).fill(BRAND.bgLight).stroke(BRAND.secondary);
  
  doc.fillColor(BRAND.text)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('PROPOSAL #: ', 60, boxY + 15)
    .font('Helvetica')
    .text(data.proposalNumber, 130, boxY + 15);
  
  doc.font('Helvetica-Bold')
    .text('DATE: ', 60, boxY + 40)
    .font('Helvetica')
    .text(data.date, 100, boxY + 40);
  
  doc.font('Helvetica-Bold')
    .text('PROJECT TYPE: ', 60, boxY + 65)
    .font('Helvetica')
    .text(data.projectType, 145, boxY + 65);
  
  // Client info
  doc.font('Helvetica-Bold')
    .text('PREPARED FOR: ', 60, boxY + 90)
    .font('Helvetica')
    .text(data.clientName, 145, boxY + 90);
  
  doc.fontSize(9)
    .fillColor(BRAND.textLight)
    .text(data.projectAddress, 145, boxY + 105, { width: 140 });
}

/**
 * Generate terms and scope page
 */
function generateTermsPage(doc, data) {
  doc.fillColor(BRAND.primary)
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('Terms & Conditions', 0, 50, { align: 'center' });
  
  doc.moveTo(50, 80).lineTo(doc.page.width - 50, 80).stroke(BRAND.secondary);
  
  const contentY = 100;
  
  doc.fillColor(BRAND.text)
    .fontSize(11)
    .font('Helvetica');
  
  // Scope of Work
  doc.font('Helvetica-Bold').text('SCOPE OF WORK', 50, contentY);
  doc.font('Helvetica').text(
    'This proposal includes all labor, materials, and equipment necessary to complete the plumbing installation as specified. ' +
    'Work includes rough-in, top-out, and final fixture installation per local code requirements and project specifications.',
    50, contentY + 20, { width: doc.page.width - 100, align: 'justify' }
  );
  
  // Exclusions
  doc.font('Helvetica-Bold').text('EXCLUSIONS', 50, contentY + 80);
  const exclusions = [
    'Repair or replacement of existing plumbing not in scope',
    'Landscaping, concrete, or drywall repair',
    'Electrical work or gas line modifications',
    'Permit fees (unless specified)',
    'Owner-supplied fixtures (unless specified)'
  ];
  
  exclusions.forEach((item, i) => {
    doc.font('Helvetica').text(`• ${item}`, 60, contentY + 100 + (i * 15));
  });
  
  // Payment Terms
  doc.font('Helvetica-Bold').text('PAYMENT TERMS', 50, contentY + 200);
  doc.font('Helvetica').text(`Payment terms: ${data.paymentTerms}`, 50, contentY + 220);
  doc.text(`Proposal valid for ${data.validityDays} days from date of issue.`, 50, contentY + 240);
  
  // Warranty
  doc.font('Helvetica-Bold').text('WARRANTY', 50, contentY + 280);
  doc.font('Helvetica').text(
    `All workmanship is warranted for ${data.warrantyMonths} months from date of final completion. ` +
    'Manufacturer warranties apply to all fixtures and materials. '
  );
}

/**
 * Generate cost breakdown page
 */
function generateCostBreakdownPage(doc, data) {
  doc.fillColor(BRAND.primary)
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('Cost Breakdown', 0, 50, { align: 'center' });
  
  doc.moveTo(50, 80).lineTo(doc.page.width - 50, 80).stroke(BRAND.secondary);
  
  const tableY = 100;
  const col1X = 50;
  const col2X = 350;
  const col3X = 480;
  
  // Table header
  doc.fillColor(BRAND.bgLight)
    .rect(col1X, tableY, doc.page.width - 100, 25)
    .fill();
  
  doc.fillColor(BRAND.primary)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('DESCRIPTION', col1X + 5, tableY + 7)
    .text('QTY', col2X, tableY + 7)
    .text('AMOUNT', col3X, tableY + 7);
  
  let rowY = tableY + 25;
  let total = 0;
  
  // Line items
  const items = data.items || [
    { description: 'Underground plumbing (per fixture)', qty: data.fixtures || 0, unitPrice: 285 },
    { description: 'Rough-in plumbing (per fixture)', qty: data.fixtures || 0, unitPrice: 320 },
    { description: 'Top-out plumbing (per fixture)', qty: data.fixtures || 0, unitPrice: 180 },
    { description: 'Trim-out/final (per fixture)', qty: data.fixtures || 0, unitPrice: 220 },
    { description: 'Water heater installation', qty: data.waterHeaters || 1, unitPrice: 850 },
  ];
  
  items.forEach((item, i) => {
    const amount = item.qty * item.unitPrice;
    total += amount;
    
    // Alternating row background
    if (i % 2 === 0) {
      doc.fillColor('#FAFAFA')
        .rect(col1X, rowY, doc.page.width - 100, 20)
        .fill();
    }
    
    doc.fillColor(BRAND.text)
      .font('Helvetica')
      .text(item.description, col1X + 5, rowY + 5, { width: 280 })
      .text(item.qty.toString(), col2X, rowY + 5)
      .text(`$${amount.toLocaleString()}`, col3X, rowY + 5);
    
    rowY += 20;
  });
  
  // Subtotal
  rowY += 10;
  doc.font('Helvetica-Bold')
    .text('Subtotal:', col2X, rowY)
    .text(`$${total.toLocaleString()}`, col3X, rowY);
  
  // Tax (if applicable)
  const taxRate = data.taxRate || 0;
  const tax = total * taxRate;
  if (tax > 0) {
    rowY += 20;
    doc.font('Helvetica')
      .text(`Tax (${(taxRate * 100).toFixed(1)}%):`, col2X, rowY)
      .text(`$${tax.toLocaleString()}`, col3X, rowY);
  }
  
  // Total
  const grandTotal = total + tax;
  rowY += 30;
  doc.fillColor(BRAND.primary)
    .rect(col1X, rowY, doc.page.width - 100, 30)
    .fill();
  
  doc.fillColor(BRAND.white)
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('TOTAL PROJECT COST:', col2X, rowY + 8)
    .text(`$${grandTotal.toLocaleString()}`, col3X, rowY + 8);
  
  // Notes
  if (data.notes) {
    doc.fillColor(BRAND.text)
      .fontSize(9)
      .font('Helvetica-Oblique')
      .text(`Note: ${data.notes}`, 50, rowY + 50, { width: doc.page.width - 100 });
  }
}

/**
 * Generate materials specification page
 */
function generateMaterialsPage(doc, materials) {
  doc.fillColor(BRAND.primary)
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('Material Specifications', 0, 50, { align: 'center' });
  
  doc.moveTo(50, 80).lineTo(doc.page.width - 50, 80).stroke(BRAND.secondary);
  
  doc.fillColor(BRAND.text)
    .fontSize(10)
    .font('Helvetica');
  
  let y = 100;
  
  materials.forEach((material, i) => {
    if (y > doc.page.height - 100) {
      doc.addPage();
      y = 50;
    }
    
    doc.font('Helvetica-Bold').text(material.name, 50, y);
    doc.font('Helvetica').text(`Category: ${material.category}`, 50, y + 15);
    if (material.supplier) {
      doc.text(`Supplier: ${material.supplier}`, 50, y + 30);
    }
    if (material.partNumber) {
      doc.text(`Part #: ${material.partNumber}`, 50, y + 45);
    }
    
    y += 70;
  });
}

/**
 * Generate signature page
 */
function generateSignaturePage(doc, data) {
  doc.fillColor(BRAND.primary)
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('Acceptance', 0, 50, { align: 'center' });
  
  doc.moveTo(50, 80).lineTo(doc.page.width - 50, 80).stroke(BRAND.secondary);
  
  const y = 120;
  
  // Client signature
  doc.fillColor(BRAND.text)
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('CLIENT ACCEPTANCE', 50, y);
  
  doc.font('Helvetica')
    .text('By signing below, Client accepts this proposal and agrees to the terms and conditions stated herein.', 50, y + 20, { width: doc.page.width - 100 });
  
  // Signature lines
  doc.moveTo(50, y + 80).lineTo(300, y + 80).stroke(BRAND.text);
  doc.fontSize(9).text('Signature', 50, y + 85);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 320, y + 85);
  
  doc.moveTo(50, y + 130).lineTo(300, y + 130).stroke(BRAND.text);
  doc.text('Print Name', 50, y + 135);
  
  // Company signature
  doc.fontSize(11)
    .font('Helvetica-Bold')
    .text('CONTRACTOR ACCEPTANCE', 50, y + 200);
  
  doc.moveTo(50, y + 240).lineTo(300, y + 240).stroke(BRAND.text);
  doc.fontSize(9)
    .font('Helvetica')
    .text(`Authorized Representative - ${data.companyName}`, 50, y + 245);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 320, y + 245);
  
  // Footer contact info
  doc.fillColor(BRAND.textLight)
    .fontSize(9)
    .text(`${data.companyName} | ${data.companyAddress}`, 0, doc.page.height - 100, { align: 'center' })
    .text(`${data.companyPhone} | ${data.companyEmail}`, { align: 'center' });
}

export default { generateProposal };
