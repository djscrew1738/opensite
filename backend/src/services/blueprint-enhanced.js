// Enhanced Blueprint PDF processing service with confidence scoring
// and improved extraction patterns

import fs from 'fs/promises';
import fsSync from 'fs';
import pdfParse from 'pdf-parse';

class EnhancedBlueprintService {
  constructor() {
    // Enhanced patterns with multiple variations for better matching
    this.patterns = {
      sqft: {
        patterns: [
          /(\d[\d,]*(?:\.\d+)?)\s*(?:sq\.?\s*ft|square\s+feet|sf|sqft|sq\.?\s*ft\.?)/i,
          /(\d[\d,]*(?:\.\d+)?)\s*(?:total\s+(?:area|sf)|gross\s+area|building\s+area)/i,
          /(?:area|size):?\s*(\d[\d,]*(?:\.\d+)?)/i,
          /(\d[\d,]*(?:\.\d+)?)\s*(?:sqm|square\s+meters?)/i
        ],
        multiplier: 10.764, // sqm to sqft
        weight: 1.0
      },
      bathrooms: {
        patterns: [
          /(\d+(?:\.\d+)?)\s*(?:bath(?:room)?s?|baths?|bth|ba\b)/i,
          /(\d+(?:\.\d+)?)\s*(?:full\s+bath|full\s+bathroom)/i,
          /(\d+(?:\.\d+)?)\s*(?:3[\s-]*piece|three[\s-]*piece)/i,
          /(\d+)\s*(?:fixture\s*bathroom|fixture\s*bath)/i
        ],
        weight: 0.9
      },
      units: {
        patterns: [
          /(\d+)\s*(?:units?|dwelling|apt\.?|apartment|suite|townhome|condo)/i,
          /(\d+)\s*(?:multi[\s-]*family|multifamily)/i,
          /(\d+)\s*(?:plex|\bunit\b)/i
        ],
        weight: 0.95
      },
      stories: {
        patterns: [
          /(\d+)\s*(?:stor(?:y|ies)|floors?|levels?)/i,
          /(\d+)\s*(?:story\s+building|floor\s+building)/i,
          /(\d+)\s*(?:\bstories\b|\bfloors\b)/i
        ],
        weight: 0.85
      },
      bedrooms: {
        patterns: [
          /(\d+)\s*(?:bed(?:room)?s?|bd|br\b)/i,
          /(\d+)\s*(?:br\s*\/\s*\d+ba|\d+ba\s*\/\s*(\d+)br)/i
        ],
        weight: 0.8
      },
      // Fixture patterns
      toilets: {
        patterns: [
          /(\d+)\s*(?:toilet|wc|water\s*closet|closet\s*bowl)/i,
          /(\d+)\s*(?:elongated\s+toilet|round\s+toilet)/i
        ],
        weight: 0.9
      },
      lavatories: {
        patterns: [
          /(\d+)\s*(?:lavator(?:y|ies)|lav|bathroom\s+sink|vanity\s+sink)/i,
          /(\d+)\s*(?:pedestal\s+sink|wall\s+sink|countertop\s+lav)/i
        ],
        weight: 0.9
      },
      kitchenFaucets: {
        patterns: [
          /(\d+)\s*(?:kitchen\s+faucet|kitchen\s+sink|kit\s+faucet|kit\s+sink)/i,
          /(\d+)\s*(?:sink[\s,]+kitchen|faucet[\s,]+kitchen)/i
        ],
        weight: 0.85
      },
      barSinks: {
        patterns: [
          /(\d+)\s*(?:bar\s+sink|wet\s+bar|prep\s+sink|entertainment\s+sink)/i
        ],
        weight: 0.8
      },
      tubs: {
        patterns: [
          /(\d+)\s*(?:tub|bathtub|bath\s+tub|soaking\s+tub|garden\s+tub)/i,
          /(\d+)\s*(?:oval\s+tub|rectangular\s+tub)/i
        ],
        weight: 0.85
      },
      showerBases: {
        patterns: [
          /(\d+)\s*(?:shower\s+base|shower\s+pan|shower\s+floor|shower\s+receptor)/i,
          /(\d+)\s*(?:shower\s+stall|walk[\s-]*in\s+shower)/i
        ],
        weight: 0.85
      },
      mudPans: {
        patterns: [
          /(\d+)\s*(?:mud\s+pan|shower\s+mud|mortar\s+bed|shower\s+liner)/i
        ],
        weight: 0.75
      },
      washingMachines: {
        patterns: [
          /(\d+)\s*(?:washing\s+machine|washer|w\/d|laundry\s+pair|washer\/dryer)/i,
          /(\d+)\s*(?:laundry\s+connection|laundry\s+hookup)/i
        ],
        weight: 0.8
      },
      waterSoftenerPreplumb: {
        patterns: [
          /(\d+)\s*(?:water\s+softener|softener\s+pre|ws\s+pre|softener\s+loop)/i,
          /(\d+)\s*(?:softener\s+rough|water\s+conditioner)/i
        ],
        weight: 0.7
      },
      hoseBibs: {
        patterns: [
          /(\d+)\s*(?:hose\s+bib|hose\s+spigot|exterior\s+faucet|silcock)/i,
          /(\d+)\s*(?:frost[\s-]*free\s+hydrant|yard\s+hydrant)/i
        ],
        weight: 0.75
      },
      floorDrains: {
        patterns: [
          /(\d+)\s*(?:floor\s+drain|area\s+drain|trench\s+drain|shower\s+drain)/i
        ],
        weight: 0.75
      }
    };

    // Reasonable value ranges for validation
    this.ranges = {
      sqft: { min: 100, max: 10000000 },
      bathrooms: { min: 0.5, max: 5000 },
      units: { min: 1, max: 10000 },
      stories: { min: 1, max: 200 },
      bedrooms: { min: 0, max: 50000 },
      toilets: { min: 0, max: 10000 },
      lavatories: { min: 0, max: 10000 },
      kitchenFaucets: { min: 0, max: 5000 },
      barSinks: { min: 0, max: 1000 },
      tubs: { min: 0, max: 5000 },
      showerBases: { min: 0, max: 5000 },
      mudPans: { min: 0, max: 5000 },
      washingMachines: { min: 0, max: 5000 },
      waterSoftenerPreplumb: { min: 0, max: 1000 },
      hoseBibs: { min: 0, max: 1000 },
      floorDrains: { min: 0, max: 5000 }
    };
  }

