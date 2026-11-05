import {
  type Accrual,
  type AmoLeadRaw,
  type AmoPairCandidate,
  type Deal,
  OWNER,
  PERSON_NAMES,
  STATE_LABEL,
  type Person,
  RATE,
  type RpBooking,
  SHARE_KEYS,
  SHARES,
  STATUS_BOOKED,
  STATUS_FINISHED,
  STATUS_ISSUED,
  STATUS_REJECTED,
  type ShareKey,
  accrualsFor,
  fieldsFromLead,
  findAmoPair,
  firstMonthlyPayment,
  isLongRental,
  isRentprogDeal,
  isShareKey,
  money,
  nextMonthlyPayment,
  parseDateRange,
  parseExtension,
  parseSum,
  phuketDay,
  rentprogDealId,
  shortDay,
  uniqueAccruals,
} from "@/lib/payroll/logic";

export type Button = { text: string; data: string };

export type Store = {
  deals(): Promise<Deal[]>;
  insertDeals(deals: Deal[]): Promise<void>;
  updateDeals(deals: Deal[]): Promise<void>;
  accruals(): Promise<Accrual[]>;
  addAccruals(rows: Accrual[]): Promise<void>;
  people(): Promise<Person[]>;
  savePerson(person: Person): Promise<void>;
};

export type Telegram = {
  send(chat: number, text: string, options?: { buttons?: Button[][]; forceReply?: boolean; menu?: string[] }): Promise<number>;
  edit(chat: number, msg: number, text: string, buttons?: Button[][]): Promise<void>;
  answer(callbackId: string, text?: string): Promise<void>;
};

export type Amo = {
  leadsByIds(ids: number[]): Promise<AmoLeadRaw[]>;
  leadsInStatus(pipeline: number, status: number): Promise<AmoLeadRaw[]>;
  pairCandidates(): Promise<AmoPairCandidate[]>;
};

export type RentProg = {
  bookings(): Promise<RpBooking[]>;
};

export type EngineDeps = {
  store: Store;
  tg: Telegram;
  amo: Amo;
  rentprog: RentProg;
  now: () => number;
  leadUrl: (id: number) => string;
  startDate: string; // rentals that ended before this day are not tracked
  ownerCode: string;
};

type CallbackQuery = {
  id: string;
  data?: string;
  from: { id: number };
  message?: { message_id: number; chat: { id: number } };
};

type IncomingMessage = {
  chat: { id: number; type?: string };
  from?: { first_name?: string; last_name?: string; username?: string };
  text?: string;
  reply_to_message?: { text?: string };
};

export type TelegramUpdate = { callback_query?: CallbackQuery; message?: IncomingMessage };

const MY_DEALS = "💰 Мои заявки";
const TOTALS = "📊 Итоги";
const MAX_IN_LIST = 20; // Telegram's message limit; whatever does not fit comes the next evening
const MAX_TEXT = 4000;

const PROMPT = {
  sum: "сумма выдачи",
  move: "новые даты",
  early: "итоговая сумма",
  ext: "продление",
  fix: "исправление суммы",
  dates: "исправление дат",
  first: "оплата за первый месяц",
  pay: "оплата за месяц",
} as const;
type PromptKind = keyof typeof PROMPT;

function promptTag(leadId: number, kind: PromptKind) {
  return `Сделка #${leadId} · ${PROMPT[kind]}`;
}

