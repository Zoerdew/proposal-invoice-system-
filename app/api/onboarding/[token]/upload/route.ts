import { NextRequest, NextResponse } from "next/server";
// Requires BLOB_READ_WRITE_TOKEN — provisioned in Vercel after this route
// was first written (Phase 7), hence this comment forcing a rebuild.
import { put } from "@vercel/blob";
import { getClientByToken } from "@/lib/db/clients";
import { createDataSource } from "@/lib/db/dataSources";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const client = await getClientByToken(token);

  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const blob = await put(`onboarding/${client.id}-${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  const dataSource = await createDataSource(client.id, {
    kind: file.name,
    fileUrl: blob.url,
  });

  return NextResponse.json(dataSource, { status: 201 });
}
