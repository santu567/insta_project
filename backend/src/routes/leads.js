import { Router } from 'express';
import pool from '../db/index.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const { campaign_id } = req.query;
  const user_id = req.user.id; // From JWT

  let query = `
    SELECT l.*, c.keyword, c.message
    FROM leads l
    JOIN campaigns c ON c.id = l.campaign_id
    JOIN instagram_accounts ia ON ia.id = c.instagram_account_id
    WHERE ia.user_id = $1
  `;
  const params = [user_id];
  let i = 2;
  if (campaign_id) {
    query += ` AND l.campaign_id = $${i++}`;
    params.push(campaign_id);
  }
  query += ' ORDER BY l.created_at DESC';

  const { rows } = await pool.query(query, params);
  res.json(rows);
});

export default router;
