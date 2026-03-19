import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { sendDM } from './graphApi.js';
import pool from '../db/index.js';
import { canSendDM, incrementDmCount } from './rateLimit.js';

const MIN_DELAY = parseInt(process.env.MIN_QUEUE_DELAY_SEC || '5', 10);
const MAX_DELAY = parseInt(process.env.MAX_QUEUE_DELAY_SEC || '20', 10);

// How long to wait before retrying a rate-limited DM (default: 5 minutes)
const RATE_LIMIT_RETRY_DELAY_MS = parseInt(process.env.RATE_LIMIT_RETRY_DELAY_MS || '300000', 10);

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
});

export const dmQueue = new Queue('send-dm', { connection });

export function randomDelayMs() {
  return (MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY)) * 1000;
}

export async function enqueueDM(payload) {
  const delay = randomDelayMs();
  await dmQueue.add('send-dm', payload, { delay });
}

const worker = new Worker(
  'send-dm',
  async (job) => {
    const { accessToken, instagramAccountId, recipientIgUserId, message, campaignId, username, commentId } = job.data;

    // Check both hourly and monthly limits
    const rateCheck = await canSendDM(instagramAccountId);

    if (!rateCheck.allowed) {
      if (rateCheck.reason === 'hourly_limit') {
        // Hourly limit hit — re-queue with delay instead of dropping the DM
        console.warn(`⏳ Hourly rate limit hit for ${instagramAccountId}. Re-queuing in ${RATE_LIMIT_RETRY_DELAY_MS / 1000}s...`);
        await dmQueue.add('send-dm', job.data, { delay: RATE_LIMIT_RETRY_DELAY_MS });
        return; // Exit cleanly, job will retry later
      }

      if (rateCheck.reason === 'monthly_limit') {
        // Monthly quota exhausted — log and skip (don't re-queue endlessly)
        console.warn(`🚫 Monthly DM limit reached for ${instagramAccountId} (${rateCheck.current}/${rateCheck.limit}). Skipping DM to ${recipientIgUserId}.`);
        return;
      }
    }

    // Attempt to send the DM
    try {
      await sendDM(accessToken, recipientIgUserId, message, commentId);
      await incrementDmCount(instagramAccountId);

      await pool.query(
        `UPDATE leads SET dm_sent_at = NOW() WHERE campaign_id = $1 AND ig_user_id = $2`,
        [campaignId, recipientIgUserId]
      );
      console.log('✅ DM sent to', username || recipientIgUserId);
    } catch (err) {
      const statusCode = err.response?.status;
      const errorData = err.response?.data?.error;

      // Handle Meta rate limit (429 Too Many Requests)
      if (statusCode === 429 || errorData?.code === 4 || errorData?.code === 32) {
        const retryAfterMs = RATE_LIMIT_RETRY_DELAY_MS * (1 + Math.random()); // Add jitter
        console.warn(`⚠️ Meta 429 rate limit! Re-queuing DM to ${recipientIgUserId} in ${Math.round(retryAfterMs / 1000)}s`);
        await dmQueue.add('send-dm', job.data, { delay: retryAfterMs });
        return;
      }

      // Handle other Meta errors (spam detection, blocked user, etc.)
      console.error('❌ DM send failed:', errorData?.message || err.message);
      throw err; // Let BullMQ's built-in retry handle it
    }
  },
  { connection }
);

worker.on('failed', (job, err) => {
  console.error('DM job failed permanently:', job?.id, err.message);
});
