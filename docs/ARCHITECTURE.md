# Architecture and Phase 1 boundaries

## Current deployment

The application keeps the existing stack: Next.js 16 App Router and React 19, deployed as a Node-compatible Next.js application, with Supabase Auth, Postgres, private Storage, and Realtime. The browser uses the Supabase publishable key and cookie-backed Supabase SSR session. The only server route requiring elevated privileges is the workspace invitation endpoint; it reads `SUPABASE_SERVICE_ROLE_KEY` from the server environment and never returns it to the browser.

The current UI performs authenticated data reads and writes directly through Supabase. Row-level security is the authoritative tenant boundary; client-side route guards and hidden controls are usability measures, not authorization. The callback route exchanges/validates Supabase Auth links, accepts matching email invitations, and redirects only to a same-origin path.

## Entity relationships

```text
auth.users
  ├── user_profiles
  ├── organization_memberships ── organizations
  └── workspace_memberships ───── workspaces ── organizations
                                      ├── brand_profiles
                                      ├── workspace_settings
                                      ├── clients
                                      ├── brand_assets ── clients
                                      ├── generated_content ── clients
                                      ├── campaign_analytics ─ clients
                                      └── workspace_invitations

roles ── role_permissions ── permissions
```

Every workspace-owned application record is associated with a `workspace_id`. Related asset, content, and analytics rows have composite foreign keys to a client in the same workspace. Organizations own workspaces; a user must have active organization and workspace memberships for workspace access. Invited users receive an organization-level `org_member` membership and the selected workspace role only after accepting the invitation with the invited email.

## Authentication and authorization

- Email confirmation, password recovery, and OAuth return through `/auth/callback`.
- New users create an organization and an initial workspace through authenticated database functions.
- The server invitation route verifies the signed-in user and `workspace.manage_members` permission before using the service role to create a pending invitation and send Supabase Auth email.
- Invitation acceptance checks the authenticated account's confirmed email in the database; it does not trust an email address supplied by the browser.
- RLS policies and workspace permission functions enforce access on each database/storage request. The service role must remain server-only.
- Workspace roles currently cover owner, administrator, manager, creator, designer, approver, analyst, viewer, and client access. There is no separate role-management console yet; admins choose a role when inviting a new member.

## Current data and service boundaries

- Supabase Postgres stores organizations, memberships, profiles, workspace settings, client brands, generated drafts, assets metadata, and manually entered campaign data.
- Supabase Storage keeps uploaded media in the private `agency-assets` bucket. App-created object keys begin with the workspace UUID; downloads use short-lived signed URLs.
- Realtime subscriptions refresh the active workspace's data. Direct database queries remain protected by RLS.
- Generated text and video output are currently demo/template behavior. No production AI, social publisher, scheduler, webhook receiver, or platform analytics connector exists.

## Threat model and mitigations

| Risk | Current mitigation | Remaining work |
|---|---|---|
| Cross-workspace data access | Workspace IDs, composite client foreign keys, permission-aware Postgres RLS, and storage policies | Execute adversarial tests with separate users/workspaces after applying the migration |
| Privilege escalation | Server checks `workspace.manage_members`; invitation roles are allowlisted; accepted role is stored in the invitation row | Add role change/removal administration and audit logs |
| Service-role key exposure | Key is read only in a server route and documented as server-only | Configure hosting secrets and rotate any key accidentally exposed in the past |
| Invitation taken by another email | Acceptance compares the confirmed Auth user's email with pending invitation email | Add explicit expiration/revocation UX and invite audit history |
| Redirect abuse | Callback accepts only same-origin redirect destinations | Add automated callback regression tests |
| Private file leakage | Private bucket and signed URLs; workspace-based object paths and RLS | Verify legacy object access and cross-tenant storage denial on a staging project |
| Provider credential leakage | No external provider credentials are currently used by this foundation | Keep future provider calls server-side; add secret rotation and redaction |
| Repeated or expensive operations | Current app does not run background publishing or production AI | Add server-side rate limits, usage budgets, and idempotency before enabling provider actions |

