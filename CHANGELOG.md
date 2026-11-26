# Changelog

## Unreleased — Phase 4A durable queue staging

- Added explicit persistent publishing intents, scoped stage/pause RPCs, calendar revision invalidation and job history.
- No external dispatch, account selection or new dependencies; live database testing pending.

## Unreleased — Phase 3A manual post composer

- Added four-platform manual composer with atomic variant saving, uploaded asset validation, illustrative previews, and editorial queue integration.
- Added scoped asset foreign key, permission checks, batch retry protection and narrow reviewer media read access.
- Added structural SQL verification and eight pure composer tests. No dependency or environment changes. Live testing pending.

## Unreleased — Phase 2A Meta account authorization

- Added Meta read-only OAuth discovery and encrypted client-scoped connection storage.
- Added Social Accounts UI, schema verification SQL and setup guide.
- Preserved dependency and environment files. No live OAuth or publishing verified.


## Unreleased — Phase 1A.2 client isolation

- Added explicit external client assignments, restrictive read policies and owner/admin grant/revoke RPC and UI.
- Removed external client access to workspace-wide brand profile; skip private client logo signing for that role.
- Remove 23 unused-import warnings reported by local lint; retain private-media image tags for separate review.
- Keep user-updated dependencies and environment unchanged; live database and build validation pending.

## Unreleased — Phase 1A.1 editorial security

- Separated draft creation and review permissions; added an authorized, draft-only review RPC.
- Removed manual publishing status updates; historical status-only records become unverified.
- Removed fabricated generation delays and video rendering progress; video previews are explicitly preview-only.
- Replaced obsolete credential-bearing verification script with a read-only UI smoke test.
- Live database and full build verification remain pending.

## Unreleased — Phase 1 foundation

- Added organization/workspace tenancy, scoped roles and permissions, onboarding, workspace switching, and workspace brand profiles.
- Added email confirmation callback, password reset, optional Google sign-in, and workspace invitations.
- Added a migration that backfills the existing shared agency data into a default organization/workspace and adds workspace-scoped RLS.
- Updated local setup and deployment guidance for the new Supabase Auth and server-only invitation configuration.
- External AI, video, publishing, and social analytics integrations remain demo-only or unimplemented.

## Previous releases

- `173af10` — Replace sparkle icons with BrandSpire branding and logo.
- `943b2fe` — Add the shared Supabase backend, authentication, private storage, and Realtime foundation.

## Phase 3B
- Add persistent bulk calendar plans for up to 100 approved manual variants per operation, same-minute and staggered times, per-item overrides, Reel/Short intent, revision-safe rescheduling and cancellation.
- Add scheduling-specific permissions, scoped read RLS, atomic RPCs and validation tests. No real publishing in this phase.

## Phase 2B — Meta configuration compatibility
- Use META_LOGIN_CONFIG_ID in OAuth dialog, retain reported content grants and show missing grants.
- Safe numeric API error diagnostics; publishing remains disabled.
