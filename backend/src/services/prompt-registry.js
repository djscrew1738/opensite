// Intelligence Orchestration Layer - Prompt Registry
// Centralized management for all AI prompts across the platform

// Patterns that commonly signal prompt injection attempts
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior|earlier)\s+(instructions?|prompts?|context)/gi,
  /forget\s+(everything|all|what|your)\s/gi,
  /you\s+are\s+now\s+(a|an)\s/gi,
  /\bact\s+as\s+(a|an)\s/gi,
  /\bnew\s+instructions?:/gi,
  /\bsystem\s*:/gi,
  /\bDAN\b/g,
  /<\/?(?:system|instruction|prompt|context)>/gi,
];

/**
 * Strip potential prompt injection patterns from user-supplied strings
 * before they are interpolated into AI prompts.
 *
 * @param {string} value - Raw user-supplied string
 * @param {number} [maxLength=500] - Hard cap on field length
 * @returns {string}
 */
function sanitizeField(value, maxLength = 500) {
  if (value == null) return '';
  let s = String(value).trim();
  // Remove null bytes and control characters (except common whitespace)
  s = s.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
  // Redact injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    s = s.replace(pattern, '[REDACTED]');
  }
  return s.slice(0, maxLength);
}

export const PromptRegistry = {
  // Blueprint Analysis Prompts
  blueprint: {
    getAnalysisPrompt: (fileName, extractedData, blueprintText, tier) => {
      const fixtureCount = (extractedData.toilets || 0) + (extractedData.lavatories || 0) +
        (extractedData.kitchenFaucets || 0) + (extractedData.barSinks || 0) +
        (extractedData.tubs || 0) + (extractedData.showerBases || 0) +
        (extractedData.mudPans || 0) + (extractedData.washingMachines || 0);

      const safeFileName = sanitizeField(fileName, 200);
      const safeBlueprintText = blueprintText ? sanitizeField(blueprintText, 6000) : null;

      return `You are an expert DFW plumbing estimator. Analyze this blueprint and return a supply-house-ready material takeoff.

PROJECT: ${safeFileName}
${extractedData.sqft ? `SQ FT: ${Number(extractedData.sqft) || 0}` : ''}
${extractedData.units ? `UNITS: ${Number(extractedData.units) || 0}` : ''}
${extractedData.stories ? `STORIES: ${Number(extractedData.stories) || 0}` : ''}
${extractedData.bathrooms ? `BATHROOMS: ${Number(extractedData.bathrooms) || 0}` : ''}
FIXTURES DETECTED: ${fixtureCount} total — ${extractedData.toilets || 0} toilets, ${extractedData.lavatories || 0} lavs, ${extractedData.kitchenFaucets || 0} kitchen, ${extractedData.barSinks || 0} bar, ${extractedData.tubs || 0} tubs, ${extractedData.showerBases || 0} showers, ${extractedData.mudPans || 0} mud pans, ${extractedData.washingMachines || 0} W/M, ${extractedData.waterSoftenerPreplumb || 0} WS pre-plumb

${safeBlueprintText ? 'BLUEPRINT TEXT:\n' + safeBlueprintText : ''}

Return ONLY this JSON — no text before or after:

{
  "fixtures": {
    "toilets": 0, "lavatories": 0, "kitchenFaucets": 0, "barSinks": 0,
    "tubs": 0, "showerBases": 0, "mudPans": 0, "washingMachines": 0,
    "waterSoftener": 0, "total": 0
  },
  "takeoff": [
    {"item": "3/4" Type L Copper", "category": "Supply", "description": "Type L Copper Tube", "quantity": 340, "unit": "LF", "unitCost": 3.85, "totalCost": 1309}
  ],
  "totals": {
    "material": 18400,
    "laborMultiplier": 1.65,
    "estimate": 30360
  },
  "notes": ["47 fixtures total", "PEX-A recommended for 2nd floor"]
}

RULES:
- "takeoff" is the ONLY thing that matters. Make it SUPPLY HOUSE READY.
- Use realistic 2024-2025 DFW supply house pricing.
- Return ONLY valid JSON. All numbers must be numbers, not strings.`;
    },
    
    getComprehensivePrompt: (context, blueprintText) => {
      const safeContext = sanitizeField(context, 2000);
      const safeBlueprintText = blueprintText ? sanitizeField(blueprintText, 5000) : null;

      return `You are an expert plumbing estimator for CTL Plumbing LLC in DFW.

Analyze this blueprint and provide a comprehensive material takeoff.

${safeContext}

${safeBlueprintText ? `BLUEPRINT TEXT:\n${safeBlueprintText}` : ''}

Provide a complete estimate including:
1. Fixture counts (validated across all sources)
2. Pipe runs (use dimension data for accuracy)
3. Material takeoff with DFW pricing
4. Labor estimates
5. Code compliance notes

Return JSON:
{
  "fixtures": { "toilets": 0, "sinks": 0 },
  "pipeRuns": { "supplyFeet": 0, "dwvFeet": 0 },
  "takeoff": [{ "item": "", "qty": 0, "unit": "", "cost": 0 }],
  "labor": { "hours": 0, "rate": 85 },
  "totals": { "material": 0, "labor": 0, "total": 0 },
  "notes": ["..."]
}`;
    }
  },

  // Lead Scoring Prompts
  leads: {
    getScoringPrompt: (lead) => {
      const safeTitle = sanitizeField(lead.title, 200);
      const safeType = sanitizeField(lead.projectType, 100);
      const safeValue = lead.value != null ? Number(lead.value) || 0 : 'Unknown';
      const safeLocation = sanitizeField(lead.location, 200);

      return `Score this construction lead (0-100) and classify as hot/warm/cold:
Project: ${safeTitle}
Type: ${safeType}
Value: $${safeValue}
Location: ${safeLocation}

Return JSON: {"score": number, "status": "hot|warm|cold", "reasoning": "..."}`;
    }
  },

  // Assistant Chat Prompts
  chat: {
    getSystemPrompt: (pageContextTitle) => {
      const safeContext = sanitizeField(pageContextTitle, 100);
      return `You are a specialized AI assistant for CTL Plumbing LLC, operating within their OpenSite intelligence platform.
Your goal is to provide expert plumbing, estimating, and operational advice.
Current User Context: ${safeContext || 'General Dashboard'}

Rules:
1. Be concise, direct, and professional.
2. Focus on DFW (Dallas-Fort Worth) local codes (IPC/UPC as locally amended) when applicable.
3. Recommend standard industry materials (e.g., PEX-A, Type L Copper, Schedule 40 PVC).`;
    },
    buildChatPrompt: (message, history, systemPrompt) => {
      let prompt = '';
      if (systemPrompt) prompt += `System: ${systemPrompt}

`;
      for (const msg of history) {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        prompt += `${role}: ${msg.content}

`;
      }
      prompt += `User: ${message}
Assistant:`;
      return prompt;
    }
  }
};

export default PromptRegistry;
