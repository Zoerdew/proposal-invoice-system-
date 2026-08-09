import { NextRequest, NextResponse } from "next/server";
// access: "public" requires the connected Blob store to be a public store
// (set at store creation, not changeable after) — a private store rejects
// this call outright. Same pattern as app/api/onboarding/[token]/upload/route.ts.
import { put } from "@vercel/blob";
import { getLead, createLeadAttachment } from "@/lib/db/leads";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lead = await getLead(id).catch(() => null);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const blob = await put(`leads/${id}-${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  const attachment = await createLeadAttachment(id, {
    fileUrl: blob.url,
    fileName: file.name,
  });

  return NextResponse.json(attachment, { status: 201 });
}
