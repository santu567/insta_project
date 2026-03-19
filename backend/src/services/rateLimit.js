import pool from '../db/index.js';

// Hourly limit — safety net to avoid Meta API bans
const DM_HOURLY_LIMIT = parseInt(process.env.DM_RATE_LIMIT_PER_HOUR || '200', 10);

// Monthly limit — subscription tier enforcement (default: 30,000 like LinkDM Pro)
const DM_MONTHLY_LIMIT = parseInt(process.env.DM_MONTHLY_LIMIT || '30000', 10);

// ===== Hourly Rate Limiting (Meta Safety) =====

export async function canSendHourly(instagramAccountId) {
  const hourBucket = new Date();
  hourBucket.setMinutes(0, 0, 0);

  const { rows } = await pool.query(
    `SELECT count FROM dm_rate_limit WHERE instagram_account_id = $1 AND hour_bucket = $2`,
    [instagramAccountId, hourBucket]
  );
  const current = parseInt(rows[0]?.count ?? 0, 10);
  return current < DM_HOURLY_LIMIT;
}

export async function incrementHourlyCount(instagramAccountId) {
  const hourBucket = new Date();
  hourBucket.setMinutes(0, 0, 0);

  await pool.query(
    `INSERT INTO dm_rate_limit (instagram_account_id, hour_bucket, count)
     VALUES ($1, $2, 1)
     ON CONFLICT (instagram_account_id, hour_bucket) DO UPDATE SET count = dm_rate_limit.count + 1`,
    [instagramAccountId, hourBucket]
  );
}

// ===== Monthly Quota Tracking (Subscription Tiers) =====

function getMonthBucket() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export async function canSendMonthly(instagramAccountId) {
  const monthBucket = getMonthBucket();

  const { rows } = await pool.query(
    `SELECT count FROM dm_monthly_usage WHERE instagram_account_id = $1 AND month_bucket = $2`,
    [instagramAccountId, monthBucket]
  );
  const current = parseInt(rows[0]?.count ?? 0, 10);
  return { allowed: current < DM_MONTHLY_LIMIT, current, limit: DM_MONTHLY_LIMIT };
}

export async function incrementMonthlyCount(instagramAccountId) {
  const monthBucket = getMonthBucket();

  await pool.query(
    `INSERT INTO dm_monthly_usage (instagram_account_id, month_bucket, count)
     VALUES ($1, $2, 1)
     ON CONFLICT (instagram_account_id, month_bucket) DO UPDATE SET count = dm_monthly_usage.count + 1`,
    [instagramAccountId, monthBucket]
  );
}

// ===== Combined Check =====

export async function canSendDM(instagramAccountId) {
  const hourlyOk = await canSendHourly(instagramAccountId);
  if (!hourlyOk) return { allowed: false, reason: 'hourly_limit' };

  const monthly = await canSendMonthly(instagramAccountId);
  if (!monthly.allowed) return { allowed: false, reason: 'monthly_limit', current: monthly.current, limit: monthly.limit };

  return { allowed: true };
}

export async function incrementDmCount(instagramAccountId) {
  await incrementHourlyCount(instagramAccountId);
  await incrementMonthlyCount(instagramAccountId);
}
