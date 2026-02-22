import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import logger from '../services/logger.js';
import { execPython, validatePythonInterpreter } from '../utils/subprocess.js';

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

async function spawnEnqueueJob(pdfId) {
  // Validate pdfId to prevent injection
  if (!pdfId || typeof pdfId !== 'string' || pdfId.length > 256) {
    throw new Error('Invalid PDF ID');
  }
  
  // Validate PDF ID format (should be a safe filename)
  if (!/^[a-zA-Z0-9_\-\.]+$/.test(pdfId)) {
    throw new Error('Invalid PDF ID format');
  }

  const args = ['--pdf-id', pdfId];
  
  // Only pass REDIS_URL if it's a valid URL
  if (process.env.REDIS_URL) {
    const redisUrl = process.env.REDIS_URL;
    // Basic URL validation
    if (redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://')) {
      args.push('--redis-url', redisUrl);
    }
  }

  // Validate Python interpreter against allowlist
  const pythonInterpreter = validatePythonInterpreter(process.env.PYTHON_INTERPRETER);

  const { stdout, stderr } = await execPython('enqueue_job.py', args, {
    pythonInterpreter,
    // Do NOT pass raw env - subprocess.js will sanitize it
    timeout: 60000 // 60 second timeout for enqueue
  });

  // Log stderr separately for debugging
  if (stderr) {
    logger.debug('Python subprocess stderr', { pdfId, stderr: stderr.substring(0, 1000) });
  }

  const jobId = stdout.trim().split(/\r?\n/).pop();
  return jobId;
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
