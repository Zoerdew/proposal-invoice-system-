import { getXeroConnection, upsertXeroConnection, XeroConnection } from "./db/xeroConnection";
import { Proposal } from "./db/proposals";

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
    tenantId,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
  });
}

async function refreshTokens(
  connection: XeroConnection
): Promise<{ accessToken: string; tenantId: string }> {
  const res = await fetch(XERO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: await basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: connection.refreshToken,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Xero token refresh failed: ${res.status} ${await res.text()}`);
  }
  const tokens = (await res.json()) as XeroTokenResponse;
  await upsertXeroConnection({
    tenantId: connection.tenantId,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
  });
  return {
    accessToken: tokens.access_token,
    tenantId: connection.tenantId,
  };
}

async function getValidAccessToken(): Promise<{ accessToken: string; tenantId: string }> {
  const connection = await getXeroConnection();
  if (!connection) {
    throw new Error(
      "Xero is not connected yet — visit /api/xero/connect once to authorize this app against Zoë's Xero org."
    );
  }
  const expiresAt = connection.expiresAt ? new Date(connection.expiresAt).getTime() : 0;
  // Refresh a minute early to avoid racing the expiry.
  if (expiresAt - Date.now() < 60_000) {
    return refreshTokens(connection);
  }
  return {
    accessToken: connection.accessToken,
    tenantId: connection.tenantId,
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
  proposal: Proposal,
  invoiceLineItems: XeroLineItem[],
  dueDate: string
): Promise<{ invoiceId: string; onlineInvoiceUrl: string }> {
  const contactName = proposal.company || proposal.clientName || "Client";

  const created = await xeroApiRequest<XeroInvoiceResponse>("Invoices", {
    method: "POST",
    body: JSON.stringify({
      Invoices: [
        {
          Type: "ACCREC",
          Contact: { Name: contactName, EmailAddress: proposal.clientEmail },
          LineItems: invoiceLineItems,
          Reference: proposal.clientName ?? "",
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
