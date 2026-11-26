# Hosted development on Render

The repository-root `render.yaml` runs the web interface and Node API as one
service, backed by the existing Supabase project. No local server is needed by
users after deployment.

1. Push the reviewed backend changes and `render.yaml` to the GitHub repository.
2. In Render, create a Blueprint from that repository and select the intended
   branch. Review the service configuration before creating it.
3. Supply `SUPABASE_PUBLISHABLE_KEY` and `DATABASE_URL` as environment values.
   Use the same Session pooler connection but replace the local certificate path
   in its query with `sslrootcert=certs%2Fsupabase-ca.crt`, retaining
   `sslmode=verify-full`. Keep the encoded password intact. Never commit this URL.
4. Deploy. Build installs dependencies and runs unit/embedded tests. Startup runs
   tracked migrations before serving requests. The `/ready` health check verifies
   database connectivity. Startup migrations must stay compatible with the
   previous application version during rolling deployments.
5. Set Supabase Auth's Site URL to the resulting HTTPS address, and add it to
   allowed redirect URLs. Verify signup confirmation, sign-in, and profile creation.
6. Configure custom SMTP before opening registration to users.

The selected free Render service is for development; review current provider
limits before production. The existing PostgreSQL concurrency test is opt-in and
was already run against Supabase. Run it explicitly before database/workflow
changes; builds intentionally do not receive `TEST_DATABASE_URL`.

Verification after deployment: `/health` and `/ready` return 200; unauthenticated
`/api/v2/me` returns 401; sign-in loads the correct profile; brand discovery and
proposal creation work; unrelated users cannot read a collaboration.

Session tokens remain only in browser memory and renew during active use. Page
reload requires signing in again. Payment collection and financial settlement
remain unimplemented; accepted proposals wait at `awaiting_payment`.
