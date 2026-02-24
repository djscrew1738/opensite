// scripts/seed-materials.js
// Seeds the database with real DFW material prices from constants.js

import { db } from '../backend/src/services/database/index.js';
import { DFW_MATERIAL_PRICING } from '../backend/src/config/constants.js';

async function seedMaterials() {
  console.log('Seeding materials table...');

  const materials = Object.entries(DFW_MATERIAL_PRICING).map(([key, value]) => ({
    id: key,
    ...value
  }));

  try {
    const created = await db.bulkCreateMaterials(materials);
    console.log(`Seeded ${created.length} materials.`);
  } catch (error) {
    console.error('Error seeding materials:', error);
  } finally {
    db.close();
  }
}

seedMaterials();
