// migrations/001_initial-schema.js

export const up = (pgm) => {
  pgm.sql(`
    -- Your full schema from database/schema.sql goes here
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    -- Drop all tables in reverse order of creation
  `);
};
