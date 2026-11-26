# Phase 1A.1 — editorial integrity patch

This is a limited first repair, not a new application or completed Phase 1A. The existing database and authentication remain in place. No external provider is added.

## Upgrade existing installation

1. Keep the original project and a database backup/export. Confirm the Supabase project used by `.env.local`. Test on a disposable database first if possible. Do not overwrite `.env.local` or share credentials. Pause live application use during the schema/app transition.
2. In Supabase SQL Editor, run ONLY `supabase/migrations/20261126074000_phase1a_content_review_security.sql` if both previous migrations have already been applied. It is transactional; do not rerun it after success. Historical `published` rows are retained with status `unverified` and old video `rendered` flags become `preview_only`. A future real publisher needs a separate migration and verified receipt model. This patch cannot establish whether any historical post was separately published manually.
3. Run `verification/check_phase1a.sql`. All seven columns should be true. If a migration or check fails, stop; do not continue to deployment.
4. Start this updated source with your existing `.env.local` (PowerShell):

```powershell
npm install
npx tsc --noEmit
npm run lint
npm run build
npm run dev
```

5. Open http://localhost:3000. If another app occupies that port use the terminal's actual URL. Test the following before publishing the update to GitHub/Vercel.

## Acceptance checks (not yet executed against a live database)

- Owner/manager: generate a template draft; approve it; refresh and confirm approved. Repeat with rejection. Rejected drafts stay visible. No publishing button exists.
- Creator-only test user: create a draft; no approve/reject UI. Direct RPC attempts must return permission denied; direct status updates must be blocked. A draft INSERT with `approved` or `unverified` status must fail RLS. Test using the user's authenticated session, never the service key.
- Approver-only test user: approve or reject another user's draft; inserting a draft directly must fail RLS. Repeating review of the same ID must fail. An approved row cannot be changed via direct UPDATE.
- Separate test organization: cannot read or review another workspace's content even if given its IDs. Do not test on real client records. Test concurrent review requests; only one transition should succeed.
- Video: save a demo preview; the UI must not claim rendering succeeded; metadata should contain `preview_only`. No generated MP4 exists.
- If old manually marked published rows exist, they must be retained under Legacy unverified records, not counted as published.

Optional read-only UI test (requires a preconfigured test account with a workspace): install `playwright`, then `python -m playwright install chromium`. Set `ASMM_TEST_EMAIL`, `ASMM_TEST_PASSWORD`, and optionally `ASMM_TEST_URL` in your local environment. Run `python verification/verify_agency_workflow.py`. Clear the credential environment variables afterward. No screenshots or passwords are written by the script. If old hardcoded credentials were ever real, rotate them immediately and address their Git history separately.

## Limitations

No live DB, dependency installation, full build, or browser tests were available during patch creation. Only syntax checks were performed. Workspace-level isolation is retained, not newly certified; client-specific isolation within a shared workspace, audit events, stronger role tests and invitation rate limits are pending. Managers/owners may still both create and approve by design; strict four-eyes approval is not enforced. Draft editing and review reopening are not implemented. Direct browser updates to generated_content are intentionally disabled. No real social account connection, scheduling, AI, video rendering or publishing is added.
