import type { Locale } from "./dictionary";

type TermsContent = {
  legalTag: string;
  heading: string;
  subheading: string;
  included: { title: string; intro: string; items: string[] };
  driver: {
    title: string;
    age: string;
    experience: string;
    licenseIntro: string;
    option1Title: string;
    option1Text: string;
    option2Title: string;
    option2Text: string;
    warning: string;
    noLicenseNote: string;
  };
  delivery: {
    title: string;
    intro: string;
    tableHeaders: [string, string];
    rows: [string, string][];
    note: string;
  };
  minTerm: {
    title: string;
    intro: string;
    economyTitle: string;
    economyRows: [string, string][];
    crossoverTitle: string;
    crossoverRows: [string, string][];
    tableHeaders: [string, string];
    note: string;
  };
  payment: { title: string; intro: string; items: string[] };
  deposit: {
    title: string;
    intro: string;
    accidentTitle: string;
    accidentItems: string[];
    amountNote: string;
    cashNote: string;
    photoNote: string;
  };
  insurance: {
    title: string;
    intro: string;
    exclusionsTitle: string;
    exclusions: string[];
    callNote: string;
  };
  mileage: { title: string; items: string[] };
  returning: { title: string; text: string };
  important: {
    title: string;
    fuelTitle: string;
    fuelText: string;
    batteryTitle: string;
    batteryText: string;
    cleanTitle: string;
    cleanText: string;
    thirdPartyTitle: string;
    thirdPartyText: string;
    parkingTitle: string;
    parkingText: string;
    earlyReturnTitle: string;
    earlyReturnText: string;
    inspectionTitle: string;
    inspectionText: string;
  };
  cta: { title: string; subtitle: string; whatsapp: string; telegram: string };
  legalFooter: string;
};

