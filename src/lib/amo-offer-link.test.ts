import { describe, expect, it } from "vitest";
import { leadsWithoutOfferLink, managerLinkForLead } from "./amo-offer-link";

const FIELD_ID = 555;

function form(entries: [string, string][]) {
  const data = new FormData();
  for (const [key, value] of entries) data.append(key, value);
  return data;
}

describe("поле «Подобрать авто» в сделке", () => {
  it("находит новые и изменённые сделки без ссылки", () => {
    const data = form([
      ["leads[add][0][id]", "101"],
      ["leads[update][0][id]", "102"],
      ["leads[update][0][custom_fields][0][id]", "777"],
      ["leads[update][0][custom_fields][0][values][0][value]", "что-то другое"],
    ]);
    expect(leadsWithoutOfferLink(data, FIELD_ID)).toEqual(["101", "102"]);
  });

  it("пропускает сделки, где ссылка уже есть — иначе amoCRM гонял бы вебхук по кругу", () => {
    const data = form([
      ["leads[update][0][id]", "103"],
      ["leads[update][0][custom_fields][0][id]", "777"],
      ["leads[update][0][custom_fields][0][values][0][value]", "x"],
      ["leads[update][0][custom_fields][1][id]", String(FIELD_ID)],
      ["leads[update][0][custom_fields][1][values][0][value]", managerLinkForLead(103)],
    ]);
    expect(leadsWithoutOfferLink(data, FIELD_ID)).toEqual([]);
  });

  it("ссылка ведёт на страницу менеджера с номером сделки", () => {
    expect(managerLinkForLead(42)).toBe("https://phuketrentcar.com/manager?lead=42");
  });
});
