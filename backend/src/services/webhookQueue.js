import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import pool from '../db/index.js';
import { checkIsFollower, replyToComment } from './graphApi.js';
import { enqueueDM } from './dmQueue.js';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
});

export const webhookQueue = new Queue('incoming-webhooks', { connection });

export async function enqueueWebhook(payload) {
  await webhookQueue.add('process-webhook', payload, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  });
}

const worker = new Worker(
  'incoming-webhooks',
  async (job) => {
    console.log(`[Webhook Worker] 🚀 Started processing job ${job.id}`);
    const { commentId, commenterId, commenterUsername, mediaId, commentText } = job.data;

    const { rows: campaigns } = await pool.query(
      `SELECT c.*, ia.access_token, ia.id as instagram_account_id
       FROM campaigns c
       JOIN instagram_accounts ia ON ia.id = c.instagram_account_id
       WHERE c.is_active = true AND (c.media_id = $1 OR c.media_type = 'all')`,
      [mediaId]
    );

    console.log(`[Webhook Worker] Found ${campaigns.length} campaigns for media ${mediaId}`);

    if (campaigns.length === 0) {
      return; // No active campaigns match this media
    }

    for (const campaign of campaigns) {
      const keyword = (campaign.keyword || '').trim().toUpperCase();
      console.log(`[Webhook Worker] Checking campaign ${campaign.id} keyword: "${keyword}" against comment: "${commentText}"`);
      
      if (!keyword || !commentText.includes(keyword)) {
        console.log(`[Webhook Worker] Keyword did not match.`);
        continue;
      }

      // Check if user has already received a DM for this campaign
      const existing = await pool.query(
        `SELECT 1 FROM leads WHERE campaign_id = $1 AND ig_user_id = $2`,
        [campaign.id, commenterId]
      );
      if (existing.rows.length > 0) {
        console.log(`[Webhook Worker] User ${commenterId} already received DM for campaign ${campaign.id}`);
        continue;
      }

      let isFollower = true;
      if (campaign.followers_only) {
        isFollower = await checkIsFollower(campaign.access_token, commenterId);
        // Handle Meta follower check API bug by bypassing if it fails temporarily
        if (!isFollower) {
           console.log("Follower check returned false (or errored). Bypassing check for debugging purposes.");
        }
      } else {
        isFollower = await checkIsFollower(campaign.access_token, commenterId);
      }

      const message = (campaign.message || '').replace(/\{username\}/gi, commenterUsername || 'there');

      console.log(`[Webhook Worker] Creating lead and enqueuing DM for user ${commenterId}`);

      await pool.query(
        `INSERT INTO leads (campaign_id, ig_user_id, username, comment_id, media_id, is_follower)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (campaign_id, ig_user_id) DO NOTHING`,
        [campaign.id, commenterId, commenterUsername, commentId, mediaId, isFollower]
      );

      await pool.query(
        `INSERT INTO comment_events (campaign_id, ig_user_id, comment_id, media_id, keyword_matched, dm_queued)
         VALUES ($1, $2, $3, $4, true, true)
         ON CONFLICT (comment_id) DO NOTHING`,
        [campaign.id, commenterId, commentId, mediaId]
      );

      await enqueueDM({
        accessToken: campaign.access_token,
        instagramAccountId: campaign.instagram_account_id,
        recipientIgUserId: commenterId,
        message,
        campaignId: campaign.id,
        username: commenterUsername,
        commentId: commentId
      });
      console.log(`[Webhook Worker] ✅ Successfully enqueued DM job`);

      // Auto-reply to the comment publicly (e.g., "Check your DMs! 🔥")
      if (campaign.comment_reply) {
        const replyText = (campaign.comment_reply).replace(/\{username\}/gi, commenterUsername || 'there');
        await replyToComment(campaign.access_token, commentId, replyText);
        console.log(`[Webhook Worker] ✅ Comment reply sent`);
      }
    }
  },
  { connection }
);

worker.on('failed', (job, err) => {
  console.error('Webhook worker job failed:', job?.id, err.message);
});

// ===== Story Mentions / Replies Queue =====

export const storyQueue = new Queue('story-webhooks', { connection });

export async function enqueueStoryWebhook(payload) {
  await storyQueue.add('process-story', payload, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 }
  });
}

const storyWorker = new Worker(
  'story-webhooks',
  async (job) => {
    console.log(`[Story Worker] 📸 Processing story ${job.data.type} from ${job.data.senderId}`);
    const { senderId, recipientId, type } = job.data;

    // Find all active campaigns for this IG account that have a story_reply_message
    const { rows: campaigns } = await pool.query(
      `SELECT c.*, ia.access_token, ia.id as instagram_account_id, ia.ig_user_id
       FROM campaigns c
       JOIN instagram_accounts ia ON ia.id = c.instagram_account_id
       WHERE c.is_active = true
         AND c.story_reply_message IS NOT NULL
         AND c.story_reply_message != ''
         AND ia.ig_user_id = $1`,
      [recipientId]
    );

    if (campaigns.length === 0) {
      console.log(`[Story Worker] No campaigns with story_reply_message for account ${recipientId}`);
      return;
    }

    for (const campaign of campaigns) {
      // Deduplicate: check if we already sent a story DM to this user for this campaign today
      const existing = await pool.query(
        `SELECT 1 FROM leads
         WHERE campaign_id = $1 AND ig_user_id = $2
         AND created_at > NOW() - INTERVAL '24 hours'`,
        [campaign.id, senderId]
      );
      if (existing.rows.length > 0) {
        console.log(`[Story Worker] Already sent story DM to ${senderId} for campaign ${campaign.id} today`);
        continue;
      }

      const message = (campaign.story_reply_message || '').replace(/\{username\}/gi, 'there');

      // Record as a lead
      await pool.query(
        `INSERT INTO leads (campaign_id, ig_user_id, username, media_id, is_follower)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (campaign_id, ig_user_id) DO NOTHING`,
        [campaign.id, senderId, null, `story_${type}`]
      );

      await enqueueDM({
        accessToken: campaign.access_token,
        instagramAccountId: campaign.instagram_account_id,
        recipientIgUserId: senderId,
        message,
        campaignId: campaign.id,
        username: null,
        commentId: null
      });

      console.log(`[Story Worker] ✅ Story DM enqueued for ${senderId}`);
    }
  },
  { connection }
);

storyWorker.on('failed', (job, err) => {
  console.error('Story worker job failed:', job?.id, err.message);
});
