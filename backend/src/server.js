// 1stein Backend Server - CTL Plumbing Intelligence Platform

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import routes
import healthRoutes from './routes/health.js';
import aiRoutes from './routes/ai.js';
import leadsRoutes from './routes/leads.js';
import estimatesRoutes from './routes/estimates.js';
import projectsRoutes from './routes/projects.js';
import dashboardRoutes from './routes/dashboard.js';
import uploadRoutes from './routes/upload.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/estimates', estimatesRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: '1stein API',
    version: '1.0.0',
    description: 'CTL Plumbing Intelligence Platform',
    status: 'running'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server on all interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║           1stein Backend Server - Running                 ║
╚═══════════════════════════════════════════════════════════╝

🚀 Local:     http://localhost:${PORT}
🌐 Network:   http://100.115.136.62:${PORT}
📚 API Docs:  http://100.115.136.62:${PORT}/api/health
🤖 AI Model:  ${process.env.OLLAMA_MODEL || 'llama3.1'}
🏢 Company:   CTL Plumbing LLC

🔒 Accessible via Tailscale network
Press Ctrl+C to stop
  `);
});

export default app;
