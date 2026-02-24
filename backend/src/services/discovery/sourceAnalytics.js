// Lead Source Performance Analytics
// Tracks and analyzes which lead sources produce the best results

import logger from '../logger.js';

/**
 * Calculate conversion funnel metrics
 */
function calculateFunnel(leads) {
  const total = leads.length;
  if (total === 0) return null;

  const enriched = leads.filter(l => l.enrichmentStatus === 'enriched').length;
  const withEmail = leads.filter(l => l.emails && l.emails.length > 0).length;
  const hot = leads.filter(l => l.icpTier === 'hot').length;
  const warm = leads.filter(l => l.icpTier === 'warm').length;
  const contacted = leads.filter(l => l.contactStatus === 'contacted' || l.contactStatus === 'responded').length;
  const responded = leads.filter(l => l.contactStatus === 'responded').length;
  const converted = leads.filter(l => l.contactStatus === 'converted').length;

  return {
    total,
    enriched,
    withEmail,
    hot,
    warm,
    contacted,
    responded,
    converted,
    rates: {
      enrichment: ((enriched / total) * 100).toFixed(1),
      emailCapture: ((withEmail / total) * 100).toFixed(1),
      hotConversion: ((hot / total) * 100).toFixed(1),
      warmConversion: ((warm / total) * 100).toFixed(1),
      contactRate: contacted > 0 ? ((contacted / total) * 100).toFixed(1) : 0,
      responseRate: contacted > 0 ? ((responded / contacted) * 100).toFixed(1) : 0,
      conversionRate: contacted > 0 ? ((converted / contacted) * 100).toFixed(1) : 0,
    },
  };
}

/**
 * Analyze discovery run performance
 */
export function analyzeDiscoveryRun(run, leads) {
  const funnel = calculateFunnel(leads);

  // Calculate average scores
  const avgIcpScore = leads.reduce((sum, l) => sum + (l.icpScore || 0), 0) / leads.length || 0;
  const avgRating = leads.reduce((sum, l) => sum + (l.rating || 0), 0) / leads.filter(l => l.rating).length || 0;

  // Calculate email quality
  const verifiedEmails = leads.filter(l => l.emailVerificationStatus === 'verified').length;
  const avgEmailScore = leads.reduce((sum, l) => sum + (l.bestEmailScore || 0), 0) / leads.length || 0;

  // Source breakdown (for multi-source runs)
  const bySource = {};
  for (const lead of leads) {
    const source = lead.source || 'unknown';
    if (!bySource[source]) {
      bySource[source] = [];
    }
    bySource[source].push(lead);
  }

  const sourceBreakdown = {};
  for (const [source, sourceLeads] of Object.entries(bySource)) {
    sourceBreakdown[source] = {
      count: sourceLeads.length,
      hot: sourceLeads.filter(l => l.icpTier === 'hot').length,
      warm: sourceLeads.filter(l => l.icpTier === 'warm').length,
      avgScore: sourceLeads.reduce((sum, l) => sum + (l.icpScore || 0), 0) / sourceLeads.length || 0,
    };
  }

  return {
    runId: run.id,
    runDate: run.createdAt,
    keyword: run.keyword,
    city: run.city,
    funnel,
    scores: {
      avgIcpScore: avgIcpScore.toFixed(1),
      avgRating: avgRating.toFixed(1),
      avgEmailScore: avgEmailScore.toFixed(1),
    },
    emailQuality: {
      verified: verifiedEmails,
      verificationRate: leads.length > 0 ? ((verifiedEmails / leads.length) * 100).toFixed(1) : 0,
    },
    sourceBreakdown,
    timeToComplete: run.updatedAt && run.createdAt
      ? Math.round((new Date(run.updatedAt) - new Date(run.createdAt)) / 1000)
      : null,
  };
}

/**
 * Compare multiple discovery runs
 */
