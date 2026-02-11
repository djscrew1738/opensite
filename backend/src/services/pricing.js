// Pricing calculation service for CTL Plumbing LLC

import { PRICING_TIERS, PROJECT_PHASES, PRICING_ADJUSTMENTS } from '../config/constants.js';

class PricingService {
  calculateEstimate(params) {
    const { sqft, bathrooms, units, stories, tier } = params;

    // Validate inputs
    if (!PRICING_TIERS[tier]) {
      throw new Error(`Invalid pricing tier: ${tier}`);
    }

    const tierConfig = PRICING_TIERS[tier];
    let basePrice = tierConfig.pricePerUnit * units;

    // Apply story adjustment (15% per story over 2)
    if (stories > 2) {
      const storyAdjustment = (stories - 2) * PRICING_ADJUSTMENTS.storyMultiplier;
      basePrice *= (1 + storyAdjustment);
    }

    // Apply bathroom density adjustment
    const bathroomDensity = bathrooms / sqft;
    if (bathroomDensity > PRICING_ADJUSTMENTS.bathroomDensityThreshold) {
      basePrice *= (1 + PRICING_ADJUSTMENTS.bathroomDensityMultiplier);
    }

    const total = Math.round(basePrice);
    const perUnit = Math.round(total / units);

    // Calculate phase breakdown
    const breakdown = this.calculatePhaseBreakdown(total);

    return {
      total,
      perUnit,
      breakdown,
      margin: tierConfig.marginRange,
      tier: tierConfig.name,
      adjustments: {
        storyAdjustment: stories > 2,
        bathroomDensity: bathroomDensity > PRICING_ADJUSTMENTS.bathroomDensityThreshold
      }
    };
  }

  calculatePhaseBreakdown(total) {
    return {
      roughIn: {
        name: PROJECT_PHASES.roughIn.name,
        amount: Math.round(total * PROJECT_PHASES.roughIn.percentage / 100),
        percentage: PROJECT_PHASES.roughIn.percentage
      },
      topOut: {
        name: PROJECT_PHASES.topOut.name,
        amount: Math.round(total * PROJECT_PHASES.topOut.percentage / 100),
        percentage: PROJECT_PHASES.topOut.percentage
      },
      trim: {
        name: PROJECT_PHASES.trim.name,
        amount: Math.round(total * PROJECT_PHASES.trim.percentage / 100),
        percentage: PROJECT_PHASES.trim.percentage
      }
    };
  }

  getAllTiers() {
    return Object.entries(PRICING_TIERS).map(([key, value]) => ({
      id: key,
      ...value
    }));
  }
}

export const pricingService = new PricingService();
