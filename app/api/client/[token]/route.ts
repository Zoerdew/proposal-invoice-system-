import { NextRequest, NextResponse } from "next/server";
import { getClientByToken } from "@/lib/db/clients";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const client = await getClientByToken(token);

  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(client);
}
