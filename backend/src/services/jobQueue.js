// services/jobQueue.js - BullMQ implementation

import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import logger from './logger.js';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const queues = {};

export function getQueue(name) {
  if (!queues[name]) {
    queues[name] = new Queue(name, { connection });
  }
  return queues[name];
}

export function createWorker(name, processor) {
  const worker = new Worker(name, processor, { connection });

  worker.on('completed', job => {
    logger.info(`Job ${job.id} in queue ${name} completed.`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job.id} in queue ${name} failed:`, err);
  });

  return worker;
}
