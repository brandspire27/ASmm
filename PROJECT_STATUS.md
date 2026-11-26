# Project status

## Phase 3A — Manual composer (local verification pending)

User reported Phase 2A setup complete except Meta keys/verification. Added manual four-platform draft composer, batch RPC and scoped media references, preview and existing approval integration. No new dependencies or API keys. Meta publishing remains blocked pending authorization. Saved snapshots are immutable; scheduling and real publishing are not implemented. See `docs/PHASE3A_COMPOSER.md`.

## Phase 2A — Meta read authorization pilot (local verification pending)

User reported Phase 1A.2 complete. Added server-only OAuth state and encrypted social account storage, official Meta Page/linked Instagram discovery, explicit account selection, local disconnect and owner/admin-only API/UI. No live Meta calls, database migration, full build or production deployment verified here. Publishing, scheduling, token health/revocation monitoring and advanced access remain pending. See `docs/PHASE2A_META_SETUP.md`.


## Phase 1A.2 patch (local verification pending)

External `client` role now requires explicit per-client grants for database reads. Workspace owner/admin assignment UI and restrictive RLS policies added; staff permissions preserved. The user reported Phase 1A.1 local verification complete and Next.js 16.4.6 audit/build passed. This patch preserves local dependency files. See `docs/PHASE1A2_UPGRADE.md` for installation, acceptance checks and scope limits.

## Phase 1A.1 patch (not deployed)

This source package adds the editorial-security migration and UI corrections. TypeScript syntax transpilation succeeded for changed TS/TSX files; dependency installation is blocked by unavailable npm registry access in the audit environment, so full type-check, lint, build and live Supabase verification remain pending. Prior validation below refers to the original Phase 1 release, not this patch. Client-level isolation within a workspace, broader security tests, real AI, OAuth social integrations, scheduling and publishing remain future work. Apply the new migration before running the updated app; see `docs/PHASE1A_UPGRADE.md`.

## Current release

Phase 1 foundation is implemented and pushed to `main` in commit `078abd6`. The configured Supabase project was reached through the local app: organization/workspace setup succeeded, and brand-profile data remained after save and reload. Vercel production deployment and the remaining integration checks are not yet verified.

The Phase 1 migration has been applied successfully to the Supabase project configured for the local app. Confirm that this is the intended production project before relying on the production deployment.

## Implemented in code

- Supabase email/password authentication, email confirmation callback, password reset, and optional Google OAuth flow.
- Organizations, workspaces, membership roles, onboarding, workspace switching, and workspace-scoped brand profiles.
- Server-side workspace invitations with role validation and an authenticated invitation acceptance flow.
- Workspace-scoped reads and writes for client records, content, assets, analytics, and provider preferences.
- Private file storage and database-enforced workspace access policies.
- Responsive navigation and Supabase Realtime subscriptions.

## Not yet verified

- Separate-user/organization RLS isolation, file upload/download, and Realtime have not been tested end to end.
- Signup confirmation, password recovery, and Google OAuth have not been independently tested from their email/provider links.
- Team invitations were not tested; they require `SUPABASE_SERVICE_ROLE_KEY`, which was intentionally omitted because invitations are not needed.
- The Vercel production deployment and its Auth redirect allowlist have not been verified.

## Not implemented as production integrations

- AI text/image generation uses template/demo output; no provider API is connected.
- Video rendering is a preview; no render provider is connected.
- Social publishing, scheduled posting, inbound webhooks, and platform analytics are not implemented.
- Campaign metrics are manually entered. The application does not currently have a background scheduler or job queue.

## Validation completed

- `npx tsc --noEmit` passed.
- Targeted ESLint on changed authentication/workspace files passed.
- `npm run build` passed, including the callback and invitation routes.
- `npm run lint` passed with 0 errors and 30 warnings in existing application files (unused imports and `<img>` optimization warnings).
- Browser verification against the locally configured Supabase project showed the active workspace, loaded brand profile, and preserved edited profile values after a page reload.
- Docker was installed but its local engine was not running, so the migration was not separately exercised against local Postgres.

## Next steps

1. Verify the Vercel deployment for commit `078abd6` and test the deployed domain's login/callback URLs.
2. Test tenant isolation with a second account and verify file upload/download and Realtime.
3. Configure `SUPABASE_SERVICE_ROLE_KEY` only if workspace invitations are needed.
4. Plan external social/AI integrations only after platform API access, approvals, pricing, and data-processing requirements are confirmed.

See [`docs/FEASIBILITY.md`](./docs/FEASIBILITY.md), [`docs/PLATFORM_API_MATRIX.md`](./docs/PLATFORM_API_MATRIX.md), [`docs/INFRASTRUCTURE_COMPARISON.md`](./docs/INFRASTRUCTURE_COMPARISON.md), and [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the architecture and research snapshot.

## Phase 3B — Bulk calendar
- Patch prepared: monthly/day-list calendar, approved manual post planning, 1–100 variants per client per atomic RPC, same time, staggered times, individual overrides, cancellation/rescheduling, explicit delivery intent, UTC timestamps, RLS and distinct scheduling permission.
- 8 calendar helper unit tests passed, strict standalone TypeScript and 4 source syntax checks passed. Live SQL, full build, role tests, browser tests and actual 100-row batch pending user verification.
- No publisher or cron yet. Meta authorization still pending. Preserve existing plans as non-executable until user explicitly activates eligible jobs in a later phase.
- No new dependencies; preserve local Next.js security upgrade and lockfile.

## Phase 4A — Durable publishing queue (staging only)
- User reported Phase 3B database checks 12/12 and application testing complete. Meta credentials still pending.
- Added explicit, scoped staging RPC (1–100 plans), persistent held intents and per-job pause, revision deduplication, calendar invalidation, history UI and structural checks. No dispatch, account binding, worker, retries or actual publishing yet.
- Preserve Next.js 16.4.6 and local environment; no new dependencies. Live SQL, authorization, full app build and real 100-record database batch pending.

## Phase 2B connection compatibility update
Added user-token configuration ID OAuth URL and retained actual granted content scopes. UI distinguishes user grants from verified account-level capability; publishing stays disabled. No database/dependency change; Phase 4A queue unchanged. Live Meta test pending. See docs/PHASE2B_META_CONFIGURATION.md.
