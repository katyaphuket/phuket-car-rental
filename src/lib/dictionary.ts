export type Locale = "ru" | "en";

export type Dictionary = {
  nav: { fleet: string; terms: string; contacts: string };
  hero: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    badges: { noDeposit: string; insurance: string; support: string };
    formIntro: string;
    social: { rating: string; reviews: string; fleet: string };
  };
  search: {
    pickup: string;
    return: string;
    submit: string;
    cancelNote: string;
    pickupZone: string;
    returnZone: string;
    pickupTime: string;
    returnTime: string;
    otherTime: string;
    otherTimeNote: string;
  };
  zoneSelect: {
    searchPlaceholder: string;
    popular: string;
    allZones: string;
    free: string;
    noResults: string;
  };
  calendar: {
    months: readonly string[];
    weekdays: readonly string[];
    nights: (n: number) => string;
    done: string;
  };
  fleet: {
    eyebrow: string;
    title: string;
    availableFrom: (range: string) => string;
    perDay: string;
    popular: string;
    request: string;
    total: string;
    deposit: string;
    errorMessage: string;
    retry: string;
    empty: string;
    showAll: (n: number) => string;
    delivery: string;
    returnFee: string;
    totalWithDelivery: string;
    deliveryUnavailable: (n: number) => string;
    pickupFromOffice: string;
  };
  cars: {
    economy: string;
    crossover: string;
    premium: string;
    automatic: string;
    year: (year: number) => string;
    seats: (n: number) => string;
  };
  carModal: {
    stepCar: string;
    stepRequest: string;
    close: string;
    freeOptionsTitle: string;
    freeOptionsSubtitle: string;
    freeOptions: {
      childSeatTitle: string;
      childSeatNote: string;
      boosterTitle: string;
      boosterNote: string;
      phoneHolderTitle: string;
      guide: string;
    };
    washTitle: string;
    washNote: string;
    pickupLabel: string;
    returnLabel: string;
    termsTitle: string;
    terms: { area: string; noFerry: string; noOtherProvinces: string };
    mileage: {
      unlimitedTitle: string;
      unlimitedNote: string;
      limitedTitle: (totalKm: number, days: number) => string;
      overageNote: string;
      tip: string;
    };
    driverTitle: string;
    driver: { age: string; experience: string; documents: string };
    summary: {
      rent: (days: number) => string;
      pickupDelivery: string;
      returnDelivery: string;
      wash: string;
      total: string;
      deposit: string;
      depositNote: string;
    };
    nextStep: string;
    payNote: string;
    form: {
      namePlaceholder: string;
      phonePlaceholder: string;
      messengerLabel: string;
      whatsapp: string;
      telegram: string;
      max: string;
      commentPlaceholder: string;
      submit: string;
      submitNote: string;
      nameRequired: string;
      phoneRequired: string;
      consentPrefix: string;
      consentTermsLabel: string;
      consentAnd: string;
      consentPrivacyLabel: string;
    };
    thanks: { title: string; text: (messenger: string) => string; back: string };
    error: { title: string; whatsapp: string };
  };
  freebies: {
    eyebrow: string;
    title: string;
    items: { icon: string; title: string; value: string }[];
  };
  whyUs: {
    eyebrow: string;
    title: string;
    items: { icon: string; title: string; description: string }[];
  };
  howTo: {
    eyebrow: string;
    title: string;
    steps: { icon: string; title: string; description: string }[];
  };
  reviews: {
    eyebrow: string;
    title: string;
    source: string;
    ratingCount: (count: number) => string;
    readAll: string;
    items: { name: string; text: string }[];
  };
  contacts: {
    eyebrow: string;
    title: string;
    phoneLabel: string;
    addressLabel: string;
    address: string;
    hoursLabel: string;
    hoursValue: string;
    formTitle: string;
    namePlaceholder: string;
    phonePlaceholder: string;
    submit: string;
    submitted: string;
  };
  footer: { tagline: string; rights: string; termsLink: string; privacyLink: string };
  termsPage: { title: string; comingSoon: string; contactCta: string };
};

