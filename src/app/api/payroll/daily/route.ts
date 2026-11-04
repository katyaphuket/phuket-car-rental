import { NextRequest, NextResponse } from "next/server";
import { isPayrollConfigured, payrollEngine } from "@/lib/payroll";

export const maxDuration = 300;

// Called by Vercel Cron, which sends CRON_SECRET as a bearer token.
export async function GET(req: NextRequest) {
  if (!isPayrollConfigured() || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse(null, { status: 404 });
  }

  const result = await payrollEngine().dailyRun();
  return NextResponse.json({ ok: true, ...result });
}