  async extractPdfText(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);

      return {
        success: true,
        text: data.text,
        pages: data.numpages,
        info: data.info,
        textLength: data.text.length
      };
    } catch (error) {
      console.error('PDF extraction error:', error);
      return {
        success: false,
        error: error.message,
        isEncrypted: error.message?.includes('password') || error.message?.includes('encrypted'),
        isCorrupted: error.message?.includes('corrupt') || error.message?.includes('invalid')
      };
    }
  }

  // Extract data with confidence scoring
  extractWithConfidence(text, fileName) {
    const extractedInfo = {};
    const confidenceScores = {};
    const extractionSources = {};
    const allMatches = {};

    for (const [key, config] of Object.entries(this.patterns)) {
      const { patterns, weight, multiplier = 1 } = config;
      let bestMatch = null;
      let bestConfidence = 0;
      const matches = [];

      for (const pattern of patterns) {
        const regex = new RegExp(pattern.source, pattern.flags + 'g');
        let match;
        
        while ((match = regex.exec(text)) !== null) {
          const value = match[1] || match[2];
          if (value) {
            const parsed = parseFloat(value.replace(/,/g, ''));
            const adjustedValue = multiplier !== 1 ? Math.round(parsed * multiplier) : parsed;
            
            if (this.isReasonableValue(key, adjustedValue)) {
              matches.push({
                value: adjustedValue,
                raw: value,
                index: match.index,
                context: text.substring(Math.max(0, match.index - 30), Math.min(text.length, match.index + 50))
              });

              // Calculate confidence based on context
              let confidence = weight;
              const context = match[0].toLowerCase();
              
              // Boost confidence for clearer labels
              if (context.includes('total') || context.includes('building')) confidence += 0.1;
              if (context.includes('spec') || context.includes('schedule')) confidence += 0.05;
              
              // Reduce confidence for ambiguous matches
              if (context.length < 10) confidence -= 0.1;
              
              // Cap at 1.0
              confidence = Math.min(1.0, Math.max(0, confidence));

              if (confidence > bestConfidence) {
                bestConfidence = confidence;
                bestMatch = adjustedValue;
              }
            }
          }
        }
      }

      if (bestMatch !== null) {
        extractedInfo[key] = bestMatch;
        confidenceScores[key] = Math.round(bestConfidence * 100);
        extractionSources[key] = matches;
        allMatches[key] = matches;
      }
    }

    return {
      fileName,
      extractedInfo,
      confidenceScores,
      extractionSources: Object.keys(extractionSources).reduce((acc, key) => {
        acc[key] = extractionSources[key].slice(0, 3); // Keep top 3 matches
        return acc;
      }, {}),
      hasLowConfidence: Object.values(confidenceScores).some(s => s < 50),
      averageConfidence: Object.values(confidenceScores).length > 0 
        ? Math.round(Object.values(confidenceScores).reduce((a, b) => a + b, 0) / Object.values(confidenceScores).length)
        : 0
    };
  }

  // Legacy analyze method for backwards compatibility
  analyzeBlueprint(text, fileName) {
    const result = this.extractWithConfidence(text, fileName);
    
    return {
      fileName: result.fileName,
      extractedInfo: result.extractedInfo,
      relevantText: this.extractRelevantSections(text),
      confidenceScores: result.confidenceScores,
      hasLowConfidence: result.hasLowConfidence,
      averageConfidence: result.averageConfidence
    };
  }

  validateAndSuggest(extractedData, confidenceScores) {
    const suggestions = [];
    const warnings = [];

    // Check for common issues
    if (extractedData.sqft && extractedData.units) {
      const sqftPerUnit = extractedData.sqft / extractedData.units;
      if (sqftPerUnit < 300) {
        warnings.push(`Very small unit size (${Math.round(sqftPerUnit)} sq ft/unit). Verify unit count.`);
      }
      if (sqftPerUnit > 10000) {
        warnings.push(`Very large unit size (${Math.round(sqftPerUnit)} sq ft/unit). Verify square footage.`);
      }
    }

    if (extractedData.bathrooms && extractedData.units) {
      const bathsPerUnit = extractedData.bathrooms / extractedData.units;
      if (bathsPerUnit > 5) {
        warnings.push(`Unusually high bathroom count (${bathsPerUnit.toFixed(1)} per unit).`);
      }
    }

    // Suggest missing common fields
    if (extractedData.units && !extractedData.bathrooms) {
      suggestions.push(`Consider adding bathroom count (typically ${Math.ceil(extractedData.units * 2)} for ${extractedData.units} units)`);
    }

    if (extractedData.sqft && !extractedData.stories) {
      suggestions.push('Story count not detected - check if building is multi-level');
    }

    // Flag low confidence items
    for (const [key, score] of Object.entries(confidenceScores || {})) {
      if (score < 50) {
        warnings.push(`${key} has low confidence (${score}%) - please verify`);
      }
    }

    return { suggestions, warnings };
  }

  isReasonableValue(key, value) {
    const range = this.ranges[key];
    if (!range) return true;
    return value >= range.min && value <= range.max;
  }

  extractRelevantSections(text, maxLength = 12000) {
    const sections = [];
    const keywords = [
      'plumbing', 'fixture', 'pipe', 'water', 'drain', 'sewer',
      'bathroom', 'kitchen', 'mechanical', 'utility', 'specifications',
      'schedule', 'equipment', 'appliance', 'rough-in', 'trim-out',
      'water heater', 'water softener', 'gas line', 'vent'
    ];

    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (keywords.some(kw => line.includes(kw))) {
        const context = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join(' ');
        if (!sections.includes(context)) {
          sections.push(context);
        }
      }
    }

    return sections.join('\n').slice(0, maxLength);
  }

  // Detect if PDF is scanned/image-based
  async detectPdfType(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      
      // Heuristics for scanned PDF detection
      const textLength = data.text?.length || 0;
      const pageCount = data.numpages || 1;
      const avgTextPerPage = textLength / pageCount;
      
      // Scanned PDFs typically have very little extractable text
      const isScanned = avgTextPerPage < 100;
      
      return {
        isScanned,
        textLength,
        pageCount,
        avgTextPerPage,
        confidence: isScanned ? 'low' : avgTextPerPage > 1000 ? 'high' : 'medium'
      };
    } catch (error) {
      return {
        isScanned: null,
        error: error.message
      };
    }
  }

  async deleteFile(filePath) {
    try {
      if (fsSync.existsSync(filePath)) {
        await fs.unlink(filePath);
      }
    } catch (error) {
      console.error('File deletion error:', error);
    }
  }
}

export const enhancedBlueprintService = new EnhancedBlueprintService();
export default EnhancedBlueprintService;
