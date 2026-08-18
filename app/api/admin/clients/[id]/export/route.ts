import { NextRequest, NextResponse } from "next/server";
import { getClientExportText } from "@/lib/clientExport";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const text = await getClientExportText(id);
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }
}
