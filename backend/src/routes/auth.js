import { Router } from 'express';
import axios from 'axios';
import pool from '../db/index.js';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

const router = Router();

// Build OAuth URL helper
function buildOAuthUrl(statusId) {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID,
    redirect_uri: `${process.env.API_URL}/auth/instagram/callback`,
    scope: 'instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_insights,instagram_manage_messages,pages_show_list,pages_read_engagement,pages_manage_metadata,business_management',
    response_type: 'code',
    display: 'page',
    extras: JSON.stringify({ setup: { channel: "IG_API_ONBOARDING" } }),
    state: statusId
  });
  return `https://www.facebook.com/dialog/oauth?${params.toString()}`;
}

// POST /instagram/start — Start the polling flow
router.post('/instagram/start', async (req, res) => {
  try {
    const statusId = randomUUID();
    const userId = req.body.user_id || 'anonymous';
    await pool.query(
      'INSERT INTO oauth_sessions (id, status, message) VALUES ($1, $2, $3)',
      [statusId, 'pending', userId]
    );
    res.json({ 
      statusId, 
      redirectUrl: `${process.env.API_URL}/auth/instagram/redirect?state=${statusId}` 
    });
  } catch (err) {
    console.error('Start error:', err);
    res.status(500).json({ error: 'Failed to start auth flow' });
  }
});

// API endpoint — returns the OAuth URL as JSON
router.get('/instagram/url', (req, res) => {
  const statusId = req.query.state || 'anonymous';
  const url = buildOAuthUrl(statusId);
  res.json({ url });
});

// Server-side redirect — directly sends user to OAuth wrapper
router.get('/instagram/redirect', (req, res) => {
  const statusId = req.query.state || 'anonymous';
  const url = buildOAuthUrl(statusId);
  res.redirect(url);
});

