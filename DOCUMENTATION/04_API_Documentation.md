# API Documentation: Citizen Grievances

Base URL: `http://localhost:5000/api`. JSON responses use `{ "success": true, "data": ... }`. Errors use `{ "success": false, "message": "..." }`. Authenticated endpoints use the Phase 2 HttpOnly session cookie and require the existing CSRF token/header on state-changing requests. Citizen endpoints require an active `citizen` account.

## Health, authentication, profile and directory endpoints

| Method and path | Access | Purpose |
|---|---|---|
| `GET /health` | Public | API liveness. |
| `GET /health/db` | Public | Checks a database connection; returns 503 if unavailable. |
| `GET /departments` | Public | Reads department rows from MySQL. |
| `GET /auth/csrf` | Public | Sets the CSRF cookie and returns a signed token. |
| `POST /auth/register` | Public + CSRF | Creates citizen accounts only; rate-limited. |
| `POST /auth/login` | Public + CSRF | Authenticates and sets the HttpOnly session cookie; rate-limited. |
| `GET /auth/me` | Authenticated | Restores the current safe user profile. |
| `POST /auth/logout` | Authenticated + CSRF | Clears the session. |
| `GET /users/profile` | Authenticated | Reads the current profile. |
| `PUT /users/profile` | Authenticated + CSRF | Updates only name/mobile. |
| `GET /access/citizen`, `/access/cmo`, `/access/officer` | Matching role | Protected role-check endpoints used for authorization verification. |

All paths in this document are relative to `/api`. The browser client obtains the CSRF token before state-changing requests and sends it in `X-CSRF-Token`; the session token remains in the HttpOnly cookie. Public contact form submission is not implemented, despite the existing `contact_enquiries` table.

Registration and login accept JSON. Example registration body:

```json
{ "name": "Fictional Citizen", "email": "citizen@example.test", "mobile": "9000000000", "password": "use-a-test-only-password" }
```

Example login body:

```json
{ "email": "citizen@example.test", "password": "use-a-test-only-password" }
```

Successful auth responses return a safe user object (ID, name, email, mobile, role, department ID, active state) and set an HttpOnly session cookie. Passwords and password hashes are never returned. Use fictional/test credentials in all examples.

## Grievance metadata

### `GET /grievances/meta`

Authentication: none. Returns district records from the `districts` table and the server's approved categories.

```json
{
  "success": true,
  "data": {
    "districts": [{ "id": 1, "name": "Thiruvananthapuram" }],
    "categories": ["Roads and Infrastructure", "Healthcare", "Education"]
  }
}
```

The current category list has twelve values. The response example is abbreviated.

## Submit a grievance

### `POST /grievances`

Authentication: citizen. Content type: `multipart/form-data`. Required fields: `district`, `category`, `subject`, `description`. Optional repeated file field: `attachments` (at most five files; PDF, JPG/JPEG, or PNG; up to the configured `MAX_FILE_SIZE`, capped at 5 MB per file). The user ID always comes from the authenticated session. The server validates the district against MySQL and the category against the approved list. It assigns priority `Medium`, status `Submitted`, creates a random reference, and inserts the grievance, first history event, and attachment metadata in one database transaction.

```text
district=Ernakulam
category=Roads and Infrastructure
subject=Pothole near public bus stop
description=There is a large pothole near the bus stop on the main road...
attachments=@road-photo.jpg
```

Success (`201`):

```json
{
  "success": true,
  "message": "Grievance submitted successfully.",
  "data": {
    "id": "42",
    "reference_number": "CMK-2026-0123456789ABCDEF",
    "status": "Submitted",
    "created_at": "2026-11-12T10:00:00.000Z"
  }
}
```

Reference format is `CMK-YYYY-` followed by 16 uppercase hexadecimal characters from a cryptographically random 64-bit value. A unique database index enforces uniqueness; collisions retry the transaction.

Common errors: `400` invalid fields, district, category, file type/signature or file count; `401` no active session; `403` wrong role or CSRF validation; `413` file too large; `503` exhausted reference collision retries.

## Citizen dashboard and list

### `GET /grievances/my/statistics`

Authentication: citizen. Returns MySQL aggregate counts scoped to the current user: `total`, `submitted`, `under_review`, `in_progress`, `resolved`, and `reopened`.

### `GET /grievances/my?page=1&limit=10&status=Submitted&district=Ernakulam&category=Healthcare`

Authentication: citizen. All filters are optional. Page is positive and limit is clamped to 50. Returns only the current citizen's records, with `id`, `reference_number`, `subject`, `district`, `category`, `priority`, `status`, `assigned_department`, `created_at`, and `updated_at`, plus pagination metadata.

## Grievance details and history

### `GET /grievances/:id`

