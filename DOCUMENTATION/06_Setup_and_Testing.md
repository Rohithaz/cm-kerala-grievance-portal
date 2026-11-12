# Setup and Testing

This guide describes the local Windows/XAMPP development setup and verification procedures. It does not describe a production deployment. Use fictional test data only.

## Prerequisites

- Node.js compatible with the installed Vite 7 release (Node 20.19+ or 22.12+; Node 24 is also suitable).
- npm, installed with Node.js.
- XAMPP MySQL/MariaDB running locally, or another supported MySQL-compatible server.
- Git is optional for local execution; this checkout currently has no `.git` directory.

## Install

From the project root:

```powershell
npm.cmd install
```

This is an npm-workspaces project. Dependencies are shared from the root install. If PowerShell blocks `npm.ps1` under its execution policy, use `npm.cmd` as shown.

## Database setup (XAMPP)

1. Start **MySQL** in the XAMPP Control Panel.
2. In phpMyAdmin, create `cm_kerala_grievance` with `utf8mb4_unicode_ci`, or grant the configured local MySQL user permission to create it.
3. If `.env` does not exist, copy `.env.example` to the project root as `.env`; otherwise edit the existing `.env` without replacing its values. Set the local MySQL host, port, database, username, and password. The backend explicitly loads the root `.env` in `server/src/config/env.js`.
4. Apply schema migrations, then seed reference data:

```powershell
npm.cmd run db:migrate
npm.cmd run db:seed
```

Migrations 001–004 are applied in order and recorded in `schema_migrations`. Reference seeding is duplicate-safe and inserts the fourteen districts and twelve fictional departments. Do not run migrations against a database you do not intend to update.

## Environment variables

All backend settings are read from the project-root `.env`. `.env.example` contains placeholders only; never copy real credentials into documentation or source control.

| Variable | Required | Purpose |
|---|---|---|
| `PORT` | No | Express listen port; defaults to 5000. |
| `NODE_ENV` | No | Runtime mode; defaults to development. Demo account seeding is disabled in production. |
| `CLIENT_URL` | No | Exact credentialed CORS origin; defaults to `http://localhost:5173`. |
| `MYSQL_HOST`, `MYSQL_PORT` | Local DB required | MySQL/MariaDB address and port; defaults are `127.0.0.1:3306`. |
| `MYSQL_DATABASE` | Local DB required | Database name; defaults to `cm_kerala_grievance`. |
| `MYSQL_USER`, `MYSQL_PASSWORD` | Local DB required | Database login for the API and scripts. Use the account configured in XAMPP/MySQL. |
| `JWT_SECRET` | Yes | Private random signing key; configure at least 32 random bytes. Do not commit it. |
| `JWT_EXPIRES_IN` | No | JWT lifetime; defaults to `1d`. |
| `AUTH_COOKIE_SECURE` | No | Secure cookie switch; use `false` for local HTTP and HTTPS-only in production. |
| `AUTH_COOKIE_SAME_SITE` | No | `lax`, `strict`, or `none`; local default is `lax`. `none` requires HTTPS/Secure. |
| `UPLOAD_DIR` | No | Private file directory; defaults to `server/uploads`. |
| `MAX_FILE_SIZE` | No | Attachment limit in bytes; defaults to 5 MiB and is capped at 5 MiB. |
| `AI_PROVIDER` | Optional | Set to `groq` to enable the Groq assistant. |
| `AI_API_KEY` | Optional for non-AI use | Server-side Groq API key. Never expose it to the Vite client or commit it. |
| `AI_MODEL` | Optional | Groq model identifier; see `.env.example` for the configured example. |
| `DEMO_CMO_EMAIL`, `DEMO_CMO_PASSWORD` | Optional pair | Development CMO demo login. |
| `DEMO_OFFICER_EMAIL`, `DEMO_OFFICER_PASSWORD` | Optional pair | Development Public Works officer demo login. |
| `DEMO_WATER_OFFICER_EMAIL`, `DEMO_WATER_OFFICER_PASSWORD` | Optional pair | Development Water Resources officer demo login. Existing accounts are never overwritten; a conflicting Water Resources email aborts the seed. |

The demo seed requires both CMO and Public Works pairs. The Water Resources pair is optional but must be configured together. Demo passwords must be at least 14 characters and at most 72 UTF-8 bytes. Use test-only accounts and keep the `.env` file private.

To create configured demo staff in a development database:

```powershell
npm.cmd run db:seed:demo
```

This command is idempotent. It hashes passwords with bcrypt and leaves existing accounts unchanged. There is no public CMO/officer registration endpoint.

## Run the app

From the project root:

```powershell
npm.cmd run dev
```

