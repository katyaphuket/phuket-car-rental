import { after, NextRequest, NextResponse } from "next/server";
import { isLeadNotifyConfigured, newLeadIds, notifyNewLead, UNSORTED_STATUS_ID } from "@/lib/lead-notify";
import { fillOfferLinks, findOfferLinkFieldId, leadsWithoutOfferLink } from "@/lib/amo-offer-link";
import { isAmoConfigured } from "@/lib/amocrm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  const { secret } = await params;
  const expected = process.env.AMO_WEBHOOK_SECRET;
  if (!expected || secret !== expected) {
    return new NextResponse(null, { status: 404 });
  }

  const form = await req.formData().catch(() => null);
  const leadIds = form && isLeadNotifyConfigured() ? newLeadIds(form) : [];

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

  // Поле «🚗 Подобрать авто»: вписываем ссылку в сделки, где её ещё нет («Неразобранное» не трогаем).
  if (form && isAmoConfigured()) {
    after(async () => {
      try {
        const fieldId = await findOfferLinkFieldId(AbortSignal.timeout(10000));
        if (!fieldId) return;
        const missing = leadsWithoutOfferLink(form, fieldId).filter((id) =>
          [...form.entries()].every(
            ([key, value]) => !(key.endsWith("[status_id]") && value === String(UNSORTED_STATUS_ID) && form.get(key.replace("[status_id]", "[id]")) === id)
          )
        );
        await fillOfferLinks(missing, fieldId);
      } catch (error) {
        console.error("Offer link field update failed:", error);
      }
    });
  }

  return NextResponse.json({ ok: true });
}
