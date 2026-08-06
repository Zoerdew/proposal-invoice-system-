import { db } from "./client";

export interface XeroConnection {
  id: string;
  tenantId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string | null;
}

export interface XeroConnectionInput {
  tenantId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export async function getXeroConnection(): Promise<XeroConnection | null> {
  const { data, error } = await db()
    .from("xero_connection")
    .select("*")
    .eq("label", "default")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    tenantId: data.tenant_id ?? "",
    accessToken: data.access_token ?? "",
    refreshToken: data.refresh_token ?? "",
    expiresAt: data.expires_at,
  };
}

export async function upsertXeroConnection(input: XeroConnectionInput): Promise<void> {
  const existing = await getXeroConnection();
  const fields = {
    tenant_id: input.tenantId,
    access_token: input.accessToken,
    refresh_token: input.refreshToken,
    expires_at: input.expiresAt,
  };
  if (existing) {
    const { error } = await db().from("xero_connection").update(fields).eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await db()
      .from("xero_connection")
      .insert({ label: "default", ...fields });
    if (error) throw error;
  }
}
