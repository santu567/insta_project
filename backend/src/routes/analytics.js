import { Router } from 'express';
import pool from '../db/index.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const { campaign_id } = req.query;
  const user_id = req.user.id;

  const conditions = ['ia.user_id = $1'];
  const params = [user_id];
  let i = 2;

  if (campaign_id) {
    conditions.push(`c.id = $${i++}`);
    params.push(campaign_id);
  }
  const where = conditions.join(' AND ');

  const totals = await pool.query(
    `SELECT
       COUNT(DISTINCT ce.id) as total_comments,
       COUNT(DISTINCT l.id) as total_leads,
       COUNT(DISTINCT CASE WHEN l.dm_sent_at IS NOT NULL THEN l.id END) as dms_sent,
       COUNT(DISTINCT CASE WHEN l.is_follower = true THEN l.id END) as followers,
       COUNT(DISTINCT CASE WHEN l.is_follower = false OR l.is_follower IS NULL THEN l.id END) as non_followers
     FROM campaigns c
     JOIN instagram_accounts ia ON ia.id = c.instagram_account_id
     LEFT JOIN comment_events ce ON ce.campaign_id = c.id
     LEFT JOIN leads l ON l.campaign_id = c.id
     WHERE ${where}`,
    params
  );

  res.json(totals.rows[0] || {
    total_comments: 0,
    total_leads: 0,
    dms_sent: 0,
    followers: 0,
    non_followers: 0
  });
});

export default router;
