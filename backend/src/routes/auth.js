import { Router } from 'express';
import axios from 'axios';
import pool from '../db/index.js';
import jwt from 'jsonwebtoken';

const router = Router();

// Build OAuth URL helper
function buildOAuthUrl(userId) {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID,
    redirect_uri: `${process.env.API_URL}/auth/instagram/callback`,
    scope: 'instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_insights,instagram_manage_messages,pages_show_list,pages_read_engagement,pages_manage_metadata,business_management',
    response_type: 'code',
    display: 'page',
    auth_type: 'rerequest',
    extras: JSON.stringify({ setup: { channel: "IG_API_ONBOARDING" } }),
    state: userId
  });
  return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
}

// API endpoint — returns the OAuth URL as JSON
router.get('/instagram/url', (req, res) => {
  const userId = req.query.user_id || 'anonymous';
  const url = buildOAuthUrl(userId);
  console.log("OAuth URL:", url);
  res.json({ url });
});

// Server-side redirect — directly sends user to OAuth (prevents mobile deep-linking)
router.get('/instagram/redirect', (req, res) => {
  const userId = req.query.user_id || 'anonymous';
  const url = buildOAuthUrl(userId);
  console.log("OAuth Redirect:", url);
  res.redirect(url);
});

// Step 2: Handle the authorization code callback
router.get('/instagram/callback', async (req, res) => {
  const { code, state: userId, error: oauthError } = req.query;

  if (oauthError || !code) {
    console.error('OAuth error or no code:', oauthError);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=no_code`);
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

    const isValidUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(userId);

    if (isValidUUID) {
      const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (userResult.rows.length > 0) {
        dbUserId = userResult.rows[0].id;
      }
    }

    if (!dbUserId) {
      const newUser = await pool.query(
        'INSERT INTO users (email) VALUES ($1) ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING id',
        [`ig_${igUserId}@insta-link.local`]
      );
      dbUserId = newUser.rows[0].id;
    }

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

    // Generate JWT
    const token = jwt.sign(
      { id: dbUserId, email: `ig_${igUserId}@insta-link.local` },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set JWT in HTTP-Only Cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Close popup and message parent window
    res.send(`
      <html>
        <body>
          <h2>Authentication successful! Redirecting...</h2>
          <script>
            if (window.opener) {
              window.opener.postMessage('oauth_success', '*');
            } else {
              window.location.href = '${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard';
            }
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('OAuth processing error FULL:', err);
    console.error('OAuth processing error:', err.response?.data || err.message || err);
    
    // Close popup and message parent window with error
    res.send(`
      <html>
        <body>
          <h2>Authentication failed. Redirecting...</h2>
          <script>
            if (window.opener) {
              window.opener.postMessage('oauth_error', '*');
            } else {
              window.location.href = '${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_processing_failed';
            }
          </script>
        </body>
      </html>
    `);
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
