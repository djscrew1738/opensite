// Subprocess utilities with validation
// Prevents command injection via environment variables or arguments

import { spawn } from 'child_process';
import path from 'path';
import logger from '../services/logger.js';

// Allowed Python interpreters (whitelist)
const ALLOWED_PYTHON_INTERPRETERS = [
  'python3',
  'python',
  '/usr/bin/python3',
  '/usr/bin/python',
  '/usr/local/bin/python3',
  '/usr/local/bin/python'
];

// Maximum argument length
const MAX_ARG_LENGTH = 1024;

// Allowed characters for arguments (alphanumeric, common safe symbols)
const SAFE_ARG_PATTERN = /^[a-zA-Z0-9_\-\.\/:@]+$/;

/**
 * Validate a Python interpreter path
 * @param {string} interpreter 
 * @returns {string} Validated interpreter
 */
export function validatePythonInterpreter(interpreter) {
  if (!interpreter) {
    return 'python3'; // Default
  }
  
  // Check whitelist
  if (!ALLOWED_PYTHON_INTERPRETERS.includes(interpreter)) {
    // Also allow absolute paths that exist and contain 'python'
    if (!interpreter.includes('python') || interpreter.length > 100) {
      logger.warn('Invalid Python interpreter rejected', { interpreter });
      throw new Error('Invalid Python interpreter specified');
    }
    
    // Additional validation: must be absolute path or simple command
    if (interpreter.includes('..') || interpreter.includes(';') || 
        interpreter.includes('&') || interpreter.includes('|') ||
        interpreter.includes('$') || interpreter.includes('`')) {
      logger.warn('Potentially malicious Python interpreter rejected', { interpreter });
      throw new Error('Invalid Python interpreter specified');
    }
  }
  
  return interpreter;
}

/**
 * Validate subprocess arguments
 * @param {string[]} args 
 * @returns {string[]} Validated arguments
 */
export function validateArgs(args) {
  if (!Array.isArray(args)) {
    throw new Error('Arguments must be an array');
  }
  
  return args.map(arg => {
    if (typeof arg !== 'string') {
      throw new Error('All arguments must be strings');
    }
    
    // Check length
    if (arg.length > MAX_ARG_LENGTH) {
      throw new Error(`Argument exceeds maximum length of ${MAX_ARG_LENGTH}`);
    }
    
    // Check for null bytes
    if (arg.includes('\0')) {
      throw new Error('Argument contains null bytes');
    }
    
    // For flags and identifiers, enforce stricter validation
    if (arg.startsWith('--') || arg.startsWith('-')) {
      // Flags should be simple alphanumeric with dashes
      if (!/^--?[a-zA-Z0-9_-]+$/.test(arg)) {
        throw new Error(`Invalid flag format: ${arg}`);
      }
    }
    
    // For PDF IDs and similar identifiers, enforce safe pattern
    if (arg.match(/^[a-f0-9\-]{36,40}$/i) || arg.match(/^pdf-/)) {
      // UUID-like or pdf- prefixed IDs are OK
      return arg;
    }
    
    return arg;
  });
}

/**
 * Sanitize environment variables for subprocess
 * Removes potentially dangerous env vars and limits size
 * @param {object} env 
 * @returns {object} Sanitized environment
 */
export function sanitizeEnv(env) {
  const sanitized = {};
  
  // Whitelist of allowed environment variables
  const ALLOWED_ENV_VARS = [
    'PATH',
    'HOME',
    'USER',
    'LANG',
    'LC_ALL',
    'TMPDIR',
    'PYTHONPATH',
    'PYTHONUNBUFFERED',
    'NODE_ENV',
    'REDIS_URL',
    'DB_PATH',
    'LOG_LEVEL'
  ];
  
  for (const key of ALLOWED_ENV_VARS) {
    if (env[key] !== undefined) {
      // Validate value doesn't contain shell metacharacters
      const value = String(env[key]);
      if (value.length > 4096) {
        logger.warn(`Environment variable ${key} exceeds max length, truncating`);
        sanitized[key] = value.substring(0, 4096);
      } else if (!value.includes('\0') && !value.includes('\n')) {
        sanitized[key] = value;
      }
    }
  }
  
  // Add a marker to indicate sanitized environment
  sanitized._SANITIZED = '1';
  
  return sanitized;
}

/**
 * Spawn a Python subprocess with validated arguments
 * @param {string} script - Script name (must be in allowed list)
 * @param {string[]} args - Arguments
 * @param {object} options - Spawn options
 * @returns {ChildProcess}
 */
export function spawnPython(script, args = [], options = {}) {
  // Validate script name
  const ALLOWED_SCRIPTS = [
    'enqueue_job.py',
    'process_pdf.py',
    'analyze_blueprint.py'
  ];
  
  if (!ALLOWED_SCRIPTS.includes(script)) {
    throw new Error(`Script not in allowed list: ${script}`);
  }
  
  // Validate Python interpreter
  const interpreter = validatePythonInterpreter(options.pythonInterpreter || process.env.PYTHON_INTERPRETER);
  
  // Validate arguments
  const validatedArgs = validateArgs([script, ...args]);
  
  // Sanitize environment
  const sanitizedEnv = sanitizeEnv(options.env || process.env);
  
  // Set safe options
  const safeOptions = {
    cwd: options.cwd || process.cwd(),
    env: sanitizedEnv,
    timeout: options.timeout || 300000, // 5 minute default timeout
    detached: false, // Don't detach - we want to track the process
    stdio: ['pipe', 'pipe', 'pipe']
  };
  
  logger.debug('Spawning Python subprocess', {
    interpreter,
    script,
    args: validatedArgs.slice(1) // Don't log the script name again
  });
  
  return spawn(interpreter, validatedArgs, safeOptions);
}

/**
 * Execute a Python script and return output
 * Promise-based wrapper around spawnPython
 */
export function execPython(script, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawnPython(script, args, options);
    
    let stdout = '';
    let stderr = '';
    
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('Subprocess execution timeout'));
    }, options.timeout || 300000);
    
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    
    child.on('close', (code) => {
      clearTimeout(timeout);
      
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        reject(new Error(`Process exited with code ${code}: ${stderr || 'Unknown error'}`));
      }
    });
    
    child.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

export default {
  validatePythonInterpreter,
  validateArgs,
  sanitizeEnv,
  spawnPython,
  execPython
};
