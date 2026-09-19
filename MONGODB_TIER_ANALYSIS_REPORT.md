# MongoDB Atlas Tier Cost Optimization Report

## Context

- Current setup: Atlas `M10` (as shared by you), monthly bill around `$150-$200`.
- Current scale: around `200` users.
- Near-term projection: around `1000` users in `5-6` months.
- Objective: move to a lower-cost Atlas tier without breaking app behavior.

## What I analyzed in your codebase

### 1) Mongo workload shape

- App is transaction-heavy (`mongoose.startSession()`, `withTransaction()`) in registration, wallet, payment distribution, e-pool, and upline flows.
- There are multiple `aggregate()` pipelines in user/admin dashboards, team views, wallet statements, and payment-link flows.
- There are background workers (`bullmq`) and daily cron jobs that hit MongoDB even outside normal user traffic.
- This means workload is not just "simple CRUD"; there is mixed read + write + aggregation + transaction traffic.

### 2) Data model / growth pressure

- Collections like `wallet_transactions` and `payment_links` can grow quickly.
- Each business action can create multiple transaction records (credit/debit/report style entries).
- With `1000` users, transaction history becomes the dominant storage + index cost driver (not user profile docs).

### 3) Index posture (important for low tiers)

- Good: `wallet_transactions` has useful compound indexes for timeline/type filters.
- Good: many primary operational fields in `users` and `payment_links` are indexed.
- Risk: `user_uplines` lacks an explicit index on `user`, but code queries by `{ user: ... }` repeatedly.
- Risk: several `payment_links` query patterns combine fields (`sender`, `payment_type`, `status`, `updatedAt`) where single-field indexes may still cause heavier scans.

## Atlas tier reality check (`M0`, `M2`, `M5`)

> Note: Atlas offerings evolve over time. In many accounts/regions, `M2/M5` are being replaced or accompanied by `Flex` style shared options. If `M2/M5` are not shown in your Atlas UI, use the nearest equivalent shared/flex tier by RAM/storage/IOPS.

### `M0` (Free tier)

- Pros: zero infra cost.
- Cons (critical for your app):
  - Very small storage envelope (commonly `~512MB`).
  - Shared performance; latency spikes/throttling risk under aggregate + transaction workloads.
  - Operational limitations vs paid tiers (backup/monitoring/network features are constrained).
- Fit for your app: **not recommended for production**. It may run initially but will be unstable under growth and history accumulation.

### `M2` (small shared, where available)

- Pros: very low cost, better than M0.
- Cons: still shared capacity; limited headroom for aggregation-heavy admin/team pages and transaction bursts.
- Fit for your app: **possible as temporary step** if:
  - active users remain low,
  - transaction history is pruned/archived,
  - and indexing is tightened.
- Risk level: **medium-high** for 1000-user target.

### `M5` (larger shared, where available)

- Pros: meaningful buffer over M2 for concurrent read/write and growing history.
- Better chance to absorb admin reports, worker traffic, and transaction retries without visible slowness.
- Fit for your app: **best low-cost practical tier** among M0/M2/M5 for your current architecture.
- Risk level: **medium** (manageable with proper indexes + monitoring).

## Capacity estimate for your specific 200 -> 1000 plan

These are practical ranges (not exact billing calculator values):

- User/account/master docs: small (tens of MB range even at 1000 users).
- Main growth from `wallet_transactions` + `payment_links` + indexes.
- If activity is moderate:
  - 1000 users can still fit in low single-digit GB total dataset.
- If activity is high (many wallet movements per user):
  - dataset + indexes can cross `2GB` sooner than expected.

So:

- `M0` storage is too tight.
- `M2` can become tight if transaction history grows quickly.
- `M5` gives safer runway for 6-12 months at your projected scale.

## Recommendation (direct answer)

### Best choice for your project right now

- **Primary recommendation: move from `M10` -> `M5` (or equivalent shared/flex tier with similar headroom).**

### Why not `M0`

- Your app has transactions + aggregations + workers; this is not a lightweight blog-style workload.
- Growth to 1000 users plus ledger history makes M0 high-risk for production.

### When `M2` is acceptable

- Only as a short-term cost emergency option (1-2 months) with strict monitoring and fast rollback path.

## Cost optimization strategy (safe rollout)

1. Clone/restore prod snapshot to staging and benchmark on target lower tier.
2. Run peak workflows:
   - registration,
   - payment/upgrade flow,
   - wallet transaction listing,
   - team/admin dashboards,
   - cron + queue workers.
3. Track p95 API latency and Mongo slow queries for 3-7 days.
4. If stable on `M5`, cut over.
5. Keep auto-scaling or quick-upgrade playbook ready (`M5 -> M10`) for campaign spikes.

## Strongly recommended DB improvements before/with downgrade

These improvements materially increase chances of success on cheaper tiers:

- Add index on `user_uplines.user` (high-impact, low-risk).
- Add compound indexes matching frequent `payment_links` filters (for example sender/status/payment_type/updatedAt variants based on actual slow-query logs).
- Add retention/archive policy for very old `wallet_transactions` (if business permits).
- Ensure expensive dashboards are paginated and avoid unnecessary broad aggregations.

## Practical decision table

| Tier | Can app technically run? | Production suitability          | Risk for 1000 users |
| ---- | ------------------------ | ------------------------------- | ------------------- |
| M0   | Yes, initially           | No (for this app profile)       | High                |
| M2   | Likely yes               | Only short-term with caution    | Medium-High         |
| M5   | Yes                      | Yes (best low-cost option here) | Medium              |

## Final verdict

- For your current and near-future scale, **`M5` (or closest equivalent shared/flex paid tier) is the best balance of cost vs reliability**.
- **Avoid `M0` for production** in this project.
- If you want maximum savings with controlled risk, do a staged `M10 -> M5` move with monitoring and a rollback plan.
