import { beforeEach, describe, expect, it } from "vitest";
import { createEngine, type Button, type Store } from "@/lib/payroll/engine";
import { monthTabCells, monthTabTitle } from "@/lib/payroll/sheets-store";
import { type Accrual, type AmoLeadRaw, type AmoPairCandidate, type Deal, type Person, type RpBooking, addMonths, findAmoPair, firstMonthlyPayment, isLongRental, nextMonthlyPayment, parseDateRange, parseDay, parseExtension, parseSum, shareFromOptions, uniqueAccruals } from "@/lib/payroll/logic";

const OLGA = 1;
const NATALYA = 2;
const OWNER_CHAT = 9;
const BOOKED = 7669282;
const ISSUED = 70178258;
const REJECTED = 143;

const ts = (day: string) => Date.parse(`${day}T10:00:00+07:00`) / 1000;

type LeadOptions = { start?: string; end?: string; price?: number; managers?: string[]; status?: number; car?: string };

function lead(id: number, opts: LeadOptions = {}): AmoLeadRaw {
  return {
    id,
    name: `Сделка ${id}`,
    status_id: opts.status ?? BOOKED,
    price: opts.price ?? 12000,
    custom_fields_values: [
      { field_id: 1734217, values: [{ value: ts(opts.start ?? "2026-12-05") }] },
      { field_id: 1734219, values: [{ value: ts(opts.end ?? "2026-12-13") }] },
      // These two must not affect the sum: the budget is the rent.
      { field_id: 1734225, values: [{ value: 99 }] },
      { field_id: 1734227, values: [{ value: 99 }] },
      { field_id: 1734239, values: [{ value: opts.car ?? "Fortuner" }] },
      { field_id: 1738813, values: (opts.managers ?? ["Ольга"]).map((value) => ({ value })) },
    ],
  };
}

type Sent = { chat: number; msg: number; text: string; buttons?: Button[][]; forceReply?: boolean; edited?: string; editedButtons?: Button[][] };

function setup() {
  const deals: Deal[] = [];
  const accruals: Accrual[] = [];
  const people: Person[] = [
    { chat: OLGA, name: "Ольга" },
    { chat: NATALYA, name: "Наталья" },
    { chat: OWNER_CHAT, name: "Владелец" },
  ];
  const sent: Sent[] = [];
  const answers: (string | undefined)[] = [];
  const amoLeads = new Map<number, AmoLeadRaw>();
  const bookings: RpBooking[] = [];
  const candidates: AmoPairCandidate[] = [];
  const clock = { day: "2026-12-01" };

  const store: Store = {
    deals: async () => structuredClone(deals),
    insertDeals: async (list) => void deals.push(...structuredClone(list)),
    updateDeals: async (list) => {
      for (const deal of list) deals[deals.findIndex((d) => d.leadId === deal.leadId)] = structuredClone(deal);
    },
    accruals: async () => structuredClone(accruals),
    addAccruals: async (rows) => void accruals.push(...rows),
    people: async () => structuredClone(people),
    savePerson: async (person) => {
      const i = people.findIndex((p) => p.chat === person.chat);
      if (i >= 0) people[i] = person;
      else people.push(person);
    },
  };

  let nextMsg = 100;
  const engine = createEngine({
    store,
    tg: {
      send: async (chat, text, options) => {
        nextMsg++;
        sent.push({ chat, msg: nextMsg, text, buttons: options?.buttons, forceReply: options?.forceReply });
        return nextMsg;
      },
      edit: async (chat, msg, text, buttons) => {
        const found = sent.find((s) => s.chat === chat && s.msg === msg);
        if (found) {
          found.edited = text;
          found.editedButtons = buttons;
        }
      },
      answer: async (_id, text) => void answers.push(text),
    },
    amo: {
      leadsByIds: async (ids) => ids.flatMap((id) => amoLeads.get(id) ?? []),
      leadsInStatus: async (_p, status) => [...amoLeads.values()].filter((l) => l.status_id === status),
      pairCandidates: async () => structuredClone(candidates),
    },
    rentprog: { bookings: async () => structuredClone(bookings) },
    now: () => Date.parse(`${clock.day}T20:00:00+07:00`),
    leadUrl: (id) => `https://amo/${id}`,
    startDate: "2026-11-01",
    ownerCode: "secret-code",
  });

  const press = (chat: number, data: string) =>
    engine.onUpdate({ callback_query: { id: "cb", data, from: { id: chat }, message: { message_id: 1, chat: { id: chat } } } });

  const reply = async (chat: number, text: string) => {
    const promptMessage = [...sent].reverse().find((s) => s.chat === chat && s.forceReply);
    await engine.onUpdate({ message: { chat: { id: chat, type: "private" }, text, reply_to_message: { text: promptMessage?.text } } });
  };

  const say = (chat: number, text: string) => engine.onUpdate({ message: { chat: { id: chat, type: "private" }, text, from: { first_name: "Новый" } } });

  const deal = (id: number) => deals.find((d) => d.leadId === id)!;
  const totalFor = (person: string) => uniqueAccruals(accruals).filter((a) => a.person === person).reduce((t, a) => t + a.amount, 0);
  const evening = (day: string) => {
    clock.day = day;
    return engine.dailyRun();
  };
  const messagesTo = (chat: number) => sent.filter((s) => s.chat === chat);

  return { bookings, candidates, engine, press, reply, say, deal, deals, accruals, sent, answers, amoLeads, clock, people, totalFor, evening, messagesTo };
}

let t: ReturnType<typeof setup>;
beforeEach(() => {
  t = setup();
});

