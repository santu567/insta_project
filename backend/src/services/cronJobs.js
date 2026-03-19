import cron from 'node-cron';
import pool from '../db/index.js';
import { refreshToken } from './graphApi.js';

export function startCronJobs() {
  // Run daily at midnight: '0 0 * * *'
  cron.schedule('0 0 * * *', async () => {
    console.log('--- CRON: Running daily token refresh check ---');
    try {
      // Find tokens expiring in less than 10 days
      const { rows } = await pool.query(`
        SELECT id, ig_user_id, access_token 
        FROM instagram_accounts 
        WHERE token_expires_at IS NOT NULL 
          AND token_expires_at < NOW() + INTERVAL '10 days'
      `);

      if (rows.length === 0) {
        console.log('CRON: No tokens require refreshing today.');
        return;
      }

      console.log(`CRON: Found ${rows.length} tokens to refresh.`);

      for (const account of rows) {
        try {
          const data = await refreshToken(account.access_token);
          
          if (data && data.access_token) {
            // Instagram tokens typically expire in 60 days (5184000 seconds)
            const expiresInSeconds = data.expires_in || 5184000;
            
            await pool.query(`
              UPDATE instagram_accounts 
              SET access_token = $1,
                  token_expires_at = NOW() + INTERVAL '${expiresInSeconds} seconds',
                  updated_at = NOW()
              WHERE id = $2
            `, [data.access_token, account.id]);
            
            console.log(`CRON: Successfully refreshed token for IG User: ${account.ig_user_id}`);
          }
        } catch (err) {
          console.error(`CRON: Failed to refresh token for IG User ${account.ig_user_id}. Error:`, err.response?.data || err.message);
        }
      }
    } catch (error) {
      console.error('CRON: Error in daily token refresh job:', error);
    }
  });

  console.log('Cron jobs scheduled: Daily Token Refresh Engine started.');
}
