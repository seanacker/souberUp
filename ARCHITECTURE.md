### Soberup — Architecture and MVP Specification

#### One‑line value proposition
Share your weekly phone usage with friends to build positive social pressure against excessive mobile use.

### 1) MVP scope
- **Platform**: Android only (minimum Android 12 / API 31)
- **Metric**: Weekly total usage (hours). No per‑app breakdown in MVP UI; collected capability kept for roadmap.
- **Sync**: Once per day from device to backend.
- **Sharing**: Invite-link based. Mutual friendships. Multi‑use, no expiration.
- **Auth**: Google OAuth (sign‑in with Google). App holds no passwords.
- **Identity**: Pseudonymous username only shared with others. Avoid storing emails; store OAuth subject ID for account linkage.
- **Notifications**: When a user meets their weekly target, notify all friends via FCM.
- **Retention**: Keep weekly aggregates for 6 months. Delete all user data upon account deletion.
- **Region**: EU data residency for all backend storage and services.
- **Ops**: Minimal logs only.

### 2) Non‑goals (MVP)
- Per‑app, per‑day, or per‑session analytics in UI.
- iOS support.
- Public profiles / discovery beyond invite links.
- Admin dashboards, complex analytics, or feature flags.

### 3) Key user stories (MVP)
- As a user, I can sign in with Google and set a weekly usage target (hours).
- As a user, I can create an invite link and form mutual friendships.
- As a user, I can view my total usage this week and my friends’ totals.
- As a user, when I meet my weekly target, my friends receive a push notification.

### 4) Android data collection
- **Primary source**: `UsageStatsManager` with user‑granted Usage Access permission.
  - Use `UsageStatsManager.queryAndAggregateUsageStats()` and/or `queryEvents()` to compute total foreground time per day, then aggregate to ISO week on device.
  - No AccessibilityService; avoids Play policy issues.
- **Scheduling**: Use `WorkManager` to compute and sync once per day (defer to charging/Wi‑Fi when possible to minimize battery impact).
- **Time boundaries**: Use device timezone to map days to ISO week (Monday 00:00 local). Send week key as `YYYY-Www` and include timezone.
- **Offline behavior**: Persist pending aggregates locally; upload on next successful run.

### 5) Privacy, security, compliance
- **Data minimization**: Store only what’s required for MVP: username (public), OAuth subject ID (internal), weekly aggregate hours, friendships, invite metadata, FCM tokens.
- **No sensitive PII**: Avoid storing email/photo unless later required and consented.
- **User consent**: Explicit onboarding explaining Usage Access permission and data sharing model.
- **Deletion**: Hard delete all user‑scoped data upon account deletion.
- **Logging**: Minimal, no PII; redact IDs in logs when possible.
- **Transport/security**: TLS everywhere; verify Google ID tokens server‑side; rotate FCM server keys.
- **Region**: Host all data/services in EU regions.

### 6) System architecture overview
- **Mobile (React Native)**
  - RN app with a small native Android module to access `UsageStatsManager`.
  - Local storage for pending aggregates and auth/session (e.g., MMKV/SecureStorage).
  - FCM client for push notifications.
- **Backend (FastAPI)**
  - Stateless HTTP API with JWT session (from verified Google ID token) or server session.
  - Background jobs (daily/weekly) for target evaluation and notifications.
  - Postgres for relational data; Redis optional for ephemeral jobs/queues.
  - FCM service for push notifications.

### 7) Data model (MVP)
- `users`
  - `id` (UUID), `google_sub` (string, unique, from ID token), `username` (string, unique), `created_at`, `deleted_at NULL`.
- `friendships`
  - `user_id`, `friend_user_id`, `created_at`; enforce mutual edge via application logic (insert reciprocal or use single undirected with constraint).
- `invites`
  - `code` (string, unique), `creator_user_id`, `created_at`, `use_count` (int), `is_disabled` (bool). Multi‑use, no expiration.
- `weekly_usage`
  - `user_id`, `week` (string `YYYY-Www`), `timezone`, `hours` (numeric), `synced_at`, unique `(user_id, week)`.
- `weekly_targets`
  - `user_id`, `week` (or `active_from_week`), `target_hours` (numeric).
- `push_tokens`
  - `user_id`, `fcm_token`, `platform`, `created_at`, `last_seen_at`.