async function bookAndIssue(id: number, opts: LeadOptions = {}) {
  t.amoLeads.set(id, lead(id, opts));
  await t.evening(opts.start ?? "2026-12-05");
  await t.press(OLGA, `ia:${t.clock.day}`);
}

describe("блок 1: новые брони", () => {
  it("берёт менеджера и бюджет из amoCRM и шлёт одну сводку обоим менеджерам, без вопроса «чья»", async () => {
    t.amoLeads.set(1, lead(1, { managers: ["Наталья"] }));
    t.amoLeads.set(2, lead(2, { managers: ["50/50 Наталья/Ольга"], car: "Mazda2", price: 4500 }));
    await t.evening("2026-12-01");

    for (const chat of [OLGA, NATALYA]) {
      expect(t.messagesTo(chat)).toHaveLength(1);
      const [message] = t.messagesTo(chat);
      expect(message.text).toContain("Fortuner");
      expect(message.text).toContain("12");
      expect(message.text).toContain("Наталья");
      expect(message.text).toContain("https://amo/1");
      expect(message.text).toContain("50/50 Наталья и Ольга");
      expect(message.buttons?.flat().map((b) => b.data)).toEqual(["d:1", "d:2"]);
    }
    expect(t.messagesTo(OWNER_CHAT).map((m) => m.text)).toEqual(t.messagesTo(OLGA).map((m) => m.text));
    expect(t.deal(1)).toMatchObject({ state: "booked", share: "n", rent: 12000 });
    expect(t.accruals).toHaveLength(0);
  });

  it("второй вечер не повторяет ту же бронь", async () => {
    t.amoLeads.set(1, lead(1));
    await t.evening("2026-12-01");
    t.sent.length = 0;
    await t.evening("2026-12-02");
    expect(t.sent).toHaveLength(0);
  });

  it("непонятную заявку спрашивает только у владелицы, менеджеры её не забирают", async () => {
    t.amoLeads.set(1, lead(1, { managers: ["Наталья", "Ольга"] }));
    await t.evening("2026-12-01");
    expect(t.messagesTo(OLGA)).toHaveLength(0);
    expect(t.messagesTo(OWNER_CHAT)[0].text).toContain("Непонятно");

    await t.press(OLGA, "f:1:o");
    expect(t.deal(1).share).toBe("");
    await t.press(OWNER_CHAT, "f:1:s");
    expect(t.deal(1)).toMatchObject({ state: "booked", share: "s" });
  });

  it("пока владелица не решила, про выдачу не спрашивает и напоминает ей", async () => {
    t.amoLeads.set(1, lead(1, { managers: [] }));
    await t.evening("2026-12-01");
    t.sent.length = 0;
    await t.evening("2026-12-05");
    expect(t.messagesTo(OLGA)).toHaveLength(0);
    expect(t.messagesTo(OWNER_CHAT)).toHaveLength(1);
    expect(t.deal(1).state).toBe("asked_whose");
  });

  it("если менеджера поправили в amoCRM до выдачи, бот берёт нового", async () => {
    t.amoLeads.set(1, lead(1, { managers: ["Ольга"] }));
    await t.evening("2026-12-01");
    t.amoLeads.set(1, lead(1, { managers: ["Наталья"] }));
    await t.evening("2026-12-02");
    expect(t.deal(1).share).toBe("n");
  });

  it("старые заявки не трогает", async () => {
    t.amoLeads.set(1, lead(1, { start: "2025-01-05", end: "2025-01-13" }));
    await t.evening("2026-12-01");
    expect(t.deals).toHaveLength(0);
  });
});

describe("споры", () => {
  it("«Не согласна» уходит только владелице с именем нажавшего, её решение сообщается обоим", async () => {
    t.amoLeads.set(1, lead(1));
    await t.evening("2026-12-01");
    t.sent.length = 0;

    await t.press(NATALYA, "d:1");
    expect(t.messagesTo(OWNER_CHAT)[0].text).toContain("Не согласна: Наталья");
    expect(t.messagesTo(OLGA)).toHaveLength(0);
    expect(t.deal(1).share).toBe("o");

    await t.press(NATALYA, "f:1:n");
    expect(t.deal(1).share).toBe("o");

    await t.press(OWNER_CHAT, "f:1:n");
    expect(t.deal(1).share).toBe("n");
    expect(t.messagesTo(OLGA).at(-1)?.text).toContain("Владелица решила");
    expect(t.messagesTo(NATALYA).at(-1)?.text).toContain("Владелица решила");
  });

  it("решение владелицы amoCRM потом не перезаписывает", async () => {
    t.amoLeads.set(1, lead(1));
    await t.evening("2026-12-01");
    await t.press(OWNER_CHAT, "f:1:n");
    await t.evening("2026-12-02");
    expect(t.deal(1).share).toBe("n");
  });

  it("спор после выдачи: деньги переходят, общая сумма та же; месяц выплаты не трогается", async () => {
    await bookAndIssue(1);
    expect(t.totalFor("Ольга")).toBe(600);

    t.clock.day = "2027-01-10";
    await t.press(NATALYA, "d:1");
    await t.press(OWNER_CHAT, "f:1:s");

    expect(t.totalFor("Ольга")).toBe(300);
    expect(t.totalFor("Наталья")).toBe(300);
    const fixes = t.accruals.filter((a) => a.type === "Правка");
    expect(fixes.every((a) => a.date === "2027-01-10")).toBe(true);
    expect(t.accruals.find((a) => a.type === "Выдача")?.date).toBe("2026-12-05");
  });

  it("повторное и обратное решение считаются верно", async () => {
    await bookAndIssue(1);
    await t.press(OWNER_CHAT, "f:1:n");
    await t.press(OWNER_CHAT, "f:1:n");
    expect(t.totalFor("Наталья")).toBe(600);
    expect(t.totalFor("Ольга")).toBe(0);
    await t.press(OWNER_CHAT, "f:1:o");
    expect(t.totalFor("Ольга")).toBe(600);
    expect(t.totalFor("Наталья")).toBe(0);
  });

  it("владелица исправляет сумму после выдачи", async () => {
    await bookAndIssue(1);
    await t.press(NATALYA, "d:1");
    await t.press(OWNER_CHAT, "fs:1");
    await t.reply(OWNER_CHAT, "10000");
    expect(t.deal(1).rent).toBe(10000);
    expect(t.totalFor("Ольга")).toBe(500);
  });

  it("менеджер не может исправить сумму за владелицу", async () => {
    await bookAndIssue(1);
    await t.press(NATALYA, "fs:1");
    expect(t.messagesTo(NATALYA).some((s) => s.forceReply)).toBe(false);
  });
});

