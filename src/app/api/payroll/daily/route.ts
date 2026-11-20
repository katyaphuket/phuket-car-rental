import { NextRequest, NextResponse } from "next/server";
import { isPayrollConfigured, payrollEngine, telegramApi } from "@/lib/payroll";
import { OWNER } from "@/lib/payroll/logic";
import { sheetsStore } from "@/lib/payroll/sheets-store";

export const maxDuration = 300;

// Called by Vercel Cron, which sends CRON_SECRET as a bearer token. The main run is at 18:00
// Phuket; the backup at 20:00 (?backup=1) does the work only if the main one did not.
export async function GET(req: NextRequest) {
  if (!isPayrollConfigured() || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse(null, { status: 404 });
  }

  const backup = req.nextUrl.searchParams.get("backup") === "1";
  try {
    const engine = payrollEngine();
    if (backup && (await engine.ranToday())) return NextResponse.json({ ok: true, skipped: "already ran today" });
    const result = await engine.dailyRun();
    return NextResponse.json({ ok: true, backup, ...result });
  } catch (error) {
    console.error("Payroll daily run failed:", error);
    await tellOwner(backup, error).catch((notifyError) => console.error("Owner alert failed:", notifyError));
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// Without this the bot would just stay silent for the evening, as it did once.
async function tellOwner(backup: boolean, error: unknown) {
  const reason = String(error instanceof Error ? error.message : error).slice(0, 300);
  const text = backup
    ? `⚠️ Вечерняя проверка не прошла и в 20:00. Сводки сегодня не будет, напишите Claude.\nПричина: ${reason}`
    : `⚠️ Вечерняя проверка в 18:00 не прошла. Бот попробует ещё раз в 20:00.\nПричина: ${reason}`;
  const owners = (await sheetsStore.people()).filter((p) => p.name === OWNER);
  for (const owner of owners) await telegramApi("sendMessage", { chat_id: owner.chat, text });
}
