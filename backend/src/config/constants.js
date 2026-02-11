// Business logic constants for CTL Plumbing LLC

export const PRICING_TIERS = {
  production: {
    name: 'Production',
    pricePerUnit: 5600,
    marginRange: '18-22%',
    description: 'High-volume multi-family projects with standardized layouts'
  },
  custom: {
    name: 'Custom',
    pricePerUnit: 7200,
    marginRange: '25-30%',
    description: 'Mid-rise buildings with custom layouts and fixtures'
  },
  premium: {
    name: 'Premium',
    pricePerUnit: 10200,
    marginRange: '30-38%',
    description: 'Luxury properties with high-end fixtures and complex systems'
  }
};

export const PROJECT_PHASES = {
  roughIn: {
    name: 'Rough-in',
    percentage: 50,
    description: 'Underground and in-wall plumbing installation'
  },
  topOut: {
    name: 'Top-out',
    percentage: 30,
    description: 'Above-ceiling and risers installation'
  },
  trim: {
    name: 'Trim',
    percentage: 20,
    description: 'Fixture installation and final connections'
  }
};

export const LEAD_STATUSES = {
  hot: {
    name: 'Hot',
    minScore: 80,
    color: 'red',
    description: 'High-value, qualified leads requiring immediate follow-up'
  },
  warm: {
    name: 'Warm',
    minScore: 50,
    color: 'yellow',
    description: 'Potential opportunities requiring nurturing'
  },
  cold: {
    name: 'Cold',
    minScore: 0,
    color: 'blue',
    description: 'Low-priority or unqualified leads'
  }
};

export const PRICING_ADJUSTMENTS = {
  storyMultiplier: 0.15, // +15% per story over 2
  bathroomDensityThreshold: 0.004, // 1 bathroom per 250 sqft
  bathroomDensityMultiplier: 0.10 // +10% for high density
};

export const COMPANY_INFO = {
  name: 'CTL Plumbing LLC',
  serviceArea: 'DFW Metroplex',
  specialization: 'Commercial and multi-family plumbing',
  contact: {
    email: 'info@ctlplumbing.com',
    phone: '(214) 555-0100'
  }
};
