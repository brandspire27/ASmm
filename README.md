# AgencyOS Lite

AgencyOS Lite is a Next.js workspace for managing agency clients, brand assets, content drafts, approvals, and campaign metrics.

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

Set the Supabase environment variables in `.env.local` before signing in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

The public publishable key is intended for browser use. Never put a Supabase `service_role` or secret key in a `NEXT_PUBLIC_` variable or in this repository.

## Configure the shared Supabase workspace

1. Create a Supabase project and copy its project URL and publishable key into `.env.local`.
2. In the Supabase SQL Editor, run [`supabase/migrations/20261125162000_initial_workspace.sql`](./supabase/migrations/20261125162000_initial_workspace.sql). This creates the shared workspace tables, row-level security rules, private `agency-assets` storage bucket, and Realtime publication.
3. Keep public sign-ups disabled. Create or invite each staff account under **Authentication → Users**.
4. Add each invited user to the agency allowlist in the SQL Editor. Replace the email with the exact account email:

   ```sql
   insert into public.agency_members (user_id, email)
   select id, email
   from auth.users
   where email = 'staff@your-agency.com'
   on conflict (user_id) do update set email = excluded.email;
   ```

   Only allowlisted accounts can read or change the shared agency data and private files. All allowlisted staff share the same workspace; client records are not separated by user.
5. To deploy on Vercel, add the same two environment variables under the project settings, then redeploy.

Client profiles, assets, content drafts, campaign records, and provider settings are stored in Supabase, not browser local storage. Previously cached demo data is not automatically imported.

## Current integration limits

The Supabase authentication, shared database, file storage, and database change subscriptions are real once configured. AI text/image generation, video rendering, social publishing, and social-platform analytics are not connected to external providers yet; those screens must not be treated as live integrations.