describe("блок 2: выдачи", () => {
  it("до даты выдачи не спрашивает и не начисляет: предоплата не считается", async () => {
    t.amoLeads.set(1, lead(1));
    await t.evening("2026-12-04");
    expect(t.deal(1).state).toBe("booked");
    expect(t.accruals).toHaveLength(0);
  });

  it("приходит обоим, «Всё верно» от одного закрывает все, начисление по бюджету", async () => {
    t.amoLeads.set(1, lead(1));
    t.amoLeads.set(2, lead(2, { car: "Mazda2", price: 5000, managers: ["50/50 Наталья/Ольга"] }));
    await t.evening("2026-12-05");
    const block = t.sent.filter((s) => s.text.startsWith("🔑"));
    expect(block.map((s) => s.chat).sort()).toEqual([OLGA, NATALYA, OWNER_CHAT]);

    await t.press(NATALYA, "ia:2026-12-05");
    expect(t.deal(1).state).toBe("in_rent");
    expect(t.deal(2).state).toBe("in_rent");
    expect(t.totalFor("Ольга")).toBe(600 + 125);
    expect(t.totalFor("Наталья")).toBe(125);
    expect(t.accruals[0].date).toBe("2026-12-05");
    expect(block.every((s) => s.edited?.includes("Отвечено"))).toBe(true);
  });

  it("аренда, начатая до запуска бота, не начисляется задним числом", async () => {
    t.amoLeads.set(1, lead(1, { start: "2026-10-24", end: "2026-12-24" }));
    await t.evening("2026-12-05");
    await t.press(OLGA, "i:1:full");
    expect(t.deal(1).state).toBe("in_rent");
    expect(t.accruals).toHaveLength(0);
  });

  it("повторное нажатие не удваивает зарплату", async () => {
    await bookAndIssue(1);
    await t.press(OLGA, "ia:2026-12-05");
    await t.press(NATALYA, "ia:2026-12-05");
    expect(t.totalFor("Ольга")).toBe(600);
  });

  it("посторонний не может ответить", async () => {
    t.amoLeads.set(1, lead(1));
    await t.evening("2026-12-05");
    await t.press(555, "ia:2026-12-05");
    expect(t.deal(1).state).toBe("asked_issue");
    expect(t.accruals).toHaveLength(0);
  });

  it("другая сумма, остальные в списке остаются открытыми", async () => {
    t.amoLeads.set(1, lead(1));
    t.amoLeads.set(2, lead(2, { car: "Mazda2" }));
    await t.evening("2026-12-05");
    await t.press(OLGA, "im:1");
    await t.press(OLGA, "i:1:sum");
    await t.reply(OLGA, "абв");
    expect(t.accruals).toHaveLength(0);
    await t.reply(OLGA, "10 000");
    expect(t.totalFor("Ольга")).toBe(500);
    expect(t.deal(1).rent).toBe(10000);
    expect(t.deal(2).state).toBe("asked_issue");

    await t.press(OLGA, "ia:2026-12-05");
    expect(t.totalFor("Ольга")).toBe(500 + 600);
  });

  it("не приехал: не начисляет и больше не спрашивает", async () => {
    t.amoLeads.set(1, lead(1));
    await t.evening("2026-12-05");
    await t.press(OLGA, "i:1:no");
    t.sent.length = 0;
    await t.evening("2026-12-14");
    expect(t.deal(1).state).toBe("no_show");
    expect(t.accruals).toHaveLength(0);
    expect(t.sent).toHaveLength(0);
  });

  it("перенос: спрашивает в новую дату, amoCRM не перезаписывает даты", async () => {
    t.amoLeads.set(1, lead(1));
    await t.evening("2026-12-05");
    await t.press(OLGA, "i:1:move");
    await t.reply(OLGA, "10.12 14.12");
    expect(t.deal(1)).toMatchObject({ state: "booked", start: "2026-12-10", end: "2026-12-14" });

    await t.evening("2026-12-06");
    expect(t.deal(1)).toMatchObject({ state: "booked", start: "2026-12-10" });

    await t.evening("2026-12-10");
    expect(t.deal(1).state).toBe("asked_issue");
  });

  it("новый бюджет и даты из amoCRM подтягиваются перед вопросом", async () => {
    t.amoLeads.set(1, lead(1));
    await t.evening("2026-12-01");
    t.amoLeads.set(1, lead(1, { start: "2026-12-07", end: "2026-12-10", price: 6000 }));
    await t.evening("2026-12-07");
    expect(t.deal(1)).toMatchObject({ state: "asked_issue", rent: 6000, start: "2026-12-07" });
  });

  it("отказ в amoCRM снимает заявку", async () => {
    t.amoLeads.set(1, lead(1));
    await t.evening("2026-12-01");
    t.amoLeads.set(1, lead(1, { status: REJECTED }));
    await t.evening("2026-12-05");
    expect(t.deal(1).state).toBe("cancelled");
    expect(t.accruals).toHaveLength(0);
  });

  it("заявка, сразу попавшая в «Выдан клиенту», тоже ловится", async () => {
    t.amoLeads.set(1, lead(1, { status: ISSUED }));
    await t.evening("2026-12-05");
    expect(t.deal(1).state).toBe("asked_issue");
  });

  it("без ответа: переносится на следующий вечер, владелица видит список, старое не удваивается", async () => {
    t.amoLeads.set(1, lead(1));
    await t.evening("2026-12-05");
    const first = t.messagesTo(OLGA).find((s) => s.text.startsWith("🔑"))!;
    t.sent.length = 0;
    t.sent.push(first);

    await t.evening("2026-12-06");
    expect(first.edited).toContain("перенесены");
    expect(t.messagesTo(OWNER_CHAT).at(-1)?.text).toContain("не ответили");
    expect(t.messagesTo(OLGA).filter((s) => s.text.startsWith("🔑"))).toHaveLength(2);

    await t.press(OLGA, "ia:2026-12-05");
    expect(t.accruals).toHaveLength(0);
    await t.press(OLGA, "ia:2026-12-06");
    expect(t.totalFor("Ольга")).toBe(600);
    expect(t.accruals[0].date).toBe("2026-12-05");
  });
});

