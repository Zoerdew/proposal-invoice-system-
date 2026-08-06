import { db } from "./client";

export interface SignatureInput {
  proposalId: string;
  signedName: string;
  ipAddress: string;
  confirmed: boolean;
}

export async function createSignature(input: SignatureInput): Promise<void> {
  const { error } = await db().from("signatures").insert({
    proposal_id: input.proposalId,
    signed_name: input.signedName,
    signed_at: new Date().toISOString(),
    ip_address: input.ipAddress,
    confirmed: input.confirmed,
  });
  if (error) throw error;
}