export function compareRuns(runAnalyses) {
  if (runAnalyses.length === 0) return null;

  // Sort by hot lead conversion rate
  const sortedByHot = [...runAnalyses].sort((a, b) =>
    parseFloat(b.funnel.rates.hotConversion) - parseFloat(a.funnel.rates.hotConversion)
  );

  // Sort by email quality
  const sortedByEmail = [...runAnalyses].sort((a, b) =>
    parseFloat(b.emailQuality.verificationRate) - parseFloat(a.emailQuality.verificationRate)
  );

  // Sort by overall score
  const sortedByScore = [...runAnalyses].sort((a, b) =>
    parseFloat(b.scores.avgIcpScore) - parseFloat(a.scores.avgIcpScore)
  );

  // Find best performing keywords
  const byKeyword = {};
  for (const analysis of runAnalyses) {
    const keyword = analysis.keyword;
    if (!byKeyword[keyword]) {
      byKeyword[keyword] = {
        runs: 0,
        totalLeads: 0,
        totalHot: 0,
        totalWarm: 0,
        avgScores: [],
      };
    }
    byKeyword[keyword].runs++;
    byKeyword[keyword].totalLeads += analysis.funnel.total;
    byKeyword[keyword].totalHot += analysis.funnel.hot;
    byKeyword[keyword].totalWarm += analysis.funnel.warm;
    byKeyword[keyword].avgScores.push(parseFloat(analysis.scores.avgIcpScore));
  }

  // Calculate keyword averages
  const keywordPerformance = Object.entries(byKeyword).map(([keyword, data]) => ({
    keyword,
    runs: data.runs,
    totalLeads: data.totalLeads,
    totalHot: data.totalHot,
    totalWarm: data.totalWarm,
    hotRate: ((data.totalHot / data.totalLeads) * 100).toFixed(1),
    avgScore: (data.avgScores.reduce((a, b) => a + b, 0) / data.avgScores.length).toFixed(1),
  }));

  // Sort keywords by hot rate
  keywordPerformance.sort((a, b) => parseFloat(b.hotRate) - parseFloat(a.hotRate));

  return {
    totalRuns: runAnalyses.length,
    topByHotLeads: sortedByHot.slice(0, 5),
    topByEmailQuality: sortedByEmail.slice(0, 5),
    topByScore: sortedByScore.slice(0, 5),
    keywordPerformance,
    recommendations: generateRecommendations(keywordPerformance, sortedByHot[0]),
  };
}

/**
 * Generate optimization recommendations
 */
function generateRecommendations(keywordPerformance, bestRun) {
  const recommendations = [];

  if (keywordPerformance.length >= 2) {
    const best = keywordPerformance[0];
    const worst = keywordPerformance[keywordPerformance.length - 1];

    if (parseFloat(best.hotRate) > parseFloat(worst.hotRate) * 2) {
      recommendations.push({
        type: 'keyword_focus',
        priority: 'high',
        message: `Focus on "${best.keyword}" - it generates ${best.hotRate}% hot leads vs ${worst.hotRate}% for "${worst.keyword}"`,
      });
    }
  }

  if (bestRun) {
    recommendations.push({
      type: 'location',
      priority: 'medium',
      message: `Re-run search in ${bestRun.city} - best performing location with ${bestRun.funnel.rates.hotConversion}% hot lead rate`,
    });
  }

  recommendations.push({
    type: 'email_quality',
    priority: 'medium',
    message: 'Verify emails during enrichment to improve deliverability and reduce bounce rates',
  });

  return recommendations;
}

/**
 * Analyze permit source performance
 */
export function analyzePermitSource(permits, sourceName) {
  const funnel = {
    total: permits.length,
    newConstruction: permits.filter(p => p.permitCategory === 'new_construction').length,
    plumbing: permits.filter(p => p.permitCategory === 'plumbing').length,
    addition: permits.filter(p => p.permitCategory === 'addition').length,
    hot: permits.filter(p => p.leadTier === 'hot').length,
    warm: permits.filter(p => p.leadTier === 'warm').length,
    cold: permits.filter(p => p.leadTier === 'cold').length,
    unscored: permits.filter(p => p.leadTier === 'unscored').length,
    contacted: permits.filter(p => p.leadStatus === 'contacted' || p.leadStatus === 'quoted').length,
    quoted: permits.filter(p => p.leadStatus === 'quoted').length,
    won: permits.filter(p => p.leadStatus === 'won').length,
  };

  const avgCost = permits
    .filter(p => p.estimatedCost)
    .reduce((sum, p) => sum + p.estimatedCost, 0) / funnel.total || 0;

  const avgScore = permits
    .filter(p => p.leadScore)
    .reduce((sum, p) => sum + p.leadScore, 0) / funnel.total || 0;

  // Group by contractor
  const byContractor = {};
  for (const permit of permits) {
    const contractor = permit.contractorName || 'Unknown';
    if (!byContractor[contractor]) {
      byContractor[contractor] = { count: 0, permits: [] };
    }
    byContractor[contractor].count++;
    byContractor[contractor].permits.push(permit);
  }

  // Top contractors by permit volume
  const topContractors = Object.entries(byContractor)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([name, data]) => ({
      name,
      permitCount: data.count,
      hotLeads: data.permits.filter(p => p.leadTier === 'hot').length,
      avgScore: data.permits.reduce((sum, p) => sum + (p.leadScore || 0), 0) / data.count || 0,
    }));

  return {
    source: sourceName,
    funnel,
    avgProjectCost: Math.round(avgCost),
    avgLeadScore: avgScore.toFixed(1),
    topContractors,
    value: {
      hotLeadsValue: permits
        .filter(p => p.leadTier === 'hot' && p.estimatedCost)
        .reduce((sum, p) => sum + p.estimatedCost, 0),
      totalPipelineValue: permits
        .filter(p => p.estimatedCost)
        .reduce((sum, p) => sum + p.estimatedCost, 0),
    },
  };
}

/**
 * Compare permit sources
 */
