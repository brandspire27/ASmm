# Phase 2C — Meta account discovery recovery

Local source update for the reported `meta=empty` callback. No migration, new dependency, paid service, or environment changes. Preserve current `.env.local`, dependency files, and all Phase 4A queue files. Back up the project; merge the patch into the existing project root.

## What changed

- Distinguishes empty Page list, incomplete Page rows, absent business grant, unavailable token diagnostics, missing matching granular targets, and unsuccessful explicit-target lookup.
- Uses the existing user token flow and `/me/accounts` first; if no candidates and `business_management` is granted, calls Meta's `debug_token` with the app token. Only if Meta reports a valid USER token for this app and the same numeric Page ID explicitly appears in both Page permission target lists, tries the direct Page endpoint using the original user token. Requires a returned matching ID, name and Page token. Maximum five target lookups in parallel; no business-wide enumeration, no guessed or manually entered Page IDs, no automatic saving. This is a conservative fallback for explicitly granted Pages, not a guarantee of business portfolio discovery. If target lists are absent or incomplete, fallback is skipped.
- Logs only counts, known permission names and fixed status codes under `Meta discovery summary`; no raw Graph payloads, tokens, IDs or OAuth codes in new diagnostics. Next.js itself may log callback query strings: do not share those lines without redaction.
- Keeps safe status on the Social Accounts URL until a new action starts, so reloads preserve troubleshooting feedback. Existing encrypted selection and client authorization remain unchanged. Publishing remains disabled.

## Verify

Run `npm audit`, `node --test verification/test_composer.cjs verification/test_calendar.cjs verification/test_publishing_queue.cjs verification/test_meta_oauth.cjs verification/test_meta_discovery.cjs`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, then `npm run dev`. Expected 39 unit tests; existing image warnings may remain. No SQL migration.

Open http://localhost:3000/social-accounts, select the client, Connect with Meta, select the authorized Page, and save only intended connections. If empty, copy only the `Meta discovery summary` line and the visible message. Check the Meta Business Settings People, Pages and Instagram accounts; the same Facebook login must have required access to the Page and its linked business portfolio. An Instagram professional account must be linked to the Facebook Page for this existing legacy Facebook Login flow. App role alone is not Page access. No credentials should be sent in chat. If no Page exists, create a test Page or use an existing Page with authorization. Do not publish the app or activate ads merely for this test.

## Verification and limits

39 pure unit tests passed in the reconstructed source using installed TypeScript; strict standalone helper type check and syntax transpilation of 4 source files passed. Full project lint/build, provider endpoint behavior, account access, actual OAuth, and database/browser integration are not tested in this environment. Direct lookup only works when Meta returns both target lists and grants a Page token. No API writes or real posts. No scheduler changes. Legacy Instagram Facebook Login is still the existing integration path; Unified Login is future work.

Official references: https://developers.facebook.com/docs/graph-api/reference/user/accounts/ ; https://developers.facebook.com/docs/graph-api/reference/debug_token/ ; https://developers.facebook.com/docs/graph-api/reference/page/ ; https://developers.facebook.com/docs/graph-api/changelog/non-versioned-changes/nvc-2023
