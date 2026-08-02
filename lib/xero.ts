import {
  TABLES,
  XeroConnectionFields,
  createRecord,
  listAll,
  updateRecord,
  ProposalFields,
  AirtableRecord,
} from "./airtable";

const XERO_AUTH_URL = "https://login.xero.com/identity/connect/authorize";
const XERO_TOKEN_URL = "https://identity.xero.com/connect/token";
const XERO_CONNECTIONS_URL = "https://api.xero.com/connections";
const XERO_API_BASE = "https://api.xero.com/api.xro/2.0";

// Standard "Sales" account code in a new Xero org's default chart of accounts.
// Override with XERO_SALES_ACCOUNT_CODE if Zoë's real chart of accounts differs.
const DEFAULT_SALES_ACCOUNT_CODE = "200";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export function getXeroAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: requireEnv("XERO_CLIENT_ID"),
    redirect_uri: requireEnv("XERO_REDIRECT_URI"),
    // offline_access is required to receive a refresh token — without it the
    // access token would expire in 30 minutes with no way to renew it.
    // Apps registered from March 2026 onward don't have access to the old
    // broad "accounting.transactions" scope — invoices need the granular
    // "accounting.invoices" scope instead. accounting.contacts is unchanged.
    scope: "openid profile email offline_access accounting.invoices accounting.contacts",
    state,
  });
  return `${XERO_AUTH_URL}?${params.toString()}`;
}

async function getXeroConnectionRecord(): Promise<AirtableRecord<XeroConnectionFields> | null> {
  const records = await listAll<XeroConnectionFields>(
    TABLES.xeroConnection,
    `{Label} = 'default'`
  );
  return records[0] ?? null;
}

async function basicAuthHeader(): Promise<string> {
  const clientId = requireEnv("XERO_CLIENT_ID");
  const clientSecret = requireEnv("XERO_CLIENT_SECRET");
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

interface XeroTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export async function exchangeCodeForTokens(code: string): Promise<void> {
  const res = await fetch(XERO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: await basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: requireEnv("XERO_REDIRECT_URI"),
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Xero token exchange failed: ${res.status} ${await res.text()}`);
  }
  const tokens = (await res.json()) as XeroTokenResponse;

  const connectionsRes = await fetch(XERO_CONNECTIONS_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
    cache: "no-store",
  });
  if (!connectionsRes.ok) {
    throw new Error(
      `Fetching Xero connections failed: ${connectionsRes.status} ${await connectionsRes.text()}`
    );
  }
  const connections = (await connectionsRes.json()) as { tenantId: string }[];
  const tenantId = connections[0]?.tenantId;
  if (!tenantId) throw new Error("No Xero organisation connected to this app");

  await upsertXeroConnection({
    Label: "default",
    "Tenant ID": tenantId,
    "Access Token": tokens.access_token,
    "Refresh Token": tokens.refresh_token,
    "Expires At": new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
  });
}

async function upsertXeroConnection(fields: XeroConnectionFields): Promise<void> {
  const existing = await getXeroConnectionRecord();
  if (existing) {
    await updateRecord(TABLES.xeroConnection, existing.id, fields);
  } else {
    await createRecord(TABLES.xeroConnection, fields);
  }
}

async function refreshTokens(
  record: AirtableRecord<XeroConnectionFields>
): Promise<{ accessToken: string; tenantId: string }> {
  const res = await fetch(XERO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: await basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: record.fields["Refresh Token"] ?? "",
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Xero token refresh failed: ${res.status} ${await res.text()}`);
  }
  const tokens = (await res.json()) as XeroTokenResponse;
  await updateRecord(TABLES.xeroConnection, record.id, {
    "Access Token": tokens.access_token,
    "Refresh Token": tokens.refresh_token,
    "Expires At": new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
  });
  return {
    accessToken: tokens.access_token,
    tenantId: record.fields["Tenant ID"] ?? "",
  };
}

async function getValidAccessToken(): Promise<{ accessToken: string; tenantId: string }> {
  const record = await getXeroConnectionRecord();
  if (!record) {
    throw new Error(
      "Xero is not connected yet — visit /api/xero/connect once to authorize this app against Zoë's Xero org."
    );
  }
  const expiresAt = record.fields["Expires At"]
    ? new Date(record.fields["Expires At"]).getTime()
    : 0;
  // Refresh a minute early to avoid racing the expiry.
  if (expiresAt - Date.now() < 60_000) {
    return refreshTokens(record);
  }
  return {
    accessToken: record.fields["Access Token"] ?? "",
    tenantId: record.fields["Tenant ID"] ?? "",
  };
}

async function xeroApiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { accessToken, tenantId } = await getValidAccessToken();
  const res = await fetch(`${XERO_API_BASE}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Xero-tenant-id": tenantId,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Xero API ${res.status} on ${path}: ${await res.text()}`);
  }
  // Action endpoints (e.g. Invoices/{id}/Email) return an empty body.
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

interface XeroInvoiceResponse {
  Invoices: {
    InvoiceID: string;
  }[];
}

export interface XeroLineItem {
  Description?: string;
  Quantity: number;
  UnitAmount: number;
  AccountCode: string;
}

export function getSalesAccountCode(): string {
  return process.env.XERO_SALES_ACCOUNT_CODE || DEFAULT_SALES_ACCOUNT_CODE;
}

// Creates, emails, and fetches the online URL for one invoice. Used both for
// installment #1 at signing and for later installments from the cron job —
// each call is a single, immediate create-and-send with no internal
// scheduling of its own.
export async function createXeroInvoice(
  proposal: AirtableRecord<ProposalFields>,
  invoiceLineItems: XeroLineItem[],
  dueDate: string
): Promise<{ invoiceId: string; onlineInvoiceUrl: string }> {
  const contactName = proposal.fields.Company || proposal.fields["Client Name"] || "Client";

  const created = await xeroApiRequest<XeroInvoiceResponse>("Invoices", {
    method: "POST",
    body: JSON.stringify({
      Invoices: [
        {
          Type: "ACCREC",
          Contact: { Name: contactName, EmailAddress: proposal.fields["Client Email"] },
          LineItems: invoiceLineItems,
          Reference: proposal.fields["Client Name"] ?? "",
          Status: "AUTHORISED",
          DueDate: dueDate,
        },
      ],
    }),
  });

  const invoiceId = created.Invoices[0]?.InvoiceID;
  if (!invoiceId) throw new Error("Xero did not return an InvoiceID");

  await xeroApiRequest(`Invoices/${invoiceId}/Email`, { method: "POST" });

  // The online invoice URL isn't on the regular invoice object — it's only
  // available via this dedicated endpoint.
  const online = await xeroApiRequest<{ OnlineInvoices: { OnlineInvoiceUrl: string }[] }>(
    `Invoices/${invoiceId}/OnlineInvoice`
  );
  const onlineInvoiceUrl = online.OnlineInvoices[0]?.OnlineInvoiceUrl ?? "";

  return { invoiceId, onlineInvoiceUrl };
}