describe("блок 3: сдачи", () => {
  beforeEach(async () => {
    await bookAndIssue(1);
    await t.evening("2026-12-13");
  });

  it("приходит в день окончания; «Всё верно» завершает, новых начислений нет", async () => {
    expect(t.sent.filter((s) => s.text.startsWith("🏁")).map((s) => s.chat).sort()).toEqual([OLGA, NATALYA, OWNER_CHAT]);
    await t.press(NATALYA, "ea:2026-12-13");
    expect(t.deal(1).state).toBe("finished");
    expect(t.totalFor("Ольга")).toBe(600);
  });

  it("продление начисляется менеджеру заявки, и снова вопрос в новую дату", async () => {
    await t.press(NATALYA, "em:1");
    await t.press(NATALYA, "e:1:ext");
    await t.reply(NATALYA, "20.12 7000");
    expect(t.deal(1)).toMatchObject({ state: "in_rent", end: "2026-12-20", rent: 19000 });
    expect(t.totalFor("Ольга")).toBe(950);
    expect(t.totalFor("Наталья")).toBe(0);

    await t.evening("2026-12-20");
    expect(t.deal(1).state).toBe("asked_end");
  });

  it("спорное продление владелица может передать, заявка переходит целиком", async () => {
    await t.press(OLGA, "e:1:ext");
    await t.reply(OLGA, "20.12 7000");
    await t.press(NATALYA, "d:1");
    await t.press(OWNER_CHAT, "f:1:n");
    expect(t.totalFor("Наталья")).toBe(950);
    expect(t.totalFor("Ольга")).toBe(0);
  });

  it("продление с датой раньше окончания не принимается", async () => {
    await t.press(OLGA, "e:1:ext");
    await t.reply(OLGA, "10.12 7000");
    expect(t.deal(1).state).toBe("asked_end");
    expect(t.accruals).toHaveLength(1);
  });

  it("досрочный возврат: минус в день возврата", async () => {
    await t.press(OLGA, "e:1:early");
    await t.reply(OLGA, "9000");
    expect(t.deal(1)).toMatchObject({ state: "finished", rent: 9000 });
    expect(t.totalFor("Ольга")).toBe(450);
    expect(t.accruals.find((a) => a.type === "Возврат")).toMatchObject({ date: "2026-12-13", amount: -150 });
  });

  it("итоговая сумма больше записанной не принимается", async () => {
    await t.press(OLGA, "e:1:early");
    await t.reply(OLGA, "99000");
    expect(t.deal(1).state).toBe("asked_end");
    expect(t.accruals).toHaveLength(1);
  });

  it("после ответа остаётся кнопка «Не согласна»", async () => {
    await t.press(OLGA, "ea:2026-12-13");
    const block = t.messagesTo(OLGA).filter((s) => s.text.startsWith("🏁")).at(-1)!;
    expect(block.editedButtons?.flat().map((b) => b.data)).toEqual(["d:1"]);
  });
});

describe("копия сводки владелице", () => {
  it("получает те же блоки, ответ менеджера обновляет и её сообщение", async () => {
    t.amoLeads.set(1, lead(1));
    await t.evening("2026-12-05");
    const copy = t.messagesTo(OWNER_CHAT).find((s) => s.text.startsWith("🔑"))!;
    expect(copy.text).toBe(t.messagesTo(OLGA).find((s) => s.text.startsWith("🔑"))!.text);
    await t.press(OLGA, "ia:2026-12-05");
    expect(copy.edited).toContain("Отвечено");
    expect(t.totalFor("Ольга")).toBe(600);
  });

  it("непонятная заявка по-прежнему только у владелицы", async () => {
    t.amoLeads.set(1, lead(1, { managers: [] }));
    await t.evening("2026-12-01");
    expect(t.messagesTo(OLGA)).toHaveLength(0);
    expect(t.messagesTo(OWNER_CHAT)).toHaveLength(1);
  });
});

