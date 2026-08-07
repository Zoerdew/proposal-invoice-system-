import { NextRequest, NextResponse } from "next/server";
import { createMetricReading } from "@/lib/db/metrics";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ metricId: string }> }
) {
  const { metricId } = await params;
  const body = await request.json().catch(() => null);
  const value = Number(body?.value);
  if (!Number.isFinite(value)) {
    return NextResponse.json({ error: "Invalid value." }, { status: 400 });
  }

  const reading = await createMetricReading(metricId, value);
  return NextResponse.json(reading, { status: 201 });
}
