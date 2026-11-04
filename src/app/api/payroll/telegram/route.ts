import { NextRequest, NextResponse } from "next/server";
import { isPayrollConfigured, payrollEngine } from "@/lib/payroll";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!isPayrollConfigured() || req.headers.get("x-telegram-bot-api-secret-token") !== process.env.PAYROLL_TELEGRAM_SECRET) {
    return new NextResponse(null, { status: 404 });
  }

  const update = await req.json().catch(() => null);
  if (!update) return NextResponse.json({ ok: true });

  // A failure is logged rather than returned: Telegram would keep resending the same update
  // and hold back every newer answer behind it.
  try {
    await payrollEngine().onUpdate(update);
  } catch (error) {
    console.error("Payroll Telegram update failed:", error);
  }
  return NextResponse.json({ ok: true });
}
