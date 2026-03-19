# InstaLink

Comment-to-DM automation for Instagram. When users comment a specific keyword on your posts or reels, InstaLink automatically sends them a DM.

## Features

- **Keyword triggers** – e.g. "LINK" – auto-DM anyone who comments it
- **Followers only** – optional filter to DM only your followers
- **Target posts** – all posts, or specific post/reel by media ID
- **Lead tracking** – store leads with follower status
- **Analytics** – total comments, DMs sent, followers vs non-followers
- **Rate limiting** – configurable DMs per hour
- **Random delay** – 5–20 sec before sending to avoid spam patterns
- **Webhook signature validation** – secure Meta webhook handling

## Stack

- **Backend:** Node.js, Express, PostgreSQL, Redis, BullMQ
- **Frontend:** Next.js 14, Tailwind CSS
- **Infra:** Docker (PostgreSQL, Redis)

## Quick start

### 1. Clone and install

```bash
cd insta_link
docker compose up -d
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Meta app

1. Go to [Meta for Developers](https://developers.facebook.com/) and create an app.
2. Add **Instagram Graph API** product.
3. Configure **Instagram Login** with redirect URI:  
   `http://localhost:4000/auth/instagram/callback`
4. Add **Webhooks** for Instagram, subscribe to `comments`.
5. Copy App ID and App Secret.

### 3. Environment

```bash
cp .env.example .env
```

Edit `.env`:

```
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
META_WEBHOOK_VERIFY_TOKEN=any_random_string_you_pick
API_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000
```

### 4. Run migrations

```bash
cd backend && npm run db:migrate
```

### 5. Start services

**Terminal 1 – backend:**
```bash
cd backend && npm run dev
```

**Terminal 2 – frontend:**
```bash
cd frontend && npm run dev
```

### 6. Webhook URL

Set your webhook URL in Meta App Dashboard → Webhooks → Instagram:

- **Callback URL:** `https://your-domain.com/webhooks/instagram`
- **Verify Token:** same as `META_WEBHOOK_VERIFY_TOKEN`

For local dev, use [ngrok](https://ngrok.com/) and set the ngrok URL as the callback.

## Project structure

```
insta_link/
├── backend/
│   ├── src/
│   │   ├── db/           # PostgreSQL schema, migrate
│   │   ├── routes/       # auth, campaigns, leads, analytics, webhooks
│   │   ├── services/     # graphApi, rateLimit, dmQueue
│   │   └── index.js
│   └── package.json
├── frontend/
│   └── src/app/          # Next.js App Router pages
├── docker-compose.yml
└── .env.example
```

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/instagram/url` | GET | Get OAuth URL for Instagram login |
| `/auth/instagram/callback` | GET | OAuth callback (redirect) |
| `/api/accounts` | GET | List connected Instagram accounts |
| `/api/campaigns` | GET, POST | List/create campaigns |
| `/api/campaigns/:id` | PATCH, DELETE | Update/delete campaign |
| `/api/leads` | GET | List leads |
| `/api/analytics` | GET | Analytics totals |
| `/webhooks/instagram` | GET, POST | Meta webhook (verify + receive) |

## Safety & compliance

- Validates webhook signature (`x-hub-signature-256`)
- Sends DMs only after comment (no proactive outreach)
- Rate limit: 100 DMs/hour per account (configurable)
- Random delay 5–20 sec before each DM
- Unique constraint prevents duplicate DMs per campaign+user

## Pricing (future)

- **Free:** 100 DMs/month
- **Pro:** Unlimited DMs

## License

MIT
