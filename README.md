# BrandSpire Social AI

BrandSpire Social AI is a Next.js application for managing agency workspaces, client brands, assets, content drafts, approvals, and manually entered campaign metrics. It uses Supabase for authentication, Postgres, private file storage, and Realtime updates.

## Local setup

1. Install dependencies and create your environment file:

   ```bash
   npm install
   cp .env.example .env.local
   ```

   On Windows PowerShell, use `Copy-Item .env.example .env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`.
3. Apply the migrations in order from **Supabase → SQL Editor**:
   - [`supabase/migrations/20261125162000_initial_workspace.sql`](./supabase/migrations/20261125162000_initial_workspace.sql)
   - [`supabase/migrations/20261125180000_phase1_organization_workspace_foundation.sql`](./supabase/migrations/20261125180000_phase1_organization_workspace_foundation.sql)
   - [`supabase/migrations/20261126074000_phase1a_content_review_security.sql`](./supabase/migrations/20261126074000_phase1a_content_review_security.sql)
4. Configure Supabase Auth:
   - Set the site URL to your local or production app URL.
   - Add `http://localhost:3000/auth/callback` and your production `/auth/callback` URL to the allowed redirect URLs.
   - Enable email sign-ups and configure email confirmation if you want users to create accounts themselves.
   - Google sign-in is optional; enable the Google provider and add its credentials in Supabase before using the Google button.
5. To send workspace invitations, set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` and in the server-side Vercel environment variables. This key is only used by the invitation API route. Never prefix it with `NEXT_PUBLIC_`, expose it in browser code, or commit it.
6. Start the app:

   ```bash
   npm run dev
   ```

New users can create an account, confirm their email, and create an organization and first workspace. Existing agency members and data are migrated into the default workspace by the Phase 1 migration. Workspace administrators can invite team members with workspace-scoped roles.

## Deploying

Deploy the Next.js app to Vercel or another Node-compatible Next.js host. Configure the public Supabase URL/key and the server-only service role key (if using invitations) in the host's environment settings, then redeploy. Configure the production callback URL in Supabase Auth before testing email, password reset, invitations, or Google OAuth.

## Current integration limits

Supabase authentication, workspace membership, role-based database access, storage, and Realtime are implemented in the app. The configured Supabase project has been tested through the local app for organization/workspace creation and brand-profile save/reload. Separate-user RLS isolation, file upload/download, Realtime, and the production Vercel deployment still need verification.

AI text/image generation, video rendering, social publishing, and social-platform analytics are not connected to external providers yet. Generated content and video previews are demo/template output; campaign metrics are manually entered. See [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) for what is implemented and what remains.

Research and design references: [`docs/FEASIBILITY.md`](./docs/FEASIBILITY.md), [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md), [`docs/PLATFORM_API_MATRIX.md`](./docs/PLATFORM_API_MATRIX.md), and [`docs/INFRASTRUCTURE_COMPARISON.md`](./docs/INFRASTRUCTURE_COMPARISON.md).

## Phase 1A.1 update

Existing installations must apply **only** the new content review migration before running the updated application. See [upgrade and verification instructions](./docs/PHASE1A_UPGRADE.md).
