# Current Build

A Dubsado-style proposal → contract → invoice flow for Falling Forwards Ltd, built as a single Next.js app on top of Airtable and Xero.

## 1. Stack and hosting

Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind v4 (CSS-first theming — brand tokens defined in `app/globals.css` via `@theme inline`). No database of its own; Airtable is the data store, reached via raw `fetch` calls (not the Airtable SDK).

Deployed to Vercel as its own dedicated project (`proposal-invoice-system`), not shared with any other app. It is **not connected to GitHub** — there's a local git repo for history, but deploys are pushed manually from a laptop via `vercel deploy --prod`. A `vercel.json` defines one scheduled Cron job (see §6).

Env vars (names only — set in Vercel project settings, `.env.local` locally, never committed): `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, `XERO_REDIRECT_URI`, `XERO_SALES_ACCOUNT_CODE` (optional), `XERO_INVOICE_DUE_DAYS` (optional), `XERO_INVOICE_LEAD_DAYS` (optional), `ADMIN_PASSWORD`, `SESSION_SECRET`, `CRON_SECRET`, `SLACK_WEBHOOK_URL` (optional).

## 2. Data — Airtable

Everything lives in one base, **"Proposal / Invoice System"**. Table and field IDs are hardcoded as constants in `lib/airtable.ts` rather than looked up by name, so renaming a field in the Airtable UI doesn't break the app.

| Table | Purpose | Key fields |
|---|---|---|
| **Offers** | Reusable proposal templates | Offer Name, Tagline, Description (client-facing marketing copy), Default Contract Terms (with `{{token}}` placeholders), Payment Plan Options (multi-select), links to Offer Line Items and Proposals. `Default Line Items` (long text) exists on the table but is dead — superseded by the Offer Line Items table and unused in code. |
| **Offer Line Items** | Template line items copied into a new Proposal when an Offer is loaded | Description, Kind (Fixed / Package Option / Add-on), Quantity, Unit Price |
| **Proposals** | One row per client, the anchor record | Client Name, Client Email, Company, Offer (link), Status (Draft → Sent → Viewed → Signed → Invoiced → Paid), Proposal Page Slug (the public URL), Contract Terms, Date Signed, Notes, Total (rollup — **sums every linked Line Item regardless of whether it's Selected**, so it's only accurate for proposals with no optional items), Proposal Link (formula), Payment Plan (client's choice), Deposit Amount (optional one-off override), links to Line Items / Signatures / Proposal Invoices. `Date Sent`, top-level `Xero Invoice ID` and `Xero Online Invoice URL` fields exist but are never written by the app — invoicing moved to the per-installment table below and these were left behind. |
| **Line Items** | A proposal's priced items | Description (feeds Xero directly), Proposal (link), Quantity, Unit Price, Line Total (formula), Kind, Selected (true once the client locks in a Package Option/Add-on; irrelevant for Fixed) |
| **Signatures** | Audit trail, separate from Proposals | Signed Name, Proposal (link), Signed At, IP Address, Confirmed |
| **Proposal Invoices** | The payment schedule — one row per instalment | Sequence, Proposal (link), Amount, Due Date, Description (the Xero line-item text), Xero Invoice ID / Xero Online Invoice URL (blank until that instalment is actually created in Xero) |
| **Xero Connection** | Single-row store for OAuth tokens (serverless functions are stateless) | Tenant ID, Access Token, Refresh Token, Expires At |

## 3. Routes

**Client-facing (public, no auth):**

| Route | Does |
|---|---|
| `/proposal/[slug]` | Page 1 — shows Offer marketing copy, fixed line items, lets the client pick a Package Option / Add-ons / Payment Plan |
| `/proposal/[slug]/contract` | Page 2 — pricing recap, full contract text, signature form |
| `/proposal/[slug]/invoice` | Page 3 — polls status, shows each instalment and its Xero "pay now" link once created |
| `/api/select-options` (POST) | Persists the client's choices, pins the payment schedule, resolves `{{Total}}`/`{{Payment Plan}}` into the contract text |
| `/api/sign` (POST) | Records the signature, flips status to Signed, creates + emails instalment #1 in Xero |
| `/api/proposal-status` (GET) | Polled by the invoice page for live status |
| `/api/xero/connect`, `/api/xero/callback` | One-time OAuth handshake to link Zoë's Xero org — unauthenticated by design (Xero's own login is the gate), meant to be visited once and not shared |

**Admin (behind a password, `/admin/*` and `/api/admin/*`):**

| Route | Does |
|---|---|
| `/admin/login` | Password form → sets a session cookie |
| `/admin/proposals`, `/admin/proposals/new`, `/admin/proposals/[id]` | List / create / edit proposals, including line items, deposit override, and contract terms |
| `/admin/offers`, `/admin/offers/new`, `/admin/offers/[id]` | Same, for reusable Offer templates |
| `/api/admin/proposals`, `/api/admin/proposals/[id]` | CRUD for proposals + their line items |
| `/api/admin/offers`, `/api/admin/offers/[id]` | CRUD for offers + their template line items |
| `/api/admin/login`, `/api/admin/logout` | Session cookie set/clear |

Auth is a single shared password (`ADMIN_PASSWORD`), checked in `proxy.ts` (Next.js 16's renamed middleware) against every `/admin` and `/api/admin` request via a signed cookie value (`SESSION_SECRET`). No per-user accounts, no rate limiting on login attempts.

**Background:** `/api/cron/send-due-invoices` (GET, bearer-token protected) — see §6.

## 4. The proposal flow

Zoë builds a proposal in `/admin/proposals/new`, optionally loading an Offer template (auto-fills contract terms + line items on selection). She sets final pricing, then clicks "Fill placeholders" to resolve `{{Client Name}}`/`{{Company}}`/`{{Client Email}}`/`{{Date}}` into the contract text — `{{Total}}` and `{{Payment Plan}}` are deliberately left alone here, since they depend on the price and are resolved later. "Save & mark as sent" is blocked if Contract Terms is empty. Saving generates a unique slug (`ensureUniqueSlug`) and a public link.

The client visits that link, moves through the three pages above, and their choices + payment plan get locked in by `/api/select-options`, which is **idempotent**: if they go back and change their selection, it reconstructs and swaps out the previously-resolved total/schedule text rather than leaving stale figures.

Security is obscurity, not real access control: the slug is unguessable but the pages themselves check nothing beyond that — no per-client login. Status drives what each page shows (Draft = not ready, Sent/Viewed = live, Signed/Invoiced/Paid = read-only "you've already signed" states).

## 5. The payment flow

Provider is **Xero** (`lib/xero.ts`), OAuth2 with a stored refresh token (granular `accounting.invoices` + `accounting.contacts` scopes — required for apps registered post–March 2026). There is no checkout page or card capture in this app; "payment" means a Xero invoice gets created and emailed to the client, who pays via whatever link/method Xero's own emailed invoice offers.

Only **instalment #1** is created and emailed synchronously, inside `/api/sign`, immediately after signing. Instalments #2+ are pre-computed and stored in Proposal Invoices with blank Xero fields, then created + emailed later by the cron job as their due date approaches — this was a deliberate choice so a client on a 3- or 6-month plan doesn't get every future invoice in their inbox on day one.

**There is no webhook or poll for Xero marking an invoice as actually paid.** "Paid" exists as a Status value in the type system and UI logic but nothing in the code ever sets it — see §7.

## 6. Automation

- **Vercel Cron**, daily at 08:00 (`vercel.json` → `/api/cron/send-due-invoices`): finds Proposal Invoices rows with a blank Xero Invoice ID due within `XERO_INVOICE_LEAD_DAYS` (default 3 days), creates + emails each one via the same Xero helper used at signing.
- **Slack alert** (`lib/slack.ts`, no-op if `SLACK_WEBHOOK_URL` unset): posts to a separate Slack workspace for every instalment the cron processes, success or failure, so Zoë can manually cross-check against Xero.
- **Emailing** itself is entirely Xero's — the app calls Xero's "email this invoice" endpoint; there's no independent email service.

## 7. Half-finished, stubbed, or known-broken

- **No "Paid" detection at all.** Nothing marks a Xero invoice as paid back in Airtable — Status stops at "Invoiced" forever. Anything downstream that should trigger on payment (e.g. provisioning a client elsewhere) doesn't exist yet.
- **No VAT/tax handling.** Line items are sent to Xero with no `TaxType`; whatever VAT gets applied depends entirely on the default tax rate set on the Xero Sales account, not on anything this app controls.
- **Deposit Amount is a manual, per-proposal escape hatch**, not a real feature: it overrides instalment #1 and splits the remainder over the chosen plan's month count, but there's no way to set custom due dates per instalment — those are always today+7 days, then +1 month each.
- **The Page 1 payment-plan preview ignores Deposit Amount.** `OptionsForm.tsx` computes its own preview installments client-side (for display only) without knowing about a deposit override, so a proposal with one set will show the wrong per-instalment amounts on that page even though the actual stored schedule (computed server-side) is correct.
- **If Xero invoice creation fails at signing**, the proposal is left stuck at Status "Signed" with no retry — it's caught and logged (`console.error`) but never surfaced to Zoë or retried automatically.
- **Login has no rate limiting or lockout** — a single shared password, no attempt throttling.
- **Dead schema**: `Offers.Default Line Items`, `Proposals.Date Sent`, and `Proposals`' top-level `Xero Invoice ID`/`Xero Online Invoice URL` fields all still exist in Airtable but nothing in the app reads or writes them anymore.