// Step 2: Handle the authorization code callback
router.get('/instagram/callback', async (req, res) => {
  const { code, state, error: oauthError } = req.query;

  if (oauthError || !code) {
    console.error('OAuth error or no code:', oauthError);
    if (state) await pool.query("UPDATE oauth_sessions SET status = 'failed', message = $1 WHERE id = $2", ['auth_cancelled', state]).catch(console.error);
    return res.send(`<html><body style="font-family: sans-serif; text-align: center; padding-top: 50px;"><h2>Authentication cancelled. Please close this window.</h2></body></html>`);
  }

  try {
    // Exchange authorization code for short-lived access token
    console.log('Exchanging authorization code for access token...');
    const tokenRes = await axios.get('https://graph.facebook.com/v25.0/oauth/access_token', {
      params: {
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        redirect_uri: `${process.env.API_URL}/auth/instagram/callback`,
        code: code
      }
    });

    const shortLivedToken = tokenRes.data.access_token;
    console.log('Got short-lived token ✓');

    // Exchange for long-lived token
    const longTokenRes = await axios.get('https://graph.facebook.com/v25.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        fb_exchange_token: shortLivedToken
      }
    });
    const longUserToken = longTokenRes.data.access_token;
    console.log('Got long-lived user token ✓');

    // Step 3: Get User's Page and Instagram Business Account
    let igUserId = null;
    let igUsername = null;
    let pageAccessToken = null;

    console.log('Fetching /me/accounts...');
    const pagesRes = await axios.get('https://graph.facebook.com/v25.0/me/accounts', {
      params: { access_token: longUserToken, fields: 'id,name,access_token,instagram_business_account' }
    });
    console.log('Pages API response:', pagesRes.data);
    const pages = pagesRes.data.data || [];
    console.log('Pages found:', pages.length);

    for (const page of pages) {
      console.log(`Checking page ${page.id} (${page.name})...`);
      if (page.instagram_business_account && page.instagram_business_account.id) {
        igUserId = page.instagram_business_account.id;
        pageAccessToken = page.access_token;
        console.log('Found IG account via /me/accounts!');
        break;
      }
    }

    if (!igUserId) {
      console.error('Could not find Instagram account. Check the API response above.');
      throw new Error('No Instagram Business account found.');
    }

    // Get username
    const igRes = await axios.get(`https://graph.facebook.com/v25.0/${igUserId}`, {
      params: { fields: 'username', access_token: pageAccessToken }
    });
    igUsername = igRes.data.username || null;

    console.log('Instagram username:', igUsername, '| IG User ID:', igUserId);

    // Automatically Subscribe the Facebook Page to this App's webhook
    try {
      console.log('Automatically subscribing Facebook Page to Webhooks...');
      await axios.post(`https://graph.facebook.com/v25.0/${pages[0].id}/subscribed_apps`, null, {
        params: {
          access_token: pageAccessToken,
          subscribed_fields: 'messages,standby,feed'
        }
      });
      console.log('✅ Page Webhook Subscribed Successfully!');
    } catch (subErr) {
      console.error('⚠️ Could not auto-subscribe page to webhooks:', subErr.response?.data || subErr.message);
    }

    // Save to DB
    let dbUserId = null;

    // We no longer rely on state being a valid user_id UUID, state is the statusId
    // We will just use email insertion as anonymous fallback, or we can pre-associate user ID later.
    const newUser = await pool.query(
      'INSERT INTO users (email) VALUES ($1) ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING id',
      [`ig_${igUserId}@insta-link.local`]
    );
    dbUserId = newUser.rows[0].id;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 60);

    await pool.query(
      `INSERT INTO instagram_accounts (user_id, ig_user_id, username, access_token, token_expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (ig_user_id) DO UPDATE SET
         access_token = $4,
         token_expires_at = $5,
         updated_at = NOW()`,
      [dbUserId, igUserId, igUsername, pageAccessToken, expiresAt]
    );

    console.log('✅ Account saved to DB!');

    // Update oauth_sessions status
    await pool.query(
      'UPDATE oauth_sessions SET status = $1, user_id = $2 WHERE id = $3',
      ['ok', dbUserId, state]
    );

    // Close popup visually
    res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
          <h2>Authentication successful!</h2>
          <p>You may safely close this tab or window and return to the main app.</p>
          <script>
            setTimeout(() => { if (window.opener) window.close(); }, 2000);
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('OAuth processing error FULL:', err);
    console.error('OAuth processing error:', err.response?.data || err.message || err);
    
    // Attempt to update the status record with the error
    if (state && typeof state === 'string') {
       await pool.query("UPDATE oauth_sessions SET status = 'failed', message = $1 WHERE id = $2", [err.message, state]).catch(console.error);
    }
    
    // Explicit close wrapper for failure
    res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
          <h2 style="color: red;">Authentication failed.</h2>
          <p>Please close this window and try again.</p>
          <p style="color: #666; font-size: 13px;">Error: ${err.message}</p>
          <script>
            setTimeout(() => { if (window.opener) window.close(); }, 3000);
          </script>
        </body>
      </html>
    `);
  }
});

// GET /instagram/status/:id
router.get('/instagram/status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT status, user_id, message FROM oauth_sessions WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const session = result.rows[0];
    
    if (session.status === 'ok' && session.user_id) {
       const userRes = await pool.query('SELECT email FROM users WHERE id = $1', [session.user_id]);
       const email = userRes.rows[0]?.email || '';
       const token = jwt.sign(
         { id: session.user_id, email },
         process.env.JWT_SECRET,
         { expiresIn: '7d' }
       );
       res.cookie('token', token, {
         httpOnly: true,
         secure: true,
         sameSite: 'none',
         maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
       });
       return res.json({ state: 'ok' });
    }
    
    res.json({ state: session.status, message: session.message });
  } catch (err) {
    console.error('Status check error:', err);
    res.status(500).json({ error: 'Internal server error checking status' });
  }
});

import { authenticate } from '../middleware/authMiddleware.js';

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

export default router;
