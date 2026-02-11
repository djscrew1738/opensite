// Blueprint PDF processing service

import fs from 'fs';
import pdfParse from 'pdf-parse';

class BlueprintService {
  async extractPdfText(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);

      return {
        success: true,
        text: data.text,
        pages: data.numpages,
        info: data.info
      };
    } catch (error) {
      console.error('PDF extraction error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Analyze blueprint text to extract project details
  analyzeBlueprint(text, fileName) {
    const analysis = {
      fileName,
      extractedInfo: {}
    };

    // Try to extract common blueprint information
    const patterns = {
      sqft: /(\d+[\d,]*)\s*(?:sq\.?\s*ft|square\s+feet|sf)/i,
      bathrooms: /(\d+)\s*(?:bath(?:room)?s?|BR)/i,
      units: /(\d+)\s*(?:units?|dwelling)/i,
      stories: /(\d+)\s*(?:stor(?:y|ies)|floor)/i,
      rooms: /(\d+)\s*(?:bed(?:room)?s?|BR)/i
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match) {
        analysis.extractedInfo[key] = parseInt(match[1].replace(/,/g, ''));
      }
    }

    // Extract text snippets for AI analysis
    analysis.relevantText = this.extractRelevantSections(text);

    return analysis;
  }

  extractRelevantSections(text) {
    const sections = [];
    const keywords = [
      'plumbing', 'fixture', 'pipe', 'water', 'drain', 'sewer',
      'bathroom', 'kitchen', 'mechanical', 'utility', 'specifications'
    ];

    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (keywords.some(kw => line.includes(kw))) {
        // Get context around the keyword
        const context = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join(' ');
        sections.push(context);
      }
    }

    // Limit to first 3000 characters for AI processing
    return sections.join('\n').slice(0, 3000);
  }

  // Clean up uploaded file
  async deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('File deletion error:', error);
    }
  }
}

export const blueprintService = new BlueprintService();