Authentication: owning citizen only. Returns complaint details, current status, department assignment (if any), resolution date, citizen-visible history, attachment metadata, and the citizen's feedback if present. A non-owner receives `404` to avoid confirming another user's private record.

### `GET /grievances/:id/history`

Authentication: owning citizen only. Returns citizen-visible events chronologically with previous/new status, safe changer display name, remarks, and timestamp. Events marked `citizen_visible=false` are never returned through citizen detail or tracking APIs.

## Public reference tracking

### `GET /grievances/track/:reference`

Authentication: none. Reference must match `CMK-YYYY-` plus 16 hexadecimal characters. Returns public-safe subject, district, category, priority, status, assigned department, timestamps, and citizen-visible status history. It does not return citizen email/mobile, description, attachment metadata, or internal remarks. Invalid format and unknown references both return `404`.

## Attachment retrieval

### `GET /grievances/attachments/:attachmentId/download`

Authentication: active citizen who owns the grievance, CMO admin, or the officer assigned to that grievance/department. The file is stored outside the static web root under `UPLOAD_DIR` with a random UUID filename. The original filename is only a sanitized download name. The server checks the related grievance and authorization before streaming; filesystem paths are never returned by APIs. Files are not served by unrestricted static hosting. Missing records or files return `404`; insufficient access returns `403`.

## Citizen feedback

### `POST /grievances/:id/feedback`

Authentication: owning citizen only. JSON body:

```json
{ "rating": 5, "comments": "Thank you for addressing this issue." }
```

Rating is an integer from 1 through 5; comments are optional and limited to 2,000 characters. Feedback is accepted only after status `Resolved`; the unique grievance constraint prevents duplicate submissions. Errors: `400` invalid input, `404` not owned/not found, `409` unresolved or duplicate.

## Error handling and privacy

Validation errors return `400`; unauthenticated access returns `401`; wrong role or file authorization returns `403`; unavailable resources return `404`; duplicate feedback and unresolved feedback return `409`; oversized files return `413`. Unexpected server errors return a generic message and do not expose SQL or filesystem details.

## CMO administrator APIs

All endpoints in this section require an active `cmo_admin` session. All POST requests also require the Phase 2 CSRF header/cookie pair. Citizen and officer sessions receive `403`; missing or inactive sessions receive `401`.

### Department directory and officer picker

- `GET /cmo/departments` returns seeded department `id`, `name`, and `description`.
- `GET /cmo/departments/:departmentId/officers` returns active department officers (`id`, `name`, `email`, `mobile`) for the selected department. Unknown departments return `404`.

### Dashboard statistics

- `GET /cmo/statistics` returns aggregate totals for `total`, `pending`, `resolved`, `overdue`, `submitted`, `under_review`, `in_progress`, `reopened`, and `high_priority`, plus recent grievances, open high-priority cases, overdue cases, escalated cases, and the latest CMO status/assignment/remark/escalation activity.
- `GET /cmo/statistics/districts` returns all districts with `total`, `pending`, `resolved`, and `overdue` counts.
- `GET /cmo/statistics/departments` returns all departments with `assigned`, `in_progress`, `resolved`, and `overdue` counts.

Counts use SQL aggregation. Overdue means `due_at < CURRENT_TIMESTAMP` and status is not `Resolved`; null due dates are not overdue. Statistics use the database clock.

### Grievance queue and administrative detail

`GET /cmo/grievances?page=1&limit=20&search=CMK-...&district=Ernakulam&category=Healthcare&priority=High&status=Submitted&departmentId=2&overdue=true&sort=created_at&direction=desc`

All filters are optional. Search matches reference or subject. Allowed sort fields are submission (`created_at`) and update (`updated_at`) time; direction is `asc` or `desc`; page size is capped at 50. The server returns citizen name, case fields, current assignment, overdue/escalation flags, and pagination metadata.

`GET /cmo/grievances/:id` returns administrative details including citizen contact, due/resolved timestamps, current assignment, assignment history, complete status history, internal and citizen-visible remarks, escalation history, and attachment metadata. It never returns filesystem paths or password hashes. Downloads use the existing authorized endpoint `GET /grievances/attachments/:attachmentId/download`.

### Review and department assignment

- `POST /cmo/grievances/:id/review` accepts an empty body. It only transitions `Submitted` to `Under Review`; other states return `409`. The server records previous/new status, CMO actor, timestamp, and a citizen-visible update in `grievance_history` inside a transaction.
- `POST /cmo/grievances/:id/assign` accepts `{ "departmentId": 2, "officerId": 17, "notes": "Please inspect the location." }`. The grievance must be `Under Review`, `In Progress`, or `Reopened`. Assignment after reopening advances it to `In Progress`. The department must exist and the active officer must belong to it. The transaction inserts a new `department_assignments` row, updates the current department/officer, and records a citizen-visible event. Initial assignment advances `Under Review` to `In Progress`; reassignment retains `In Progress` and preserves previous assignment records. Invalid officers return `400`; unknown department/grievance returns `404`; invalid workflow state returns `409`.

