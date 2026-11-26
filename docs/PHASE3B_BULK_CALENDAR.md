# Phase 3B — Bulk content calendar (planning only)

## Install
Back up the existing local project and Supabase database. Merge this patch into the Phase 3A project. Do not replace `.env.local`, package.json, lockfile or node_modules. Apply `supabase/migrations/20261126120000_phase3b_bulk_calendar.sql` once in the correct Supabase SQL Editor, after Phase 3A. Run `verification/check_phase3b.sql`: all 12 columns should be true. This is a structural permission check, not a live role test.

PowerShell, project root:

```powershell
npm audit
node --test verification/test_composer.cjs verification/test_calendar.cjs
npx tsc --noEmit
npm run lint
npm run build
npm run dev
```

Open http://localhost:3000/calendar and choose a Focus Client. Owner/admin/social media manager can plan approved manual drafts only. Create drafts in Create Post and approve them in Approvals. One platform variant counts as one item. Select up to 100 per batch for a single client. Repeat batches for more clients or items. Use Same time for all, Stagger times (0–10080 minutes), or individual time fields. Instagram MP4 drafts are planned as Reels; Facebook MP4 can be planned as video or Reel; YouTube MP4 as video or Short. This does not validate duration, aspect ratio or other remote media constraints. Time input uses the current device timezone (shown explicitly) and persists UTC with IANA zone. DST gaps/folds are rejected by the UI for ordinary modern transitions. Monthly calendar shows counts and a day/month list, in device timezone. Select existing plans to reschedule or cancel. Past plans are never sent. Save batches are atomic, scope checked, revision guarded, and replay of identical saves does not create duplicate rows. A cancelled plan can be explicitly re-planned.

## Acceptance tests
- Schedule two approved drafts at the same future minute; reload and verify both.
- Schedule approved photo and video drafts at different times, including a Reel delivery intent; inspect month/day calendar.
- With 100 approved variants for one client, select 100, apply same time and save; reload, then reschedule at staggered intervals. The batch is atomic. Try selecting 101; UI limits selection to 100. Repeat in another batch if needed.
- Cancel selected plans; check they no longer appear as planned. Re-plan explicitly.
- Attempt past times and invalid date inputs. Try a stale edit from two tabs; refresh after conflict.
- With separate test users, verify creator/approver/client cannot mutate plans or other clients' data. Verify direct INSERT/UPDATE/DELETE blocked; test RPC with foreign client, unapproved draft, duplicate IDs and 101 items. Use test records, not production data.

## Limitations and next phase
No actual scheduled delivery, cron, connected-account selection, publish API or network media upload occurs in this phase. Plans must be explicitly authorized for the next publishing engine; do not automatically dispatch past or existing plans. No additional paid dependency. Platform quotas, parallel publishing limits, remote media formats, approvals, native scheduling, time tolerance, account permissions, retries, job leases and idempotent remote reconciliation must be implemented and tested before live publishing. Actual 100-item database batch and throughput have not been tested. Existing AppStateContext draft fetch limit may restrict how many drafts are visible in large workspaces; pagination of the source drafts is a future improvement. No bulk creation/import of 100 drafts in this phase; they must already exist. Current device timezone is the only editable-time zone in this phase. Schedule plan rows are retained after cancellation and restrict deletion of referenced drafts; deletion policy will be revisited with actual publishing receipts. No changes to existing credentials or hosting.
