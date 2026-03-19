-- Users (simple auth - extend for OAuth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Instagram accounts linked to users (use ON CONFLICT for ig_user_id)
CREATE TABLE IF NOT EXISTS instagram_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ig_user_id VARCHAR(50) NOT NULL UNIQUE,
  username VARCHAR(100),
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instagram_account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  keyword VARCHAR(100) NOT NULL,
  media_id VARCHAR(100),
  media_type VARCHAR(20) DEFAULT 'all',
  followers_only BOOLEAN DEFAULT false,
  message TEXT NOT NULL,
  comment_reply TEXT,
  story_reply_message TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads (commenters who triggered DMs)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  ig_user_id VARCHAR(50) NOT NULL,
  username VARCHAR(100),
  comment_id VARCHAR(100),
  media_id VARCHAR(100),
  is_follower BOOLEAN,
  dm_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, ig_user_id)
);

-- Comment events (for analytics, avoid duplicates)
CREATE TABLE IF NOT EXISTS comment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  ig_user_id VARCHAR(50) NOT NULL,
  comment_id VARCHAR(100) NOT NULL UNIQUE,
  media_id VARCHAR(100),
  keyword_matched BOOLEAN DEFAULT false,
  dm_queued BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limit tracking (DMs per hour per account)
CREATE TABLE IF NOT EXISTS dm_rate_limit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instagram_account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  hour_bucket TIMESTAMPTZ NOT NULL,
  count INTEGER DEFAULT 0,
  UNIQUE(instagram_account_id, hour_bucket)
);

-- Monthly DM usage tracking (for subscription tier limits)
CREATE TABLE IF NOT EXISTS dm_monthly_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instagram_account_id UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  month_bucket VARCHAR(7) NOT NULL,  -- e.g. '2026-03'
  count INTEGER DEFAULT 0,
  UNIQUE(instagram_account_id, month_bucket)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_instagram_accounts_user_id ON instagram_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_instagram_account_id ON campaigns(instagram_account_id);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_comment_events_campaign_id ON comment_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_comment_events_comment_id ON comment_events(comment_id);
