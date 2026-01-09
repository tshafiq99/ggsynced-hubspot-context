import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local before any other imports
dotenv.config({ path: join(__dirname, '.env.local') });

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
  res.json({ status: 'ok', message: 'GG Synced API' });
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
