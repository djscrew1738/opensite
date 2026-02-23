/**
 * Builder Intelligence Rollup
 *
 * Runs periodically (weekly by default) to update computed stats
 * on the builders table. This turns raw permit data into actionable
 * intelligence about who's building what, where, and how often.
 *
 * Key outputs:
 *   - Permit volume (total, 30d, 90d)
 *   - Average project cost
 *   - Primary zip codes and project types
 *   - Activity trend (ramping up, steady, slowing down)
 *   - Whether they have a plumber relationship
 */

export async function runBuilderRollup(db, logger) {
  const startTime = Date.now();
  logger.info('Starting builder intelligence rollup...');

  try {
    const now = Date.now();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // ── Step 1: Update permit counts and averages ──
    const builders = await db.all('SELECT id FROM builders');

    for (const builder of builders) {
      // Get all permits for this builder
      const permits = await db.all(`
        SELECT p.*
        FROM permits p
        JOIN permit_builder_map pbm ON p.id = pbm.permitId
        WHERE pbm.builderId = ?
      `, [builder.id]);

      if (permits.length === 0) continue;

      const totalPermits = permits.length;
      const permits30d = permits.filter(p => p.issuedDate >= thirtyDaysAgo).length;
      const permits90d = permits.filter(p => p.issuedDate >= ninetyDaysAgo).length;
      const permits60_90d = permits.filter(
        p => p.issuedDate >= ninetyDaysAgo && p.issuedDate < sixtyDaysAgo
      ).length;

      const costsWithValues = permits
        .filter(p => p.estimatedCost && p.estimatedCost > 0)
        .map(p => p.estimatedCost);
      const avgProjectCost = costsWithValues.length > 0
        ? costsWithValues.reduce((a, b) => a + b, 0) / costsWithValues.length
        : null;

      const sortedDates = permits.map(p => p.issuedDate).filter(Boolean).sort();
      const firstPermitDate = sortedDates[0] || null;
      const lastPermitDate = sortedDates[sortedDates.length - 1] || null;

      // Compute activity trend
      let activityTrend = 'steady';
      if (permits30d === 0 && permits60_90d === 0) {
        activityTrend = 'inactive';
      } else if (permits30d > permits60_90d * 1.5) {
        activityTrend = 'ramping_up';
      } else if (permits30d < permits60_90d * 0.5 && permits60_90d > 0) {
        activityTrend = 'slowing_down';
      }

      // Get primary zip codes (top 5)
      const zipCounts = {};
      permits.forEach(p => {
        if (p.zipCode) {
          zipCounts[p.zipCode] = (zipCounts[p.zipCode] || 0) + 1;
        }
      });
      const topZips = Object.entries(zipCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([zip]) => zip);

      // Get project types (unique occupancy types)
      const projectTypes = [...new Set(permits.map(p => p.occupancyType).filter(Boolean))];

      // Update builder
      await db.updateBuilder(builder.id, {
        totalPermits,
        permitsLast30d: permits30d,
        permitsLast90d: permits90d,
        avgProjectCost: avgProjectCost ? Math.round(avgProjectCost * 100) / 100 : null,
        firstPermitDate,
        lastPermitDate,
        activityTrend,
        primaryZipCodes: topZips,
        projectTypes
      });
    }

    logger.info('Updated permit counts, averages, and trends');

    // ── Step 2: Detect plumber relationships ──
    for (const builder of builders) {
      // Get this builder's new construction permits
      const buildPermits = await db.all(`
        SELECT p.*
        FROM permits p
        JOIN permit_builder_map pbm ON p.id = pbm.permitId
        WHERE pbm.builderId = ? AND p.permitCategory = 'new_construction'
      `, [builder.id]);

      if (buildPermits.length === 0) continue;

      const plumberCandidates = {};

      // For each building permit, look for plumbing permits at same address
      for (const buildPermit of buildPermits) {
        if (!buildPermit.address) continue;

        const plumbingPermits = await db.all(`
          SELECT contractorName
          FROM permits
          WHERE permitCategory = 'plumbing'
            AND address = ?
            AND contractorName IS NOT NULL
            AND contractorName != ?
        `, [buildPermit.address, buildPermit.contractorName]);

        plumbingPermits.forEach(pp => {
          if (pp.contractorName) {
            plumberCandidates[pp.contractorName] = (plumberCandidates[pp.contractorName] || 0) + 1;
          }
        });
      }

      // Find most common plumber
      const entries = Object.entries(plumberCandidates);
      if (entries.length > 0) {
        const [plumberName, matchCount] = entries.sort((a, b) => b[1] - a[1])[0];
        const confidence = Math.min(1.0, matchCount / 3.0);

        await db.updateBuilder(builder.id, {
          hasPlumber: 1,
          knownPlumber: plumberName,
          plumberConfidence: Math.round(confidence * 100) / 100
        });
      }
    }

    logger.info('Updated plumber relationship detection');

    // ── Summary stats ──
    const allBuilders = await db.getAllBuilders();
    const stats = {
      totalBuilders: allBuilders.length,
      rampingUp: allBuilders.filter(b => b.activityTrend === 'ramping_up').length,
      steady: allBuilders.filter(b => b.activityTrend === 'steady').length,
      slowingDown: allBuilders.filter(b => b.activityTrend === 'slowing_down').length,
      inactive: allBuilders.filter(b => b.activityTrend === 'inactive').length,
      noPlumberActive: allBuilders.filter(b => !b.hasPlumber && b.permitsLast30d > 0).length,
      highPriorityProspects: allBuilders.filter(
        b => b.relationshipStatus === 'unknown' && b.permitsLast30d >= 2
      ).length
    };

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    logger.info(
      `Builder rollup complete in ${elapsed}s: ` +
      `${stats.totalBuilders} total builders, ` +
      `${stats.rampingUp} ramping up, ${stats.steady} steady, ` +
      `${stats.noPlumberActive} active without plumber, ` +
      `${stats.highPriorityProspects} high-priority prospects`
    );

    return stats;

  } catch (err) {
    logger.error(`Builder rollup failed: ${err.message}`, err);
    throw err;
  }
}

/**
 * Get top builder prospects — active builders without plumber relationships
 */
export async function getTopProspects(db, limit = 20) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const allBuilders = await db.getAllBuilders({
    hasPlumber: false
  });
  
  const activeBuilders = allBuilders.filter(b => b.permitsLast30d > 0 && ['unknown', 'prospecting'].includes(b.relationshipStatus));

  // Get recent permits for each
  const prospects = [];
  for (const builder of activeBuilders) {
    const builderPermits = await db.getBuilderPermits(builder.id);
    const recentPermits = builderPermits.filter(p => p.issuedDate >= thirtyDaysAgo);

    const recentAddresses = [...new Set(recentPermits.map(p => p.address).filter(Boolean))];
    const recentTotalValue = recentPermits
      .filter(p => p.estimatedCost)
      .reduce((sum, p) => sum + p.estimatedCost, 0);

    prospects.push({
      ...builder,
      recentAddresses,
      recentTotalValue
    });
  }

  // Sort by activity and value
  prospects.sort((a, b) => {
    if (a.permitsLast30d !== b.permitsLast30d) {
      return b.permitsLast30d - a.permitsLast30d;
    }
    return (b.avgProjectCost || 0) - (a.avgProjectCost || 0);
  });

  return prospects.slice(0, limit);
}
