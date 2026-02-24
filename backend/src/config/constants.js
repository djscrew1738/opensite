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

export const FIXTURE_PRICING = {
  pricePerFixture: 995,
  qualifyingFixtures: [
    'lavatories', 'kitchenFaucets', 'barSinks', 'waterSoftenerPreplumb',
    'toilets', 'showerBases', 'tubs', 'washingMachines', 'waterHeaters'
  ]
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

export const DFW_MATERIAL_PRICING = {
  // Real DFW supplier pricing (Ferguson, HD Supply averages)
  pvc_pipe_4in: { name: '4" PVC DWV Pipe (per ft)', unitCost: 3.45, supplier: 'Ferguson', tier: 'production' },
  pvc_pipe_3in: { name: '3" PVC DWV Pipe (per ft)', unitCost: 2.15, supplier: 'Ferguson', tier: 'production' },
  pvc_pipe_2in: { name: '2" PVC DWV Pipe (per ft)', unitCost: 1.12, supplier: 'Ferguson', tier: 'production' },
  pex_pipe_1in: { name: '1" PEX-A Pipe (per ft)', unitCost: 0.95, supplier: 'HD Supply', tier: 'production' },
  pex_pipe_3_4in: { name: '3/4" PEX-A Pipe (per ft)', unitCost: 0.55, supplier: 'HD Supply', tier: 'production' },
  pex_pipe_1_2in: { name: '1/2" PEX-A Pipe (per ft)', unitCost: 0.35, supplier: 'HD Supply', tier: 'production' },
  copper_pipe_1in: { name: '1" Type L Copper (per ft)', unitCost: 5.85, supplier: 'Ferguson', tier: 'premium' },
  copper_pipe_3_4in: { name: '3/4" Type L Copper (per ft)', unitCost: 3.75, supplier: 'Ferguson', tier: 'premium' },
  copper_pipe_1_2in: { name: '1/2" Type L Copper (per ft)', unitCost: 2.15, supplier: 'Ferguson', tier: 'premium' },
  water_heater_50g: { name: '50 Gal Electric Water Heater', unitCost: 545.00, supplier: 'HD Supply', tier: 'production' },
  water_heater_tankless: { name: 'Tankless Gas Water Heater (Navien)', unitCost: 1450.00, supplier: 'Ferguson', tier: 'premium' },
  toilet_standard: { name: 'Standard elongated toilet (ProFlo)', unitCost: 125.00, supplier: 'Ferguson', tier: 'production' },
  toilet_premium: { name: 'Premium comfort height toilet (Kohler)', unitCost: 345.00, supplier: 'Ferguson', tier: 'premium' },
  faucet_standard: { name: 'Standard lav faucet (Moen)', unitCost: 85.00, supplier: 'HD Supply', tier: 'production' },
  faucet_premium: { name: 'Premium widespread faucet (Delta)', unitCost: 215.00, supplier: 'Ferguson', tier: 'premium' }
};
