const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const config = require('../config');
const { processSession } = require('../services/pipeline');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.ogg';
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
});

/**
 * POST /api/upload/audio
 * Upload audio and start processing
 */
router.post('/audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log(`[Upload] Received: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(1)}MB)`);

    const { rows: [session] } = await db.query(
      `INSERT INTO sessions (project_id, title, audio_path, status, recorded_at)
       VALUES ($1, $2, $3, 'uploaded', $4)
       RETURNING id`,
      [
        req.body.project_id || null,
        req.body.title || `Recording ${new Date().toLocaleDateString()}`,
        req.file.path,
        req.body.recorded_at || new Date().toISOString(),
      ]
    );

    console.log(`[Upload] Created session #${session.id}`);

    // Process async
    processSession(session.id).catch(err => {
      console.error(`[Upload] Processing failed for session ${session.id}:`, err);
    });

    res.json({
      success: true,
      session_id: session.id,
      message: 'Audio uploaded. Processing started...',
    });

  } catch (err) {
    console.error('[Upload] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/upload/attachment
 * Upload file attachment
 */
router.post('/attachment', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { rows: [attachment] } = await db.query(
      `INSERT INTO attachments (session_id, project_id, file_type, file_name, file_path, file_size)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        req.body.session_id || null,
        req.body.project_id || null,
        path.extname(req.file.originalname).toLowerCase(),
        req.file.originalname,
        req.file.path,
        req.file.size,
      ]
    );

    res.json({
      success: true,
      attachment_id: attachment.id,
      message: 'File attached successfully',
    });

  } catch (err) {
    console.error('[Upload] Attachment error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
