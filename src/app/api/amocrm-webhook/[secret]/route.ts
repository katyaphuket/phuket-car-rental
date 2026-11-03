import { after, NextRequest, NextResponse } from "next/server";
import { isLeadNotifyConfigured, newLeadIds, notifyNewLead } from "@/lib/lead-notify";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  const { secret } = await params;
  const expected = process.env.AMO_WEBHOOK_SECRET;
  if (!expected || secret !== expected || !isLeadNotifyConfigured()) {
    return new NextResponse(null, { status: 404 });
  }

  const form = await req.formData().catch(() => null);
  const leadIds = form ? newLeadIds(form) : [];

  // amoCRM wants a quick answer and repeats the webhook otherwise, so the work runs after it.
  after(() =>
    Promise.all(
      leadIds.map((leadId) =>
        notifyNewLead(leadId).catch((error) => {
          console.error(`Lead ${leadId} notification failed:`, error);
        })
      )
    )
  );

  return NextResponse.json({ ok: true });
}