describe("все блоки за один вечер", () => {
  it("новая бронь, выдача и сдача приходят тремя отдельными сообщениями", async () => {
    t.amoLeads.set(1, lead(1, { start: "2026-12-05", end: "2026-12-13" }));
    t.amoLeads.set(2, lead(2, { start: "2026-12-13", end: "2026-12-20", car: "Mazda2" }));
    await t.evening("2026-12-05");
    await t.press(OLGA, "ia:2026-12-05");
    t.amoLeads.set(3, lead(3, { start: "2026-12-25", end: "2026-12-28", car: "CX-30" }));
    t.sent.length = 0;

    await t.evening("2026-12-13");
    const titles = t.messagesTo(OLGA).map((s) => s.text.split("\n")[0]);
    expect(titles).toEqual(["🆕 Новые брони за сегодня", "🔑 Выдачи: проверьте", "🏁 Сдачи: проверьте"]);
  });
});

describe("подключение и «Мои заявки»", () => {
  it("подключить может только владелица, выбирая имя", async () => {
    await t.say(77, "/start");
    expect(t.messagesTo(OWNER_CHAT).at(-1)?.buttons?.flat().map((b) => b.text)).toEqual(["Ольга", "Наталья", "Офис", "Екатерина/Дмитрий", "Отклонить"]);
    await t.press(OLGA, "r:77:0");
    expect(t.people.some((p) => p.chat === 77)).toBe(false);
    await t.press(OWNER_CHAT, "r:77:1");
    expect(t.people.find((p) => p.chat === 77)?.name).toBe("Наталья");
  });

  it("отклонённый не подключается", async () => {
    await t.say(77, "/start");
    await t.press(OWNER_CHAT, "r:77:no");
    expect(t.people.some((p) => p.chat === 77)).toBe(false);
  });

  it("неверный код не делает владельцем", async () => {
    await t.say(77, "/start wrong");
    expect(t.people.some((p) => p.chat === 77)).toBe(false);
    await t.say(78, "/start secret-code");
    expect(t.people.find((p) => p.chat === 78)?.name).toBe("Владелец");
  });

  it("в сводке видно, кто из менеджеров ответил", async () => {
    t.amoLeads.set(1, lead(1));
    await t.evening("2026-12-05");
    await t.press(NATALYA, "ia:2026-12-05");
    const copy = t.messagesTo(OWNER_CHAT).find((s) => s.text.startsWith("🔑"))!;
    expect(copy.edited).toContain("Выдана (Наталья)");
  });

  it("менеджер видит свои заявки и 50/50 со ссылками, но не чужие", async () => {
    t.amoLeads.set(1, lead(1, { managers: ["Ольга"] }));
    t.amoLeads.set(2, lead(2, { managers: ["50/50 Наталья/Ольга"], car: "Mazda2", price: 5000 }));
    t.amoLeads.set(3, lead(3, { managers: ["Наталья"], car: "Ranger" }));
    t.amoLeads.set(4, lead(4, { managers: ["50/50 Наталья/Ольга"], car: "CX-30", start: "2026-12-20", end: "2026-12-25", price: 10000 }));
    await t.evening("2026-12-05");
    await t.press(OLGA, "ia:2026-12-05");
    t.sent.length = 0;

    await t.say(OLGA, "/zayavki");
    const text = t.messagesTo(OLGA).at(-1)!.text;
    expect(text).toContain("Ольга, этот месяц");
    expect(text).toContain("https://amo/1");
    expect(text).toContain("https://amo/2");
    expect(text).toContain("50/50");
    expect(text).toContain("Ещё впереди");
    expect(text).toContain("https://amo/4");
    expect(text).not.toContain("https://amo/3");
    expect(text).not.toContain("Наталья, этот месяц");
  });

  it("посторонний не увидит зарплату, итоги только у владелицы", async () => {
    await bookAndIssue(1, { managers: ["50/50 Ольга/офис"] });
    t.sent.length = 0;
    await t.say(555, "/zayavki");
    expect(t.messagesTo(555).at(-1)?.text).toContain("/start");

    await t.say(OLGA, "/itogi");
    expect(t.messagesTo(OLGA).at(-1)?.text).not.toContain("Офис");

    t.clock.day = "2026-12-20";
    await t.say(OWNER_CHAT, "/itogi");
    const text = t.messagesTo(OWNER_CHAT).at(-1)!.text;
    expect(text).toContain("Офис: 300");
    expect(text).toContain("Ольга: 300");
  });
});

describe("запуск: уже идущие заявки", () => {
  it("заходят без вопросов и без сводки, начисление только с даты запуска, повтор безопасен", async () => {
    t.clock.day = "2026-12-01";
    t.amoLeads.set(1, lead(1, { start: "2026-12-05", end: "2026-12-13" }));
    t.amoLeads.set(2, lead(2, { start: "2026-11-20", end: "2026-12-03", status: ISSUED, managers: ["Наталья"] }));
    t.amoLeads.set(3, lead(3, { start: "2026-10-20", end: "2026-12-03", status: ISSUED }));
    t.amoLeads.set(4, lead(4, { start: "2026-08-01", end: "2026-08-20", status: ISSUED }));
    t.amoLeads.set(5, lead(5, { start: "2026-12-06", end: "2026-12-08", managers: ["Наталья", "Ольга"] }));

    expect(await t.engine.importExisting()).toEqual({ imported: 4, rentprogOnly: 0, asked: 1, accruals: 1 });
    expect(t.messagesTo(OLGA)).toHaveLength(0);
    expect(t.messagesTo(OWNER_CHAT)).toHaveLength(1);
    expect(t.deal(1).state).toBe("booked");
    expect(t.deal(2).state).toBe("in_rent");
    expect(t.totalFor("Наталья")).toBe(600);
    expect(t.totalFor("Ольга")).toBe(0);
    expect(t.deals.some((d) => d.leadId === 4)).toBe(false);

    await t.engine.importExisting();
    expect(t.totalFor("Наталья")).toBe(600);
    expect(t.deals).toHaveLength(4);
  });
});

