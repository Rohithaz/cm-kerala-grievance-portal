# AI Integration

## Assessment scope

The WhiteMatrix assessment requires analysis of the citizen's complaint description, suggested department and category, a Low/Medium/High priority recommendation, and a short summary for CMO review. Potential duplicate detection is optional and is not implemented in this phase.

## Provider and request flow

The application calls Groq's OpenAI-compatible Chat Completions endpoint from the Express server. The configured model is `openai/gpt-oss-20b`. Groq currently lists JSON Schema mode for this model; see the [GPT-OSS 20B model page](https://console.groq.com/docs/model/openai/gpt-oss-20b), [Chat Completions API reference](https://console.groq.com/docs/api-reference), and [Structured Outputs guide](https://console.groq.com/docs/structured-outputs).

1. A citizen can analyze the description while drafting a grievance. The browser sends only that description to `POST /api/grievances/ai-analysis`.
2. An authenticated CMO administrator can request a fresh analysis of a case through `POST /api/cmo/grievances/:id/ai-analysis`. The API loads only the complaint description for the provider request.
3. The backend obtains the current department names from MariaDB and uses the application category list and priority enum as output constraints.
4. The backend sends a system instruction that treats complaint text as untrusted input, requests strict JSON Schema output, validates every field and returns suggestions to the caller.
5. The UI labels output as AI-generated and for human review. It never fills category, priority, assignment, status, or resolution fields automatically.

The result contains `summary`, `suggestedDepartment`, `suggestedCategory`, `suggestedPriority`, `sufficientInformation`, and `uncertainty`. Suggestions may be null when information is insufficient. Department and category suggestions must match current application/database values exactly; priority must be `Low`, `Medium`, or `High`.

## Configuration

Set these in the project-root `.env`, which the backend loads. The actual key is not included here or in `.env.example`:

```dotenv
AI_PROVIDER=groq
AI_API_KEY=your_groq_api_key
AI_MODEL=openai/gpt-oss-20b
```

Do not put the key in `client/.env`, a `VITE_*` variable, browser code, or committed files. No additional SDK dependency is required; the server uses Node's built-in `fetch`.

## Safety and limits

- Citizen route requires an active citizen session. The CMO route is behind active CMO role authorization. Cookie-authenticated POSTs retain global CSRF protection.
- Each route is limited to 10 requests per IP per 15 minutes. Descriptions must be 20–10,000 characters. Groq calls time out after 25 seconds.
- Only complaint description text is sent. No name, email, phone, address, grievance ID, attachments, or authentication details are sent.
- The prompt explicitly rejects instructions embedded in complaint text and forbids inventing facts or making official decisions.
- Groq output is constrained and checked against server-owned enums and length limits. Malformed JSON, unknown enum values, missing configuration, timeouts, and provider errors become safe client messages. Provider response bodies, keys, prompt contents, and complaint text are not logged.
- Analysis runs on demand and is not stored in the grievance or database. It cannot modify the grievance's department, priority, status, assignment, or resolution.
- Duplicate detection is optional in the assessment and is intentionally omitted. No local DistilBERT or FastAPI integration existed in this repository.

## Verification

Run mocked integration and regression checks with `npm run test:ai --workspace server`; run the frontend production build with `npm run build` from the project root. A real-provider test should be run only when the project-root API key is configured, and should report pass/fail without printing credentials.