function parsePromptTag(text: string | undefined): { leadId: number; kind: PromptKind } | null {
  const m = text?.match(/Сделка #(-?\d+) · ([^\n]+)/);
  if (!m) return null;
  const kind = (Object.keys(PROMPT) as PromptKind[]).find((k) => PROMPT[k] === m[2].trim());
  return kind ? { leadId: Number(m[1]), kind } : null;
}

// A car handed over, so its rent counts towards pay.
const ISSUED_STATES: Deal["state"][] = ["in_rent", "asked_pay", "asked_end", "finished"];

// What the owner can set by hand, in the order the buttons appear.
const EDITABLE_STATES: Deal["state"][] = ["booked", "in_rent", "finished", "no_show", "cancelled"];

// The link to a deal, or its number; numbers below zero exist only in RentProg.
export function dealIdFromText(text: string) {
  const link = text.match(/\/leads\/detail\/(\d+)/);
  if (link) return Number(link[1]);
  return /^-?\d{3,}$/.test(text) ? Number(text) : null;
}

const shareLabel = (deal: Deal) => (deal.share ? SHARES[deal.share].label : "менеджер не указан");
const blockTitle = { i: "🔑 Выдачи: проверьте", p: "💳 Оплаты за месяц: проверьте", e: "🏁 Сдачи: проверьте" } as const;
type BlockKind = keyof typeof blockTitle;
const OPEN_STATE = { i: "asked_issue", p: "asked_pay", e: "asked_end" } as const;
const ALL_OK = { i: "выданы все", p: "оплатили все", e: "сданы все" } as const;

export function createEngine(deps: EngineDeps) {
  const { store, tg, amo, rentprog, leadUrl } = deps;
  const today = () => phuketDay(deps.now());

  const dealLink = (id: number) => (isRentprogDeal(id) ? "только в RentProg, сделки в amoCRM нет" : leadUrl(id));

  function line(deal: Deal) {
    const client = deal.name ? `, ${deal.name}` : "";
    return `${deal.car}${client}, ${shortDay(deal.start)}–${shortDay(deal.end)}, ${money(deal.rent)} — ${shareLabel(deal)}\n${dealLink(deal.leadId)}`;
  }

  const shortName = (deal: Deal) => `${deal.car.slice(0, 22)} ${shortDay(deal.start)}`;

  async function sendToAll(people: Person[], text: string, buttons?: Button[][]) {
    const messages: Deal["messages"] = [];
    for (const person of people) {
      try {
        messages.push({ chat: person.chat, msg: await tg.send(person.chat, text, { buttons }) });
      } catch (error) {
        console.error(`Telegram send to ${person.name} failed:`, error);
      }
    }
    return messages;
  }

  const owners = (people: Person[]) => people.filter((p) => p.name === OWNER);

  // Everyone, owner included, gets the same list, so a manager on a day off loses nothing: a
  // colleague can answer the facts, and who earns the money comes from amoCRM, not from who
  // pressed first.
  function renderBlock(kind: BlockKind, key: string, deals: Deal[]) {
    const inBlock = deals.filter((d) => d.blockKey === key);
    const open = inBlock.filter((d) => d.state === OPEN_STATE[kind]);
    const done = inBlock.filter((d) => d.state !== OPEN_STATE[kind]);
    // A long rental can be paid in full or monthly, so one button cannot answer for it.
    const needsAnswer = (d: Deal) => kind === "i" && isLongRental(d);
    const bulk = open.filter((d) => !needsAnswer(d));
    const openLine = (d: Deal) => {
      if (kind === "p") return `• ${line(d)}\nОплата ${shortDay(d.nextPay)}: ${money(d.monthlySum)}`;
      return needsAnswer(d) ? `• ${line(d)}\nДлинная аренда: как оплачена?` : `• ${line(d)}`;
    };

    const text = [
      blockTitle[kind],
      ...open.map((d) => `\n${openLine(d)}`),
      ...(done.length ? ["\nОтвечено:", ...done.map((d) => `${d.note || "✅"} ${d.car}, ${shortDay(d.start)}: ${money(d.rent)}\n${dealLink(d.leadId)}`)] : []),
    ].join("\n");

    const buttons: Button[][] = [];
    if (bulk.length) {
      buttons.push([{ text: `✅ Всё верно, ${ALL_OK[kind]} (${bulk.length})`, data: `${kind}a:${key.slice(2)}` }]);
    }
    for (const d of open) buttons.push([{ text: `${needsAnswer(d) ? "💳 Как оплачена" : "✏️ Изменить"}: ${shortName(d)}`, data: `${kind}m:${d.leadId}` }]);
    for (const d of done) buttons.push([{ text: `Не согласна: ${shortName(d)}`, data: `d:${d.leadId}` }]);
    return { text, buttons };
  }

  async function refreshBlock(kind: BlockKind, key: string, messages: Deal["messages"], deals: Deal[]) {
    const { text, buttons } = renderBlock(kind, key, deals);
    const hasDeals = deals.some((d) => d.blockKey === key);
    for (const { chat, msg } of messages) {
      await tg
        .edit(chat, msg, hasDeals ? text : `${blockTitle[kind]}\nЭти заявки перенесены в новый список.`, hasDeals ? buttons : [])
        .catch((error) => console.error("Telegram edit failed:", error));
    }
  }

  async function refreshDealBlock(deal: Deal, deals: Deal[]) {
    if (deal.blockKey) await refreshBlock(deal.blockKey[0] as BlockKind, deal.blockKey, deal.messages, deals);
  }

  // Unanswered deals from earlier evenings move into today's list, so nothing gets lost.
  async function sendBlock(kind: BlockKind, list: Deal[], deals: Deal[], people: Person[]) {
    if (!list.length) return;
    const day = today();
    const key = `${kind}:${day}`;

    const previous = new Map<string, Deal["messages"]>();
    for (const deal of list) {
      if (deal.blockKey && deal.blockKey !== key) previous.set(deal.blockKey, deal.messages);
      deal.state = OPEN_STATE[kind];
      deal.blockKey = key;
      deal.lastAsked = day;
      deal.note = "";
    }
    for (const [oldKey, messages] of previous) await refreshBlock(oldKey[0] as BlockKind, oldKey, messages, deals);

    const { text, buttons } = renderBlock(kind, key, deals);
    const messages = await sendToAll(people, text, buttons);
    for (const deal of list) deal.messages = messages;
  }

  async function askOwnerWhose(deal: Deal, people: Person[]) {
    for (const { chat, msg } of deal.messages) {
      await tg.edit(chat, msg, `⏰ Вопрос повторён ниже\n${line(deal)}`).catch((error) => console.error("Telegram edit failed:", error));
    }
    deal.lastAsked = today();
    deal.messages = await sendToAll(owners(people), `❓ Непонятно, чья заявка: в amoCRM пусто или выбрано несколько вариантов\n${line(deal)}`, decisionButtons(deal));
  }

  function decisionButtons(deal: Deal): Button[][] {
    return SHARE_KEYS.map((key) => [{ text: SHARES[key].label, data: `f:${deal.leadId}:${key}` }]);
  }

  function newDeal(fields: NonNullable<ReturnType<typeof fieldsFromLead>>, state: Deal["state"]): Deal {
    return { ...fields, state, manual: false, lastAsked: "", blockKey: "", note: "", messages: [], monthlySum: 0, nextPay: "" };
  }

  async function allTrackedLeads() {
    const leads: AmoLeadRaw[] = [];
    for (const { pipeline, status } of [...STATUS_BOOKED, STATUS_ISSUED]) {
      leads.push(...(await amo.leadsInStatus(pipeline, status)));
    }
    return leads;
  }

  function newRentprogDeal(booking: RpBooking, state: Deal["state"]): Deal {
    return {
      leadId: rentprogDealId(booking.id),
      name: booking.client,
      car: booking.car,
      start: booking.start,
      end: booking.end,
      rent: booking.rent,
      share: "f",
      state,
      manual: false,
      lastAsked: "",
      blockKey: "",
      note: "",
      messages: [],
      monthlySum: 0,
      nextPay: "",
    };
  }

  // Launch fills in the whole period since the start date, quietly: rentals already finished,
  // cars out now, bookings ahead, and office bookings that exist only in RentProg.
  async function importExisting() {
    const known = await store.deals();
    const existing = await store.accruals();
    const people = await store.people();
    const fresh: Deal[] = [];
    const rows: Accrual[] = [];
    const isKnown = (id: number) => known.some((d) => d.leadId === id) || fresh.some((d) => d.leadId === id);
    const accrueIssue = (deal: Deal) => {
      if (deal.share && deal.start >= deps.startDate) {
        rows.push(...accrualsFor(deal, deal.rent, deal.share, "Выдача", deal.start, `${deal.leadId}:issue`));
      }
    };

    const stages = [
      ...STATUS_BOOKED.map((s) => ({ ...s, kind: "booked" as const })),
      { ...STATUS_ISSUED, kind: "issued" as const },
      ...STATUS_FINISHED.map((s) => ({ ...s, kind: "finished" as const })),
    ];
    for (const { pipeline, status, kind } of stages) {
      for (const lead of await amo.leadsInStatus(pipeline, status)) {
        const fields = fieldsFromLead(lead);
        if (!fields || isKnown(fields.leadId)) continue;
        if (fields.end < deps.startDate || (kind === "finished" && fields.start < deps.startDate)) continue;

        // A long rental out now goes to the evening list: only the manager knows how it was paid.
        const askPayment = kind === "issued" && isLongRental(fields);
        const state = !fields.share ? "asked_whose" : kind === "booked" || askPayment ? "booked" : kind === "issued" ? "in_rent" : "finished";
        const deal = newDeal(fields, state);
        fresh.push(deal);
        if (kind !== "booked" && !askPayment) accrueIssue(deal);
      }
    }

    const candidates = await amo.pairCandidates();
    const yesterday = phuketDay(deps.now() - 86400000);
    for (const booking of await rentprog.bookings()) {
      if (booking.draft || booking.failed || booking.end < deps.startDate || booking.createdDay > yesterday) continue;
      if (booking.finished && booking.start < deps.startDate) continue;
      if (isKnown(rentprogDealId(booking.id)) || findAmoPair(booking, candidates)) continue;

      const askPayment = booking.inRent && isLongRental(booking);
      const deal = newRentprogDeal(booking, booking.finished ? "finished" : booking.inRent && !askPayment ? "in_rent" : "booked");
      fresh.push(deal);
      if (booking.finished || (booking.inRent && !askPayment)) accrueIssue(deal);
    }

    const unclear = fresh.filter((d) => d.state === "asked_whose");
    for (const deal of unclear) await askOwnerWhose(deal, people);
    await store.insertDeals(fresh);
    await writeAccruals(existing, rows);
    return { imported: fresh.length, rentprogOnly: fresh.filter((d) => isRentprogDeal(d.leadId)).length, asked: unclear.length, accruals: rows.length };
  }

  // A deal that later appears in amoCRM replaces the office record, and any money goes with it.
  async function retireRentprogDeal(deal: Deal, existing: Accrual[], day: string) {
    const rows = uniqueAccruals(existing).filter((r) => r.leadId === deal.leadId);
    const net = rows.reduce((total, r) => total + r.base * r.fraction, 0);
    if (net !== 0 && deal.share) {
      await writeAccruals(existing, accrualsFor(deal, -net, deal.share, "Правка", day, `${deal.leadId}:retired`));
    }
    deal.state = "cancelled";
    deal.note = "Нашлась сделка в amoCRM";
  }

  // Bookings from yesterday or earlier that still have no deal count as the office's. Today's
  // wait until tomorrow, because the manager may simply not have reached amoCRM yet.
  async function checkRentprog(deals: Deal[], changed: Set<Deal>, day: string) {
    const [bookings, candidates, existing] = await Promise.all([rentprog.bookings(), amo.pairCandidates(), store.accruals()]);
    const trackedStatuses = new Set<number>([...STATUS_BOOKED, STATUS_ISSUED].map((s) => s.status));
    const fresh: Deal[] = [];

    for (const booking of bookings) {
      const id = rentprogDealId(booking.id);
      const pair = findAmoPair(booking, candidates);
      const known = deals.find((d) => d.leadId === id);

      if (known) {
        const pending = ["booked", "asked_issue"].includes(known.state);
        if (pair && trackedStatuses.has(pair.status) && !known.manual && known.state !== "cancelled" && known.state !== "no_show") {
          const block = known.state === "asked_issue" ? known.blockKey : "";
          await retireRentprogDeal(known, existing, day);
          changed.add(known);
          if (block) await refreshDealBlock(known, deals);
        } else if (pending && booking.failed) {
          known.state = "cancelled";
          known.note = "❌ Отменена в RentProg";
          changed.add(known);
        } else if (pending && !known.manual && (known.rent !== booking.rent || known.start !== booking.start || known.end !== booking.end)) {
          known.rent = booking.rent;
          known.start = booking.start;
          known.end = booking.end;
          changed.add(known);
        }
        continue;
      }

      if (booking.draft || booking.failed || pair) continue;
      if (booking.createdDay >= day || booking.end < deps.startDate) continue;
      if (booking.finished && booking.start < deps.startDate) continue;
      fresh.push(newRentprogDeal(booking, "booked"));
    }

    // Cancelling a booking in RentProg can remove it from the list altogether.
    const present = new Set(bookings.map((b) => rentprogDealId(b.id)));
    for (const deal of deals) {
      if (isRentprogDeal(deal.leadId) && !present.has(deal.leadId) && ["booked", "asked_issue"].includes(deal.state)) {
        deal.state = "cancelled";
        deal.note = "❌ Нет в RentProg";
        changed.add(deal);
      }
    }
    return fresh;
  }

  async function writeAccruals(existing: Accrual[], rows: Accrual[]) {
    const fresh = rows.filter((r) => !existing.some((e) => e.key === r.key && e.person === r.person));
    if (fresh.length) await store.addAccruals(fresh);
    existing.push(...fresh);
  }

  // Until the car is issued amoCRM is the truth, unless someone corrected the deal in the bot.
  function syncFromAmo(deal: Deal, lead: AmoLeadRaw | undefined) {
    if (!lead) return false;
    if (lead.status_id === STATUS_REJECTED) {
      deal.state = "cancelled";
      deal.note = "❌ Отказ в amoCRM";
      return true;
    }
    const fields = fieldsFromLead(lead);
    if (!fields) return false;

    const before = JSON.stringify(deal);
    deal.car = fields.car;
    deal.name = fields.name;
    if (!deal.manual) {
      deal.start = fields.start;
      deal.end = fields.end;
      deal.rent = fields.rent;
      if (fields.share) {
        deal.share = fields.share;
        if (deal.state === "asked_whose") deal.state = "booked";
      }
    }
    if (deal.state === "asked_issue" && deal.start > today()) {
      deal.state = "booked";
      deal.note = "📅 Даты изменились";
    }
    return JSON.stringify(deal) !== before;
  }

  async function dailyRun() {
    const day = today();
    const people = await store.people();
    const deals = await store.deals();

    // 1. New bookings, including ones that reached "Выдан клиенту" since yesterday's check.
    const fresh: Deal[] = [];
    for (const lead of await allTrackedLeads()) {
      const fields = fieldsFromLead(lead);
      if (!fields || fields.end < deps.startDate) continue;
      if (deals.some((d) => d.leadId === fields.leadId) || fresh.some((d) => d.leadId === fields.leadId)) continue;
      fresh.push(newDeal(fields, fields.share ? "booked" : "asked_whose"));
    }
    await store.insertDeals(fresh);
    deals.push(...fresh);

    // 2. Fresh data from amoCRM for everything not yet issued.
    const preIssue = deals.filter((d) => ["asked_whose", "booked", "asked_issue"].includes(d.state) && !isRentprogDeal(d.leadId));
    const leads = await amo.leadsByIds(preIssue.map((d) => d.leadId));
    const changed = new Set<Deal>(fresh);
    for (const deal of preIssue) {
      const previousBlock = deal.state === "asked_issue" ? deal.blockKey : "";
      if (!syncFromAmo(deal, leads.find((l) => l.id === deal.leadId))) continue;
      changed.add(deal);
      if (previousBlock) await refreshDealBlock(deal, deals);
      if (deal.state === "cancelled" && !previousBlock) {
        for (const { chat, msg } of deal.messages) {
          await tg.edit(chat, msg, `❌ Отказ в amoCRM, вопрос снят\n${line(deal)}`).catch((error) => console.error("Telegram edit failed:", error));
        }
      }
    }

    // Bookings that reached RentProg but not the working stages of amoCRM.
    const officeDeals = await checkRentprog(deals, changed, day);
    await store.insertDeals(officeDeals);
    deals.push(...officeDeals);
    fresh.push(...officeDeals);

    // A rental that began before the launch counts for nothing here, so asking "was it issued"
    // only confuses; a long one still has to be asked, for its later monthly payments.
    for (const deal of deals) {
      if ((deal.state === "booked" || deal.state === "asked_issue") && deal.start < deps.startDate && !isLongRental(deal)) {
        const asked = deal.state === "asked_issue";
        const messages = deal.messages;
        const block = deal.blockKey;
        deal.state = "in_rent";
        deal.blockKey = "";
        deal.messages = [];
        deal.lastAsked = "";
        changed.add(deal);
        if (asked && block) await refreshBlock(block[0] as BlockKind, block, messages, deals);
      }
    }

    // A deal that was cancelled after being counted must not keep its money.
    const counted = await store.accruals();
    for (const deal of changed) {
      if (deal.state !== "cancelled") continue;
      const money = dealMoney(deal, counted);
      if (money.totalBase !== 0) await writeAccruals(counted, money.reversal(money.fixNumber));
    }

    // 3. Unclear deals go to the owner alone, and wait there until decided.
    const unclear = deals.filter((d) => d.state === "asked_whose" && d.lastAsked < day);
    for (const deal of unclear) {
      await askOwnerWhose(deal, people);
      changed.add(deal);
    }

    // 4. First block: new bookings. Reading it is optional, and the buttons stay for good.
    const newBookings = fresh.filter((d) => d.state === "booked").slice(0, MAX_IN_LIST);
    if (newBookings.length) {
      const text = ["🆕 Новые брони за сегодня", ...newBookings.map((d) => `\n• ${line(d)}`)].join("\n");
      await sendToAll(people, text, newBookings.map((d) => [{ text: `Не согласна: ${shortName(d)}`, data: `d:${d.leadId}` }]));
    }

    // 5. Second and third blocks: what was due today, plus what nobody answered before.
    const overdue = deals.filter((d) => ["asked_issue", "asked_pay", "asked_end"].includes(d.state) && d.lastAsked < day);
    const issues = deals.filter((d) => (d.state === "booked" && d.start <= day) || d.state === "asked_issue").slice(0, MAX_IN_LIST);
    const ends = deals.filter((d) => (d.state === "in_rent" && d.end <= day) || d.state === "asked_end").slice(0, MAX_IN_LIST);
    const payments = deals
      .filter((d) => (d.state === "in_rent" && d.end > day && d.nextPay && d.nextPay <= day) || d.state === "asked_pay")
      .slice(0, MAX_IN_LIST);
    await sendBlock("i", issues, deals, people);
    await sendBlock("p", payments, deals, people);
    await sendBlock("e", ends, deals, people);
    for (const deal of [...issues, ...payments, ...ends]) changed.add(deal);

    // New deals are already in the sheet, so this writes their questions and any changes.
    await store.updateDeals([...changed, ...officeDeals]);

    if (overdue.length) {
      const text = ["⏰ Вчера не ответили по заявкам:", ...overdue.map((d) => `• ${line(d)}`)].join("\n");
      await sendToAll(owners(people), text.slice(0, MAX_TEXT));
    }
    return { fresh: fresh.length, office: officeDeals.length, issues: issues.length, payments: payments.length, ends: ends.length, overdue: overdue.length };
  }

  async function completeIssue(deal: Deal, sum: number, person: Person, existing: Accrual[]) {
    if (!deal.share) return;
    deal.rent = sum;
    // A rental that began before the launch is already in the managers' own tables.
    if (deal.start >= deps.startDate) {
      const counted = dealMoney(deal, existing);
      if (!counted.rows.length) {
        await writeAccruals(existing, accrualsFor(deal, sum, deal.share, "Выдача", deal.start, `${deal.leadId}:issue`));
      } else if (counted.totalBase !== sum) {
        // Counted already, at launch or before a date change: only the difference moves, today.
        await writeAccruals(existing, accrualsFor(deal, sum - counted.totalBase, deal.share, "Правка", today(), `${deal.leadId}:fix${counted.fixNumber}:sum`));
      }
    }
    deal.state = "in_rent";
    deal.note = `🔑 Выдана (${person.name})`;
  }

  async function recordMonthlyPayment(deal: Deal, sum: number, person: Person, existing: Accrual[]) {
    if (!deal.share) return;
    await writeAccruals(existing, accrualsFor(deal, sum, deal.share, "Оплата за месяц", deal.nextPay, `${deal.leadId}:pay:${deal.nextPay}`));
    deal.note = `💳 Оплата ${shortDay(deal.nextPay)}: ${money(sum)} (${person.name})`;
    deal.monthlySum = sum;
    deal.nextPay = nextMonthlyPayment(deal.start, deal.nextPay, deal.end);
    deal.state = "in_rent";
  }

  function openDispute(deal: Deal, person: Person, people: Person[]) {
    const buttons = [...decisionButtons(deal), [{ text: "✏️ Другая сумма", data: `fs:${deal.leadId}` }]];
    return sendToAll(owners(people), `⚠️ Не согласна: ${person.name}\n${line(deal)}\n\nКак решаем?`, buttons);
  }

  // What this deal has earned so far, per person. Corrections are dated today, so a month
  // already paid stays as it was.
  function dealMoney(deal: Deal, existing: Accrual[]) {
    const rows = uniqueAccruals(existing).filter((r) => r.leadId === deal.leadId);
    const net = new Map<string, { base: number; amount: number }>();
    for (const r of rows) {
      const item = net.get(r.person) ?? { base: 0, amount: 0 };
      item.base += r.base * r.fraction;
      item.amount += r.amount;
      net.set(r.person, item);
    }
    const reversal = (fixNumber: number): Accrual[] =>
      [...net.entries()]
        .filter(([, item]) => item.amount !== 0)
        .map(([person, item]) => ({
          date: today(),
          leadId: deal.leadId,
          car: deal.car,
          type: "Правка",
          base: -item.base,
          person,
          fraction: 1,
          amount: -item.amount,
          key: `${deal.leadId}:fix${fixNumber}:out`,
        }));
    return {
      rows,
      fixNumber: rows.filter((r) => r.type === "Правка").length + 1,
      totalBase: [...net.values()].reduce((sum, item) => sum + item.base, 0),
      reversal,
    };
  }

  async function takeBackMoney(deal: Deal) {
    const existing = await store.accruals();
    const money = dealMoney(deal, existing);
    if (money.totalBase !== 0) await writeAccruals(existing, money.reversal(money.fixNumber));
  }

  // One time: rentals counted at launch without a question go into the evening list to be
  // checked. Their money stays counted, and an answer only moves the difference.
  async function startReview() {
    const deals = await store.deals();
    const existing = await store.accruals();
    const toCheck = deals.filter(
      (d) => ["in_rent", "finished"].includes(d.state) && !d.note && d.start >= deps.startDate && dealMoney(d, existing).totalBase !== 0
    );
    for (const deal of toCheck) {
      deal.state = "booked";
      deal.manual = true;
    }

    const leads = await amo.leadsByIds(deals.filter((d) => !isRentprogDeal(d.leadId)).map((d) => d.leadId));
    const bookings = await rentprog.bookings();
    const named = deals.filter((deal) => {
      const name = isRentprogDeal(deal.leadId)
        ? bookings.find((b) => rentprogDealId(b.id) === deal.leadId)?.client
        : leads.find((l) => l.id === deal.leadId)?.clientName;
      if (!name || name === deal.name) return false;
      deal.name = name;
      return true;
    });
    await store.updateDeals([...new Set([...toCheck, ...named])]);
    return { toCheck: toCheck.length, named: named.length };
  }

  const notifyStaff = (people: Person[], text: string) => sendToAll(people.filter((p) => p.name !== OWNER), text);

  async function showEditPanel(chat: number, deal: Deal) {
    const buttons: Button[][] = [
      [{ text: "Сменить менеджера", data: `om:${deal.leadId}` }],
      [{ text: "Другая сумма", data: `fs:${deal.leadId}` }],
      [{ text: "Другие даты", data: `od:${deal.leadId}` }],
    ];
    if (deal.share) buttons.push([{ text: "Изменить статус", data: `os:${deal.leadId}` }]);
    await tg.send(chat, `${line(deal)}\nСтатус: ${STATE_LABEL[deal.state]}\n\nЧто изменить?`, { buttons });
  }

  // Issuing and un-issuing by hand has to move the money too, or the sheet would disagree
  // with the status.
  async function applyStatus(deal: Deal, state: Deal["state"], people: Person[]) {
    const existing = await store.accruals();
    const money = dealMoney(deal, existing);
    const wasIssued = ISSUED_STATES.includes(deal.state);
    const nowIssued = ISSUED_STATES.includes(state);

    if (!nowIssued && money.totalBase !== 0) await writeAccruals(existing, money.reversal(money.fixNumber));
    if (nowIssued && !wasIssued && money.totalBase === 0 && deal.share && deal.start >= deps.startDate) {
      await writeAccruals(existing, accrualsFor(deal, deal.rent, deal.share, "Правка", today(), `${deal.leadId}:fix${money.fixNumber}:in`));
    }
    if (!nowIssued) {
      deal.monthlySum = 0;
      deal.nextPay = "";
    }
    deal.state = state;
    deal.manual = true;
    deal.note = `✏️ ${STATE_LABEL[state]} (${OWNER})`;
    await store.updateDeals([deal]);
    await notifyStaff(people, `Владелица изменила статус: ${STATE_LABEL[state]}\n${line(deal)}`);
  }

  async function applyDecision(deal: Deal, share: ShareKey, people: Person[]) {
    const existing = await store.accruals();
    const { rows, fixNumber, totalBase, reversal } = dealMoney(deal, existing);
    const previousLabel = shareLabel(deal);
    const previousShare = deal.share;

    if (rows.length && share !== deal.share) {
      await writeAccruals(existing, [...reversal(fixNumber), ...accrualsFor(deal, totalBase, share, "Правка", today(), `${deal.leadId}:fix${fixNumber}:in`)]);
    }

    deal.share = share;
    deal.manual = true;
    if (deal.state === "asked_whose") {
      deal.state = "booked";
      deal.messages = [];
    }
    await store.updateDeals([deal]);

    const involved = new Set([...Object.keys(SHARES[share].split), ...(previousShare ? Object.keys(SHARES[previousShare].split) : [])]);
    const text = `Владелица решила: ${SHARES[share].label} (было: ${previousLabel})\n${line(deal)}`;
    await sendToAll(people.filter((p) => involved.has(p.name)), text);
  }

  async function onCallback(query: CallbackQuery) {
    const [kind, idText, value] = (query.data ?? "").split(":");
    const people = await store.people();
    const person = people.find((p) => p.chat === query.from.id);

    if (kind === "r") {
      if (person?.name !== OWNER) return tg.answer(query.id, "Только владелица");
      const chat = Number(idText);
      const name = value === "no" ? null : PERSON_NAMES[Number(value)];
      if (query.message) await tg.edit(query.message.chat.id, query.message.message_id, name ? `Подключён: ${name}` : "Запрос отклонён");
      if (name) {
        await store.savePerson({ chat, name });
        await tg.send(chat, `Готово, вы подключены: ${name}.`, { menu: [MY_DEALS] });
      }
      return tg.answer(query.id);
    }

    if (!person) return tg.answer(query.id, "Сначала нажмите /start");

    const deals = await store.deals();

    if (kind === "ia" || kind === "pa" || kind === "ea") {
      const blockKind = kind[0] as BlockKind;
      const key = `${blockKind}:${idText}`;
      const open = deals.filter((d) => d.blockKey === key && d.state === OPEN_STATE[blockKind] && !(blockKind === "i" && isLongRental(d)));
      if (!open.length) return tg.answer(query.id, "На это уже ответили");

      const existing = await store.accruals();
      for (const deal of open) {
        if (blockKind === "i") await completeIssue(deal, deal.rent, person, existing);
        else if (blockKind === "p") await recordMonthlyPayment(deal, deal.monthlySum, person, existing);
        else {
          deal.state = "finished";
          deal.note = `🏁 Сдана (${person.name})`;
        }
      }
      await store.updateDeals(open);
      await refreshDealBlock(open[0], deals);
      return tg.answer(query.id, "Записано");
    }

    const deal = deals.find((d) => d.leadId === Number(idText));
    if (!deal) return tg.answer(query.id, "Заявка не найдена");
    const stale = () => tg.answer(query.id, "На это уже ответили");
    const closeMenu = async (text: string) => {
      if (query.message) await tg.edit(query.message.chat.id, query.message.message_id, text);
    };

    if (kind === "d") {
      await openDispute(deal, person, people);
      return tg.answer(query.id, "Отправлено владелице");
    }

    if (kind === "om" || kind === "od" || kind === "os" || kind === "ost") {
      if (person.name !== OWNER) return tg.answer(query.id, "Решает только владелица");
      if (kind === "om") {
        await tg.send(query.from.id, `Чья заявка?\n${line(deal)}`, { buttons: decisionButtons(deal) });
        return tg.answer(query.id);
      }
      if (kind === "od") return prompt(query, deal.leadId, "dates", "Напишите начало и конец. Например: 12.12 20.12");
      if (kind === "os") {
        await tg.send(query.from.id, `Какой статус поставить?\nСейчас: ${STATE_LABEL[deal.state]}\n${line(deal)}`, {
          buttons: EDITABLE_STATES.filter((state) => state !== deal.state).map((state) => [{ text: STATE_LABEL[state], data: `ost:${deal.leadId}:${state}` }]),
        });
        return tg.answer(query.id);
      }
      const state = EDITABLE_STATES.find((item) => item === value);
      if (!state || !deal.share) return stale();
      await applyStatus(deal, state, people);
      await refreshDealBlock(deal, deals);
      await closeMenu(`✅ Статус: ${STATE_LABEL[state]}\n${line(deal)}`);
      return tg.answer(query.id, "Записано");
    }

    if (kind === "f" || kind === "fs") {
      if (person.name !== OWNER) return tg.answer(query.id, "Решает только владелица");
      if (kind === "fs") return prompt(query, deal.leadId, "fix", `Напишите верную сумму аренды. Сейчас: ${money(deal.rent)}. Например: 12000`);
      if (!isShareKey(value)) return stale();
      await applyDecision(deal, value, people);
      await refreshDealBlock(deal, deals);
      await closeMenu(`✅ Решено: ${SHARES[value].label}\n${line(deal)}`);
      return tg.answer(query.id, "Записано");
    }

    if (kind === "im") {
      if (deal.state !== "asked_issue") return stale();
      const long = isLongRental(deal);
      await tg.send(query.from.id, `${long ? "Как оплачена длинная аренда?" : "Что изменить?"}\n${line(deal)}`, {
        buttons: [
          ...(long
            ? [
                [{ text: `Оплачена сразу вся: ${money(deal.rent)}`, data: `i:${deal.leadId}:full` }],
                [{ text: "Оплата помесячно", data: `i:${deal.leadId}:month` }],
              ]
            : []),
          [{ text: long ? "Оплачена сразу, другая сумма" : "Другая сумма", data: `i:${deal.leadId}:sum` }],
          [{ text: "Перенос дат", data: `i:${deal.leadId}:move` }],
          [{ text: "Клиент не приехал / отмена", data: `i:${deal.leadId}:no` }],
          [{ text: "Не согласна с менеджером", data: `d:${deal.leadId}` }],
        ],
      });
      return tg.answer(query.id);
    }

    if (kind === "em") {
      if (deal.state !== "asked_end") return stale();
      await tg.send(query.from.id, `Что изменить?\n${line(deal)}`, {
        buttons: [
          [{ text: "Продлил", data: `e:${deal.leadId}:ext` }],
          [{ text: "Вернул раньше / возврат денег", data: `e:${deal.leadId}:early` }],
          [{ text: "Не согласна с менеджером", data: `d:${deal.leadId}` }],
        ],
      });
      return tg.answer(query.id);
    }

    if (kind === "i") {
      if (deal.state !== "asked_issue") return stale();
      if (value === "no") {
        await takeBackMoney(deal);
        deal.state = "no_show";
        deal.note = `🚫 Не приехал (${person.name})`;
        await store.updateDeals([deal]);
        await refreshDealBlock(deal, deals);
        await closeMenu("Записано: клиент не приехал.");
        return tg.answer(query.id, "Записано");
      }
      if (value === "full") {
        await completeIssue(deal, deal.rent, person, await store.accruals());
        await store.updateDeals([deal]);
        await refreshDealBlock(deal, deals);
        await closeMenu(`Записано: оплачена сразу вся, ${money(deal.rent)}.`);
        return tg.answer(query.id, "Записано");
      }
      if (value === "month") return prompt(query, deal.leadId, "first", "Сколько оплачено за первый месяц, только аренда? Например: 24000");
      if (value === "sum") return prompt(query, deal.leadId, "sum", "Напишите сумму только за аренду, без мойки, доставки и залога. Например: 12000");
      if (value === "move") return prompt(query, deal.leadId, "move", "Напишите новые даты: начало и конец. Например: 12.12 20.12");
      return stale();
    }

    if (kind === "pm") {
      if (deal.state !== "asked_pay") return stale();
      await tg.send(query.from.id, `Что с оплатой за месяц?\n${line(deal)}\nОжидалось: ${money(deal.monthlySum)}`, {
        buttons: [
          [{ text: "Другая сумма", data: `p:${deal.leadId}:sum` }],
          [{ text: "Оплаты не было", data: `p:${deal.leadId}:none` }],
          [{ text: "Вернул машину раньше", data: `e:${deal.leadId}:early` }],
          [{ text: "Не согласна с менеджером", data: `d:${deal.leadId}` }],
        ],
      });
      return tg.answer(query.id);
    }

    if (kind === "p") {
      if (deal.state !== "asked_pay") return stale();
      if (value === "sum") return prompt(query, deal.leadId, "pay", `Сколько оплачено за этот месяц, только аренда? Ожидалось: ${money(deal.monthlySum)}`);
      if (value === "none") {
        deal.note = `💳 Оплаты ${shortDay(deal.nextPay)} не было (${person.name})`;
        deal.nextPay = nextMonthlyPayment(deal.start, deal.nextPay, deal.end);
        deal.state = "in_rent";
        await store.updateDeals([deal]);
        await refreshDealBlock(deal, deals);
        await closeMenu("Записано: оплаты не было.");
        return tg.answer(query.id, "Записано");
      }
      return stale();
    }

    if (kind === "e") {
      if (value === "early" && deal.state === "asked_pay") return prompt(query, deal.leadId, "early", earlyPrompt(deal, await store.accruals()));
      if (deal.state !== "asked_end") return stale();
      if (value === "ext") return prompt(query, deal.leadId, "ext", "Напишите новую дату окончания и сумму только за продление. Например: 25.12 8000");
      if (value === "early") return prompt(query, deal.leadId, "early", earlyPrompt(deal, await store.accruals()));
      return stale();
    }

    return tg.answer(query.id);
  }

  // Monthly rentals compare against what was actually paid so far, not the whole contract.
  function countedRent(deal: Deal, existing: Accrual[]) {
    if (!deal.monthlySum) return deal.rent;
    return uniqueAccruals(existing).filter((r) => r.leadId === deal.leadId).reduce((total, r) => total + r.base * r.fraction, 0);
  }

  function earlyPrompt(deal: Deal, existing: Accrual[]) {
    return `Сколько в итоге стоила аренда после возврата денег? Сейчас: ${money(countedRent(deal, existing))}. Например: 9000`;
  }

  async function prompt(query: CallbackQuery, leadId: number, kind: PromptKind, text: string) {
    await tg.send(query.from.id, `${promptTag(leadId, kind)}\n${text}`, { forceReply: true });
    await tg.answer(query.id);
  }

  async function onReply(chat: number, person: Person, tag: { leadId: number; kind: PromptKind }, text: string, people: Person[]) {
    const deals = await store.deals();
    const deal = deals.find((d) => d.leadId === tag.leadId);
    if (!deal) return void (await tg.send(chat, "Заявка не найдена."));
    const day = today();
    const again = (hint: string) => tg.send(chat, `${promptTag(tag.leadId, tag.kind)}\nНе получилось прочитать ответ. ${hint}`, { forceReply: true });
    const answered = () => tg.send(chat, "На это уже ответили.");
    const save = async () => {
      await store.updateDeals([deal]);
      await refreshDealBlock(deal, deals);
    };

    if (tag.kind === "fix") {
      if (person.name !== OWNER) return;
      const sum = parseSum(text);
      if (sum === null) return void (await again("Нужно число, например: 12000"));
      const existing = await store.accruals();
      const counted = ISSUED_STATES.includes(deal.state) && existing.some((r) => r.leadId === deal.leadId);
      const delta = sum - countedRent(deal, existing);
      if (counted && delta !== 0 && deal.share) {
        const n = existing.filter((r) => r.leadId === deal.leadId && r.type === "Правка").length + 1;
        await writeAccruals(existing, accrualsFor(deal, delta, deal.share, "Правка", day, `${deal.leadId}:fix${n}:sum`));
      }
      if (!deal.monthlySum) deal.rent = sum;
      deal.manual = true;
      await save();
      await notifyStaff(people, `Владелица исправила сумму: ${money(sum)}\n${line(deal)}`);
      return void (await tg.send(chat, `Записано: ${money(sum)}.`));
    }

    if (tag.kind === "dates") {
      if (person.name !== OWNER) return;
      const range = parseDateRange(text, day);
      if (!range) return void (await again("Нужно две даты, например: 12.12 20.12"));
      deal.start = range.start;
      deal.end = range.end;
      deal.manual = true;
      // A question about a day that has moved ahead waits for that day.
      if (deal.state === "asked_issue" && deal.start > day) deal.state = "booked";
      if (deal.state === "asked_end" && deal.end > day) deal.state = "in_rent";
      if (deal.monthlySum) deal.nextPay = firstMonthlyPayment(deal.start, deal.end, day);
      deal.note = deal.state === "booked" || deal.state === "in_rent" ? "📅 Даты изменены" : deal.note;
      await save();
      await notifyStaff(people, `Владелица изменила даты\n${line(deal)}`);
      return void (await tg.send(chat, `Записано: ${shortDay(range.start)}–${shortDay(range.end)}.`));
    }

    if (tag.kind === "sum") {
      if (deal.state !== "asked_issue") return void (await answered());
      const sum = parseSum(text);
      if (sum === null) return void (await again("Нужно число, например: 12000"));
      await completeIssue(deal, sum, person, await store.accruals());
      deal.manual = true;
      await save();
      return void (await tg.send(chat, `Записано: ${money(sum)}.`));
    }

    if (tag.kind === "first") {
      if (deal.state !== "asked_issue" || !deal.share) return void (await answered());
      const sum = parseSum(text);
      if (sum === null) return void (await again("Нужно число, например: 24000"));
      const existing = await store.accruals();
      if (deal.start >= deps.startDate) {
        await writeAccruals(existing, accrualsFor(deal, sum, deal.share, "Оплата за месяц", deal.start, `${deal.leadId}:issue`));
      }
      deal.monthlySum = sum;
      deal.nextPay = firstMonthlyPayment(deal.start, deal.end, deps.startDate);
      deal.state = "in_rent";
      deal.note = `💳 Помесячно: ${money(sum)} (${person.name})`;
      await save();
      return void (await tg.send(chat, deal.nextPay ? `Записано. Про следующую оплату спрошу ${shortDay(deal.nextPay)}.` : "Записано."));
    }

    if (tag.kind === "pay") {
      if (deal.state !== "asked_pay") return void (await answered());
      const sum = parseSum(text);
      if (sum === null) return void (await again("Нужно число, например: 24000"));
      await recordMonthlyPayment(deal, sum, person, await store.accruals());
      await save();
      return void (await tg.send(chat, `Записано: ${money(sum)}.`));
    }

    if (tag.kind === "move") {
      if (deal.state !== "asked_issue") return void (await answered());
      const range = parseDateRange(text, day);
      if (!range) return void (await again("Нужно две даты, например: 12.12 20.12"));
      await takeBackMoney(deal);
      deal.start = range.start;
      deal.end = range.end;
      deal.manual = true;
      deal.state = "booked";
      deal.note = `📅 Перенос на ${shortDay(range.start)} (${person.name})`;
      await save();
      return void (await tg.send(chat, `Записано. Спрошу ${shortDay(deal.start)}. Если изменилась сумма, поправьте её в тот день.`));
    }

    if (tag.kind === "early") {
      if ((deal.state !== "asked_end" && deal.state !== "asked_pay") || !deal.share) return void (await answered());
      const existing = await store.accruals();
      const counted = countedRent(deal, existing);
      const total = parseSum(text);
      if (total === null || total > counted) return void (await again(`Нужно число не больше ${money(counted)}.`));
      if (total < counted) {
        await writeAccruals(existing, accrualsFor(deal, total - counted, deal.share, "Возврат", day, `${deal.leadId}:refund`));
      }
      deal.rent = total;
      deal.nextPay = "";
      deal.state = "finished";
      deal.note = `↩️ Вернул раньше (${person.name})`;
      await save();
      return void (await tg.send(chat, `Записано: ${money(total)}.`));
    }

    if (deal.state !== "asked_end" || !deal.share) return void (await answered());
    const ext = parseExtension(text, day);
    if (!ext || ext.end <= deal.end) return void (await again(`Нужна дата позже ${shortDay(deal.end)} и сумма, например: 25.12 8000`));
    await writeAccruals(await store.accruals(), accrualsFor(deal, ext.sum, deal.share, "Продление", day, `${deal.leadId}:ext:${ext.end}`));
    deal.rent += ext.sum;
    deal.end = ext.end;
    // Payments stay on schedule through the extension only if one was still due; otherwise the
    // extension's own sum already covers the new days.
    deal.state = "in_rent";
    deal.note = `➕ Продление +${money(ext.sum)} (${person.name})`;
    await save();
    await tg.send(chat, `Записано. Спрошу снова ${shortDay(ext.end)}.`);
  }

  const monthOf = (day: string) => day.slice(0, 7);

  function previousMonth(day: string) {
    const d = new Date(`${day.slice(0, 7)}-01T00:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() - 1);
    return d.toISOString().slice(0, 7);
  }

  async function myDeals(chat: number, person: Person) {
    const day = today();
    const rows = uniqueAccruals(await store.accruals()).filter((r) => r.person === person.name);
    const deals = await store.deals();
    const sum = (list: Accrual[]) => list.reduce((total, r) => total + r.amount, 0);
    const month = rows.filter((r) => monthOf(r.date) === monthOf(day));

    const byDeal = new Map<number, Accrual[]>();
    for (const r of month) byDeal.set(r.leadId, [...(byDeal.get(r.leadId) ?? []), r]);
    const shareNote = (deal: Deal | undefined) => (deal?.share && SHARES[deal.share].split[person.name as never] === 0.5 ? `, ${SHARES[deal.share].label}` : "");
    const earned = [...byDeal.entries()].map(([leadId, list]) => {
      const deal = deals.find((d) => d.leadId === leadId);
      return `${list[0].car}, ${money(list.reduce((t, r) => t + r.base * r.fraction, 0))}${shareNote(deal)} → ${money(sum(list))}\n${dealLink(leadId)}`;
    });

    const ahead = deals
      .filter((d) => ["booked", "asked_issue"].includes(d.state) && d.share && Object.hasOwn(SHARES[d.share].split, person.name))
      .sort((a, b) => a.start.localeCompare(b.start))
      .map((d) => {
        const fraction = (SHARES[d.share as ShareKey].split as Record<string, number>)[person.name];
        return `${d.car}, выдача ${shortDay(d.start)}, ${money(d.rent)}${shareNote(d)} → ${money(d.rent * RATE * fraction)}\n${dealLink(d.leadId)}`;
      });

    const nextPayments = deals
      .filter((d) => d.state === "in_rent" && d.nextPay && d.share && Object.hasOwn(SHARES[d.share].split, person.name))
      .map((d) => {
        const fraction = (SHARES[d.share as ShareKey].split as Record<string, number>)[person.name];
        return `${d.car}, оплата ${shortDay(d.nextPay)}, ${money(d.monthlySum)}${shareNote(d)} → ${money(d.monthlySum * RATE * fraction)}\n${dealLink(d.leadId)}`;
      });
    ahead.push(...nextPayments);

    const parts = [
      `💰 ${person.name}, этот месяц: ${money(sum(month))}`,
      `Прошлый месяц: ${money(sum(rows.filter((r) => monthOf(r.date) === previousMonth(day))))}`,
    ];
    if (earned.length) parts.push("", "Начислено:", ...earned);
    if (ahead.length) parts.push("", "Ещё впереди:", ...ahead);
    await tg.send(chat, parts.join("\n").slice(0, MAX_TEXT));
  }

  async function totals(chat: number) {
    const rows = uniqueAccruals(await store.accruals());
    const day = today();
    const report = (month: string, title: string) => {
      const list = rows.filter((r) => monthOf(r.date) === month);
      const byPerson = new Map<string, number>();
      for (const r of list) byPerson.set(r.person, (byPerson.get(r.person) ?? 0) + r.amount);
      const rent = list.reduce((total, r) => total + r.base * r.fraction, 0);
      return [
        `📊 ${title}`,
        `Аренда: ${money(rent)}`,
        ...[...byPerson.entries()].sort((a, b) => b[1] - a[1]).map(([name, amount]) => `${name}: ${money(amount)}`),
      ].join("\n");
    };
    const open = (await store.deals()).filter((d) => d.state.startsWith("asked_")).length;
    await tg.send(chat, [report(monthOf(day), "Этот месяц"), report(previousMonth(day), "Прошлый месяц"), `Вопросов без ответа: ${open}`].join("\n\n"));
  }

  async function onMessage(message: IncomingMessage) {
    const chat = message.chat.id;
    const text = message.text?.trim() ?? "";
    if (message.chat.type && message.chat.type !== "private") return;

    const people = await store.people();
    const person = people.find((p) => p.chat === chat);

    if (text.startsWith("/start")) {
      const code = text.split(/\s+/)[1];
      if (code && deps.ownerCode && code === deps.ownerCode) {
        await store.savePerson({ chat, name: OWNER });
        await tg.send(chat, "Вы подключены как владелица. Менеджерам отправьте ссылку на бота, а их запросы придут сюда.", { menu: [TOTALS] });
        return;
      }
      if (person) {
        await tg.send(chat, `Вы уже подключены: ${person.name}.`, { menu: [person.name === OWNER ? TOTALS : MY_DEALS] });
        return;
      }
      if (!owners(people).length) {
        await tg.send(chat, "Бот ещё не настроен.");
        return;
      }
      const who = [message.from?.first_name, message.from?.last_name].filter(Boolean).join(" ") + (message.from?.username ? ` (@${message.from.username})` : "");
      const buttons: Button[][] = [
        ...PERSON_NAMES.map((name, index) => [{ text: name, data: `r:${chat}:${index}` }]),
        [{ text: "Отклонить", data: `r:${chat}:no` }],
      ];
      await sendToAll(owners(people), `Хочет подключиться: ${who || "без имени"}. Кто это?`, buttons);
      await tg.send(chat, "Запрос отправлен владелице. Бот напишет, когда вас подключат.");
      return;
    }

    if (!person) {
      await tg.send(chat, "Сначала нажмите /start.");
      return;
    }

    const tag = parsePromptTag(message.reply_to_message?.text);
    if (tag) return onReply(chat, person, tag, text, people);

    if (person.name === OWNER && (text === TOTALS || text === "/itogi")) return totals(chat);
    if (person.name === OWNER) {
      const id = dealIdFromText(text);
      if (id !== null) {
        const deal = (await store.deals()).find((d) => d.leadId === id);
        if (deal) return showEditPanel(chat, deal);
        await tg.send(chat, "Такой заявки в таблице нет. В таблице только заявки с этапов «Забронировано» и дальше, с даты запуска. Если она только что попала на этот этап, она появится после 18:00.");
        return;
      }
      await tg.send(chat, "Чтобы изменить заявку, пришлите ссылку на сделку amoCRM или её номер из первого столбца листа «Заявки». На вопросы бота отвечайте кнопками.");
      return;
    }
    if (person.name !== OWNER && (text === MY_DEALS || text === "/zayavki")) return myDeals(chat, person);

    await tg.send(chat, "Отвечайте кнопками. Если бот просил написать сумму или дату, нажмите на его сообщение и выберите «Ответить».");
  }

  async function onUpdate(update: TelegramUpdate) {
    if (update.callback_query) await onCallback(update.callback_query);
    else if (update.message) await onMessage(update.message);
  }

  return { onUpdate, dailyRun, importExisting, startReview };
}