function booking(id: number, opts: Partial<RpBooking> = {}): RpBooking {
  return {
    id,
    car: "Yaris Sport #7826",
    plate: "7826",
    phone: "812345678",
    start: "2026-12-10",
    end: "2026-12-21",
    rent: 10450,
    createdDay: "2026-12-01",
    finished: false,
    inRent: false,
    draft: false,
    failed: false,
    ...opts,
  };
}

const pairOf = (leadId: number, opts: Partial<AmoPairCandidate> = {}): AmoPairCandidate => ({ leadId, status: BOOKED, plate: "", phones: [], start: "2026-12-10", ...opts });

describe("сверка с RentProg", () => {
  it("бронь без сделки в amoCRM на следующий день становится заявкой офиса", async () => {
    t.bookings.push(booking(50));
    await t.evening("2026-12-01");
    expect(t.deals).toHaveLength(0);

    await t.evening("2026-12-02");
    expect(t.deal(-50)).toMatchObject({ share: "f", state: "booked", rent: 10450 });
    const message = t.messagesTo(OLGA).at(-1)!;
    expect(message.text).toContain("Офис");
    expect(message.text).toContain("только в RentProg");
    expect(message.buttons?.flat().map((b) => b.data)).toEqual(["d:-50"]);
  });

  it("бронь, поставленная ночью, тоже ловится на следующий день", async () => {
    t.bookings.push(booking(50, { createdDay: "2026-12-02" }));
    await t.evening("2026-12-02");
    expect(t.deals).toHaveLength(0);
    await t.evening("2026-12-03");
    expect(t.deal(-50).state).toBe("booked");
  });

  it("есть пара по телефону или по машине с датой: офису не записывается", async () => {
    t.bookings.push(booking(50), booking(51, { phone: "111111111", plate: "1885" }), booking(52, { phone: "222222222", plate: "9999" }));
    t.candidates.push(pairOf(1, { phones: ["812345678"], start: "2026-12-12" }), pairOf(2, { plate: "1885", status: 70178266 }));
    await t.evening("2026-12-05");
    expect(t.deals.map((d) => d.leadId)).toEqual([-52]);
  });

  it("сделка, которая стоит только в «Отказе», парой не считается", async () => {
    t.bookings.push(booking(50));
    await t.evening("2026-12-05");
    expect(t.deal(-50).share).toBe("f");
  });

  it("черновики, отмены и старые аренды не записываются", async () => {
    t.bookings.push(booking(50, { draft: true }), booking(51, { failed: true }), booking(52, { start: "2026-08-01", end: "2026-08-10" }));
    await t.evening("2026-12-05");
    expect(t.deals).toHaveLength(0);
  });

  it("считается отдельной строкой офиса, спор передаёт деньги менеджеру", async () => {
    t.bookings.push(booking(50, { start: "2026-12-05" }));
    await t.evening("2026-12-05");
    await t.press(OLGA, "ia:2026-12-05");
    expect(t.totalFor("Офис")).toBeCloseTo(522.5);

    await t.press(OLGA, "d:-50");
    expect(t.messagesTo(OWNER_CHAT).at(-1)?.text).toContain("только в RentProg");
    await t.press(OWNER_CHAT, "f:-50:o");
    expect(t.totalFor("Офис")).toBeCloseTo(0);
    expect(t.totalFor("Ольга")).toBeCloseTo(522.5);
  });

  it("другая сумма работает и для заявки только из RentProg", async () => {
    t.bookings.push(booking(50, { start: "2026-12-05" }));
    await t.evening("2026-12-05");
    await t.press(OLGA, "i:-50:sum");
    await t.reply(OLGA, "10000");
    expect(t.totalFor("Офис")).toBe(500);
  });

  it("если сделка появилась позже, запись офиса снимается и деньги не удваиваются", async () => {
    t.bookings.push(booking(50, { start: "2026-12-05" }));
    await t.evening("2026-12-05");
    await t.press(OLGA, "ia:2026-12-05");
    expect(t.totalFor("Офис")).toBeCloseTo(522.5);

    t.amoLeads.set(7, lead(7, { start: "2026-12-05", end: "2026-12-21", price: 10450, managers: ["Ольга"] }));
    t.candidates.push(pairOf(7, { phones: ["812345678"], start: "2026-12-05" }));
    await t.evening("2026-12-06");
    expect(t.deal(-50).state).toBe("cancelled");
    expect(t.totalFor("Офис")).toBeCloseTo(0);
    await t.press(OLGA, "ia:2026-12-06");
    expect(t.totalFor("Ольга")).toBeCloseTo(522.5);
  });

  it("решение владелицы сверка не отменяет", async () => {
    t.bookings.push(booking(50));
    await t.evening("2026-12-02");
    await t.press(OWNER_CHAT, "f:-50:n");
    t.candidates.push(pairOf(7, { phones: ["812345678"] }));
    await t.evening("2026-12-03");
    expect(t.deal(-50)).toMatchObject({ state: "booked", share: "n" });
  });

  it("отменённая или исчезнувшая бронь снимается до выдачи", async () => {
    t.bookings.push(booking(50), booking(51));
    await t.evening("2026-12-02");
    t.bookings[0].failed = true;
    t.bookings.splice(1, 1);
    await t.evening("2026-12-03");
    expect(t.deal(-50).state).toBe("cancelled");
    expect(t.deal(-51).state).toBe("cancelled");
  });

  it("заявка из RentProg видна в итогах отдельной строкой и без ссылки", async () => {
    t.bookings.push(booking(50, { start: "2026-12-05", end: "2026-12-07" }));
    await t.evening("2026-12-05");
    const block = t.messagesTo(OLGA).find((s) => s.text.startsWith("🔑"))!;
    expect(block.text).toContain("только в RentProg");
    expect(block.text).not.toContain("https://amo/-50");
  });

  it("поиск пары: телефон важнее, далёкая дата не подходит", () => {
    const b = booking(1);
    expect(findAmoPair(b, [pairOf(1, { plate: "7826" }), pairOf(2, { phones: ["812345678"] })])?.leadId).toBe(2);
    expect(findAmoPair(b, [pairOf(1, { phones: ["812345678"], start: "2026-12-14" })])).toBeNull();
  });
});

