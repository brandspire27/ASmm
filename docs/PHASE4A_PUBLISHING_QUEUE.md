# Phase 4A — durable queue preparation

Zero additional dependencies or paid services. Merge this patch into the verified Phase 3B project. Keep `.env.local`, package.json and lockfiles unchanged. Back up the intended Supabase database and run `supabase/migrations/20261126130000_phase4a_publishing_queue.sql` once in SQL Editor. If the table already exists, run `verification/check_phase4a.sql` first; if any result fails, inspect the installed schema instead of dropping or rerunning blindly. Structural checks are not end-to-end security tests.

Run `npm audit`, `node --test verification/test_composer.cjs verification/test_calendar.cjs verification/test_publishing_queue.cjs`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `npm run dev`.

## Acceptance tests in the local app

1. Select a focus client. Create and approve test variants, then plan them for a future time in Calendar.
2. Open `/publishing-queue`. Stage selected plans (up to 100) and confirm the Held count. Reload; the records must persist. Reopening the page must not stage anything automatically. Repeated identical stage calls must not create duplicates.
3. Pause and return to held. No network posting occurs in either state. Reschedule one plan in Calendar; refresh the queue: the old job must be Superseded and the new revision must be available to stage. Cancel another plan: its old job must be Cancelled.
4. Try 100 approved variants for the same minute and 100 staggered variants (use a test client and future dates); validate the full batch and database counts. A stale item must reject the entire batch. No external account or token is required.
5. In a separate authorized test session, confirm unauthorized roles cannot call stage/pause RPCs; test cross-workspace and cross-client access. Use dedicated test accounts and data. Do not expose secrets.

## Scope and limitations

Jobs are durable *intents*, bound to an immutable approved content variant and calendar revision. One active intent per content, one historical record per revision. No account destination selection yet; never auto-select a social account. No scheduler, retry attempts, remote receipts, platform quota enforcement, dispatch or concurrency workers yet. All jobs are non-executable; existing plans remain untouched until explicitly staged. Pause is per-job staging control, not an emergency stop for a running worker. Later migration must introduce account binding, explicit publishing authorization, atomic claims/leases, retries, attempt records, per-account concurrency, emergency pause, remote verification, and safe handling of cancellation during in-flight requests. Do not deploy a worker against this staging-only schema.

Past held jobs do not publish; reschedule before activation. Current UI loads scoped plans/job history in pages of 500; server validates the 100-item batch cap. Free-tier capacity and real publishing throughput remain unverified.
