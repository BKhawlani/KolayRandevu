# KolayRandevu

KolayRandevu is an appointment request platform for customers and service providers. Customers browse services, request an appointment, and follow its status. Providers review requests for their services. Admins can review accounts and manage the service catalog.

## Main workflow

Customer chooses a service and date/time, submits a request, and the API persists it in SQLite as `beklemede`. The service provider can approve or reject it, and the customer sees the resulting status in their appointment history.

## Tech stack

- React, TypeScript, Vite, React Router, CSS
- Node.js, Express, TypeScript
- SQLite with SQL migrations
- JWT authentication and `bcryptjs` password hashing
- Zod request validation

## Project structure

```text
frontend/src/auth/       Authentication context and session handling
frontend/src/api/        Shared API request helper
frontend/src/components/ Shared navigation, landing and protected-route UI
frontend/src/pages/      Landing, authentication, services, account and role pages
backend/src/routes/      API route modules
backend/src/controllers/ HTTP handlers
backend/src/services/    Database queries and application operations
backend/src/middleware/  Authentication, authorization, validation and errors
backend/src/validation/  Reusable Zod schemas
backend/src/scripts/     Demo data seeding command
backend/migrations/      Ordered SQLite schema migrations
backend/data/            Default local SQLite database location
```

## Requirements

Node.js 20 or newer and npm. React Router 7 requires Node.js 20 or newer.

## Installation and local run

Install backend dependencies and configure its environment:

```powershell
cd backend
npm ci
Copy-Item .env.example .env
```

Edit `backend/.env`: set a private random `JWT_SECRET` (at least 32 characters) and a strong `DEMO_ADMIN_PASSWORD` before seeding. Start the backend:

```sh
npm run dev
```

In a second terminal, install and start the frontend:

```powershell
cd frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

The API defaults to `http://localhost:3000` and Vite to `http://localhost:5173`. Use the production scripts below for builds and serving the built output:

```sh
# From backend/
npm run build
npm start

# From frontend/
npm run build
npm run preview
```

## Environment variables

Backend values are documented in `backend/.env.example`:

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Runtime mode. |
| `PORT` | API listening port. |
| `DATABASE_PATH` | SQLite file path, relative to the backend working directory unless absolute. |
| `FRONTEND_ORIGIN` | Frontend origin allowed by CORS. |
| `JWT_SECRET` | Private JWT signing secret; use a unique value of at least 32 characters. |
| `JWT_EXPIRES_IN_SECONDS` | JWT lifetime in seconds. |
| `DEMO_ADMIN_PASSWORD` | Strong password used only by the demo seed command. Never commit its real value. |

Frontend uses `VITE_API_URL` from `frontend/.env.example` for the API base URL, including `/api`. `.env` files are ignored by Git; example values are placeholders only.

## Database and demo data

SQLite initializes when the backend starts. The default database is `backend/data/kolayrandevu.sqlite` when commands run from `backend/`; `DATABASE_PATH` can select another file. Ordered migrations are applied once and recorded in `schema_migrations`. SQLite foreign-key enforcement is enabled.

The final feature pass did not change the schema, so no new migration was required. To add the local demo administrator and fictional services, set `DEMO_ADMIN_PASSWORD` in `backend/.env`, then run from `backend/`:

```sh
npm run seed:demo
```

The demo admin login identifier is **engbashar**. The seed command hashes the configured password and does not print it. It also creates fictional demo catalog entries: Sağlık Danışmanlığı, Klinik Muayene, Psikolojik Danışmanlık, Diş Hekimi, Beslenme Danışmanlığı, and Fizyoterapi. The command is idempotent for this demo data. Public registration always creates `kullanici` accounts; it cannot create an admin.

## Pages and navigation

- `/` — landing page
- `/hizmetler` and `/services` — public service catalog loaded from the API
- `/login`, `/register` — authentication
- `/dashboard` — customer appointment form and history
- `/provider-dashboard` — provider appointment requests and decisions
- `/hesabim` — authenticated profile view/edit and password change
- `/admin` — admin-only account list and service management

Navigation adapts to the current role. The frontend role display is for navigation only; the backend authorizes protected operations.

## API overview

All endpoints are under `/api`. Protected routes require `Authorization: Bearer <token>`. Errors use `{ "error": { "code": "...", "message": "..." } }`.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Health check. |
| `POST` | `/api/auth/register` | Public | Register a customer; role is always `kullanici`. |
| `POST` | `/api/auth/login` | Public | Login using email or the demo admin identifier `engbashar`. |
| `GET` | `/api/auth/me` | Authenticated | Return the current account's safe profile. |
| `PATCH` | `/api/auth/me` | Authenticated | Update the current account's name/email only. |
| `PATCH` | `/api/auth/me/password` | Authenticated | Change the current account password after verifying the current password. |
| `GET` | `/api/services` | Public | List the service catalog. |
| `GET` | `/api/services/:id` | Public | Get a service. |
| `POST` | `/api/services` | `hizmetci` or `admin` | Create a service owned by the authenticated identity. |
| `POST` | `/api/appointments` | `kullanici` | Create an appointment request for an existing service. |
| `GET` | `/api/appointments/me` | Authenticated | List only the current customer's appointment history. |
| `GET` | `/api/provider/appointments` | `hizmetci` | List requests for services owned by the authenticated provider. |
| `PATCH` | `/api/provider/appointments/:id/status` | `hizmetci` | Approve or reject an owned pending request. |
| `GET` | `/api/admin/users` | `admin` | List safe user fields; password hashes are omitted. |
| `GET` | `/api/admin/services` | `admin` | List services for management. |
| `POST` | `/api/admin/services` | `admin` | Create a catalog service. |
| `PATCH` | `/api/admin/services/:id` | `admin` | Edit a service. |
| `DELETE` | `/api/admin/services/:id` | `admin` | Delete a service only when foreign-key references allow it. |

Service deletion returns a clear conflict if appointments reference that service. A provider cannot read or update another provider's requests. Account profile updates derive the user ID from the verified JWT and do not accept role changes.

## Verification

Verified in this workspace: backend and frontend TypeScript/production builds; isolated API/database checks for strong password validation, registration/login, duplicate email, current-account update, role-spoof rejection, admin access rules and safe user output, public service listing, admin service create/edit/delete and referenced-service conflict, appointment creation/persistence/history, provider scoping, approve/reject status persistence, repeat processing, and cross-customer/provider isolation. The new demo seed was run twice against an isolated database and once against the local database. The existing local database was preserved.

No browser automation or visual viewport test was run for the newly added pages/navigation. The frontend was build-checked; API behavior was tested against the real backend code using isolated data. See [AI_LOG.md](AI_LOG.md) for verification scope and limitations.

## Known limitations and deployment

- No email verification, password reset, notifications, payments, SMS, calendar integration, chat, or analytics.
- No browser automation/visual interaction suite was available for this pass.
- No production deployment configuration or live URL was created. A deployment needs persistent SQLite storage, a private production JWT secret, the deployed frontend origin in `FRONTEND_ORIGIN`, and the API URL in `VITE_API_URL`. Configure `DEMO_ADMIN_PASSWORD` privately only if deploying/seeding the demo admin.

## AI usage

AI-assisted development was used. See [AI_LOG.md](AI_LOG.md) for the task summary and actual verification scope.

## Source and template attribution

No external application template, copied source project, or external image assets were used. Dependencies are declared in the package manifests.
