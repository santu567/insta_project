import { Router } from 'express';
import pool from '../db/index.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const { ig_account_id } = req.query;
  const user_id = req.user.id; // From JWT

  let query = `
    SELECT c.*, ia.username as account_username
    FROM campaigns c
    JOIN instagram_accounts ia ON ia.id = c.instagram_account_id
    WHERE ia.user_id = $1
  `;
  const params = [user_id];
  let i = 2;

  if (ig_account_id) {
    query += ` AND c.instagram_account_id = $${i++}`;
    params.push(ig_account_id);
  }
  query += ' ORDER BY c.created_at DESC';

  const { rows } = await pool.query(query, params);
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { instagram_account_id, keyword, media_id, media_type, followers_only, message, comment_reply, story_reply_message } = req.body;
  if (!instagram_account_id || !keyword || !message) {
    return res.status(400).json({ error: 'instagram_account_id, keyword, and message required' });
  }

  const { rows } = await pool.query(
    `INSERT INTO campaigns (instagram_account_id, keyword, media_id, media_type, followers_only, message, comment_reply, story_reply_message)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      instagram_account_id,
      keyword,
      media_id || null,
      media_type || 'all',
      !!followers_only,
      message,
      comment_reply || null,
      story_reply_message || null
    ]
  );
  res.status(201).json(rows[0]);
});

router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  // First verify the campaign belongs to an IG account owned by this user
  const ownCheck = await pool.query(
    `SELECT c.id FROM campaigns c
     JOIN instagram_accounts ia ON ia.id = c.instagram_account_id
     WHERE c.id = $1 AND ia.user_id = $2`,
    [id, user_id]
  );
  if (ownCheck.rows.length === 0) return res.status(404).json({ error: 'Campaign not found or unauthorized' });

  const { is_active, keyword, media_id, media_type, followers_only, message } = req.body;

  const updates = [];
  const values = [];
  let i = 1;
  if (typeof is_active === 'boolean') {
    updates.push(`is_active = $${i++}`);
    values.push(is_active);
  }
  if (keyword !== undefined) {
    updates.push(`keyword = $${i++}`);
    values.push(keyword);
  }
  if (media_id !== undefined) {
    updates.push(`media_id = $${i++}`);
    values.push(media_id);
  }
  if (media_type !== undefined) {
    updates.push(`media_type = $${i++}`);
    values.push(media_type);
  }
  if (followers_only !== undefined) {
    updates.push(`followers_only = $${i++}`);
    values.push(followers_only);
  }
  if (message !== undefined) {
    updates.push(`message = $${i++}`);
    values.push(message);
  }
  if (req.body.comment_reply !== undefined) {
    updates.push(`comment_reply = $${i++}`);
    values.push(req.body.comment_reply || null);
  }
  if (req.body.story_reply_message !== undefined) {
    updates.push(`story_reply_message = $${i++}`);
    values.push(req.body.story_reply_message || null);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE campaigns SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Campaign not found' });
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  // Verify ownership before delete by using a subquery
  const { rowCount } = await pool.query(`
    DELETE FROM campaigns c
    USING instagram_accounts ia
    WHERE c.instagram_account_id = ia.id 
      AND c.id = $1 
      AND ia.user_id = $2
  `, [id, user_id]);

  if (rowCount === 0) return res.status(404).json({ error: 'Campaign not found or unauthorized' });
  res.status(204).send();
});

export default router;
