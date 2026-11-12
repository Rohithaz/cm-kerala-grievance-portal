# Project Overview

## Problem statement

The WhiteMatrix assessment asks for a working prototype that lets citizens submit public-service concerns, track progress, and receive updates while CMO administrators and department officers review and act on cases.

## Objectives

- Provide citizen registration, grievance submission, tracking, and post-resolution feedback.
- Support CMO review, department/officer assignment, escalation, action-report review, resolution, and reopening.
- Preserve traceable status and assignment history in MySQL.
- Offer AI-generated triage suggestions for human review, without automated official decisions.
- Identify the application as an assessment prototype and use fictional data.

## Scope and implemented features

- Public landing page with prototype disclaimer, department cards, and links into submission and tracking. Dedicated About, How It Works, full Departments, Contact, and FAQ pages are not implemented. The database has a contact enquiry table, but there is no contact form/API.
- Citizen registration/login/logout, profile, grievance submission, private attachments, dashboard, status history, reference tracking, and feedback after resolution.
- CMO dashboard, queue/search/filters, grievance details and authorized attachment access, review, assignment, remarks, escalations, action-report review, statistics, and reopening.
- Department officer login, assigned queue, case details, investigation notes, private report attachments, and versioned action-taken reports submitted to the CMO.
- Groq-backed AI complaint analysis with department/category/priority suggestions and a CMO summary. Analysis is on-demand and review-only.

The source and tests define current behavior. Remaining assessment gaps are in [REQUIREMENTS_CHECKLIST.md](REQUIREMENTS_CHECKLIST.md). Deployment is not represented as complete.

## User roles

- **Citizen:** registers publicly, manages own grievances, and can use public reference tracking.
- **CMO administrator:** reviews grievances, assigns active officers, monitors progress, and approves or requests changes to reports.
- **Department officer:** accesses grievances assigned to that officer and submits investigation/action reports.

Staff accounts are provisioned through the development-only demo seed, not public registration. The API reloads each user's active state and role from MySQL on protected requests; client route guards are not the security boundary.

## Technology stack

- **Client:** React 19, Vite 7, JavaScript ES modules, React Router, Axios, custom CSS, and CSS-based statistics displays.
- **Server:** Node.js, Express 5, ES modules, REST endpoints, `mysql2/promise`, `bcryptjs`, `jsonwebtoken`, `cookie-parser`, `multer`, and `express-rate-limit`.
- **Database:** MySQL-compatible InnoDB with `utf8mb4`; local verification has used XAMPP MariaDB 10.4.32.
- **AI provider:** Groq OpenAI-compatible Chat Completions API.
- **Development:** npm workspaces and `concurrently`.

## Prototype notice and data

> Recruitment assessment prototype. This is not an official Government of Kerala or Chief Minister's Office service and is not authorized or endorsed by either.

Use fictional sample data only. Do not submit real citizen grievances or official government credentials.
