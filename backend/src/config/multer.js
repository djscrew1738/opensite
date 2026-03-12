import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || 'tool/uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true, mode: 0o700 });
}

const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.png', '.jpg', '.jpeg', '.tiff', '.tif', '.webp', '.dwg',
  '.docx', '.doc', '.txt', '.md', '.csv', '.html', '.htm', '.json', '.xml',
  '.xlsx', '.xls'
]);

const MIME_MAP = {
  '.pdf': ['application/pdf'],
  '.png': ['image/png'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.tiff': ['image/tiff'],
  '.tif': ['image/tiff'],
  '.webp': ['image/webp'],
  '.dwg': ['application/acad', 'application/x-acad', 'image/vnd.dwg', 'application/octet-stream'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.doc': ['application/msword'],
  '.txt': ['text/plain'],
  '.md': ['text/markdown', 'text/plain', 'application/octet-stream'],
  '.csv': ['text/csv', 'application/vnd.ms-excel', 'text/plain'],
  '.html': ['text/html'],
  '.htm': ['text/html'],
  '.json': ['application/json', 'text/plain'],
  '.xml': ['application/xml', 'text/xml'],
  '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  '.xls': ['application/vnd.ms-excel'],
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `upload-${randomUUID()}${ext}`);
  }
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error(`Unsupported file type: ${ext}`));
  }
  const allowedMimes = MIME_MAP[ext] || [];
  if (allowedMimes.length > 0 && !allowedMimes.includes(file.mimetype)) {
    return cb(new Error(`Invalid MIME type for ${ext}: ${file.mimetype}`));
  }
  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

export { UPLOAD_DIR };
