import type { Locale } from "./dictionary";

type PrivacyContent = {
  heading: string;
  subheading: string;
  general: { title: string; text: string };
  collected: { title: string; intro: string; items: string[]; notCollected: string };
  usage: { title: string; intro: string; items: string[]; notUsed: string };
  retention: { title: string; text: string };
  rights: { title: string; intro: string; items: string[]; contact: string; response: string };
  cookies: { title: string; text: string };
  contacts: { title: string; companyName: string; address: string; email: string; phone: string };
};

export const privacyContent: Record<Locale, PrivacyContent> = {
  ru: {
    heading: "Политика конфиденциальности",
    subheading: "Последнее обновление: июнь 2025",
    general: {
      title: "Общие положения",
      text:
        "KATACARS CO., LTD. (регистрационный номер 0835567015952, 88/10 Kata Road, Karon, Mueang Phuket, Phuket 83100, Thailand) уважает вашу конфиденциальность и обязуется защищать персональные данные.\n\nНастоящая политика описывает какие данные мы собираем, как используем и защищаем.",
    },
    collected: {
      title: "Какие данные мы собираем",
      intro: "При оформлении заявки на аренду:",
      items: [
        "Имя",
        "Номер телефона",
        "Предпочитаемый мессенджер (WhatsApp, Telegram)",
        "Комментарий к заявке (по желанию)",
      ],
      notCollected: "Мы не собираем: платёжные данные, данные паспорта, геолокацию.",
    },
    usage: {
      title: "Как мы используем данные",
      intro: "Только для:",
      items: ["Связи для подтверждения бронирования", "Уточнения деталей аренды", "Ответа на вопросы"],
      notUsed: "Мы не передаём данные третьим лицам, не используем для рекламных рассылок, не продаём и не передаём партнёрам.",
    },
    retention: {
      title: "Срок хранения данных",
      text: "Данные хранятся 12 месяцев с момента получения заявки, после чего удаляются.",
    },
    rights: {
      title: "Ваши права",
      intro: "Вы вправе в любой момент:",
      items: [
        "Запросить информацию о хранящихся данных",
        "Потребовать исправления неточных данных",
        "Потребовать удаления ваших данных",
      ],
      contact: "Для запросов: katacarsinfo@gmail.com",
      response: "Ответим в течение 5 рабочих дней.",
    },
    cookies: {
      title: "Cookies",
      text: "Сайт использует технические cookies для корректной работы.\n\nМы не используем cookies для отслеживания или рекламы.",
    },
    contacts: {
      title: "Контакты",
      companyName: "KATACARS CO., LTD.",
      address: "88/10 Kata Road, Karon, Mueang Phuket, Phuket 83100, Thailand",
      email: "Email: katacarsinfo@gmail.com",
      phone: "Телефон: +66 83 9852000",
    },
  },
  en: {
    heading: "Privacy Policy",
    subheading: "Last updated: June 2025",
    general: {
      title: "General provisions",
      text:
        "KATACARS CO., LTD. (registration number 0835567015952, 88/10 Kata Road, Karon, Mueang Phuket, Phuket 83100, Thailand) respects your privacy and is committed to protecting your personal data.\n\nThis policy describes what data we collect, how we use it, and how we protect it.",
    },
    collected: {
      title: "What data we collect",
      intro: "When you submit a rental request:",
      items: [
        "Name",
        "Phone number",
        "Preferred messenger (WhatsApp, Telegram)",
        "Comment on the request (optional)",
      ],
      notCollected: "We do not collect: payment details, passport data, or location data.",
    },
    usage: {
      title: "How we use your data",
      intro: "Only to:",
      items: ["Contact you to confirm a booking", "Clarify rental details", "Answer your questions"],
      notUsed: "We do not share your data with third parties, do not use it for marketing mailings, and do not sell or pass it to partners.",
    },
    retention: {
      title: "Data retention period",
      text: "Data is stored for 12 months from the date the request is received, after which it is deleted.",
    },
    rights: {
      title: "Your rights",
      intro: "You have the right at any time to:",
      items: [
        "Request information about the data we hold",
        "Request correction of inaccurate data",
        "Request deletion of your data",
      ],
      contact: "For requests: katacarsinfo@gmail.com",
      response: "We will respond within 5 business days.",
    },
    cookies: {
      title: "Cookies",
      text: "The site uses technical cookies required for it to work correctly.\n\nWe do not use cookies for tracking or advertising.",
    },
    contacts: {
      title: "Contacts",
      companyName: "KATACARS CO., LTD.",
      address: "88/10 Kata Road, Karon, Mueang Phuket, Phuket 83100, Thailand",
      email: "Email: katacarsinfo@gmail.com",
      phone: "Phone: +66 83 9852000",
    },
  },
};
