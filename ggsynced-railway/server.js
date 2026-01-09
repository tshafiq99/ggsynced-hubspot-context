import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
// Try .env.local first (for local development), then fall back to .env
dotenv.config({ path: join(__dirname, '.env.local') });
dotenv.config(); // This will load .env if .env.local doesn't exist

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import startggRoutes from './routes/startgg.js';
import hubspotRoutes from './routes/hubspot.js';
import syncRoutes from './routes/sync.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'GG Synced API',
    timestamp: new Date().toISOString()
  });
});

// Health check with service verification
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      supabase: 'unknown'
    }
  };

  // Check Supabase connection
  try {
    const { getSupabaseClient } = await import('./services/supabase.js');
    const client = getSupabaseClient();
    // Simple check - just verify client exists
    if (client) {
      health.services.supabase = 'connected';
    }
  } catch (error) {
    health.services.supabase = 'error';
    health.services.supabaseError = error.message;
    health.status = 'degraded';
  }

  res.status(health.status === 'ok' ? 200 : 503).json(health);
});

// Routes
app.use('/auth', authRoutes);
app.use('/startgg', startggRoutes);
app.use('/hubspot', hubspotRoutes);
app.use('/sync', syncRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Railway requires binding to 0.0.0.0 to accept external connections
const HOST = process.env.HOST || '0.0.0.0';

// Start server with error handling
try {
  app.listen(PORT, HOST, () => {
    console.log(`Server running on ${HOST}:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'not set'}`);
  });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}
