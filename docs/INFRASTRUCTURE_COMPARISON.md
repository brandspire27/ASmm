# Infrastructure and free-tier comparison

The figures below are a snapshot of official pricing and limit pages accessed during this work. They are not a cost estimate for this application's traffic and may change; verify the live pricing pages before purchase or production launch.

## Comparison

| Service | Free/entry tier observed | Relevant limits and caveats | Fit for this project |
|---|---|---|---|
| Supabase | Free: $0; 50,000 MAU, 500 MB database, 1 GB file storage, 5 GB egress and 5 GB cached egress. Pro starts at $25/month and includes $10/month compute credits. | Free projects pause after one week of inactivity and the plan allows two active projects. Pro includes 100 GB file storage and 250 GB egress in the current pricing snapshot; compute/extra usage is billed separately. | Best fit for the selected stack: Auth, Postgres, RLS, Storage, and Realtime are already integrated. Free is suitable for a staging/demo, not a dependable always-on agency production backend; budget for Pro before relying on it. |
| Vercel | Hobby: $0; current plan page lists 100 GB fast data transfer, 1 million function invocations, and 4 CPU-hours per month. Pro is listed at $20/month. | Hobby terms restrict use to personal or non-commercial use; a commercial agency service should not rely on Hobby. Vercel Functions are request/compute infrastructure, not a persistent database or durable media store. | Keep hosting the Next.js app on Vercel, but use a paid/commercial-eligible plan for real agency use. Supabase remains the backend and durable storage. |
| Cloudflare Workers + D1 + R2 | Workers Free: 100,000 requests/day and 10 ms CPU per invocation. D1 Free: 5 million rows read/day, 100,000 rows written/day, 5 GB total storage. R2 Free: 10 GB-month Standard storage, 1 million Class A and 10 million Class B operations/month, free egress. | Workers Paid starts at $5/month; D1 and R2 have separate quotas and usage metrics. This is a composable stack, not a drop-in replacement for the existing Supabase project; it requires migration and reimplementation of Auth, relational permissions, storage policy, and Realtime behavior. | Attractive for an explicitly planned migration or high media egress, but not the lowest-risk choice for this project after the user chose Supabase. |
| Firebase | Spark is no-cost without a payment method for many Firebase services. The current pricing page lists Firestore free allowances including 1 GiB stored, 10 GiB/month network egress, 20K writes/day, 50K reads/day, and 20K deletes/day; Authentication has 50K MAU for supported non-phone flows. | Product-specific restrictions differ; Cloud Functions require Blaze, phone Auth is billed by SMS, and Cloud Storage availability/quotas depend on bucket type/region and billing plan. Firebase projects are Google Cloud projects and billing attaches at project level. | Viable for a new Firebase-oriented product, but a migration would replace Postgres/RLS and require data-model/auth/storage changes. Do not migrate merely to chase free quotas. |

## Recommendation for the current deployment

1. Retain the current Next.js + Supabase architecture.
2. Use a Supabase staging/free project for development and migration validation, not as the only always-on production dependency.
3. Use a commercial-eligible Vercel plan for an agency production service and Supabase Pro (or a separately evaluated paid backend) for always-on data/auth/storage.
4. Budget for file storage and egress separately. Social video uploads and signed-media downloads can exceed free allowances before database usage does.
5. Add spend alerts and usage monitoring before connecting AI or social APIs. Provider API charges are separate from hosting/database charges.
6. Re-evaluate the backend only if measured usage, compliance requirements, or reliability needs justify the migration cost.

## Official pricing sources

- [Supabase pricing](https://supabase.com/pricing)
- [Vercel pricing](https://vercel.com/pricing), [Hobby plan limits](https://vercel.com/docs/plans/hobby), and [Terms of Service — Hobby Plan](https://vercel.com/legal/terms#hobby-plan)
- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), and [R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [Firebase pricing](https://firebase.google.com/pricing) and [Firebase billing plans](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans)
