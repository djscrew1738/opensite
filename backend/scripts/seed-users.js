import { DatabaseService } from '../src/services/database/core.js';
import { addUserOperations } from '../src/services/database/users.js';
import { hashPassword } from '../src/utils/auth.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

// Create a version of DatabaseService with user operations
class SeedDatabaseService extends DatabaseService {}
addUserOperations(SeedDatabaseService);

async function seed() {
  const db = new SeedDatabaseService();
  
  console.log('Seeding users...');
  
  try {
    // 1. Admin Account
    const adminEmail = 'djscrew@ctlplumbingllc.com';
    const adminUsername = 'djscrew';
    const adminPassword = 'Ux4600-420';
    
    const existingAdmin = await db.getUserByEmail(adminEmail);
    if (existingAdmin) {
      console.log(`Admin user ${adminEmail} already exists. Updating password...`);
      const hashedPassword = await hashPassword(adminPassword);
      await db.updateUser(existingAdmin.id, { 
        passwordHash: hashedPassword,
        role: 'admin',
        username: adminUsername
      });
    } else {
      console.log(`Creating admin user ${adminEmail}...`);
      const hashedPassword = await hashPassword(adminPassword);
      await db.createUser({
        username: adminUsername,
        email: adminEmail,
        passwordHash: hashedPassword,
        role: 'admin'
      });
    }

    // 2. Guest Account (only if GUEST_ACCOUNT_ENABLED=true)
    if (process.env.GUEST_ACCOUNT_ENABLED === 'true') {
      const guestEmail = process.env.GUEST_EMAIL || 'guest@ctlplumbingllc.com';
      const guestPassword = process.env.GUEST_PASSWORD;

      if (!guestPassword) {
        console.log('Skipping guest account: GUEST_PASSWORD not set');
      } else {
        const existingGuest = await db.getUserByEmail(guestEmail);
        const hashedPassword = await hashPassword(guestPassword);
        if (existingGuest) {
          console.log(`Updating guest user ${guestEmail}...`);
          await db.updateUser(existingGuest.id, { passwordHash: hashedPassword, role: 'viewer' });
        } else {
          console.log(`Creating guest user ${guestEmail}...`);
          await db.createUser({
            username: 'Guest',
            email: guestEmail,
            passwordHash: hashedPassword,
            role: 'viewer',
          });
        }
        console.log('Guest account ready');
      }
    } else {
      console.log('Guest account disabled (GUEST_ACCOUNT_ENABLED != true)');
    }
    
    console.log('Seeding completed successfully.');
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    db.close();
  }
}

seed();
