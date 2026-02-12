// Blueprint PDF processing service

import fs from 'fs/promises';
import fsSync from 'fs';
import pdfParse from 'pdf-parse';

class BlueprintService {
  async extractPdfText(filePath) {
    try {
      // Use async file reading to avoid memory issues with large PDFs
      const dataBuffer = await fs.readFile(filePath);
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

    // Enhanced patterns to catch more variations including fixtures
    const patterns = {
      sqft: /(\d+[\d,]*(?:\.\d+)?)\s*(?:sq\.?\s*ft|square\s+feet|sf|sqft)/i,
      bathrooms: /(\d+(?:\.\d+)?)\s*(?:bath(?:room)?s?|bth|ba|BR)|(\d+(?:\.\d+)?)BR/i,
      units: /(\d+)\s*(?:units?|dwelling|apt|apartment)/i,
      stories: /(\d+)\s*(?:stor(?:y|ies)|floors?|level)/i,
      rooms: /(\d+)\s*(?:bed(?:room)?s?|bd|br)|(\d+)BR/i,
      lavatories: /(\d+)\s*(?:lavator(?:y|ies)|lav|sink)/i,
      barSinks: /(\d+)\s*(?:bar\s*sink|wet\s*bar)/i,
      tubs: /(\d+)\s*(?:tub|bathtub)/i,
      showerBases: /(\d+)\s*(?:shower\s*base|shower\s*pan|shower)/i,
      mudPans: /(\d+)\s*(?:mud\s*pan|shower\s*mud)/i,
      washingMachines: /(\d+)\s*(?:washing\s*machine|washer|w\/d|laundry)/i,
      toilets: /(\d+)\s*(?:toilet|wc|water\s*closet)/i,
      waterSoftenerPreplumb: /(\d+)\s*(?:water\s*softener|soft(?:e)?ner\s*pre|ws\s*pre)/i,
      kitchenFaucets: /(\d+)\s*(?:kitchen\s*faucet|kitchen\s*sink|kit\s*faucet)/i
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match) {
        // Handle multiple capture groups (e.g., "2BR" vs "2 BR")
        const value = match[1] || match[2];
        if (value) {
          const parsed = parseFloat(value.replace(/,/g, ''));

          // Sanity check extracted values
          if (this.isReasonableValue(key, parsed)) {
            analysis.extractedInfo[key] = parsed;
          } else {
            console.warn(`Suspicious ${key} value extracted: ${parsed}, ignoring`);
          }
        }
      }
    }

    // Extract text snippets for AI analysis
    analysis.relevantText = this.extractRelevantSections(text);

    return analysis;
  }

  // Validate extracted values are reasonable
  isReasonableValue(key, value) {
    const ranges = {
      sqft: { min: 100, max: 1000000 },
      bathrooms: { min: 0.5, max: 500 },
      units: { min: 1, max: 10000 },
      stories: { min: 1, max: 100 },
      rooms: { min: 0, max: 1000 },
      lavatories: { min: 0, max: 1000 },
      barSinks: { min: 0, max: 500 },
      tubs: { min: 0, max: 500 },
      showerBases: { min: 0, max: 500 },
      mudPans: { min: 0, max: 500 },
      washingMachines: { min: 0, max: 1000 },
      toilets: { min: 0, max: 1000 },
      waterSoftenerPreplumb: { min: 0, max: 1000 },
      kitchenFaucets: { min: 0, max: 1000 }
    };

    const range = ranges[key];
    if (!range) return true;

    return value >= range.min && value <= range.max;
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
      // Check if file exists using sync method (existsSync is the only sync method we need)
      if (fsSync.existsSync(filePath)) {
        // Use async unlink to avoid blocking
        await fs.unlink(filePath);
      }
    } catch (error) {
      // Don't throw - file might have already been deleted
      console.error('File deletion error:', error);
    }
  }
}

export const blueprintService = new BlueprintService();