describe("заполнение с 1 ноября", () => {
  it("заходят и завершённые за период, и заявки только из RentProg; менеджерам тихо", async () => {
    t.clock.day = "2026-11-04";
    t.amoLeads.set(1, lead(1, { start: "2026-11-01", end: "2026-11-03", status: 70178266, managers: ["Наталья"] }));
    t.amoLeads.set(2, lead(2, { start: "2026-10-01", end: "2026-10-20", status: 70178266 }));
    t.bookings.push(booking(50, { start: "2026-11-02", end: "2026-11-03", finished: true, createdDay: "2026-11-01" }));
    t.bookings.push(booking(51, { start: "2026-11-03", end: "2026-11-20", inRent: true, createdDay: "2026-11-02" }));
    t.bookings.push(booking(52, { start: "2026-12-01", end: "2026-12-05", createdDay: "2026-11-03" }));
    t.bookings.push(booking(53, { start: "2026-12-01", end: "2026-12-05", createdDay: "2026-11-04" }));
    t.bookings.push(booking(54, { start: "2026-10-01", end: "2026-10-05", finished: true, createdDay: "2026-09-20" }));

    const result = await t.engine.importExisting();
    expect(result).toEqual({ imported: 4, rentprogOnly: 3, asked: 0, accruals: 3 });
    expect(t.deal(1).state).toBe("finished");
    expect(t.deal(-50).state).toBe("finished");
    expect(t.deal(-51).state).toBe("in_rent");
    expect(t.deal(-52).state).toBe("booked");
    expect(t.totalFor("Наталья")).toBe(600);
    expect(t.totalFor("Офис")).toBeCloseTo(1045);
    expect(t.accruals.every((a) => a.date >= "2026-11-01")).toBe(true);
    expect(t.messagesTo(OLGA)).toHaveLength(0);

    await t.engine.importExisting();
    expect(t.deals).toHaveLength(4);
    expect(t.accruals).toHaveLength(3);
  });
});

