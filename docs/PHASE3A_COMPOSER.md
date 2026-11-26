# Phase 3A — Manual post composer

Requires the installed Phase 1A.1, 1A.2 and 2A migrations. Meta credentials are not required. No new dependencies or environment variables. Keep your locally updated Next.js 16.4.6 and lockfile.

## Upgrade
1. Back up your project and database. Merge the patch at the project root, replacing only included files. Stop any running development server first.
2. In the correct Supabase project's SQL Editor, run `supabase/migrations/20261126110000_phase3a_post_composer.sql` once. It is transactional. If it errors, do not run a second migration or deploy blindly; inspect the error.
3. Run `verification/check_phase3a.sql`. Expect ten true columns. These are schema/privilege checks, not proof of full RLS isolation.
4. In PowerShell at project root: `npm audit`, `node --test verification/test_composer.cjs`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm run dev`.

## Acceptance checks
- Select a Focus Client. Open Create Post as owner, admin, social media manager or content creator.
- Save a Facebook text draft. Confirm it is listed under Saved manual posts and in Approvals after reload. It must not be published or scheduled.
- Upload an owned JPEG/PNG/WebP or MP4 in Brand Assets as a role with upload access. Select Instagram image and Facebook image or YouTube video, customize each variant and save them together. Confirm distinct variants in Approvals. YouTube title and description are independent. Check preview uses the selected asset.
- Try an empty title/caption, missing required media, over-limit text, text with an attachment, or inappropriate file type. Confirm rejection. Retry the same failed/uncertain submission without changing inputs; the batch ID prevents duplicate inserts while the original batch remains intact. Reloading/leaving the page loses the unsaved form and its retry ID; inspect Approvals before retrying after navigation.
- Approve/reject a draft as an authorized reviewer. A content creator must not be able to review, and a client-role user must not be able to save drafts. A reviewer should see only the media referenced by visible manual posts if they lack broad asset read access. Test across separate users and workspaces. Check that a foreign client asset is rejected by the RPC, and a direct browser insert with type manual_post is denied.
- Verify existing AI demo drafts, video preview, clients, assets and Social Accounts still work.

## Design choices and limits
- Reuse generated_content and the existing editorial approval workflow instead of adding a competing posts table. Each selected platform is one immutable editorial snapshot. Copy as new draft for revisions; saved records cannot be edited in place. Prior drafts remain in history. A referenced asset cannot be deleted from brand_assets until the associated manual drafts are removed by an authorized manager. The existing file-storage layer is not an immutable media versioning system; final publishing must revalidate file existence and specifications. Preview errors are shown as unavailable media; reload when signed URLs expire.
- Single image/video per variant, existing private uploaded asset selection (no third-party media URLs, no carousel or direct uploader in composer). Browser selection filters extensions; database additionally checks the stored MIME metadata, same-client ownership and workspace path. Actual content inspection, video codecs, duration, dimensions, platform account and publish eligibility must be verified later. The 50 MB existing bucket limit remains. Legacy paths outside the workspace folder are not eligible for new composer drafts.
- Conservative composer caps, not claims of exact current platform limits: title 100 Unicode code points; caption 5000 Facebook/YouTube, 2000 Instagram, 1500 Google Business. Caption/description required even for media posts in this first version.
- No OAuth calls, API keys, background jobs, native scheduling, live publishing, or publishing receipts. The preview is illustrative, not a reproduction of the platform. Existing read-only Meta integration remains unchanged. Actual Meta verification is pending.
- The patch does not change dependencies, environment, hosting, or existing storage limits. Target extra cost is zero within existing free quotas. Full TypeScript/lint/build, database migration, live separate-user tests and browser tests must be run in the user's environment. Local syntax and pure composer tests are separate from live verification.
