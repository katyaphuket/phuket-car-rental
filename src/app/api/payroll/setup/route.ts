import { NextRequest, NextResponse } from "next/server";
import { isPayrollConfigured, payrollEngine, telegramApi } from "@/lib/payroll";
import { prepareSheet } from "@/lib/payroll/sheets-store";

export const maxDuration = 300;

// Safe to repeat. ?step=prepare makes the tabs and connects the bot; ?step=import brings in
// rentals already under way, so it runs after the managers have joined the bot.
export async function POST(req: NextRequest) {
  if (!isPayrollConfigured() || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse(null, { status: 404 });
  }

  const step = req.nextUrl.searchParams.get("step");
  if (step === "prepare") {
    await prepareSheet();
    await telegramApi("setWebhook", {
      url: `${req.nextUrl.origin}/api/payroll/telegram`,
      secret_token: process.env.PAYROLL_TELEGRAM_SECRET,
      allowed_updates: ["message", "callback_query"],
    });
    await telegramApi("setMyCommands", {
      commands: [
        { command: "zayavki", description: "Мои заявки и зарплата" },
        { command: "itogi", description: "Итоги для владелицы" },
      ],
    });
    return NextResponse.json({ ok: true, step });
  }

  if (step === "import") {
    return NextResponse.json({ ok: true, step, ...(await payrollEngine().importExisting()) });
  }

  return NextResponse.json({ ok: false, error: "step must be prepare or import" }, { status: 400 });
}
