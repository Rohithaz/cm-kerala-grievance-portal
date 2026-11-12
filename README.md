# CM Kerala Public Grievance Portal

Recruitment assessment prototype for the WhiteMatrix AI Full Stack Engineer assignment. **This is not an official Government of Kerala or Chief Minister's Office service, and is not authorized or endorsed by either. Use fictional data only.**

## Overview

The application demonstrates a grievance lifecycle: citizen submission and tracking, CMO review and department assignment, officer investigation and action reports, and CMO approval or reopening. It also provides on-demand Groq AI triage suggestions for human review.

## Implemented features

- Citizen registration/login/logout, profile, grievance submission, private supporting files, dashboard, history, public reference tracking, and post-resolution feedback.
- CMO dashboard, grievance search/filtering, details, authorized attachment access, review, department/officer assignment, remarks, escalation, district/department statistics, action-report review, and reopening.
- Department officer queue, investigation notes, action-report drafts/versions, private report attachments, and submission to CMO.
- Database-backed, timestamped status history for Submitted, Under Review, In Progress, Resolved, and Reopened.
- Groq-backed department/category/priority suggestions and summary. Suggestions are labelled for human review and do not update official fields.
- Public landing page and live department preview.

**Known assessment gaps:** dedicated About Us, How It Works, Departments directory, Contact Us form, and FAQ pages are not implemented. The contact table exists but has no submission API. The landing page's information sections are brief and do not show sample statistics.

## User roles

- **Citizen:** register and manage own grievances.
- **CMO administrator:** review, route, monitor, and make resolution decisions.
- **Department officer:** investigate only cases assigned to the officer and submit action reports.

Staff accounts are development/test accounts created by the demo seeder. Public registration creates citizens only.

## Technology

- React 19, Vite 7, React Router, Axios, and custom CSS (including CSS-based statistics displays).
- Node.js ES modules, Express 5, `mysql2/promise`, `bcryptjs`, `jsonwebtoken`, `multer`, and `express-rate-limit`.
- MySQL-compatible InnoDB database; tested locally with XAMPP MariaDB 10.4.32.
- Groq OpenAI-compatible Chat Completions API for the AI assistant.

## Prerequisites

- Node.js compatible with Vite 7 (20.19+ or 22.12+; Node 24 is also suitable) and npm.
- XAMPP MySQL/MariaDB or another supported MySQL-compatible database.

## Install and configure

From the project root:

```powershell
npm.cmd install
```

If the root `.env` does not exist, copy `.env.example` to `.env`; otherwise edit the existing local `.env` without replacing its values.

Edit the project-root `.env` with local MySQL credentials and a private `JWT_SECRET` of at least 32 random bytes. The backend loads this exact root file through `server/src/config/env.js`. `.env.example` contains placeholders only. See [Setup and Testing](DOCUMENTATION/06_Setup_and_Testing.md) for every variable and Windows/XAMPP setup details.

Create the database `cm_kerala_grievance` in phpMyAdmin (or allow the migration user to create it), then run:

```powershell
npm.cmd run db:migrate
npm.cmd run db:seed
```

Migrations 001–004 create the schema additively and record applied migrations. The reference seed inserts fictional districts and departments. Do not run these commands against a database you do not intend to update.

## Demo accounts

For local assessment/testing only, configure `DEMO_CMO_EMAIL`/`DEMO_CMO_PASSWORD` and `DEMO_OFFICER_EMAIL`/`DEMO_OFFICER_PASSWORD` in the root `.env`, then run:

```powershell
npm.cmd run db:seed:demo
```

An optional `DEMO_WATER_OFFICER_EMAIL`/`DEMO_WATER_OFFICER_PASSWORD` pair provisions a separate Water Resources officer. The seed hashes passwords, is idempotent, leaves existing accounts unchanged, and refuses production mode. Never place demo passwords in this public README. The assessment requires evaluator credentials in the submission message or README; provide test-only credentials through the private submission message when appropriate.

## Run locally

```powershell
npm.cmd run dev
```

- Client: `http://localhost:5173`
- API: `http://localhost:5000/api`
- API health: `http://localhost:5000/api/health`
- Database health: `http://localhost:5000/api/health/db`
- Departments: `http://localhost:5000/api/departments`

Stop the combined development process with `Ctrl+C`. Alternatively run `npm.cmd run server` and `npm.cmd run client` in separate terminals.

## Tests and build

```powershell
npm.cmd run test:ai --workspace server
npm.cmd run build
```

The integration suite includes AI validation plus selected citizen, CMO assignment, officer-access, tracking, and authorization regression checks. It connects to the configured database and inserts temporary test records that its cleanup removes. Run only against a disposable development/test database, never production. Backend syntax check:

```powershell
Get-ChildItem server/src,server/test -Recurse -File -Filter *.js | ForEach-Object { node --check $_.FullName }
```

## Documentation

- [Project Overview](DOCUMENTATION/01_Project_Overview.md)
- [System Architecture](DOCUMENTATION/02_System_Architecture.md) (includes Mermaid diagram)
- [Database Design](DOCUMENTATION/03_Database_Design.md) (includes Mermaid ER diagram)
- [API Documentation](DOCUMENTATION/04_API_Documentation.md)
- [AI Integration](DOCUMENTATION/05_AI_Integration.md)
- [Setup and Testing](DOCUMENTATION/06_Setup_and_Testing.md)
- [User Guide](DOCUMENTATION/07_User_Guide.md)
- [Assessment Requirements Checklist](DOCUMENTATION/REQUIREMENTS_CHECKLIST.md)

## Security and privacy

- `.env`, environment variants, private uploads, dependency folders, build output, logs, temporary files, and local database backups are git-ignored. Keep `.env.example` placeholders only.
- JWTs are held in HttpOnly cookies; client auth state is not persisted to localStorage/sessionStorage. Unsafe requests use CSRF protection.
- Uploads are type/signature/size checked and stored outside the public static directory. Use authorized download endpoints.
- The AI key is server-side only; complaint text is sent to Groq only for requested analysis. AI suggestions are non-authoritative.
- Use fictional sample content, not real citizen data or government credentials.

## Troubleshooting

- For database connection errors, check that XAMPP MySQL is running and the root `.env` host/port/database/user/password match the local instance. Do not paste secrets into logs or issue reports.
- For missing tables, run migrations in the intended development database, then seed reference data.
- If the CMO officer list is empty, the officer must be active and have a `department_id` matching the selected department.
- For cookie/CSRF issues, use the configured client origin and ensure Secure/SameSite settings match HTTP or HTTPS.

## Development and service disclosure

OpenAI Codex was used as an AI coding assistant during project preparation. The application integrates Groq as a third-party AI inference service. Other runtime/build libraries are listed in the workspace package files.

## Submission status

The local application has not been deployed from this checkout and no GitHub repository/remote is configured. A hosted application URL, public source repository, evaluator demo credentials, and 3–5 minute screen recording still need to be prepared and verified before submission.