Note: Consider a materialized view for “current week stats for friends” later if needed.

### 8) API design (FastAPI)
Base URL: `/api/v1`

- Auth
  - `POST /auth/google` — body `{ idToken }` → verifies with Google, issues app JWT, creates user on first sign‑in. Returns `{ token, user: { id, username } }`.
  - `POST /auth/logout` — revoke session (client deletes token).

- Users
  - `GET /me` — returns `{ id, username }`.
  - `PATCH /me` — update `{ username }` (unique, validated).
  - `DELETE /me` — delete account and all data.

- Invites & friendships
  - `POST /invites` — create or return existing invite code `{ code }`.
  - `POST /invites/{code}/accept` — creates mutual friendship between acceptor and creator.
  - `GET /friends` — list friends and their current week hours.
  - `DELETE /friends/{friendId}` — remove friendship (both directions).

- Usage & targets
  - `POST /usage/weekly` — upsert an aggregate `{ week, timezone, hours }` for the authenticated user.
  - `GET /usage/weekly?weeks=12` — fetch recent aggregates for the authenticated user.
  - `PUT /targets/weekly` — set active weekly target `{ targetHours }` (applies to current and future weeks unless changed).
  - `GET /targets/weekly` — get current target.

- Notifications
  - `POST /push/token` — register/update FCM token `{ token, platform }`.

Errors: JSON problem‑details style `{ code, message, details? }`. Auth via `Authorization: Bearer <token>`.

### 9) Background jobs
- **Daily sync validation**: Deduplicate and ensure one `weekly_usage` row per user/week (idempotent upsert).
- **Weekly target evaluation**: On week rollover (ISO week boundary per user timezone):
  - For each user with a target and a recorded `hours` for the last week, compute `achieved = hours <= target`.
  - If achieved, fetch friendships and send FCM notifications to friends: “<username> met their weekly target: <hours>/<target>h”.

Implementation options: APScheduler/Celery/Arq. For MVP, a simple cron‑like scheduler (e.g., APScheduler) is sufficient.

### 10) Mobile app components (RN)
- Auth screen (Google sign‑in), username set/update.
- Home: current week usage total and target status; friends list with their current week totals.
- Invites: show invite code, accept invite link deep‑link handler.
- Settings: weekly target, notifications toggle, account deletion.
- Native Android module for usage stats; WorkManager for daily background job.

### 11) Security details
- Verify Google ID tokens server‑side (audience match, signature via Google certs, expiry check).
- Issue short‑lived access tokens (e.g., 1 day) with refresh via re‑verification or refresh endpoint.
- Validate and rate‑limit write endpoints (`/usage/weekly`, `/push/token`).
- Principle of least privilege in infra; secrets in EU secret manager.

### 12) Observability and ops
- Minimal structured logs (request ID, route, status, latency). No PII.
- Basic health check `/healthz` and readiness `/readyz`.
- Error capture to stdout; optional Sentry later.

### 13) Deployment & environment
- **Infra**: Single EU region (e.g., EU‑West) with Postgres. Consider managed Postgres (e.g., Neon.eu, Supabase.eu, or Cloud SQL EU region).
- **Services**: FastAPI behind a managed load balancer or PaaS (e.g., Fly.io EU region, Render EU, Railway EU).
- **Notifications**: FCM server key stored as secret; device tokens stored per user.
- **Environments**: `dev`, `prod`. Feature flags not required for MVP.

### 14) Data retention & deletion
- Retain `weekly_usage` for 6 months. Older rows purged via scheduled job.
- Full data deletion on account deletion: remove `users`, `friendships`, `invites`, `weekly_usage`, `weekly_targets`, `push_tokens` for user.

### 15) Roadmap (post‑MVP)
- Per‑app totals and daily breakdown in UI; top apps and categories.
- Session detection and streaks/insights.
- Better social features (comments, reactions, weekly summaries to friends).
- Privacy controls (private mode, share to subsets, temporary sharing).
- Web dashboard; iOS support (Screen Time APIs where possible).
- Admin metrics and error alerting.

### 16) Open decisions
- Week rollover schedule for notifications: default ISO week boundary at Monday 00:00 in user timezone.
- Mutual friendship storage model: dual directed rows vs single undirected row with canonical ordering.
- Background job stack: APScheduler vs Celery; start with APScheduler for simplicity.


