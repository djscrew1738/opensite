/**
 * Blueprint Analysis Export Service
 * Export estimates to various formats (PDF, CSV, Excel, QuickBooks)
 */

import PDFDocument from 'pdfkit';
import { createObjectCsvWriter } from 'csv-writer';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import logger from './logger.js';

/**
 * Export Service for Blueprint Analysis
 */
class BlueprintExportService {
  constructor() {
    this.exportDir = process.env.EXPORT_DIR || './exports';
    this.ensureExportDir();
  }

  ensureExportDir() {
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
  }

  /**
   * Export to PDF
   */
  async exportToPDF(analysisData, options = {}) {
    const {
      includeVisualization = true,
      includeBreakdown = true,
      companyInfo = {}
    } = options;

    const filename = `estimate_${analysisData.jobId}_${Date.now()}.pdf`;
    const filepath = path.join(this.exportDir, filename);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filepath);
      
      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('Plumbing Estimate', 50, 50);
      doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, 50, 80);
      
      if (companyInfo.name) {
        doc.text(`Company: ${companyInfo.name}`, 50, 95);
      }

      // Project Info
      doc.moveDown();
      doc.fontSize(14).text('Project Information', 50, 130);
      doc.fontSize(10);
      doc.text(`Job ID: ${analysisData.jobId}`, 50, 150);
      doc.text(`File: ${analysisData.fileName || 'N/A'}`, 50, 165);
      doc.text(`Confidence: ${analysisData.confidence || 0}%`, 50, 180);

      // Fixtures
      doc.moveDown();
      doc.fontSize(14).text('Fixtures Detected', 50, 210);
      doc.fontSize(10);
      
      const fixtures = analysisData.combined?.fixtures || {};
      let y = 230;
      Object.entries(fixtures).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`, 50, y);
        y += 15;
      });

      // Material Takeoff
      doc.addPage();
      doc.fontSize(14).text('Material Takeoff', 50, 50);
      doc.fontSize(10);

      const materials = analysisData.combined?.materials || [];
      y = 80;
      
      // Table header
      doc.font('Helvetica-Bold');
      doc.text('Item', 50, y);
      doc.text('Category', 200, y);
      doc.text('Qty', 300, y);
      doc.text('Unit', 350, y);
      doc.text('Cost', 400, y);
      doc.text('Total', 480, y);
      doc.font('Helvetica');
      y += 20;

      materials.forEach(item => {
        const total = (item.qty || item.quantity || 0) * (item.cost || item.unitCost || 0);
        doc.text(item.item.substring(0, 30), 50, y);
        doc.text(item.category || 'Other', 200, y);
        doc.text(String(item.qty || item.quantity || 0), 300, y);
        doc.text(item.unit || 'EA', 350, y);
        doc.text(`$${(item.cost || item.unitCost || 0).toFixed(2)}`, 400, y);
        doc.text(`$${total.toFixed(2)}`, 480, y);
        y += 15;
      });

      // Totals
      doc.moveDown(2);
      const totals = analysisData.combined?.totals || {};
      doc.font('Helvetica-Bold');
      doc.text(`Material Total: $${(totals.material || 0).toFixed(2)}`, 350, y + 30);
      doc.text(`Labor Total: $${(totals.labor || 0).toFixed(2)}`, 350, y + 45);
      doc.text(`Grand Total: $${(totals.total || 0).toFixed(2)}`, 350, y + 60);

      doc.end();

      stream.on('finish', () => {
        resolve({ filepath, filename });
      });

      stream.on('error', reject);
    });
  }

  /**
   * Export to CSV
   */
  async exportToCSV(analysisData, options = {}) {
    const filename = `estimate_${analysisData.jobId}_${Date.now()}.csv`;
    const filepath = path.join(this.exportDir, filename);

    const materials = analysisData.combined?.materials || [];
    
    const csvWriter = createObjectCsvWriter({
      path: filepath,
      header: [
        { id: 'item', title: 'Item' },
        { id: 'category', title: 'Category' },
        { id: 'description', title: 'Description' },
        { id: 'quantity', title: 'Quantity' },
        { id: 'unit', title: 'Unit' },
        { id: 'unitCost', title: 'Unit Cost' },
        { id: 'totalCost', title: 'Total Cost' }
      ]
    });

    const records = materials.map(item => ({
      item: item.item,
      category: item.category || 'Other',
      description: item.description || '',
      quantity: item.qty || item.quantity || 0,
      unit: item.unit || 'EA',
      unitCost: item.cost || item.unitCost || 0,
      totalCost: (item.qty || item.quantity || 0) * (item.cost || item.unitCost || 0)
    }));

    // Add summary rows
    const totals = analysisData.combined?.totals || {};
    records.push({});
    records.push({ item: 'SUMMARY', category: '' });
    records.push({ item: 'Material Total', totalCost: totals.material || 0 });
    records.push({ item: 'Labor Total', totalCost: totals.labor || 0 });
    records.push({ item: 'Grand Total', totalCost: totals.total || 0 });

    await csvWriter.writeRecords(records);
    
    return { filepath, filename };
  }

  /**
   * Export to Excel
   */
  async exportToExcel(analysisData, options = {}) {
    const filename = `estimate_${analysisData.jobId}_${Date.now()}.xlsx`;
    const filepath = path.join(this.exportDir, filename);

    const wb = XLSX.utils.book_new();

    // Materials Sheet
    const materials = analysisData.combined?.materials || [];
    const materialsData = materials.map(item => ({
      'Item': item.item,
      'Category': item.category || 'Other',
      'Description': item.description || '',
      'Quantity': item.qty || item.quantity || 0,
      'Unit': item.unit || 'EA',
      'Unit Cost': item.cost || item.unitCost || 0,
      'Total Cost': (item.qty || item.quantity || 0) * (item.cost || item.unitCost || 0)
    }));

    const wsMaterials = XLSX.utils.json_to_sheet(materialsData);
    XLSX.utils.book_append_sheet(wb, wsMaterials, 'Materials');

    // Summary Sheet
    const totals = analysisData.combined?.totals || {};
    const fixtures = analysisData.combined?.fixtures || {};
    
    const summaryData = [
      { 'Category': 'Project Info', 'Item': 'Job ID', 'Value': analysisData.jobId },
      { 'Category': 'Project Info', 'Item': 'File', 'Value': analysisData.fileName || 'N/A' },
      { 'Category': 'Project Info', 'Item': 'Confidence', 'Value': `${analysisData.confidence || 0}%` },
      {},
      { 'Category': 'Fixtures', 'Item': 'Total Fixtures', 'Value': Object.values(fixtures).reduce((a, b) => a + b, 0) },
      ...Object.entries(fixtures).map(([key, value]) => ({
        'Category': 'Fixtures',
        'Item': key,
        'Value': value
      })),
      {},
      { 'Category': 'Costs', 'Item': 'Material Total', 'Value': totals.material || 0 },
      { 'Category': 'Costs', 'Item': 'Labor Total', 'Value': totals.labor || 0 },
      { 'Category': 'Costs', 'Item': 'Grand Total', 'Value': totals.total || 0 }
    ];

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Pipe Runs Sheet
    const pipeRuns = analysisData.combined?.pipeRuns || {};
    const pipeData = [
      { 'Source': 'From Dimensions', 'Estimated Feet': pipeRuns.fromDimensions?.estimatedPipeFeet || 0 },
      { 'Source': 'From Vision', 'Estimated Feet': pipeRuns.fromVision?.estimatedPipeFeet || 0 },
      { 'Source': 'Combined', 'Estimated Feet': pipeRuns.combined?.estimatedFeet || 0 }
    ];

    const wsPipes = XLSX.utils.json_to_sheet(pipeData);
    XLSX.utils.book_append_sheet(wb, wsPipes, 'Pipe Estimates');

    XLSX.writeFile(wb, filepath);

    return { filepath, filename };
  }

  /**
   * Export to QuickBooks IIF format
   */
  async exportToQuickBooks(analysisData, options = {}) {
    const filename = `estimate_${analysisData.jobId}_${Date.now()}.iif`;
    const filepath = path.join(this.exportDir, filename);

    const materials = analysisData.combined?.materials || [];
    let iifContent = '!TRNS\tTRNSID\tTRNSTYPE\tDATE\tACCNT\tNAME\tCLASS\tAMOUNT\tMEMO\n';
    iifContent += '!SPL\tSPLID\tTRNSTYPE\tDATE\tACCNT\tNAME\tCLASS\tAMOUNT\tMEMO\n';
    iifContent += '!ENDTRNS\n';

    materials.forEach((item, idx) => {
      const amount = (item.qty || item.quantity || 0) * (item.cost || item.unitCost || 0);
      iifContent += `SPL\t${idx + 1}\tITEM\t${new Date().toLocaleDateString()}\tMaterials\t${item.item}\t\t${amount}\t${item.category || 'Plumbing'}\n`;
    });

    iifContent += 'ENDTRNS\n';

    fs.writeFileSync(filepath, iifContent);

    return { filepath, filename };
  }

  /**
   * Export to JSON (for API/integration)
   */
  async exportToJSON(analysisData, options = {}) {
    const filename = `estimate_${analysisData.jobId}_${Date.now()}.json`;
    const filepath = path.join(this.exportDir, filename);

    const exportData = {
      metadata: {
        jobId: analysisData.jobId,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      },
      project: {
        fileName: analysisData.fileName,
        confidence: analysisData.confidence,
        servicesUsed: analysisData.combined?.sources || []
      },
      fixtures: analysisData.combined?.fixtures || {},
      pipeRuns: analysisData.combined?.pipeRuns || {},
      materials: analysisData.combined?.materials || [],
      totals: analysisData.combined?.totals || {}
    };

    fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));

    return { filepath, filename };
  }

  /**
   * Export in specified format
   */
  async export(analysisData, format, options = {}) {
    switch (format.toLowerCase()) {
      case 'pdf':
        return this.exportToPDF(analysisData, options);
      case 'csv':
        return this.exportToCSV(analysisData, options);
      case 'excel':
      case 'xlsx':
        return this.exportToExcel(analysisData, options);
      case 'quickbooks':
      case 'iif':
        return this.exportToQuickBooks(analysisData, options);
      case 'json':
        return this.exportToJSON(analysisData, options);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Get export file URL
   */
  getExportUrl(filename) {
    return `/exports/${filename}`;
  }

  /**
   * Clean up old exports
   */
  async cleanupOldExports(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    const files = fs.readdirSync(this.exportDir);
    const now = Date.now();

    for (const file of files) {
      const filepath = path.join(this.exportDir, file);
      const stats = fs.statSync(filepath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filepath);
        logger.info(`Cleaned up old export: ${file}`);
      }
    }
  }
}

export const blueprintExportService = new BlueprintExportService();
export default BlueprintExportService;
