import { Router } from 'express';
import pool from '../db/index.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const user_id = req.user.id;

  const { rows } = await pool.query(
    'SELECT id, ig_user_id, username, created_at FROM instagram_accounts WHERE user_id = $1',
    [user_id]
  );
  res.json(rows);
});

export default router;
