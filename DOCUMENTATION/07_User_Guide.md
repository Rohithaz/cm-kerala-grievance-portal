# User Guide

This guide is for the assessment prototype. Use fictional information and test accounts only. This application is not an official Government of Kerala or Chief Minister's Office service.

## Public visitor

- Use **Track a grievance** and enter a reference number to view its public status, assigned department, and citizen-visible history. Public tracking does not reveal personal contact data, the private description, internal notes, or attachments.
- Sign in or register to use the citizen portal.
- The current landing page has a short purpose/workflow overview and a preview of departments. Dedicated About, How It Works, full Departments, Contact, and FAQ pages are not available yet.

## Citizen

1. Register using your name, email, mobile number, and password, then sign in.
2. Open **Submit** and select the district and category. Add a subject and detailed description. PDF/JPG/PNG supporting files are optional.
3. The application shows the generated reference number after submission. Keep it to use public tracking.
4. Open **Overview** or **My grievances** to view counts, submissions, current status, department, and details.
5. In a draft, you may request AI analysis. Treat the department/category/priority/summary as suggestions for review; the model does not submit or decide the grievance.
6. After CMO approval resolves a grievance, submit a single rating and optional feedback from its detail page.
7. Use **Sign out** when finished.

## CMO administrator

1. Sign in with a configured assessment CMO test account. Staff accounts are created through the development-only seed script; there is no public staff registration.
2. Use the dashboard for totals, overdue/high-priority activity, department/district statistics, and reports awaiting review.
3. Open the grievance queue to filter/search cases. Open a case to inspect citizen details, attachment metadata/downloads, status history, remarks, escalations, and assignment history.
4. Move a Submitted case into review. Assign it to a department and an active officer listed for that department. The server checks that the officer is active and belongs to that department.
5. Add internal remarks for CMO workflow or citizen-visible remarks for progress updates. Escalation records a reason and does not itself change status.
6. Review department action reports. Approve a report with resolution details to resolve the case, or request changes with remarks. A resolved case can be reopened with a reason.
7. Use the department, district, and report views to monitor stored application records. Sign out when finished.

## Department officer

1. Sign in with an assessment officer test account. The queue is limited to grievances assigned to that officer.
2. Open an assigned grievance to read its details, assignment instructions, status history, and authorized attachments.
3. Add investigation remarks and choose whether each is internal or citizen-visible. Officers can update investigation progress but cannot mark a grievance Resolved.
4. Create an action-report draft with the action taken, findings, and (where appropriate) proposed resolution details. An optional supported file may be attached.
5. Save a draft to continue later, or submit it to the CMO. Submitted report versions are immutable. If the CMO requests changes, prepare a revised report.
6. Sign out when finished.

## Account and environment setup

For local setup, database commands, exact environment variables, and demo-account provisioning, follow [Setup and Testing](06_Setup_and_Testing.md). Never share the root `.env` file or commit its values. For an evaluator, send test-only login credentials through the submission message if those credentials are not intentionally published in the README.

## Supported uploads

Grievance and report attachments support PDF, JPG/JPEG, and PNG, with signature checks and a maximum of 5 MB per file. Stored files are private and must be downloaded through an authorized application link.

## Prototype limitations

The public information pages and persisted Contact Us form are incomplete. No hosted URL is documented here. Do not use this prototype for real grievances or sensitive personal data.
