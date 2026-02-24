// services/startup.js
// Encapsulates server startup logic

import logger from './logger.js';
import { db } from './database.js';
import { aiProvider } from './ai-provider.js';
import { startPermitJobs } from '../jobs/permit-jobs.js';
import { emailWatcherService } from './emailWatcher/index.js';
import { webSocketService } from './websocket.js';
import { printConfigStatus } from '../utils/notification-config-checker.js';
import { hashPassword } from '../utils/auth.js';
import { initializeJobHandlers } from './jobHandlers.js';
import os from 'os';

export async function startServer(app, port) {
  const server = app.listen(port, '0.0.0.0', async () => {
    webSocketService.initialize(server);
    initializeJobHandlers();
    logger.info(`Server started on port ${port}`);
    
    await provisionGuestAccount();
    await loadAISettings();
    
    if (process.env.PERMIT_JOBS_ENABLED !== 'false') {
      startPermitJobs();
    }
    
    if (process.env.EMAIL_WATCHER_ENABLED !== 'false') {
      emailWatcherService.start().catch(err => {
        logger.warn('Email watcher service failed to start', { error: err.message });
      });
    }
    
    await printConfigStatus();
    printServerInfo(port);
  });

  return server;
}

async function provisionGuestAccount() {
  try {
    const guestEmail = 'guest@ctlplumbingllc.com';
    let guestUser = await db.getUserByEmail(guestEmail);
    const hashedGuestPassword = await hashPassword('guest');

    if (!guestUser) {
      await db.createUser({
        username: 'Guest User',
        email: guestEmail,
        passwordHash: hashedGuestPassword,
        role: 'viewer',
        isActive: true,
      });
      logger.info('Auto-provisioned guest account');
    } else {
      await db.updateUser(guestUser.id, { passwordHash: hashedGuestPassword, role: 'viewer', isActive: true });
    }
  } catch (err) {
    logger.warn('Failed to auto-provision guest account', { error: err.message });
  }
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
