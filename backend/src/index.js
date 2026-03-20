import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
const __rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../');

// Only load .env file in development — production uses platform env vars
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.join(__rootDir, '.env') });
}

import express from 'express';
import cors from 'cors';
import webhooks from './routes/webhooks.js';
import auth from './routes/auth.js';
import campaigns from './routes/campaigns.js';
import leads from './routes/leads.js';
import analytics from './routes/analytics.js';
import accounts from './routes/accounts.js';

// Initialize BullMQ Workers
import './services/webhookQueue.js';
import './services/dmQueue.js';

// Initialize Cron Jobs
import { startCronJobs } from './services/cronJobs.js';
startCronJobs();

import cookieParser from 'cookie-parser';

const app = express();
const PORT = process.env.PORT || 4000;

// CORS: Allow both production frontend and localhost for development
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'https://mica-pacifical-shiningly.ngrok-free.dev'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(cookieParser());

app.use('/webhooks/instagram', express.raw({ type: '*/*' }), (req, res, next) => {
  if (Buffer.isBuffer(req.body)) {
    req.rawBody = req.body;
    try {
      req.body = JSON.parse(req.body.toString('utf8'));
    } catch (e) {
      req.body = {};
    }
  }
  next();
}, webhooks);

app.use(express.json());

app.use('/auth', auth);
app.use('/api/campaigns', campaigns);
app.use('/api/leads', leads);
app.use('/api/analytics', analytics);
app.use('/api/accounts', accounts);

app.get('/health', (_, res) => res.json({ ok: true }));

// Redirect to frontend privacy policy page
app.get('/privacy-policy', (_, res) => {
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/privacy`);
});

// Meta Data Deletion Callback (required for App Review)
app.post('/data-deletion', async (req, res) => {
  const { signed_request } = req.body;
  // In production, you would decode the signed_request to get the user_id
  // For now, return a confirmation response that Meta expects
  const confirmationCode = `del_${Date.now()}`;
  const statusUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/privacy`;
  
  res.json({
    url: statusUrl,
    confirmation_code: confirmationCode
  });
});

app.listen(PORT, () => {
  console.log(`InstaLink API running on http://localhost:${PORT}`);
});