## Failure handling and recovery

| Failure | Expected behavior |
|---|---|
| Supabase is unavailable or the network request fails | Surface the database/auth error; do not report a saved/published result or silently fall back to browser-only data. Retry only after the user can see the failure. |
| Migration fails or the new schema is only partially applied | Stop deployment, keep a database backup/snapshot, inspect which DDL/data steps completed, and repair on staging first. Do not blindly rerun manual SQL against production. |
| Email confirmation, password reset, or invitation delivery fails | Keep the user on an explicit error state. The invitation API attempts to mark a pending invitation revoked when Supabase Auth returns an invite error; confirm delivery configuration before retrying. |
| Invitation email was delivered but acceptance fails | Preserve the authenticated session and show a clear callback error; an administrator should verify the pending invitation and invited email before resending. |
| Asset upload succeeds but its metadata insert fails | Attempt to remove the uploaded object; if cleanup also fails, surface both errors so an administrator can reconcile the orphaned file. |
| A role does not have permission for a data operation | Let Postgres/Storage RLS deny the operation and show the error; do not elevate the request to service role as a fallback. |
| Future publisher times out after the provider may have accepted a post | Reconcile by idempotency key/provider status before retrying. Mark ambiguous operations for review rather than risking duplicate posts. |
| Future provider rate limit or permanent API error | Respect `Retry-After` when provided; use bounded retries for transient errors and a visible failed/dead-letter state for permanent or exhausted jobs. |

## Recommended future publisher and scheduler

This is a target design, not an implemented feature:

1. Persist an approved post and an idempotency key before enqueueing work.
2. Store scheduled work in a durable `scheduled_jobs`/outbox table with workspace, account, schedule time, attempt count, lease, and provider status.
3. A managed queue/worker claims due jobs with a database lease or `SKIP LOCKED`; it never relies on an in-memory Next.js timer.
4. The worker fetches provider secrets from server-side secret storage, validates account scopes and approval state, and submits the post with an idempotency key.
5. Retry bounded transient failures with exponential backoff and jitter; move permanent failures/exhausted attempts to a dead-letter state and alert workspace admins.
6. Verify provider webhooks, record provider response IDs and timestamps, reconcile ambiguous timeouts before retrying, and keep an audit trail.

Before enabling this design, choose a queue/runtime and social providers based on the verified API/approval and infrastructure comparisons.

## Recommended AI service boundary

Future AI calls should go through server-side provider adapters, not the browser. Each adapter should enforce workspace membership, provider-specific limits, a spend/token budget, timeouts, and structured input/output validation. Brand profile fields can supply approved grounding context, but prompts and provider responses should be treated as untrusted data. Persist provider/model, usage, latency, and error metadata without logging secrets or unnecessary personal data. Failover must be bounded and must not silently convert provider failures into success-shaped content.

## Phase 1 acceptance criteria

- A new account can confirm its email, create an organization/workspace, and reach the dashboard.
- A workspace admin can invite a member; only the invited, email-confirmed account can accept, and it receives only the selected workspace role.
- A user in workspace A cannot read or mutate workspace B's database rows or files, even by changing client-side IDs.
- Switching workspaces refreshes the UI from the selected workspace and does not display prior workspace data.
- Password recovery returns to a working password-update screen; disabled or unconfigured identity providers show explicit errors.
- Migrations can be applied to a staging project without losing existing shared-agency rows.

## Repository map

```text
src/app/                 Next.js routes and UI pages
src/app/api/             Server-only API routes
src/app/auth/            Auth callback route
src/components/          Reusable application shell and UI components
src/context/             Authenticated workspace state and Supabase data access
src/lib/supabase/        Browser/server clients and generated schema types
supabase/migrations/     Ordered Postgres schema and RLS migrations
docs/                    Architecture, API research, and infrastructure research
```

See [`README.md`](../README.md) for local setup and migration order, and [`PROJECT_STATUS.md`](../PROJECT_STATUS.md) for verification and deployment gates.
