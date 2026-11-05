import { createSign } from "node:crypto";
import type { Store } from "@/lib/payroll/engine";
import { type Accrual, type Deal, type DealState, type Person, SHARE_KEYS, SHARES, STATE_LABEL, uniqueAccruals } from "@/lib/payroll/logic";

const TIMEOUT_MS = 15000;
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const API = "https://sheets.googleapis.com/v4/spreadsheets";

const TAB_DEALS = "Заявки";
const TAB_ACCRUALS = "Начисления";
const TAB_PEOPLE = "Люди";
const TAB_SUMMARY = "Итоги";

const DEAL_HEADER = ["Сделка (минус: только RentProg)", "Клиент", "Машина", "Выдача", "Возврат", "Аренда", "Чья", "Статус", "Правка вручную", "Последний вопрос", "Список", "Ответ", "Сообщения", "Оплата за месяц", "Следующая оплата"];
const ACCRUAL_HEADER = ["Дата", "Месяц", "Сделка", "Машина", "Тип", "База", "Кому", "Доля", "Начислено", "Ключ", "Аренда (доля)", "Ссылка", "Клиент", "Даты аренды"];
const PEOPLE_HEADER = ["Telegram", "Кто"];

const STATE_BY_LABEL = Object.fromEntries(Object.entries(STATE_LABEL).map(([state, label]) => [label, state])) as Record<string, DealState>;

const MONTH_NAMES = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

export function monthTabTitle(month: string) {
  return `${MONTH_NAMES[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;
}

// A month sheet holds only formulas over "Начисления", so it can never disagree with the data.
export function monthTabCells(month: string, sep = ","): string[][] {
  const data = `'${TAB_ACCRUALS}'!A:N`;
  const inMonth = `'${TAB_ACCRUALS}'!B:B${sep}"${month}"`;
  return [
    [monthTabTitle(month)],
    ["Всего аренды", `=SUMIFS('${TAB_ACCRUALS}'!K:K${sep}${inMonth})`, "Всего 5%", `=SUMIFS('${TAB_ACCRUALS}'!I:I${sep}${inMonth})`],
    [],
    ["Кто заработал"],
    [`=IFERROR(QUERY(${data}${sep}"select G, sum(K), sum(I) where B='${month}' group by G order by sum(I) desc label G 'Кто', sum(K) 'Аренда', sum(I) '5%'"${sep}1)${sep}"Пока начислений нет")`],
    ...Array.from({ length: 7 }, () => []),
    ["Все начисления"],
    [`=IFERROR(QUERY(${data}${sep}"select A, D, M, N, E, K, G, I, L where B='${month}' order by A, C label A 'Начислено', D 'Машина', M 'Клиент', N 'Даты аренды', E 'Тип', K 'Аренда', G 'Кому', I '5%', L 'Ссылка'"${sep}1)${sep}"Пока начислений нет")`],
  ];
}

function monthsBetween(first: string, last: string) {
  const months: string[] = [];
  const cursor = new Date(`${first}-01T00:00:00Z`);
  while (cursor.toISOString().slice(0, 7) <= last) {
    months.push(cursor.toISOString().slice(0, 7));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

async function accessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) throw new Error("Google service account is not configured");

  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${base64url(
    JSON.stringify({ iss: email, scope: SCOPE, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })
  )}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(key);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${base64url(signature)}`,
    }),
  });
  if (!res.ok) throw new Error(`Google token failed: ${res.status}`);

  const body: { access_token: string; expires_in: number } = await res.json();
  cachedToken = { token: body.access_token, expiresAt: Date.now() + (body.expires_in - 60) * 1000 };
  return body.access_token;
}

