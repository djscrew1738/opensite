// services/startup.js
// Encapsulates server startup logic with parallel initialization

import logger from './logger.js';
import { db } from './database.js';
import { aiProvider } from './ai-provider.js';
import { startPermitJobs } from '../jobs/permit-jobs.js';
import { emailWatcherService } from './emailWatcher/index.js';
import { webSocketService } from './websocket.js';
import { printConfigStatus } from '../utils/notification-config-checker.js';
import { hashPassword } from '../utils/auth.js';
import { initializeJobHandlers } from './jobHandlers.js';
import cron from 'node-cron';
import os from 'os';

export async function startServer(app, port) {
  const server = app.listen(port, '0.0.0.0', async () => {
    // Start WebSocket immediately (non-blocking)
    webSocketService.initialize(server);
    
    // Initialize job handlers (non-blocking)
    initializeJobHandlers();
    
    logger.info(`Server started on port ${port}`);
    
    // Parallelize independent initialization tasks
    const initStartTime = Date.now();
    
    await Promise.allSettled([
      // Guest account provisioning (can run in parallel)
      provisionGuestAccount(),
      
      // AI settings loading (can run in parallel with guest account)
      loadAISettings(),
      
      // Print config status (independent)
      printConfigStatus(),
    ]);
    
    // Start background services (non-blocking)
    startBackgroundServices();
    
    // Schedule backups (non-blocking)
    scheduleBackups();
    
    const initDuration = Date.now() - initStartTime;
    logger.info(`Server initialization completed in ${initDuration}ms`);
    
    printServerInfo(port);
  });

  return server;
}

/**
 * Start background services that don't block server startup
 */
function startBackgroundServices() {
  // Start permit jobs in background
  if (process.env.PERMIT_JOBS_ENABLED !== 'false') {
    startPermitJobs();
  } else {
    logger.info('Permit jobs disabled');
  }
  
  // Start email watcher in background
  if (process.env.EMAIL_WATCHER_ENABLED !== 'false') {
    emailWatcherService.start().catch(err => {
      logger.warn('Email watcher service failed to start', { error: err.message });
    });
  } else {
    logger.info('Email watcher disabled');
  }
}

async function provisionGuestAccount() {
  if (process.env.GUEST_ACCOUNT_ENABLED !== 'true') {
    logger.debug('Guest account disabled');
    return;
  }

  try {
    const guestEmail = process.env.GUEST_EMAIL || 'guest@ctlplumbingllc.com';
    const guestPassword = process.env.GUEST_PASSWORD;

    if (!guestPassword) {
      logger.warn('GUEST_PASSWORD not set — skipping guest account provisioning');
      return;
    }

    const guestUser = await db.getUserByEmail(guestEmail);
    const hashedGuestPassword = await hashPassword(guestPassword);

    if (!guestUser) {
      await db.createUser({
        username: 'Guest User',
        email: guestEmail,
        passwordHash: hashedGuestPassword,
        role: 'viewer',
        isActive: true,
      });
      logger.info('Guest account provisioned', { email: guestEmail });
    } else {
      await db.updateUser(guestUser.id, { passwordHash: hashedGuestPassword, role: 'viewer', isActive: true });
      logger.info('Guest account updated', { email: guestEmail });
    }
  } catch (err) {
    logger.warn('Failed to provision guest account', { error: err.message });
  }
}

function scheduleBackups() {
  const schedule = process.env.BACKUP_SCHEDULE || '0 2 * * *';
  const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || '14', 10);
  const minKeep = parseInt(process.env.BACKUP_MIN_KEEP || '3', 10);

  if (process.env.BACKUP_ENABLED === 'false') {
    logger.info('Automated backups disabled');
    return;
  }

  cron.schedule(schedule, () => {
    try {
      const backupPath = db.backup();
      logger.info('Scheduled backup completed', { path: backupPath });
      const pruned = db.pruneBackups(retentionDays, minKeep);
      if (pruned.length > 0) {
        logger.info('Backup retention applied', { removed: pruned.length });
      }
    } catch (err) {
      logger.error('Scheduled backup failed', { error: err.message });
    }
  });

  logger.info(`Backup scheduler active: ${schedule} (retention: ${retentionDays}d, keep: ${minKeep} min)`);
}

async function loadAISettings() {
  try {
    await aiProvider.loadFromSettings();
    logger.info('AI provider settings loaded');
  } catch (err) {
    logger.warn('Could not load AI settings', { error: err.message });
  }
}

function getNetworkIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '0.0.0.0';
}

function printServerInfo(port) {
  const networkIp = getNetworkIp();
  logger.info(`
╔═══════════════════════════════════════════════════════════╗
║      Opensite Backend Server v2.0 - Enhanced Edition      ║
╚═══════════════════════════════════════════════════════════╝

  Server:    http://localhost:${port}
  Network:   http://${networkIp}:${port}
  API Docs:  http://${networkIp}:${port}/api/docs

  `);
}