export const termsContent: Record<Locale, TermsContent> = {
  ru: {
    legalTag: "Публичная оферта · KATACARS CO., LTD. · Рег. № 0835567015952",
    heading: "Условия аренды и доставка",
    subheading: "Phuket Car Rental — прямой прокатчик без посредников",
    included: {
      title: "Что включено в аренду",
      intro: "Всё это уже входит в стоимость — без доплат",
      items: [
        "Бизнес-страховка",
        "Детское автокресло",
        "Второй водитель (необходимы его права при получении)",
        "Держатель для телефона",
        "Путеводитель по лучшим местам Пхукета",
        "Поддержка 24/7 — на связи всё время аренды",
      ],
    },
    driver: {
      title: "Требования к водителю",
      age: "Возраст: от 21 года",
      experience: "Стаж вождения: от 3 лет",
      licenseIntro: "Водительское удостоверение — один из вариантов:",
      option1Title: "Вариант 1: Национальное ВУ",
      option1Text:
        "Национальное ВУ (пластиковая карта) — достаточно для аренды. Обратите внимание: в Таиланде для управления автомобилем формально требуется международное ВУ, полиция может выписать штраф при его отсутствии.",
      option2Title: "Вариант 2: Международное ВУ",
      option2Text:
        "Международное ВУ — принимается при наличии фото национального ВУ (для подтверждения подлинности). Отправьте нам фото заранее — мы проверим и подтвердим бронирование.",
      warning:
        "⚠️ Просроченное ВУ — даже автоматически продлённое — считается недействительным. Проверьте дату перед поездкой.",
      noLicenseNote: "Без действующего ВУ страховка не работает.",
    },
    delivery: {
      title: "Доставка и возврат",
      intro:
        "Привезём автомобиль в ваш отель или можно забрать самостоятельно из офиса у отеля Ibis Kata (Ката-Бич) — бесплатно.",
      tableHeaders: ["Район", "Цена в одну сторону"],
      rows: [
        ["Ката", "Бесплатно"],
        ["Карон, Ката Нои", "150 ฿"],
        ["Чалонг, Раваи", "300 ฿"],
        ["Патонг, Кату", "600 ฿"],
        ["Камала, Пхукет Таун, Панва, Рассада", "700 ฿"],
        ["Бангтао, Сурин, Таланг, Найтон, Найянг", "1 000 ฿"],
        ["Аэропорт HKT", "1 000 ฿"],
        ["Май Кхао", "1 200 ฿"],
      ],
      note: "Доставка и возврат рассчитываются отдельно. Например, доставка в Патонг и возврат оттуда же — 600 + 600 = 1 200 ฿.",
    },
    minTerm: {
      title: "Минимальный срок аренды для доставки",
      intro: "Доставка доступна не при любом сроке аренды — зависит от района и класса автомобиля.",
      economyTitle: "Эконом, Эконом+, Эконом Top",
      economyRows: [
        ["Ката (самовывоз)", "от 1 дня"],
        ["Карон, Ката Нои, Чалонг, Раваи", "от 3 дней"],
        ["Патонг, Кату, Камала, Пхукет Таун, Панва, Рассада", "от 5 дней"],
        ["Бангтао, Сурин, Таланг, Найтон, Найянг, Аэропорт, Май Кхао", "от 7 дней"],
      ],
      crossoverTitle: "Кроссовер, Пикап",
      crossoverRows: [
        ["Ката (самовывоз)", "от 1 дня"],
        ["Карон, Ката Нои, Чалонг, Раваи", "от 1 дня"],
        ["Патонг, Кату, Камала, Пхукет Таун, Панва, Рассада", "от 3 дней"],
        ["Бангтао, Сурин, Таланг, Найтон, Найянг, Аэропорт, Май Кхао", "от 5 дней"],
      ],
      tableHeaders: ["Район", "Минимальный срок"],
      note: "Премиум и Кабриолет — доставка по всему острову от 1 дня.\n\nСамовывоз из офиса (Ката) доступен всегда от 1 дня для любого класса автомобиля.\n\nС 15 ноября по 15 марта — минимальный срок аренды 3 дня для всех автомобилей и всех районов.",
    },
    payment: {
      title: "Оплата",
      intro: "Оплата при получении автомобиля — предоплата не требуется.",
      items: ["Наличными в батах", "Переводом на счёт в батах", "Рублями по СБП", "Долларами наличными"],
    },
    deposit: {
      title: "Депозит — зачем и как работает",
      intro:
        "Депозит — это временная страховка для обеих сторон, не дополнительная оплата. Он замораживается при получении автомобиля и возвращается сразу при сдаче.\n\nЗачем он нужен: депозит покрывает ситуации которые не входят в страховку — повреждения колёс, стёкол, дисков, а также франшизу при ДТП по вашей вине.",
      accidentTitle: "Что происходит при ДТП",
      accidentItems: [
        "Лёгкое ДТП по вашей вине (царапина, вмятина) — из депозита удерживается стоимость ремонта. Остаток возвращается.",
        "Серьёзное ДТП — страховка покрывает основной ущерб, из депозита может быть удержана франшиза и компенсация за простой авто в ремонте.",
        "ДТП не по вашей вине — депозит возвращается полностью.",
        "ДТП в нетрезвом состоянии — страховка не действует, ответственность полная.",
      ],
      amountNote:
        "Размер депозита зависит от класса автомобиля и указан на карточке каждой машины (от 6 000 до 35 000 ฿).",
      cashNote:
        "Депозит принимается в батах или эквиваленте в любой валюте — только наличными купюрами. Эти же купюры возвращаются вам при сдаче автомобиля.",
      photoNote:
        "Важно: при получении сделайте фото и видео автомобиля со всех сторон — это ваша защита при спорных ситуациях на сдаче.",
    },
    insurance: {
      title: "Страховка",
      intro:
        "Все автомобили застрахованы по программе Бизнес. Страховка покрывает большинство дорожных ситуаций при соблюдении правил дорожного движения.",
      exclusionsTitle: "Не покрывается страховкой:",
      exclusions: [
        "Вождение в состоянии алкогольного или наркотического опьянения",
        "Повреждения колёс, стёкол и дисков",
        "Проколы шин и повреждения от падающих предметов (в том числе кокосов — это реальность Пхукета 🌴)",
      ],
      callNote: "При ДТП — сразу звоните нам. Мы на связи 24/7 и поможем разобраться на месте.",
    },
    mileage: {
      title: "Пробег и территория",
      items: [
        "До 5 дней: 120 км/сутки (суммируется по дням). Перепробег — 10 ฿/км.",
        "От 5 дней: пробег без ограничений.",
        "Разрешённая территория: Пхукет, Пхангнга, Краби, Као Лак, Чео Лан.",
        "Выезд на Самуи, Ко Панган, в Бангкок и другие провинции — только по предварительному согласованию.",
        "Паромные переправы запрещены.",
      ],
    },
    returning: {
      title: "Как сдать автомобиль",
      text:
        "Сдача так же просто как получение — мы заберём машину из вашего отеля или вы вернёте её в офис. Осматриваем вместе, депозит возвращаем сразу. Если автомобиль требует мойки — 400 ฿, или верните чистым самостоятельно.",
    },
    important: {
      title: "Важно знать",
      fuelTitle: "Топливо",
      fuelText:
        "Возвращайте с тем же уровнем что получили. Тип топлива — в договоре и на крышке бака. Рекомендуем заправки PT, PTT, Caltex.",
      batteryTitle: "Аккумулятор",
      batteryText: "Не забывайте выключать фары. Вызов для запуска разряженного аккумулятора — платно.",
      cleanTitle: "Чистота в салоне",
      cleanText:
        "Курение, перевозка животных и дуриана в салоне запрещены. При несоблюдении — химчистка 3 000 ฿.\n\n(Дуриан — тропический фрукт с очень сильным запахом, популярный в Таиланде.)",
      thirdPartyTitle: "Передача авто третьим лицам",
      thirdPartyText: "Запрещена без согласования с администрацией.",
      parkingTitle: "Парковка",
      parkingText: "Избегайте мест с красно-белой разметкой бордюра — полиция блокирует колёса.",
      earlyReturnTitle: "Досрочный возврат",
      earlyReturnText:
        "Если планы изменились — предупредите нас заранее. Оплата за неиспользованные дни не возвращается, но мы всегда идём навстречу в форс-мажорных ситуациях.",
      inspectionTitle: "Осмотр при получении",
      inspectionText: "Сделайте фото или видео со всех сторон — это защищает вас от спорных ситуаций при сдаче.",
    },
    cta: {
      title: "Остались вопросы?",
      subtitle: "Ответим быстро — обычно в течение 15 минут",
      whatsapp: "Написать в WhatsApp",
      telegram: "Написать в Telegram",
    },
    legalFooter:
      "Настоящая страница является публичной офертой KATACARS CO., LTD. (регистрационный номер 0835567015952, 88/10 Kata Road, Karon, Mueang Phuket, Phuket 83100, Thailand). Оформление заявки на сайте означает принятие всех условий изложенных выше.",
  },
  en: {
    legalTag: "Public Offer · KATACARS CO., LTD. · Reg. No. 0835567015952",
    heading: "Rental Terms and Delivery",
    subheading: "Phuket Car Rental — direct rental company, no middlemen",
    included: {
      title: "What's included in the rental",
      intro: "All of this is already included in the price — no extra charges",
      items: [
        "Business insurance",
        "Child car seat",
        "Second driver (their license is required at pickup)",
        "Phone holder",
        "Guide to the best places in Phuket",
        "24/7 support — we're in touch for the whole rental period",
      ],
    },
    driver: {
      title: "Driver requirements",
      age: "Age: 21+",
      experience: "Driving experience: 3+ years",
      licenseIntro: "Driving license — one of the following options:",
      option1Title: "Option 1: National driving license",
      option1Text:
        "A national driving license (plastic card) is sufficient for the rental. Please note: in Thailand an international driving license is formally required to drive, and police may issue a fine if you don't have one.",
      option2Title: "Option 2: International driving license",
      option2Text:
        "An international license is accepted along with a photo of your national license (to confirm authenticity). Send us the photo in advance — we'll verify it and confirm your booking.",
      warning:
        "⚠️ An expired license — even if auto-renewed — is considered invalid. Check the expiry date before your trip.",
      noLicenseNote: "Without a valid driving license, the insurance does not apply.",
    },
    delivery: {
      title: "Delivery and return",
      intro:
        "We'll bring the car to your hotel, or you can pick it up yourself for free from our office near Ibis Kata hotel (Kata Beach).",
      tableHeaders: ["Area", "One-way price"],
      rows: [
        ["Kata", "Free"],
        ["Karon, Kata Noi", "150 ฿"],
        ["Chalong, Rawai", "300 ฿"],
        ["Patong, Kathu", "600 ฿"],
        ["Kamala, Phuket Town, Panwa, Rassada", "700 ฿"],
        ["Bang Tao, Surin, Thalang, Naithon, Nai Yang", "1,000 ฿"],
        ["HKT Airport", "1,000 ฿"],
        ["Mai Khao", "1,200 ฿"],
      ],
      note: "Delivery and return are calculated separately. For example, delivery to Patong and return from there — 600 + 600 = 1,200 ฿.",
    },
    minTerm: {
      title: "Minimum rental term for delivery",
      intro: "Delivery isn't available for any rental term — it depends on the area and car class.",
      economyTitle: "Economy, Economy+, Economy Top",
      economyRows: [
        ["Kata (self pickup)", "from 1 day"],
        ["Karon, Kata Noi, Chalong, Rawai", "from 3 days"],
        ["Patong, Kathu, Kamala, Phuket Town, Panwa, Rassada", "from 5 days"],
        ["Bang Tao, Surin, Thalang, Naithon, Nai Yang, Airport, Mai Khao", "from 7 days"],
      ],
      crossoverTitle: "Crossover, Pickup",
      crossoverRows: [
        ["Kata (self pickup)", "from 1 day"],
        ["Karon, Kata Noi, Chalong, Rawai", "from 1 day"],
        ["Patong, Kathu, Kamala, Phuket Town, Panwa, Rassada", "from 3 days"],
        ["Bang Tao, Surin, Thalang, Naithon, Nai Yang, Airport, Mai Khao", "from 5 days"],
      ],
      tableHeaders: ["Area", "Minimum term"],
      note: "Premium and Convertible — island-wide delivery from 1 day.\n\nSelf pickup from the office (Kata) is always available from 1 day for any car class.\n\nFrom November 15 to March 15 — the minimum rental term is 3 days for all cars and all areas.",
    },
    payment: {
      title: "Payment",
      intro: "Payment is made on pickup — no prepayment is required.",
      items: ["Cash in Thai baht", "Bank transfer in baht", "Rubles via SBP", "Cash in US dollars"],
    },
    deposit: {
      title: "Deposit — why it's needed and how it works",
      intro:
        "The deposit is a temporary safeguard for both sides, not an extra payment. It's held when you pick up the car and released right away when you return it.\n\nWhy it's needed: the deposit covers situations not included in the insurance — damage to wheels, glass, and rims, as well as the deductible in an accident caused by you.",
      accidentTitle: "What happens in an accident",
      accidentItems: [
        "Minor accident caused by you (scratch, dent) — the repair cost is deducted from the deposit. The remainder is returned.",
        "Serious accident — insurance covers the main damage; the deposit may cover the deductible and compensation for the car being out of service for repairs.",
        "Accident not caused by you — the deposit is returned in full.",
        "Accident while intoxicated — insurance does not apply, full liability.",
      ],
      amountNote:
        "The deposit amount depends on the car class and is listed on each car's card (from 6,000 to 35,000 ฿).",
      cashNote:
        "The deposit is accepted in baht or the equivalent in any currency — cash only. The same banknotes are returned to you when you return the car.",
      photoNote:
        "Important: take photos and video of the car from all sides at pickup — this protects you in case of any disputes at return.",
    },
    insurance: {
      title: "Insurance",
      intro:
        "All cars are insured under the Business program. The insurance covers most road situations as long as traffic rules are followed.",
      exclusionsTitle: "Not covered by insurance:",
      exclusions: [
        "Driving under the influence of alcohol or drugs",
        "Damage to wheels, glass, and rims",
        "Tire punctures and damage from falling objects (including coconuts — a real risk in Phuket 🌴)",
      ],
      callNote: "In case of an accident — call us right away. We're available 24/7 and will help sort it out on the spot.",
    },
    mileage: {
      title: "Mileage and territory",
      items: [
        "Up to 5 days: 120 km/day (cumulative across days). Excess mileage — 10 ฿/km.",
        "From 5 days: unlimited mileage.",
        "Permitted area: Phuket, Phang Nga, Krabi, Khao Lak, Cheow Lan.",
        "Trips to Koh Samui, Koh Phangan, Bangkok, and other provinces — by prior agreement only.",
        "Ferry crossings are not allowed.",
      ],
    },
    returning: {
      title: "How to return the car",
      text:
        "Returning the car is as easy as picking it up — we'll collect it from your hotel, or you can return it to our office. We inspect the car together and return the deposit right away. If the car needs washing — 400 ฿, or return it clean yourself.",
    },
    important: {
      title: "Good to know",
      fuelTitle: "Fuel",
      fuelText:
        "Return the car with the same fuel level you received it with. Fuel type is listed in the contract and on the fuel cap. We recommend PT, PTT, and Caltex stations.",
      batteryTitle: "Battery",
      batteryText: "Don't forget to turn off the headlights. A callout to jump-start a dead battery is chargeable.",
      cleanTitle: "Keeping the interior clean",
      cleanText:
        "Smoking, transporting animals, and durian in the cabin are not allowed. Violations result in a 3,000 ฿ cleaning fee.\n\n(Durian is a tropical fruit with a very strong smell, popular in Thailand.)",
      thirdPartyTitle: "Handing the car to third parties",
      thirdPartyText: "Not allowed without prior agreement with our team.",
      parkingTitle: "Parking",
      parkingText: "Avoid areas with red-and-white curb markings — the police will clamp the wheels.",
      earlyReturnTitle: "Early return",
      earlyReturnText:
        "If your plans change, let us know in advance. Payment for unused days is non-refundable, but we always try to accommodate force majeure situations.",
      inspectionTitle: "Inspection at pickup",
      inspectionText: "Take photos or video from all sides — this protects you in case of disputes at return.",
    },
    cta: {
      title: "Still have questions?",
      subtitle: "We reply fast — usually within 15 minutes",
      whatsapp: "Message on WhatsApp",
      telegram: "Message on Telegram",
    },
    legalFooter:
      "This page constitutes a public offer by KATACARS CO., LTD. (registration number 0835567015952, 88/10 Kata Road, Karon, Mueang Phuket, Phuket 83100, Thailand). Submitting a request on this site means accepting all the terms outlined above.",
  },
};
