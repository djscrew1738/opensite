import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

import logger from '../services/logger.js';

const router = express.Router();
const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true, mode: 0o700 });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
});

function spawnEnqueueJob(pdfId) {
  return new Promise((resolve, reject) => {
    const pythonCommand = process.env.PYTHON_INTERPRETER || 'python3';
    const args = ['enqueue_job.py', '--pdf-id', pdfId];
    if (process.env.REDIS_URL) {
      args.push('--redis-url', process.env.REDIS_URL);
    }

    const child = spawn(pythonCommand, args, {
      cwd: process.cwd(),
      env: process.env,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        const jobId = stdout.trim().split(/\r?\n/).pop();
        resolve(jobId);
      } else {
        reject(new Error(stderr.trim() || `enqueue_job exited with code ${code}`));
      }
    });
  });
}

router.post('/extract', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.error('PDF file is required', 'FILE_REQUIRED', null, 400);
  }

  try {
    const jobId = await spawnEnqueueJob(req.file.filename);
    res.success({ job_id: jobId, status: 'queued' });
  } catch (error) {
    logger.error('Failed to enqueue plumbing extraction', {
      error: error.message,
      filename: req.file?.filename
    });
    res.error('Unable to queue plumbing extraction job', 'QUEUE_ERROR', { detail: error.message }, 500);
  }
});

export default router;
