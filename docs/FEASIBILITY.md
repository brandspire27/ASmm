# Feasibility assessment

## Verdict

A secure multi-tenant workspace foundation is feasible with the current Next.js + Supabase + Vercel stack. Phase 1 implements the identity, organization/workspace, role, brand-profile, storage, and invitation foundations without migrating the deployed application to a new stack.

The broader product—production AI generation, scheduled social publishing, and cross-platform analytics—is conditionally feasible, not guaranteed by this foundation. Platform API access, app review, account eligibility, provider quotas, and product-specific approvals must be validated before promising automatic publishing or analytics. Some APIs may permit only limited account types or media/actions, and provider access can change over time.

## Decisions and constraints

- Keep Next.js and Supabase, as selected by the user; retain Vercel as the current deployment target.
- Use Postgres RLS as the tenant security boundary and private Supabase Storage for workspace files.
- Keep provider secrets and service-role operations on the server.
- Do not move scheduled work into a Next.js request or process timer; use a durable queue/worker if scheduling is added.
- Treat provider integrations as separate, approval-gated phases rather than assuming a single API can serve every platform.

## What Phase 1 enables

- Multiple organizations and workspaces, with workspace-specific roles and data.
- Email signup/confirmation, password recovery, optional Google OAuth, and email invitations.
- Workspace-isolated client data, brand profiles, content drafts, campaign records, and uploaded files.
- A deployment path that keeps the current application stack and Supabase project.

Phase 1 does not connect AI providers, social networks, publishing, background scheduling, or platform analytics.

## Key risks and feasibility gates

| Gate | Why it matters | Exit condition |
|---|---|---|
| Database migration | New app reads and writes require the new schema and policies | Apply the ordered migrations in a staging Supabase project; inspect row counts and validate RLS |
| Tenant isolation | A mistaken policy could expose one workspace to another | Test with separate org/workspace users, including direct API and Storage requests |
| Auth delivery | Confirmations, password resets, and invites depend on email delivery and redirect configuration | Validate all email links on local and production callback URLs |
| Platform access | Publishing/analytics APIs have distinct product rules, permissions, and review processes | Complete an official-source matrix and a provider proof of concept for each target capability |
| Operating cost | Database, storage, egress, workers, AI calls, and provider plans have separate limits | Model expected active users, media volume, publishing frequency, and AI usage against current official pricing |
| Background reliability | Scheduled posts must survive deploys, restarts, and upstream timeouts | Select a durable queue/worker, add idempotency, bounded retries, and operator-visible failure states |

## Suggested delivery phases

1. **Foundation:** run migrations and test auth, onboarding, role enforcement, workspaces, uploads, and Realtime in staging.
2. **Brand workflow:** finish brand-profile onboarding, team administration, approvals, and audit history.
3. **AI-assisted drafts:** add one server-side provider adapter with usage budgets and no automatic publishing.
4. **Single-platform publishing:** select one API based on official access requirements; implement account linking, permissions, scheduling, retries, and reconciliation.
5. **Additional platforms and analytics:** add one provider at a time after review and acceptance tests.

## Deployment status

The code can build, but Phase 1 is not live-ready until the migration is applied and the Supabase Auth/email and hosting settings are configured. No project credentials were available to perform that live validation. See [`PROJECT_STATUS.md`](../PROJECT_STATUS.md) and [`README.md`](../README.md).

For source-backed access and pricing constraints, see the [platform API matrix](./PLATFORM_API_MATRIX.md) and [infrastructure comparison](./INFRASTRUCTURE_COMPARISON.md).