### Remarks and escalation

- `POST /cmo/grievances/:id/remarks` accepts `{ "remark": "Department has received the case.", "visibility": "citizen" }`. Visibility must be `internal` or `citizen`; remark length is 3–4,000 characters. Citizen APIs return only `citizen` remarks.
- `POST /cmo/grievances/:id/escalate` accepts `{ "reason": "The service deadline has passed without action." }`. Reason length is 5–2,000 characters. It appends to `grievance_escalations`, records the CMO and timestamp, and leaves grievance status unchanged. Resolved grievances cannot be escalated.

Neither endpoint permits callers to choose a grievance status. Final resolution is not part of Phase 4.

## Phase 5 department officer and CMO resolution APIs

All state-changing requests below require the existing authenticated HttpOnly session and valid `X-CSRF-Token`. The officer router requires an active `department_officer`; all grievance SQL is constrained by both grievance ID and the authenticated officer ID. CMO report and reopening APIs require an active `cmo_admin`.

- `GET /api/officer/statistics` returns MySQL-derived assigned-work KPIs and recent work lists.
- `GET /api/officer/grievances?page=1&limit=10&status=&priority=&district=&from=&to=&overdue=` returns a server-paginated officer-only queue.
- `GET /api/officer/grievances/:id` and `GET /api/officer/grievances/:id/history` return only the current officer's assigned case and appropriately visible history.
- `POST /api/officer/grievances/:id/remarks` accepts `{ "remark": "Inspection scheduled", "visibility": "internal" }`; visibility is `internal` or `citizen`.
- `POST /api/officer/grievances/:id/status` accepts only `{ "status": "In Progress", "remarks": "..." }`. Officers cannot set `Resolved`.
- `POST /api/officer/grievances/:id/action-reports` creates a persistent draft from `title`, `actionDescription`, optional `findings`, and optional `resolutionDetails`.
- `PATCH /api/officer/grievances/:id/action-reports/:reportId` updates only the submitting officer's draft; submitted reports return `409` and remain immutable.
- `POST /api/officer/action-reports/:reportId/attachments` accepts one `attachments` PDF/JPG/PNG file with existing size, MIME, signature and private-storage controls.
- `POST /api/officer/grievances/:id/action-reports/:reportId/submit` submits an immutable draft. A revised report is a new row linked to its previous changes-requested report.
- `GET /api/officer/grievances/:id/action-reports` lists report versions and review feedback.
- `GET /api/officer/action-reports/attachments/:attachmentId/download` downloads a report attachment only for its assigned submitting officer.
- `GET /api/cmo/action-reports?page=1&limit=10&status=submitted`, `GET /api/cmo/action-reports/:id`, and `GET /api/cmo/action-reports/attachments/:attachmentId/download` provide the CMO review queue, detail and private attachment access.
- `POST /api/cmo/action-reports/:id/review` accepts `{ "decision": "approve"|"request_changes", "remarks": "..." }`. Approval requires resolution details and atomically approves the report, sets the grievance to `Resolved`, sets `resolved_at`, writes visible status history and publishes the resolution remark. Requesting changes leaves the grievance in progress and records review remarks.
- `POST /api/cmo/grievances/:id/reopen` accepts `{ "reason": "..." }` for resolved cases. It records a visible `Resolved` to `Reopened` history transition and preserves earlier report and resolution history. A CMO may then assign the reopened grievance again.

Citizen-owned grievance detail returns resolution details only from a CMO-approved report. Citizen remarks/history queries exclude internal officer and CMO remarks. Public tracking continues to expose status and safe history only.

## Phase 6 AI Grievance Assistant

Both endpoints require an active account, role authorization, and the existing CSRF token for POST requests. Each route has a 10-request-per-IP/15-minute limiter. Complaint text must be 20–10,000 characters.

- `POST /api/grievances/ai-analysis` is citizen-only and accepts `{ "description": "The public tap near the market has been leaking for three days." }` for an unsaved draft.
- `POST /api/cmo/grievances/:id/ai-analysis` is CMO-only, accepts an empty body, and analyzes only the stored grievance description belonging to that ID.

The JSON response includes `aiGenerated: true` and `data` containing `summary`, `suggestedDepartment`, `suggestedCategory`, `suggestedPriority`, `sufficientInformation`, and `uncertainty`. Nullable suggestions indicate that the model could not responsibly choose a value. Department values are checked against the live departments table, categories against the application allow-list, and priority against `Low`, `Medium`, or `High`. AI output is not stored and cannot change grievance fields or status. See [AI Integration](05_AI_Integration.md) for privacy, provider errors, timeout, and prompt-injection safeguards.