describe("длинные аренды", () => {
  const LONG = { start: "2026-12-02", end: "2027-03-02", price: 90000 };

  async function askLong() {
    t.amoLeads.set(1, lead(1, LONG));
    await t.evening("2026-12-02");
  }

  it("«Всё верно» их не закрывает: ничего не начислено, пока менеджер не выбрал оплату", async () => {
    await askLong();
    t.amoLeads.set(2, lead(2, { start: "2026-12-02", end: "2026-12-05", car: "Mazda2", price: 3000 }));
    await t.evening("2026-12-03");
    const block = t.messagesTo(OLGA).filter((s) => s.text.startsWith("🔑")).at(-1)!;
    expect(block.text).toContain("Длинная аренда");
    expect(block.buttons?.flat().map((b) => b.text)[0]).toContain("выданы все (1)");

    await t.press(OLGA, "ia:2026-12-03");
    expect(t.deal(2).state).toBe("in_rent");
    expect(t.deal(1).state).toBe("asked_issue");
    expect(t.accruals.filter((a) => a.leadId === 1)).toHaveLength(0);
  });

  it("оплачена сразу: 5% со всей суммы, вопросов о месяцах нет", async () => {
    await askLong();
    await t.press(OLGA, "i:1:full");
    expect(t.totalFor("Ольга")).toBe(4500);
    t.sent.length = 0;
    await t.evening("2027-01-02");
    expect(t.messagesTo(OLGA)).toHaveLength(0);
  });

  it("помесячно: первый месяц, потом вопрос через месяц, и так до конца", async () => {
    await askLong();
    await t.press(OLGA, "i:1:month");
    await t.reply(OLGA, "30000");
    expect(t.totalFor("Ольга")).toBe(1500);
    expect(t.deal(1)).toMatchObject({ state: "in_rent", monthlySum: 30000, nextPay: "2027-01-02" });

    t.sent.length = 0;
    await t.evening("2027-01-01");
    expect(t.messagesTo(OLGA)).toHaveLength(0);

    await t.evening("2027-01-02");
    const block = t.messagesTo(OLGA).find((s) => s.text.startsWith("💳"))!;
    expect(block.text).toContain("30");
    await t.press(NATALYA, "pa:2027-01-02");
    expect(t.totalFor("Ольга")).toBe(3000);
    expect(t.accruals.at(-1)?.date).toBe("2027-01-02");
    expect(t.deal(1).nextPay).toBe("2027-02-02");

    await t.evening("2027-02-02");
    await t.press(OLGA, "pm:1");
    await t.press(OLGA, "p:1:sum");
    await t.reply(OLGA, "25000");
    expect(t.totalFor("Ольга")).toBe(4250);
    expect(t.deal(1)).toMatchObject({ monthlySum: 25000, nextPay: "" });

    await t.evening("2027-03-02");
    expect(t.deal(1).state).toBe("asked_end");
    await t.press(OLGA, "ea:2027-03-02");
    expect(t.deal(1).state).toBe("finished");
    expect(t.totalFor("Ольга")).toBe(4250);
  });

  it("повторное нажатие оплаты не удваивает, оплаты не было — месяц без начисления", async () => {
    await askLong();
    await t.press(OLGA, "i:1:month");
    await t.reply(OLGA, "30000");
    await t.evening("2027-01-02");
    await t.press(OLGA, "pa:2027-01-02");
    await t.press(OLGA, "pa:2027-01-02");
    expect(t.totalFor("Ольга")).toBe(3000);

    await t.evening("2027-02-02");
    await t.press(OLGA, "p:1:none");
    expect(t.totalFor("Ольга")).toBe(3000);
    expect(t.deal(1).state).toBe("in_rent");
  });

  it("досрочный возврат считается от реально оплаченного", async () => {
    await askLong();
    await t.press(OLGA, "i:1:month");
    await t.reply(OLGA, "30000");
    await t.evening("2027-01-02");
    await t.press(OLGA, "e:1:early");
    await t.reply(OLGA, "40000");
    expect(t.deal(1).state).toBe("asked_pay");
    await t.reply(OLGA, "20000");
    expect(t.deal(1)).toMatchObject({ state: "finished", nextPay: "" });
    expect(t.totalFor("Ольга")).toBe(1000);
  });

  it("аренда меньше месяца спрашивается как обычно", () => {
    expect(isLongRental({ start: "2026-12-01", end: "2027-01-01" })).toBe(false);
    expect(isLongRental({ start: "2026-12-01", end: "2027-01-02" })).toBe(true);
  });

  it("при запуске: идущая длинная аренда не начисляется целиком, менеджера спрашивают", async () => {
    t.clock.day = "2026-11-04";
    t.amoLeads.set(1, lead(1, { start: "2026-11-02", end: "2027-04-02", status: ISSUED, price: 120000 }));
    await t.engine.importExisting();
    expect(t.accruals).toHaveLength(0);
    expect(t.deal(1).state).toBe("booked");
    await t.evening("2026-11-04");
    expect(t.deal(1).state).toBe("asked_issue");
    await t.press(OLGA, "i:1:month");
    await t.reply(OLGA, "24000");
    expect(t.totalFor("Ольга")).toBe(1200);
    expect(t.accruals[0].date).toBe("2026-11-02");
  });

  it("начатая до запуска помесячная: старый месяц в таблицах, спрашивает первую оплату после запуска", async () => {
    t.clock.day = "2026-11-04";
    t.amoLeads.set(1, lead(1, { start: "2026-08-02", end: "2027-02-02", status: ISSUED, price: 120000 }));
    await t.engine.importExisting();
    await t.evening("2026-11-04");
    await t.press(OLGA, "i:1:month");
    await t.reply(OLGA, "20000");
    expect(t.accruals).toHaveLength(0);
    expect(t.deal(1).nextPay).toBe("2026-11-02");

    await t.evening("2026-11-05");
    expect(t.deal(1).state).toBe("asked_pay");
    await t.press(OLGA, "pa:2026-11-05");
    expect(t.totalFor("Ольга")).toBe(1000);
    expect(t.accruals[0].date).toBe("2026-11-02");
    expect(t.deal(1).nextPay).toBe("2026-12-02");
  });

  it("даты месяцев", () => {
    expect(addMonths("2027-01-31", 1)).toBe("2027-02-28");
    expect(addMonths("2026-12-15", 2)).toBe("2027-02-15");
    expect(firstMonthlyPayment("2026-12-02", "2027-03-02", "2026-11-01")).toBe("2027-01-02");
    expect(firstMonthlyPayment("2026-12-02", "2027-01-02", "2026-11-01")).toBe("");
    expect(nextMonthlyPayment("2027-01-31", "2027-02-28", "2027-06-01")).toBe("2027-03-31");
  });
});

describe("лист месяца", () => {
  it("называется по месяцу и считает только этот месяц", () => {
    expect(monthTabTitle("2026-11")).toBe("Ноябрь 2026");
    expect(monthTabTitle("2027-01")).toBe("Январь 2027");
    const cells = monthTabCells("2026-11").flat().join(" ");
    expect(cells).toContain("where B='2026-11'");
    expect(cells).not.toContain("2026-12");
  });
});

describe("разбор ответов", () => {
  it("суммы", () => {
    expect(parseSum("12 000")).toBe(12000);
    expect(parseSum("12000 бат")).toBe(12000);
    expect(parseSum("abc")).toBeNull();
  });
  it("даты", () => {
    expect(parseDay("25.12", "2026-12-01")).toBe("2026-12-25");
    expect(parseDay("05.01", "2026-12-20")).toBe("2027-01-05");
    expect(parseDay("31.02", "2026-12-01")).toBeNull();
    expect(parseDateRange("12.12 20.12", "2026-12-01")).toEqual({ start: "2026-12-12", end: "2026-12-20" });
    expect(parseDateRange("20.12 12.12", "2026-12-01")).toBeNull();
    expect(parseExtension("25.12 8 000", "2026-12-01")).toEqual({ end: "2026-12-25", sum: 8000 });
  });
  it("варианты поля Менеджер", () => {
    expect(shareFromOptions(["50/50 Наталья/Ольга"])).toBe("s");
    expect(shareFromOptions(["Екатерина/Дмитрий"])).toBe("d");
    expect(shareFromOptions(["Наталья", "Ольга"])).toBe("");
    expect(shareFromOptions(["Другое"])).toBe("");
    expect(shareFromOptions([])).toBe("");
  });
});
