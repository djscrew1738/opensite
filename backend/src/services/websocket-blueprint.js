/**
 * WebSocket Handler for Blueprint Analysis
 * Provides real-time updates for analysis jobs
 */

import { WebSocketServer } from 'ws';
import { blueprintOrchestrator } from './blueprint-orchestrator.js';
import logger from './logger.js';

/**
 * Blueprint WebSocket Manager
 */
class BlueprintWebSocketManager {
  constructor(server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/blueprint'
    });
    
    this.clients = new Map(); // jobId -> Set of WebSockets
    
    this.setupWebSocketServer();
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws, req) => {
      logger.info('Blueprint WebSocket client connected');
      
      ws.on('message', (message) => {
        this.handleMessage(ws, message);
      });
      
      ws.on('close', () => {
        this.handleDisconnect(ws);
      });
      
      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
      });
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to blueprint analysis WebSocket'
      }));
    });
  }

  handleMessage(ws, message) {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'subscribe':
          this.handleSubscribe(ws, data.jobId);
          break;
          
        case 'unsubscribe':
          this.handleUnsubscribe(ws, data.jobId);
          break;
          
        default:
          ws.send(JSON.stringify({
            type: 'error',
            message: `Unknown message type: ${data.type}`
          }));
      }
    } catch (error) {
      logger.error('WebSocket message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  }

  handleSubscribe(ws, jobId) {
    if (!jobId) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'jobId is required'
      }));
      return;
    }

    // Add client to job subscribers
    if (!this.clients.has(jobId)) {
      this.clients.set(jobId, new Set());
      
      // Subscribe to orchestrator updates
      blueprintOrchestrator.subscribe(jobId, (job) => {
        this.broadcastUpdate(jobId, job);
      });
    }
    
    this.clients.get(jobId).add(ws);
    
    // Send current status
    const job = blueprintOrchestrator.getJob(jobId);
    if (job) {
      ws.send(JSON.stringify({
        type: 'status',
        jobId,
        data: {
          status: job.status,
          progress: job.progress,
          results: job.status === 'completed' ? job.results : null
        }
      }));
    }
    
    logger.debug(`Client subscribed to job ${jobId}`);
  }

  handleUnsubscribe(ws, jobId) {
    if (jobId && this.clients.has(jobId)) {
      this.clients.get(jobId).delete(ws);
      
      if (this.clients.get(jobId).size === 0) {
        this.clients.delete(jobId);
      }
    }
    
    ws.send(JSON.stringify({
      type: 'unsubscribed',
      jobId
    }));
  }

  handleDisconnect(ws) {
    // Remove from all subscriptions
    this.clients.forEach((subscribers, jobId) => {
      subscribers.delete(ws);
    });
    
    logger.debug('WebSocket client disconnected');
  }

  broadcastUpdate(jobId, job) {
    const subscribers = this.clients.get(jobId);
    if (!subscribers) return;

    const message = JSON.stringify({
      type: 'update',
      jobId,
      data: {
        status: job.status,
        progress: job.progress,
        results: job.status === 'completed' ? job.results : null,
        errors: job.errors
      }
    });

    subscribers.forEach(ws => {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      }
    });
  }
}

export { BlueprintWebSocketManager };
