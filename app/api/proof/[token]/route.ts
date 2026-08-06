import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getClientByToken } from "@/lib/db/clients";
import { createProof } from "@/lib/db/proof";

const PROOF_TYPES = ["Testimonial", "Thank You", "Unprompted Praise"] as const;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const client = await getClientByToken(token);

  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Fixed while porting (BUILD-SPEC.md): the page-level gate that redirects
  // to onboarding doesn't cover API routes hit directly.
  if (!client.onboardingComplete) {
    return NextResponse.json({ error: "Complete onboarding first" }, { status: 403 });
  }

  const formData = await req.formData();
  const type = formData.get("type");
  const text = formData.get("text");
  const source = formData.get("source");
  const screenshot = formData.get("screenshot");

  if (
    typeof type !== "string" ||
    !PROOF_TYPES.includes(type as (typeof PROOF_TYPES)[number]) ||
    typeof text !== "string" ||
    !text.trim() ||
    typeof source !== "string" ||
    !source.trim()
  ) {
    return NextResponse.json({ error: "Invalid proof data" }, { status: 400 });
  }

  let screenshotUrl: string | undefined;
  if (screenshot instanceof File && screenshot.size > 0) {
    const blob = await put(`proof/${client.id}-${Date.now()}-${screenshot.name}`, screenshot, {
      access: "public",
    });
    screenshotUrl = blob.url;
  }

  const proof = await createProof(client.id, {
    type: type as (typeof PROOF_TYPES)[number],
    text,
    source,
    screenshotUrl,
  });

  return NextResponse.json(proof, { status: 201 });
}
