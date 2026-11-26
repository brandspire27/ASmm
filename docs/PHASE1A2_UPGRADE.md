# Phase 1A.2 — external client isolation

Apply on top of the completed Phase 1A.1 installation. This patch intentionally does not include package.json, lockfiles, environment files, or node_modules; retain the locally audited Next.js 16.4.6 upgrade. Back up your project and Supabase database; use a test project first where possible. Pause live use during the migration and frontend transition.

1. Extract the patch and copy its `src`, `supabase`, `verification` and `docs` folders into your existing project (merge folders, replace only included files). Copy the two included status documents if desired. Keep your current dependency files.
2. In the intended Supabase SQL Editor, run only `supabase/migrations/20261126090000_phase1a2_client_scope.sql` once. Prior Phase 1A.1 migration must already be applied. Existing client-role accounts will immediately lose access to client-specific records until explicitly assigned. No existing client/content/analytics records are deleted.
3. Run `verification/check_phase1a2.sql`. All ten columns must be true. Metadata checks are not an authorization integration test.
4. Run `npm audit`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm run dev`.
5. Sign in as the workspace owner/admin. In Workspaces > Client access assignments, select a client record, enter the email of an active confirmed member with the `client` role, and select Grant access or Revoke access. Invitations must be accepted first. Internal staff continue to have their existing workspace-scoped permissions.

## Acceptance test (use dummy clients and separate test accounts)

- Owner: create Client A and Client B, each with a draft and an analytics record. Owner still sees both.
- Invite a separate confirmed test user with the Client role. Sign in separately: before assignment, the test user sees neither client nor their content/analytics, nor the workspace-wide brand profile.
- Grant only A to that user from the owner account. Refresh the client account: A's client record, content and analytics appear; B remains absent. Private asset access remains unavailable to the client role by design; a private logo is omitted rather than causing a failed workspace load.
- Using the test user's authenticated browser Supabase session (not the service-role key), query `clients`, `generated_content`, `campaign_analytics` filtered by B's ID, and try `set_client_access` with B. The queries must return no B rows, and the RPC must deny access. An owner of a different workspace must also be unable to grant B in this workspace.
- Revoke A; refresh the client account and repeat the direct queries: neither client should be accessible. Changing or suspending a workspace membership invalidates assignments. Existing data already downloaded or cached by a user cannot be recalled.
- Re-run the Phase 1A.1 creator/approver tests. Confirm owner/manager workflows, client selection, templates and private media continue working.

## Scope and limitations

This is a targeted client-role database isolation patch, not a complete multi-tenant security certification. Internal staff are intentionally workspace-wide; per-staff client assignments, invitation rate limits, broader storage policy hardening, access audit history, and real external integrations are not included. Private media is not enabled for client accounts. Revocation takes effect on fresh database reads; existing browser state and previously issued signed URLs are not immediately revoked, so reload the client session for the acceptance tests. Seven existing `<img>` performance warnings are left intentionally; switching private signed media to Next image optimization needs a separate cost/security review. No production database, live OAuth, full build or multi-user testing was executed in the patch creation environment.