export function comparePermitSources(sourceAnalyses) {
  const sortedByVolume = [...sourceAnalyses].sort((a, b) => b.funnel.total - a.funnel.total);
  const sortedByQuality = [...sourceAnalyses].sort((a, b) =>
    parseFloat(b.avgLeadScore) - parseFloat(a.avgLeadScore)
  );
  const sortedByValue = [...sourceAnalyses].sort((a, b) =>
    b.value.hotLeadsValue - a.value.hotLeadsValue
  );

  return {
    byVolume: sortedByVolume,
    byQuality: sortedByQuality,
    byValue: sortedByValue,
    combinedScore: sourceAnalyses.map(s => ({
      ...s,
      combinedScore: (
        (s.funnel.total / sortedByVolume[0].funnel.total * 30) +
        (parseFloat(s.avgLeadScore) / 100 * 35) +
        (s.value.hotLeadsValue / sortedByValue[0].value.hotLeadsValue * 35)
      ).toFixed(1),
    })).sort((a, b) => parseFloat(b.combinedScore) - parseFloat(a.combinedScore)),
  };
}

/**
 * Generate overall lead generation report
 */
export function generateOverallReport(discoveryRuns, permitSources, timeRange = null) {
  // Filter by time range if provided
  const filterByDate = (items) => {
    if (!timeRange) return items;
    const start = new Date(timeRange.start);
    const end = new Date(timeRange.end);
    return items.filter(item => {
      const date = new Date(item.createdAt || item.date);
      return date >= start && date <= end;
    });
  };

  const filteredRuns = filterByDate(discoveryRuns);
  const filteredPermits = filterByDate(permitSources);

  // Aggregate discovery stats
  const discoveryStats = {
    totalRuns: filteredRuns.length,
    totalLeads: filteredRuns.reduce((sum, r) => sum + (r.totalFound || 0), 0),
    totalHot: filteredRuns.reduce((sum, r) => sum + (r.scored?.hot || 0), 0),
    totalWarm: filteredRuns.reduce((sum, r) => sum + (r.scored?.warm || 0), 0),
    totalEnriched: filteredRuns.reduce((sum, r) => sum + (r.enriched || 0), 0),
  };

  // Aggregate permit stats
  const permitStats = {
    totalSources: filteredPermits.length,
    totalPermits: filteredPermits.reduce((sum, s) => sum + s.funnel.total, 0),
    totalHot: filteredPermits.reduce((sum, s) => sum + s.funnel.hot, 0),
    totalWarm: filteredPermits.reduce((sum, s) => sum + s.funnel.warm, 0),
    totalValue: filteredPermits.reduce((sum, s) => sum + s.value.totalPipelineValue, 0),
  };

  return {
    timeRange,
    generatedAt: new Date().toISOString(),
    discovery: discoveryStats,
    permits: permitStats,
    combined: {
      totalLeads: discoveryStats.totalLeads + permitStats.totalPermits,
      totalHot: discoveryStats.totalHot + permitStats.totalHot,
      totalWarm: discoveryStats.totalWarm + permitStats.totalWarm,
      hotRate: (((discoveryStats.totalHot + permitStats.totalHot) /
        (discoveryStats.totalLeads + permitStats.totalPermits || 1)) * 100).toFixed(1),
    },
    topPerformers: {
      discoveryRuns: filteredRuns
        .sort((a, b) => (b.scored?.hot || 0) - (a.scored?.hot || 0))
        .slice(0, 5),
      permitSources: filteredPermits
        .sort((a, b) => b.funnel.hot - a.funnel.hot)
        .slice(0, 5),
    },
  };
}

/**
 * Track lead progression over time
 */
export function trackLeadProgression(leads, timeframe = 30) {
  const now = new Date();
  const days = [];

  for (let i = timeframe - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayLeads = leads.filter(l => {
      const leadDate = (l.createdAt || '').split('T')[0];
      return leadDate === dateStr;
    });

    days.push({
      date: dateStr,
      total: dayLeads.length,
      hot: dayLeads.filter(l => l.icpTier === 'hot').length,
      warm: dayLeads.filter(l => l.icpTier === 'warm').length,
      enriched: dayLeads.filter(l => l.enrichmentStatus === 'enriched').length,
    });
  }

  return {
    timeframe,
    daily: days,
    totals: {
      total: days.reduce((sum, d) => sum + d.total, 0),
      hot: days.reduce((sum, d) => sum + d.hot, 0),
      warm: days.reduce((sum, d) => sum + d.warm, 0),
    },
    trend: {
      avgPerDay: (days.reduce((sum, d) => sum + d.total, 0) / timeframe).toFixed(1),
      bestDay: days.reduce((best, d) => d.total > best.total ? d : best, days[0]),
    },
  };
}

export default {
  analyzeDiscoveryRun,
  compareRuns,
  analyzePermitSource,
  comparePermitSources,
  generateOverallReport,
  trackLeadProgression,
};
