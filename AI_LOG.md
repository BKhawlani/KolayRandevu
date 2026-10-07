# AI development log

## Tools used

- OpenAI Codex in the shared development workspace.
- PowerShell through the `rtk` command proxy, Node.js, npm, TypeScript, and temporary Node scripts for API/database verification.

No additional AI agents or external AI services were used.

## AI-assisted task distribution

AI-assisted implementation followed the user's phased instructions: project scaffolding; SQLite migrations; Express foundation; Zod validation; bcryptjs/JWT authentication and authorization; services and appointments APIs; landing and authentication UI; customer and provider dashboards; and the final improvements covering password policy, public service catalog, admin panel, account page, role-aware navigation, seeding, security review, and documentation.

## Important instructions summarized

The instructions consistently scoped this to a small MVP and prohibited unrelated features. The final pass required strong passwords on both client and server, a public API-backed service page, minimal server-authorized admin service/user management, authenticated self-service profile edits, role-specific navigation, demo admin/service data, verification, and accurate documentation. Email verification, password reset, payments, notifications, calendar, chat, analytics, and deployment claims were explicitly out of scope.

## Human review and implementation decisions

The phased requirements and review decisions kept SQLite, JWT with bcryptjs password hashing, Zod boundary validation, and backend-authoritative access control. Registration continues to assign only `kullanici`. User and provider ownership is derived from the verified JWT; profile updates cannot change role. The demo identifier `engbashar` maps to an email-format account in the existing login model, and its password is provided through ignored environment configuration and hashed by the seed command. The final feature pass did not require schema changes or a new migration.

Implementation was reviewed against the stated acceptance criteria and exercised through builds and API/database checks; generated changes were not treated as verified without those checks.

## Verification performed

- Backend TypeScript build and frontend TypeScript/production build were run in the development phases; the final pass reran both builds.
- An isolated SQLite-backed API run checked strong/weak password behavior, public registration role restrictions, duplicate registration, login, current-account GET/PATCH, duplicate email, rejected role/user-ID changes, safe admin user output, admin access restrictions, and service create/edit/delete behavior.
- The same isolated backend run exercised public service listing, customer appointment persistence/history, provider-scoped listing and status changes, cross-customer/provider isolation, and status reprocessing rejection. It checked database status and API-visible customer status after updates.
- The demo seed command was exercised twice on an isolated database and once on the local database. The isolated second run checked idempotency. Seeded services are fictional examples.
- A foreign-key deletion failure surfaced from SQLite as `SQLITE_CONSTRAINT_TRIGGER`; service deletion now maps that known foreign-key conflict to a safe `409` response. This behavior was retested with a referenced service.
- A local API smoke check authenticated through the `engbashar` identifier and read the seeded catalog. No password value was printed.
- Existing phase verification also covered backend health, invalid/unknown routes, authentication and role middleware, validation, SQLite persistence across backend restart, and a safely simulated appointment insert failure.

The final API checks used isolated test data. The regular local SQLite file was kept and seeded with the demo admin and service catalog. The schema was unchanged.

## Limitations


- No independent third-party security audit is claimed.

## Follow-up: account password change

At the user's request, `/hesabim` now includes an authenticated password-change form. The backend `PATCH /api/auth/me/password` route checks the current password, applies the same strong-password and bcrypt size limits used during registration, hashes the replacement with bcryptjs, and updates only the authenticated user's record. The frontend provides confirmation, reveal/hide controls, duplicate-submit protection, and success/error states. Backend and frontend builds passed. An isolated SQLite check passed for weak-password rejection, incorrect-current-password rejection without changing the hash, new bcrypt hash persistence, and old-password invalidation. No brows