This starts the backend and Vite client. Local URLs:

- Client: `http://localhost:5173`
- API: `http://localhost:5000/api`
- API liveness: `http://localhost:5000/api/health`
- Database health: `http://localhost:5000/api/health/db`
- Public department records: `http://localhost:5000/api/departments`

Sign in with a citizen registration or with locally configured demo staff. The CMO assignment dialog offers officers that are active and linked to the selected department. For Windows, stop the combined dev process with `Ctrl+C`; start it again with `npm.cmd run dev`. To run sides separately use `npm.cmd run server` and `npm.cmd run client` in separate terminals.

## Automated checks

The repository has one automated test script:

```powershell
npm.cmd run test:ai --workspace server
```

Despite its name, this integration suite also checks selected Phase 1–5 regressions, including CSRF/role boundaries, citizen submission/tracking, CMO review/assignment, officer access, and that AI does not alter official grievance fields. It requires the configured database and creates temporary test users/grievances/assignments that its cleanup removes. Run only against a disposable development/test database, never production.

Check JavaScript syntax:

```powershell
Get-ChildItem server/src,server/test -Recurse -File -Filter *.js | ForEach-Object { node --check $_.FullName }
```

Build the client:

```powershell
npm.cmd run build
```

## Manual workflow checks

These are verification steps, not results claimed by this guide. Use a test database and fictional content.

### Citizen

1. Register a citizen and sign in; confirm refresh restores the session and logout clears it.
2. Submit a grievance with a district, category, subject, description, and optional supported attachment. Confirm a unique reference is shown.
3. Check the citizen dashboard, open the grievance, and confirm status/history.
4. Sign out and track by reference. Confirm only public-safe fields and citizen-visible history appear.
5. After CMO approval resolves a case, sign in as its citizen and submit feedback once.

### CMO administrator

1. Sign in with a configured CMO demo account and inspect the dashboard totals, district/department statistics, and queue filters.
2. Open a submitted grievance, inspect details and any attachment, and move it into review.
3. Assign it to a department and an active officer belonging to that department. Add an internal remark and, separately, a citizen-visible update; confirm visibility behavior.
4. Escalate a delayed case and confirm the escalation is recorded without changing status.
5. Review an officer action report, request changes or approve it, then verify resolution history. Reopen a resolved test case and confirm prior history remains.

### Department officer

1. Sign in with a configured officer account and confirm the queue contains only cases assigned to that officer.
2. Inspect complaint details, history, and authorized attachments.
3. Record investigation remarks, create/edit a draft action report, attach an allowed file if needed, and submit the report to the CMO.
4. If changes are requested, submit a revised report. Confirm the officer cannot resolve a grievance directly.

### Security, privacy and files

- Confirm citizen, CMO, and officer accounts cannot access each other's protected dashboards/APIs.
- Confirm inactive accounts are denied and state-changing calls without valid CSRF are rejected.
- Upload a valid PDF/JPG/PNG and verify unauthorized users cannot retrieve it; reject mismatched signatures, unsupported types, or over-limit files.
- Confirm public tracking does not disclose contact details, descriptions, internal remarks, or private files.

## Verification recorded for this checkout

Results run from the project workspace on 2026-11-12:

| Check | Command | Result |
|---|---|---|
| AI and selected Phase 1–5 integration regressions | `npm.cmd run test:ai --workspace server` | Passed: 6 tests, 0 failures. Includes CMO assignment, officer access, tracking, role/input limits, and AI no-mutation checks. The integration harness cleans up its temporary users/grievances. |
| Backend syntax | `node --check` over `server/src` and `server/test` JavaScript files | Passed: 41 files. |
| Client production build | `npm.cmd run build` | Passed: Vite transformed 134 modules. |

`npm install` was not needed for this verification because dependencies were already present. Browser-driven visual/end-to-end testing has not been completed in this environment; deployment and hosted URL verification are also outstanding. The regression harness is not a replacement for the manual workflows below.

## Troubleshooting

- **Database connection error:** ensure XAMPP MySQL is running and root `.env` has the correct database host/port/user/password. Do not print credentials into logs or support requests.
- **Missing tables:** run `npm run db:migrate` in the intended development database, then `npm run db:seed` for reference rows.
- **No officer in assignment dropdown:** the account must have role `department_officer`, be active, and have `department_id` matching the selected department. Configure a demo officer for that department and rerun the demo seed; the seed does not change an existing account's department.
- **Login or CSRF errors:** access the client using the configured `CLIENT_URL`, refresh the page to obtain a current CSRF token, and confirm cookie settings match HTTP/HTTPS.
- **Port already in use:** stop the other process or change `PORT`/the Vite port and update the matching client/API URL configuration.
