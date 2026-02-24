// WebSocket Service for real-time updates

import { WebSocketServer } from 'ws';
import logger from './logger.js';
import { verifyToken } from '../utils/auth.js';
import url from 'url';

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map();
  }

  initialize(server) {
    this.wss = new WebSocketServer({ server });
    logger.info('WebSocket server initialized');

    this.wss.on('connection', (ws, req) => {
      const { token } = url.parse(req.url, true).query;

      if (!token) {
        ws.close(1008, 'Token required');
        return;
      }

      try {
        const user = verifyToken(token);
        if (!user) {
          ws.close(1008, 'Invalid token');
          return;
        }

        const clientId = user.id;
        this.clients.set(clientId, ws);
        logger.info('WebSocket client connected', { clientId });

        ws.on('message', (message) => {
          logger.debug('WebSocket message received', { clientId, message });
        });

        ws.on('close', () => {
          this.clients.delete(clientId);
          logger.info('WebSocket client disconnected', { clientId });
        });

        ws.on('error', (error) => {
          logger.error('WebSocket error', { clientId, error });
        });

      } catch (error) {
        ws.close(1008, 'Invalid token');
      }
    });
  }

  send(clientId, type, payload) {
    const ws = this.clients.get(clientId);
    if (ws && ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type, payload }));
    }
  }

  broadcast(type, payload) {
    const message = JSON.stringify({ type, payload });
    this.wss.clients.forEach(client => {
      if (client.readyState === client.OPEN) {
        client.send(message);
      }
    });
  }
}

export const webSocketService = new WebSocketService();
