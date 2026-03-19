import { Router } from 'express';
import axios from 'axios';
import pool from '../db/index.js';
import jwt from 'jsonwebtoken';

const router = Router();

// Step 1: Redirect to Facebook Login with Business Login for Instagram config
router.get('/instagram/url', (req, res) => {
  const userId = req.query.user_id || 'anonymous';
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID,
    redirect_uri: `${process.env.API_URL}/auth/instagram/callback`,
    scope: 'instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_insights,instagram_manage_messages,pages_show_list,pages_read_engagement,pages_manage_metadata,business_management',
    response_type: 'token',
    display: 'page',
    extras: JSON.stringify({ "setup": { "channel": "IG_API_ONBOARDING" } }),
    state: userId
  });
  const url = `https://www.facebook.com/dialog/oauth?${params}`;
  console.log("OAuth URL:", url);
  res.json({ url });
});

// Step 2: Facebook Implicit flow redirects to callback with #hash
router.get('/instagram/callback', (req, res) => {
  // If the hash was already parsed and passed as query, proceed.
  if (req.query.access_token) {
    return res.redirect(`/auth/instagram/callback_process?` + new URLSearchParams(req.query).toString());
  }

  // Otherwise, the token is trapped in the #hash (browser-only variable).
  // Return a tiny HTML script to grab the hash and redirect to our backend processor.
  res.send(`
    <html>
      <head><title>Authenticating...</title></head>
      <body>
        <h3>Completing Instagram connection... Please wait.</h3>
        <script>
          if (window.location.hash) {
            // Remove the '#' and parse as URL parameters
            const params = new URLSearchParams(window.location.hash.substring(1));
            // Add any query params (like state)
            const queryParams = new URLSearchParams(window.location.search);
            for (const [key, value] of queryParams.entries()) {
              params.append(key, value);
            }
            // Redirect to the backend processing route
            window.location.href = '${process.env.API_URL}/auth/instagram/callback_process?' + params.toString();
          } else {
            window.location.href = '${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=no_token';
          }
        </script>
      </body>
    </html>
  `);
});

// Step 3: Backend processes the extracted token
router.get('/instagram/callback_process', async (req, res) => {
  console.log("Query received:", req.query);

  const { access_token, long_lived_token, state: userId } = req.query;
  if (!access_token && !long_lived_token) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=no_token_extracted`);
  }

  try {
    console.log('Token extracted successfully!');

    // According to the new Meta docs, long_lived_token might be provided directly in the hash. 
    // If not, we fall back to exchanging the short-lived access_token.
    let longUserToken = long_lived_token;

    if (!longUserToken) {
      console.log('No long_lived_token in URL fragment. Exchanging short-lived token...');
      const longTokenRes = await axios.get('https://graph.facebook.com/v25.0/oauth/access_token', {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: process.env.META_APP_ID,
          client_secret: process.env.META_APP_SECRET,
          fb_exchange_token: access_token
        }
      });
      console.log('Token exchange response:', longTokenRes.data);
      longUserToken = longTokenRes.data.access_token;
    }
    console.log('Got long-lived user token ✓');

    // Step 4: Get User's Page and Instagram Business Account (as per docs)
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

    // Automatically Subscribe the Facebook Page to this App's webhook (Required for Instagram Webhooks)
    try {
      console.log('Automatically subscribing Facebook Page to Webhooks...');
      // By sending POST with no subscribed_fields, Meta leverages the fields defined in the dashboard.
      // But we explicitly request feed just in case, or leave it blank to bind the app to the page.
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

    // Check if state/userId is a valid UUID before querying
    const isValidUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(userId);

    if (isValidUUID) {
      const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (userResult.rows.length > 0) {
        dbUserId = userResult.rows[0].id;
      }
    }

    if (!dbUserId) {
      // Create new user if not logged in or invalid ID
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
      secure: true, // Must be true for SameSite=None
      sameSite: 'none', // Required for cross-domain (ngrok to localhost)
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`);
  } catch (err) {
    console.error('OAuth processing error FULL:', err);
    console.error('OAuth processing error:', err.response?.data || err.message || err);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_processing_failed`);
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
