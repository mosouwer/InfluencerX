# Backend foundation

Run commands from `backend/`. Node.js 20+ is recommended.

```sh
npm ci
cp .env.example .env
docker compose up -d
npm run migrate
npm start
```

Set `DATABASE_URL` to your PostgreSQL connection. Configure `AUTH_ISSUER` and `AUTH_JWKS_URL` for your Supabase project with asymmetric signing keys. Clients sign up and sign in through Supabase Auth, then send `Authorization: Bearer <access token>` to this API. No identity headers or demo authentication are accepted.

After authentication, call `PUT /api/v2/profile` with `role` (`brand` or `influencer`) and `display_name`. Identity comes from the token. A profile's role is immutable through this endpoint; admin provisioning is an operator responsibility.

## API

- `GET /health`: process liveness.
- `GET /api/v2/me`: current profile.
- `GET /api/v2/collaborations`: latest 100 owned collaborations.
- `POST /api/v2/collaborations`: brand creates an agreement.
- `GET /api/v2/collaborations/:id`: agreement, deliverables, submission history, events.
- `PUT /api/v2/collaborations/:id/deliverables/:deliverableId`: creator sends `{ "url": "https://..." }` while active or revising.
- `POST /api/v2/collaborations/:id/actions`: `{ "action": "accept" }`, or decline, submit, resubmit, request_revision, approve, cancel, dispute.

Booking payload:

```json
{
  "creator_id": "11111111-1111-4111-8111-111111111111",
  "title": "Summer launch",
  "brief": "Show the product in use",
  "amount_paise": 1200000,
  "deadline": "2027-06-01",
  "usage_rights": "Organic reposting for 30 days",
  "revision_limit": 1,
  "deliverables": ["One Instagram reel"]
}
```

Amounts are integer paise; API database results represent bigint amounts as strings. Commission is snapshotted at 2000 basis points. Acceptance waits at `awaiting_payment`. There is deliberately no public action to mark payment received. Payment integration, financial settlement, disputes resolution, UI migration, and legacy data import are subsequent work. Completion currently records content approval only.

`npm test` runs validation, workflow, and embedded PostgreSQL API tests. Embedded tests exercise SQL and transactions but do not replace external PostgreSQL concurrency/deployment checks. Apply migrations to a separate development database before production rollout. Migration tracking and an advisory lock prevent duplicate migration application.

Use a dedicated database schema and server-only database credentials. Do not expose these tables through a public data API without a separate access policy. The local Compose password is only for local development.

## Authentication and concurrency verification

The signed-token test serves an ephemeral local JWKS and checks real ES256 signatures, issuer, audience, expiry, and required claims using the production verifier. It does not contact Supabase.

To run the standalone PostgreSQL concurrency test, provide a development database whose user can create schemas:

```sh
TEST_DATABASE_URL=postgresql://influencex:localdev@localhost:5432/influencex npm test
```

The test creates a randomly named schema, runs migrations, sends three simultaneous approval requests through separate pooled connections, and verifies that only one approval event commits. It removes only its own schema afterward. Without `TEST_DATABASE_URL`, this test is explicitly skipped.

Live Supabase setup remains external: create/select your project, enable asymmetric JWT signing, configure issuer/JWKS URLs in `.env`, and use an actual user access token to exercise onboarding. Never commit `.env` or database passwords.

For this Supabase project the downloaded root certificate is stored at
`certs/supabase-ca.crt`. The ignored `.env` connection URL uses `sslmode=verify-full`
and `sslrootcert` to verify the server certificate and hostname. Update that path
when moving the project to another computer. Migration 003 enables row security
without client policies: direct client Data API requests cannot access business
tables; the server-only database connection performs authorized operations.

`npm run check:auth` checks the configured publishable key against the live Auth
settings endpoint. With an optional `AUTH_TEST_ACCESS_TOKEN` in the ignored local
`.env`, it also verifies the real JWT signature and checks the live user session.
It never prints tokens or creates accounts. Remove the temporary token after use.

## Creator discovery

Creators edit niche, biography, location, availability, and optional package rates
through `GET/PUT /api/v2/creator-profile`. Rates are integer paise; null means the
package is not offered. Only the authenticated creator can edit their own profile.
`GET /api/v2/creators` accepts `search`, `niche`, and `max_budget_paise`. Budget
filtering matches at least one offered package. Unavailable creators are hidden
and cannot receive new proposals. Existing agreements keep their original prices
when profile rates change.