async function sheets(path: string, init?: RequestInit) {
  const res = await fetch(`${API}/${process.env.PAYROLL_SHEET_ID}${path}`, {
    ...init,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const details = await res.text().catch(() => "");
    throw new Error(`Google Sheets ${path} failed: ${res.status} ${details.slice(0, 300)}`);
  }
  return res.json();
}

const range = (tab: string, cells: string) => encodeURIComponent(`'${tab}'!${cells}`);

async function readRows(tab: string): Promise<string[][]> {
  const body: { values?: string[][] } = await sheets(`/values/${range(tab, "A2:Z")}?valueRenderOption=UNFORMATTED_VALUE`);
  return (body.values ?? []).map((row) => row.map((cell) => String(cell)));
}

// RAW keeps a lead name like "=1+1" as text instead of a formula.
async function appendRows(tab: string, rows: (string | number)[][]) {
  await sheets(`/values/${range(tab, "A1")}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: "POST",
    body: JSON.stringify({ values: rows }),
  });
}

async function writeRow(tab: string, rowNumber: number, row: (string | number)[]) {
  await sheets(`/values/${range(tab, `A${rowNumber}`)}?valueInputOption=RAW`, {
    method: "PUT",
    body: JSON.stringify({ values: [row] }),
  });
}

function dealToRow(deal: Deal): (string | number)[] {
  return [
    deal.leadId,
    deal.name,
    deal.car,
    deal.start,
    deal.end,
    deal.rent,
    deal.share ? SHARES[deal.share].label : "",
    STATE_LABEL[deal.state],
    deal.manual ? "да" : "",
    deal.lastAsked,
    deal.blockKey,
    deal.note,
    JSON.stringify(deal.messages),
    deal.monthlySum,
    deal.nextPay,
  ];
}

function rowToDeal(row: string[]): Deal | null {
  const leadId = Number(row[0]);
  const state = STATE_BY_LABEL[row[7]];
  if (!leadId || !state) return null;

  let messages: Deal["messages"] = [];
  try {
    messages = JSON.parse(row[12] || "[]");
  } catch {
    messages = [];
  }
  return {
    leadId,
    name: row[1] ?? "",
    car: row[2] ?? "",
    start: row[3] ?? "",
    end: row[4] ?? "",
    rent: Number(row[5]) || 0,
    share: SHARE_KEYS.find((key) => SHARES[key].label === row[6]) ?? "",
    state,
    manual: row[8] === "да",
    lastAsked: row[9] ?? "",
    blockKey: row[10] ?? "",
    note: row[11] ?? "",
    messages,
    monthlySum: Number(row[13]) || 0,
    nextPay: row[14] ?? "",
  };
}

function accrualLink(leadId: number) {
  return leadId < 0 ? "только в RentProg" : `${process.env.AMOCRM_BASE_URL?.replace(/\/+$/, "")}/leads/detail/${leadId}`;
}

// Google reads a formula by the sheet's locale: a Russian sheet needs ";" between arguments.
async function formulaSeparator() {
  const meta: { properties: { locale?: string } } = await sheets("?fields=properties.locale");
  return /^(en|th|ja|ko|zh)/.test(meta.properties.locale ?? "en") ? "," : ";";
}

async function existingTabs() {
  const meta: { sheets: { properties: { title: string; sheetId: number } }[] } = await sheets("?fields=sheets.properties(title,sheetId)");
  return new Map(meta.sheets.map((s) => [s.properties.title, s.properties.sheetId]));
}

function boldRow(sheetId: number, row: number, fontSize = 10) {
  return {
    repeatCell: {
      range: { sheetId, startRowIndex: row, endRowIndex: row + 1 },
      cell: { userEnteredFormat: { textFormat: { bold: true, fontSize } } },
      fields: "userEnteredFormat.textFormat",
    },
  };
}

function columnWidth(sheetId: number, from: number, to: number, pixelSize: number) {
  return {
    updateDimensionProperties: {
      range: { sheetId, dimension: "COLUMNS", startIndex: from, endIndex: to },
      properties: { pixelSize },
      fields: "pixelSize",
    },
  };
}

function monthColumnWidths(sheetId: number) {
  return [
    columnWidth(sheetId, 0, 1, 130),
    columnWidth(sheetId, 1, 2, 230),
    columnWidth(sheetId, 2, 3, 180),
    columnWidth(sheetId, 3, 4, 110),
    columnWidth(sheetId, 4, 8, 110),
    columnWidth(sheetId, 8, 9, 320),
  ];
}

const MONTH_ROWS = { title: 0, totals: 1, peopleTitle: 3, peopleHeader: 4, listTitle: 12, listHeader: 13 };

// New months go first, so the current one opens without scrolling through the tabs.
async function ensureMonthTabs(months: string[]) {
  const tabs = await existingTabs();
  for (const month of [...months].sort()) {
    const title = monthTabTitle(month);
    if (tabs.has(title)) continue;
    const added: { replies: { addSheet: { properties: { sheetId: number } } }[] } = await sheets(":batchUpdate", {
      method: "POST",
      body: JSON.stringify({ requests: [{ addSheet: { properties: { title, index: 0 } } }] }),
    });
    const sheetId = added.replies[0].addSheet.properties.sheetId;
    await sheets(`/values/${range(title, "A1")}?valueInputOption=USER_ENTERED`, {
      method: "PUT",
      body: JSON.stringify({ values: monthTabCells(month, await formulaSeparator()) }),
    });
    await sheets(":batchUpdate", {
      method: "POST",
      body: JSON.stringify({
        requests: [
          boldRow(sheetId, MONTH_ROWS.title, 14),
          boldRow(sheetId, MONTH_ROWS.totals),
          boldRow(sheetId, MONTH_ROWS.peopleTitle, 12),
          boldRow(sheetId, MONTH_ROWS.peopleHeader),
          boldRow(sheetId, MONTH_ROWS.listTitle, 12),
          boldRow(sheetId, MONTH_ROWS.listHeader),
          ...monthColumnWidths(sheetId),
        ],
      }),
    });
    tabs.set(title, sheetId);
  }
}

// Rows written before the client and dates columns existed get them from the deal.
export async function fillAccrualDetails(deals: Deal[]) {
  const rows = await readRows(TAB_ACCRUALS);
  const values = rows.map((row) => {
    const deal = deals.find((d) => d.leadId === Number(row[2]));
    return deal ? [deal.name, `${deal.start.slice(8, 10)}.${deal.start.slice(5, 7)}–${deal.end.slice(8, 10)}.${deal.end.slice(5, 7)}`] : [row[12] ?? "", row[13] ?? ""];
  });
  if (!values.length) return;
  await sheets(`/values/${range(TAB_ACCRUALS, `M2:N${values.length + 1}`)}?valueInputOption=RAW`, {
    method: "PUT",
    body: JSON.stringify({ values }),
  });
}

export function isSheetsConfigured() {
  return Boolean(process.env.PAYROLL_SHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY);
}

export const sheetsStore: Store = {
  async deals() {
    return (await readRows(TAB_DEALS)).map(rowToDeal).filter((d): d is Deal => d !== null);
  },

  // Google allows about 60 requests a minute, so whole lists go in a single request.
  async insertDeals(deals) {
    if (deals.length) await appendRows(TAB_DEALS, deals.map(dealToRow));
  },

  async updateDeals(deals) {
    if (!deals.length) return;
    const rows = await readRows(TAB_DEALS);
    const data = deals.flatMap((deal) => {
      const index = rows.findIndex((row) => Number(row[0]) === deal.leadId);
      if (index < 0) {
        console.error(`Deal ${deal.leadId} is missing from the sheet`);
        return [];
      }
      return [{ range: `'${TAB_DEALS}'!A${index + 2}`, values: [dealToRow(deal)] }];
    });
    await sheets("/values:batchUpdate", {
      method: "POST",
      body: JSON.stringify({ valueInputOption: "RAW", data }),
    });
  },

  async accruals() {
    const rows = (await readRows(TAB_ACCRUALS)).filter((row) => row[0]);
    return uniqueAccruals(
      rows.map(
        (row): Accrual => ({
          date: row[0],
          leadId: Number(row[2]),
          car: row[3] ?? "",
          type: row[4] ?? "",
          base: Number(row[5]) || 0,
          person: row[6] ?? "",
          fraction: Number(row[7]) || 0,
          amount: Number(row[8]) || 0,
          key: row[9] ?? "",
        })
      )
    );
  },

  async addAccruals(rows) {
    await appendRows(
      TAB_ACCRUALS,
      rows.map((r) => [r.date, r.date.slice(0, 7), r.leadId, r.car, r.type, r.base, r.person, r.fraction, r.amount, r.key, r.base * r.fraction, accrualLink(r.leadId), r.client ?? "", r.period ?? ""])
    );
    await ensureMonthTabs([...new Set(rows.map((r) => r.date.slice(0, 7)))]);
  },

  async people() {
    return (await readRows(TAB_PEOPLE))
      .map((row): Person => ({ chat: Number(row[0]), name: row[1] ?? "" }))
      .filter((person) => person.chat && person.name);
  },

  async savePerson(person) {
    const rows = await readRows(TAB_PEOPLE);
    const index = rows.findIndex((row) => Number(row[0]) === person.chat);
    if (index >= 0) await writeRow(TAB_PEOPLE, index + 2, [person.chat, person.name]);
    else await appendRows(TAB_PEOPLE, [[person.chat, person.name]]);
  },
};

// Safe to run again: only missing tabs are created, and headers are rewritten as they were.
export async function prepareSheet() {
  const existing = await existingTabs();
  const missing = [TAB_DEALS, TAB_ACCRUALS, TAB_PEOPLE, TAB_SUMMARY].filter((tab) => !existing.has(tab));
  if (missing.length) {
    await sheets(":batchUpdate", {
      method: "POST",
      body: JSON.stringify({ requests: missing.map((title) => ({ addSheet: { properties: { title } } })) }),
    });
  }

  await writeRow(TAB_DEALS, 1, DEAL_HEADER);
  await writeRow(TAB_ACCRUALS, 1, ACCRUAL_HEADER);
  await writeRow(TAB_PEOPLE, 1, PEOPLE_HEADER);

  const tabs = await existingTabs();
  const dataTabs = [TAB_DEALS, TAB_ACCRUALS, TAB_PEOPLE].map((tab) => tabs.get(tab) as number);
  await sheets(":batchUpdate", {
    method: "POST",
    body: JSON.stringify({
      requests: dataTabs.flatMap((sheetId) => [
        boldRow(sheetId, 0),
        { updateSheetProperties: { properties: { sheetId, gridProperties: { frozenRowCount: 1 } }, fields: "gridProperties.frozenRowCount" } },
      ]),
    }),
  });

  const sep = await formulaSeparator();
  const query = `=IFERROR(QUERY('${TAB_ACCRUALS}'!A:L${sep}"select G, sum(I) where I is not null group by G pivot B label G 'Кто'"${sep}1)${sep}"Пока начислений нет")`;
  await sheets(`/values/${range(TAB_SUMMARY, "A1")}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    body: JSON.stringify({ values: [[query]] }),
  });

  const firstMonth = (process.env.PAYROLL_START_DATE ?? "").slice(0, 7);
  const thisMonth = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 7);
  if (!firstMonth) return;
  const months = monthsBetween(firstMonth, thisMonth);
  await ensureMonthTabs(months);
  // Running this again repairs the formulas on month sheets that already exist.
  for (const month of months) {
    await sheets(`/values/${range(monthTabTitle(month), "A1")}?valueInputOption=USER_ENTERED`, {
      method: "PUT",
      body: JSON.stringify({ values: monthTabCells(month, sep) }),
    });
    const sheetId = (await existingTabs()).get(monthTabTitle(month));
    if (sheetId !== undefined) {
      await sheets(":batchUpdate", { method: "POST", body: JSON.stringify({ requests: monthColumnWidths(sheetId) }) });
    }
  }
}