export const dictionary: Record<Locale, Dictionary> = {
  ru: {
    nav: { fleet: "Машины", terms: "Условия", contacts: "Контакты" },
    hero: {
      eyebrow: "Phuket, Thailand",
      titleLine1: "Аренда авто",
      titleLine2: "на Пхукете",
      badges: {
        noDeposit: "Без залога документов",
        insurance: "Бизнес страховка включена",
        support: "Поддержка 24/7",
      },
      formIntro: "Укажите даты и место доставки — покажем свободные авто и цены",
      social: { rating: "4,8 рейтинг", reviews: "241 отзыв на Google", fleet: "43 авто в парке" },
    },
    search: {
      pickup: "Дата получения",
      return: "Дата возврата",
      submit: "Найти авто →",
      cancelNote: "Бесплатная отмена · Подтверждение за 15 минут",
      pickupZone: "Место подачи",
      returnZone: "Место возврата",
      pickupTime: "Время получения",
      returnTime: "Время возврата",
      otherTime: "Другое время (по согласованию)",
      otherTimeNote: "Прошу связаться для согласования времени получения/возврата",
    },
    zoneSelect: {
      searchPlaceholder: "Поиск района",
      popular: "Популярные",
      allZones: "Все районы",
      free: "Бесплатно",
      noResults: "Ничего не найдено",
    },
    calendar: {
      months: ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"],
      weekdays: ["пн", "вт", "ср", "чт", "пт", "сб", "вс"],
      nights: (n: number) => `${n} ${n === 1 ? "день" : n < 5 ? "дня" : "дней"}`,
      done: "Готово",
    },
    fleet: {
      eyebrow: "Парк автомобилей",
      title: "Выберите свой автомобиль",
      availableFrom: (range: string) => `Доступно сейчас · ${range}`,
      perDay: "/день",
      popular: "Популярно",
      request: "Оставить заявку",
      total: "за весь период",
      deposit: "Депозит",
      errorMessage: "Не удалось загрузить автомобили. Попробуйте ещё раз.",
      retry: "Попробовать снова",
      empty: "На эти даты нет доступных машин",
      showAll: (n: number) => `Показать все ${n} автомобилей`,
      delivery: "Доставка",
      returnFee: "Возврат",
      totalWithDelivery: "Итого с доставкой",
      deliveryUnavailable: (n: number) => `Доставка недоступна · минимум ${n} дней для этого района`,
      pickupFromOffice: "Самовывоз из офиса",
    },
    cars: {
      economy: "Эконом",
      crossover: "Кроссовер",
      premium: "Премиум",
      automatic: "Автомат",
      year: (year) => `${year} г.в.`,
      seats: (n) => `${n} мест`,
    },
    carModal: {
      stepCar: "Автомобиль",
      stepRequest: "Заявка",
      close: "Закрыть",
      freeOptionsTitle: "Выберите необходимое",
      freeOptionsSubtitle: "Всё отмеченное будет подготовлено к вашему приезду",
      freeOptions: {
        childSeatTitle: "Детское автокресло — Бесплатно",
        childSeatNote: "Для детей до 18 кг",
        boosterTitle: "Бустер — Бесплатно",
        boosterNote: "Для детей 15–36 кг",
        phoneHolderTitle: "Держатель для телефона — Бесплатно",
        guide: "🗺 Путеводитель по лучшим местам Пхукета — в подарок каждому клиенту",
      },
      washTitle: "Мойка при возврате — 400฿",
      washNote: "Или верните автомобиль чистым самостоятельно",
      pickupLabel: "Получение",
      returnLabel: "Возврат",
      termsTitle: "Условия использования",
      terms: {
        area: "Территория: Пхукет, Пхангнга, Краби",
        noFerry: "Паромные переправы запрещены",
        noOtherProvinces: "Выезд на Самуи, Ко Панган, в Бангкок и другие провинции запрещён",
      },
      mileage: {
        unlimitedTitle: "Пробег без ограничений",
        unlimitedNote: "При аренде от 5 дней пробег не ограничен",
        limitedTitle: (totalKm: number, days: number) => `120 км/сутки (итого ${totalKm} км на ${days} дней)`,
        overageNote: "Перепробег: 10฿/км",
        tip: "При аренде от 5 дней — пробег без ограничений. Измените даты в форме поиска чтобы увидеть доступность и цену.",
      },
      driverTitle: "Требования к водителю",
      driver: {
        age: "Возраст 21+",
        experience: "Стаж вождения от 3 лет",
        documents: "Загранпаспорт + водительские права",
      },
      summary: {
        rent: (days: number) => `Аренда за период (${days} ${days === 1 ? "день" : days < 5 ? "дня" : "дней"})`,
        pickupDelivery: "Доставка при получении",
        returnDelivery: "Возврат",
        wash: "Мойка при возврате",
        total: "Итого",
        deposit: "Депозит (возвращается)",
        depositNote: "Оплата при получении автомобиля. Предоплата не требуется.",
      },
      nextStep: "Оставить заявку →",
      payNote: "Оплата при получении автомобиля. Предоплата не требуется.",
      form: {
        namePlaceholder: "Ваше имя",
        phonePlaceholder: "+66 или +7...",
        messengerLabel: "Мессенджер для связи",
        whatsapp: "WhatsApp",
        telegram: "Telegram",
        max: "MAX",
        commentPlaceholder: "Номер рейса, время прилёта, пожелания...",
        submit: "Отправить заявку",
        submitNote: "Менеджер свяжется с вами в течение 15 минут для подтверждения бронирования",
        nameRequired: "Укажите имя",
        phoneRequired: "Укажите телефон (минимум 7 цифр)",
        consentPrefix: "Нажимая кнопку, вы соглашаетесь с",
        consentTermsLabel: "условиями аренды",
        consentAnd: "и",
        consentPrivacyLabel: "политикой конфиденциальности",
      },
      thanks: {
        title: "Заявка принята!",
        text: (messenger: string) => `Менеджер свяжется с вами в ближайшие 15 минут через ${messenger}.`,
        back: "Вернуться к выбору авто",
      },
      error: {
        title: "Что-то пошло не так. Пожалуйста, напишите нам напрямую в WhatsApp",
        whatsapp: "Написать в WhatsApp",
      },
    },
    freebies: {
      eyebrow: "Без доплат",
      title: "Включено бесплатно",
      items: [
        {
          icon: "ti-baby-carriage",
          title: "Детское автокресло",
          value: "Бесплатно",
        },
        {
          icon: "ti-device-mobile",
          title: "Держатель для телефона",
          value: "Бесплатно",
        },
        {
          icon: "ti-map-2",
          title: "Путеводитель по лучшим местам Пхукета",
          value: "В подарок каждому клиенту",
        },
      ],
    },
    whyUs: {
      eyebrow: "Наши преимущества",
      title: "Почему мы",
      items: [
        {
          icon: "ti-car",
          title: "Автомобили 2022–2026 г.в.",
          description: "Лучшее соотношение цены, качества и сервиса на острове.",
        },
        {
          icon: "ti-map-pin",
          title: "Самовывоз на Ката или доставка",
          description: "Офис самовывоза на Ката-бич, доставка по всему острову от 0 бат.",
        },
        {
          icon: "ti-shield-check",
          title: "Все авто застрахованы",
          description: "Поддержка на связи 24/7 — поможем в любой ситуации.",
        },
        {
          icon: "ti-lock-open",
          title: "Без залога документов",
          description: "Не требуем паспорт, права или кредитную карту в залог.",
        },
        {
          icon: "ti-cash",
          title: "Оплата в любой валюте",
          description: "Принимаем баты, рубли и доллары — как вам удобно.",
        },
        {
          icon: "ti-receipt",
          title: "Прозрачные условия",
          description: "Никаких скрытых платежей — все условия оговорены заранее.",
        },
      ],
    },
    howTo: {
      eyebrow: "Процесс аренды",
      title: "Как арендовать автомобиль",
      steps: [
        {
          icon: "ti-phone",
          title: "Забронируйте",
          description: "Оставьте заявку по телефону или напишите нам. Мы свяжемся с вами и уточним все детали.",
        },
        {
          icon: "ti-file-text",
          title: "Подготовьте документы",
          description:
            "Для брони и контракта понадобится: фото загранпаспорта, водительские права, локация или название отеля и телефонный номер для связи.",
        },
        {
          icon: "ti-car",
          title: "Заберите автомобиль",
          description:
            "Привезём автомобиль вам в отель или в аэропорт и подпишем договор. Помимо оплаты потребуется депозит, который будет возвращён при сдаче автомобиля.",
        },
      ],
    },
    reviews: {
      eyebrow: "Отзывы клиентов",
      title: "Что говорят о нас",
      source: "Яндекс Отзывы",
      ratingCount: (count: number) => `на основе ${count} отзывов`,
      readAll: "Читать все отзывы",
      items: [
        {
          name: "Иван Мельников",
          text: "Отличный сервис! Всё быстро и честно и без обмана. Брали Мазду 2 в аренду. Машина чистая, исправная. На сообщения ребята отвечают быстро и понятно. Отдых с автомобилем - совсем другое дело, новые впечатления и свобода перемещения! Однозначно рекомендую!",
        },
        {
          name: "Вячеслав Скрипко",
          text: "Огромное спасибо что подарили новые эмоции на прекрасном острове. Авто взяли в первый раз и не пожалели. Удобно, безопасно и комфортно, особенно в низкий сезон. Машинка приятная и опрятная. Удобно что доставили и забрали у отеля без доп. оплат и восколько нам было надо. Гайд по местам мелочь но приятная.",
        },
        {
          name: "Артур П.",
          text: "Спасибо за машину, так как без нее отдых был точно не полноценный! Привезли к отелю авто, забрали, дали возможность продлить не на полный день. Вернули самостоятельно, забытый паурбэнк. Оплата и на российскую карту и в датах местных! Депозит вернули моментально, без всяких придирок!!!",
        },
      ],
    },
    contacts: {
      eyebrow: "Свяжитесь с нами",
      title: "Контакты",
      phoneLabel: "Телефон",
      addressLabel: "Адрес",
      address: "Phuket, Kata Beach, во дворе отеля «Ibis Kata»",
      hoursLabel: "Часы работы",
      hoursValue: "ежедневно с 09:00 до 18:00",
      formTitle: "Оставить заявку",
      namePlaceholder: "Имя",
      phonePlaceholder: "Телефон",
      submit: "Отправить",
      submitted: "Спасибо! Мы свяжемся с вами в ближайшее время.",
    },
    footer: {
      tagline: "Аренда авто на Пхукете с подачей в любую точку острова.",
      rights: "Все права защищены.",
      termsLink: "Условия аренды и оферта",
      privacyLink: "Политика конфиденциальности",
    },
    termsPage: {
      title: "Условия аренды и доставка",
      comingSoon: "Информация появится в ближайшее время",
      contactCta: "Связаться с нами",
    },
  },
  en: {
    nav: { fleet: "Fleet", terms: "Terms", contacts: "Contacts" },
    hero: {
      eyebrow: "Phuket, Thailand",
      titleLine1: "Car rental",
      titleLine2: "in Phuket",
      badges: {
        noDeposit: "No document deposit",
        insurance: "Business insurance included",
        support: "24/7 support",
      },
      formIntro: "Pick your dates and delivery location — we'll show available cars and prices",
      social: { rating: "4.8 rating", reviews: "241 reviews on Google", fleet: "43 cars in the fleet" },
    },
    search: {
      pickup: "Pickup date",
      return: "Return date",
      submit: "Search cars →",
      cancelNote: "Free cancellation · Confirmed in 15 minutes",
      pickupZone: "Pickup zone",
      returnZone: "Return zone",
      pickupTime: "Pickup time",
      returnTime: "Return time",
      otherTime: "Other time (to be arranged)",
      otherTimeNote: "Please contact me to arrange the pickup/return time",
    },
    zoneSelect: {
      searchPlaceholder: "Search zone",
      popular: "Popular",
      allZones: "All zones",
      free: "Free",
      noResults: "No matches found",
    },
    calendar: {
      months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      nights: (n: number) => `${n} day${n === 1 ? "" : "s"}`,
      done: "Done",
    },
    fleet: {
      eyebrow: "Our fleet",
      title: "Choose your car",
      availableFrom: (range: string) => `Available now · ${range}`,
      perDay: "/day",
      popular: "Popular",
      request: "Request this car",
      total: "for the whole period",
      deposit: "Deposit",
      errorMessage: "Couldn't load the cars. Please try again.",
      retry: "Try again",
      empty: "No cars available for these dates",
      showAll: (n: number) => `Show all ${n} cars`,
      delivery: "Delivery",
      returnFee: "Return",
      totalWithDelivery: "Total with delivery",
      deliveryUnavailable: (n: number) => `Delivery unavailable · minimum ${n} days for this zone`,
      pickupFromOffice: "Pick up from the office",
    },
    cars: {
      economy: "Economy",
      crossover: "Crossover",
      premium: "Premium",
      automatic: "Automatic",
      year: (year) => `${year}`,
      seats: (n) => `${n} seats`,
    },
    carModal: {
      stepCar: "Car",
      stepRequest: "Request",
      close: "Close",
      freeOptionsTitle: "Choose what you need",
      freeOptionsSubtitle: "Everything checked will be ready for your arrival",
      freeOptions: {
        childSeatTitle: "Child car seat — Free",
        childSeatNote: "For children up to 18 kg",
        boosterTitle: "Booster seat — Free",
        boosterNote: "For children 15–36 kg",
        phoneHolderTitle: "Phone holder — Free",
        guide: "🗺 Guide to the best spots in Phuket — a gift for every client",
      },
      washTitle: "Wash on return — 400฿",
      washNote: "Or return the car clean yourself",
      pickupLabel: "Pickup",
      returnLabel: "Return",
      termsTitle: "Usage terms",
      terms: {
        area: "Area: Phuket, Phang Nga, Krabi",
        noFerry: "Ferry crossings are not allowed",
        noOtherProvinces: "Travel to Koh Samui, Koh Phangan, Bangkok and other provinces is not allowed",
      },
      mileage: {
        unlimitedTitle: "Unlimited mileage",
        unlimitedNote: "Mileage is unlimited for rentals of 5 days or more",
        limitedTitle: (totalKm: number, days: number) => `120 km/day (total ${totalKm} km for ${days} days)`,
        overageNote: "Excess mileage: 10฿/km",
        tip: "Unlimited mileage applies for rentals of 5 days or more. Change the dates in the search form to see availability and pricing.",
      },
      driverTitle: "Driver requirements",
      driver: {
        age: "Age 21+",
        experience: "At least 3 years of driving experience",
        documents: "Passport + driving licence",
      },
      summary: {
        rent: (days: number) => `Rental for the period (${days} day${days === 1 ? "" : "s"})`,
        pickupDelivery: "Delivery on pickup",
        returnDelivery: "Return",
        wash: "Wash on return",
        total: "Total",
        deposit: "Deposit (refundable)",
        depositNote: "Pay on pickup. No prepayment required.",
      },
      nextStep: "Send a request →",
      payNote: "Pay on pickup. No prepayment required.",
      form: {
        namePlaceholder: "Your name",
        phonePlaceholder: "+66 or +1...",
        messengerLabel: "Preferred messenger",
        whatsapp: "WhatsApp",
        telegram: "Telegram",
        max: "MAX",
        commentPlaceholder: "Flight number, arrival time, requests...",
        submit: "Send request",
        submitNote: "A manager will contact you within 15 minutes to confirm the booking",
        nameRequired: "Please enter your name",
        phoneRequired: "Please enter a phone number (at least 7 digits)",
        consentPrefix: "By clicking the button, you agree to the",
        consentTermsLabel: "rental terms",
        consentAnd: "and",
        consentPrivacyLabel: "privacy policy",
      },
      thanks: {
        title: "Request received!",
        text: (messenger: string) => `A manager will contact you within 15 minutes via ${messenger}.`,
        back: "Back to car selection",
      },
      error: {
        title: "Something went wrong. Please message us directly on WhatsApp",
        whatsapp: "Message on WhatsApp",
      },
    },
    freebies: {
      eyebrow: "No extra charges",
      title: "Included for free",
      items: [
        {
          icon: "ti-baby-carriage",
          title: "Child car seat",
          value: "Free",
        },
        {
          icon: "ti-device-mobile",
          title: "Phone holder",
          value: "Free",
        },
        {
          icon: "ti-map-2",
          title: "Guide to the best spots in Phuket",
          value: "A gift for every client",
        },
      ],
    },
    whyUs: {
      eyebrow: "Our advantages",
      title: "Why choose us",
      items: [
        {
          icon: "ti-car",
          title: "Cars from 2022–2026",
          description: "Best price-to-quality ratio and service on the island.",
        },
        {
          icon: "ti-map-pin",
          title: "Pickup in Kata or island-wide delivery",
          description: "Self-pickup office at Kata beach, delivery anywhere on the island from 0 THB.",
        },
        {
          icon: "ti-shield-check",
          title: "Every car is insured",
          description: "24/7 support — we're always reachable if something comes up.",
        },
        {
          icon: "ti-lock-open",
          title: "No document deposit",
          description: "We never hold your passport, license, or credit card as collateral.",
        },
        {
          icon: "ti-cash",
          title: "Pay in any currency",
          description: "Thai baht, rubles, or US dollars — whatever's convenient for you.",
        },
        {
          icon: "ti-receipt",
          title: "Transparent terms",
          description: "No hidden fees — every condition is agreed on upfront.",
        },
      ],
    },
    howTo: {
      eyebrow: "Rental process",
      title: "How to rent a car",
      steps: [
        {
          icon: "ti-phone",
          title: "Book",
          description: "Send a request by phone or message. We'll get in touch and confirm the details.",
        },
        {
          icon: "ti-file-text",
          title: "Prepare your documents",
          description:
            "For the booking and contract you'll need: a photo of your passport, driving licence, your location or hotel name, and a phone number.",
        },
        {
          icon: "ti-car",
          title: "Pick up the car",
          description:
            "We'll bring the car to your hotel or the airport and sign the contract. Besides payment, a deposit is required and refunded when the car is returned.",
        },
      ],
    },
    reviews: {
      eyebrow: "Customer reviews",
      title: "What clients say",
      source: "Yandex Reviews",
      ratingCount: (count: number) => `based on ${count} reviews`,
      readAll: "Read all reviews",
      items: [
        {
          name: "Ivan Melnikov",
          text: "Отличный сервис! Всё быстро и честно и без обмана. Брали Мазду 2 в аренду. Машина чистая, исправная. На сообщения ребята отвечают быстро и понятно. Отдых с автомобилем - совсем другое дело, новые впечатления и свобода перемещения! Однозначно рекомендую!",
        },
        {
          name: "Vyacheslav Skripko",
          text: "Огромное спасибо что подарили новые эмоции на прекрасном острове. Авто взяли в первый раз и не пожалели. Удобно, безопасно и комфортно, особенно в низкий сезон. Машинка приятная и опрятная. Удобно что доставили и забрали у отеля без доп. оплат и восколько нам было надо. Гайд по местам мелочь но приятная.",
        },
        {
          name: "Artur P.",
          text: "Спасибо за машину, так как без нее отдых был точно не полноценный! Привезли к отелю авто, забрали, дали возможность продлить не на полный день. Вернули самостоятельно, забытый паурбэнк. Оплата и на российскую карту и в датах местных! Депозит вернули моментально, без всяких придирок!!!",
        },
      ],
    },
    contacts: {
      eyebrow: "Get in touch",
      title: "Contacts",
      phoneLabel: "Phone",
      addressLabel: "Address",
      address: "Phuket, Kata Beach, in the courtyard of the Ibis Kata hotel",
      hoursLabel: "Opening hours",
      hoursValue: "daily, 09:00–18:00",
      formTitle: "Send a request",
      namePlaceholder: "Name",
      phonePlaceholder: "Phone",
      submit: "Send",
      submitted: "Thank you! We'll contact you shortly.",
    },
    footer: {
      tagline: "Car rental in Phuket with delivery anywhere on the island.",
      rights: "All rights reserved.",
      termsLink: "Rental Terms and Offer",
      privacyLink: "Privacy Policy",
    },
    termsPage: {
      title: "Rental terms and delivery",
      comingSoon: "Information will be available soon",
      contactCta: "Contact us",
    },
  },
};
