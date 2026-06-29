import type { Locale } from "./dictionary";

export type Feature = {
  icon: string; // emoji или название иконки
  label: string; // подпись
};

export type CarClass = "Эконом" | "Эконом+" | "Эконом Top" | "Кроссовер" | "Пикап" | "Премиум" | "Кабриолет";

export type CarFeatures = {
  displayName: string; // отображаемое название машины (вместо car_name из RentProg)
  carClass: CarClass;
  year: number;
  description: string;
  features: Feature[];
  bodyType: string; // хэтчбек / седан / кроссовер / пикап / кабриолет
  drive: string; // передний / задний / полный
  engine: string; // например "1.2 бензин" или "2.0 турбо дизель"
  seats?: number; // если не 5 — указываем явно
  highlight?: string; // особая фишка для бейджа на фото: "Люк", "Гибрид", "360°" и т.д.
};

export const CAR_FEATURES: Record<number, CarFeatures> = {
  43331: {
    displayName: "Toyota Yaris Sport",
    carClass: "Эконом",
    year: 2022,
    description:
      "Компактный и экономичный хэтчбек — отличный вариант для поездок по Пхукету. Манёвренный, удобный для города и очень экономичный.",
    bodyType: "хэтчбек",
    drive: "передний",
    engine: "1.2 бензин",
    features: [
      { icon: "❄️", label: "Кондиционер" },
      { icon: "🎵", label: "Bluetooth" },
      { icon: "🪟", label: "Тонировка" },
      { icon: "🚗", label: "Автомат" },
    ],
  },

  43332: {
    displayName: "Toyota Yaris Sport",
    carClass: "Эконом",
    year: 2022,
    description:
      "Стильный и экономичный хэтчбек — отличный вариант для комфортных поездок по Пхукету. Надёжный, удобный в управлении.",
    bodyType: "хэтчбек",
    drive: "передний",
    engine: "1.2 бензин",
    features: [
      { icon: "📷", label: "Камера заднего вида" },
      { icon: "📱", label: "Apple CarPlay / Android Auto" },
      { icon: "🎵", label: "Bluetooth" },
      { icon: "🛋️", label: "Кожаный салон" },
    ],
  },

  43333: {
    displayName: "Toyota Yaris Ativ",
    carClass: "Эконом",
    year: 2022,
    description:
      "Стильный и экономичный седан — отличный вариант для комфортных поездок по Пхукету. Надёжный, удобный в управлении.",
    bodyType: "седан",
    drive: "передний",
    engine: "1.2 бензин",
    features: [
      { icon: "📷", label: "Камера заднего вида" },
      { icon: "📱", label: "Apple CarPlay / Android Auto" },
      { icon: "🎵", label: "Bluetooth" },
      { icon: "🛋️", label: "Кожаный салон" },
    ],
  },

  68767: {
    displayName: "Mitsubishi Mirage",
    carClass: "Эконом",
    year: 2022,
    description:
      "Компактный и максимально экономичный хэтчбек — идеальный вариант для бюджетных поездок по Пхукету. Лёгкий в управлении, манёвренный.",
    bodyType: "хэтчбек",
    drive: "передний",
    engine: "1.2 бензин",
    features: [
      { icon: "📷", label: "Камера заднего вида" },
      { icon: "🎵", label: "Bluetooth / мультимедиа" },
      { icon: "⛽", label: "Экономичный расход" },
      { icon: "🚗", label: "Автомат" },
    ],
  },

  43531: {
    displayName: "Suzuki Ciaz",
    carClass: "Эконом",
    year: 2022,
    description:
      "Просторный и экономичный седан — идеален для комфортных поездок по Пхукету. Отлично подойдёт для пары или семьи: много места, плавный ход.",
    bodyType: "седан",
    drive: "передний",
    engine: "1.2 бензин",
    features: [
      { icon: "📷", label: "Камера заднего вида" },
      { icon: "🎵", label: "Bluetooth / мультимедиа" },
      { icon: "🪟", label: "Тонировка" },
      { icon: "🚗", label: "Просторный салон" },
    ],
  },

  43471: {
    displayName: "MG3",
    carClass: "Эконом",
    year: 2022,
    description:
      "Стильный городской хэтчбек — компактный, экономичный и очень удобный. Яркий жёлтый цвет добавляет настроения.",
    bodyType: "хэтчбек",
    drive: "передний",
    engine: "1.5 бензин",
    highlight: "Жёлтый",
    features: [
      { icon: "🅿️", label: "Задние парктроники" },
      { icon: "🎵", label: "Bluetooth" },
      { icon: "🪟", label: "Тонировка" },
      { icon: "🚗", label: "Автомат" },
    ],
  },

  43472: {
    displayName: "MG3",
    carClass: "Эконом",
    year: 2022,
    description:
      "Стильный городской хэтчбек — компактный, экономичный и очень удобный. Яркий красный цвет добавляет настроения.",
    bodyType: "хэтчбек",
    drive: "передний",
    engine: "1.5 бензин",
    highlight: "Люк",
    features: [
      { icon: "📷", label: "Камера заднего вида" },
      { icon: "🎵", label: "Bluetooth" },
      { icon: "🌤️", label: "Люк на крыше" },
      { icon: "🪟", label: "Тонировка" },
    ],
  },

  46837: {
    displayName: "Mazda 2",
    carClass: "Эконом",
    year: 2020,
    description:
      "Компактный и экономичный автомобиль для поездок по Пхукету. Манёвренный, удобный и комфортный.",
    bodyType: "хэтчбек",
    drive: "передний",
    engine: "1.3 бензин",
    features: [
      { icon: "📷", label: "Камера заднего вида" },
      { icon: "🎵", label: "Bluetooth / мультимедиа" },
      { icon: "🛋️", label: "Кожаный салон" },
      { icon: "🚗", label: "Автомат" },
    ],
  },

  48392: {
    displayName: "Toyota Yaris Ativ",
    carClass: "Эконом+",
    year: 2023,
    description:
      "Современный и экономичный седан для поездок по Пхукету. Комфортный, надёжный и простой в управлении.",
    bodyType: "седан",
    drive: "передний",
    engine: "1.2 бензин",
    features: [
      { icon: "📷", label: "Камера заднего вида" },
      { icon: "📱", label: "Apple CarPlay / Android Auto" },
      { icon: "🔑", label: "Бесключевой доступ" },
      { icon: "🚗", label: "Легкосплавные диски" },
    ],
  },

  46836: {
    displayName: "Toyota Yaris Ativ",
    carClass: "Эконом+",
    year: 2023,
    description:
      "Современный и экономичный седан для поездок по Пхукету. Комфортный, надёжный и простой в управлении.",
    bodyType: "седан",
    drive: "передний",
    engine: "1.2 бензин",
    features: [
      { icon: "📷", label: "Камера заднего вида" },
      { icon: "📱", label: "Apple CarPlay / Android Auto" },
      { icon: "🔑", label: "Бесключевой доступ" },
      { icon: "🚗", label: "Легкосплавные диски" },
    ],
  },

  70264: {
    displayName: "Nissan Almera",
    carClass: "Эконом+",
    year: 2023,
    description:
      "Комфортный и экономичный городской седан — отличный вариант для поездок по Пхукету. Мягкая подвеска, просторный салон и низкий расход топлива делают Almera удобной машиной для путешествий по острову.",
    bodyType: "седан",
    drive: "передний",
    engine: "1.0 Turbo бензин",
    highlight: "Турбо",
    features: [
      { icon: "⛽", label: "Бензиновый двигатель 1.0 Turbo" },
      { icon: "⚙️", label: "Автоматическая коробка (CVT)" },
      { icon: "🚗", label: "Передний привод" },
      { icon: "📷", label: "Камера заднего вида" },
      { icon: "📱", label: "Apple CarPlay / Android Auto" },
      { icon: "🎵", label: "Bluetooth + мультимедиа" },
      { icon: "🔑", label: "Бесключевой доступ / Start-Stop" },
      { icon: "🅿️", label: "Парктроники и тонировка" },
    ],
  },

  50891: {
    displayName: "Suzuki Swift",
    carClass: "Эконом+",
    year: 2023,
    description:
      "Манёвренный и экономичный хэтчбек — отличный вариант для поездок по Пхукету. Компактный, удобный для города и очень простой в управлении.",
    bodyType: "хэтчбек",
    drive: "передний",
    engine: "1.2 бензин",
    features: [
      { icon: "📷", label: "Камера заднего вида" },
      { icon: "📱", label: "Apple CarPlay / Android Auto" },
      { icon: "🔑", label: "Бесключевой доступ / Start-Stop" },
      { icon: "🪟", label: "Тонировка" },
    ],
  },

  50722: {
    displayName: "Suzuki Swift",
    carClass: "Эконом+",
    year: 2023,
    description:
      "Манёвренный и экономичный хэтчбек — отличный вариант для поездок по Пхукету. Компактный, удобный для города и очень простой в управлении.",
    bodyType: "хэтчбек",
    drive: "передний",
    engine: "1.2 бензин",
    features: [
      { icon: "📷", label: "Камера заднего вида" },
      { icon: "📱", label: "Apple CarPlay / Android Auto" },
      { icon: "🔑", label: "Бесключевой доступ / Start-Stop" },
      { icon: "🪟", label: "Тонировка" },
    ],
  },

  50840: {
    displayName: "Mazda 2 Sedan",
    carClass: "Эконом+",
    year: 2023,
    description:
      "Комфортный и экономичный городской седан с хорошей комплектацией. Плавная езда, компактные размеры и современные опции.",
    bodyType: "седан",
    drive: "передний",
    engine: "1.3 бензин",
    features: [
      { icon: "📷", label: "Камера + парктроники" },
      { icon: "📱", label: "Apple CarPlay / Android Auto" },
      { icon: "🔑", label: "Бесключевой доступ / Start-Stop" },
      { icon: "🚗", label: "Легкосплавные диски" },
    ],
  },

  70260: {
    displayName: "Mazda 2",
    carClass: "Эконом+",
    year: 2023,
    description:
      "Комфортный и экономичный хэтчбек с хорошей комплектацией. Плавная езда, компактные размеры и современные опции.",
    bodyType: "хэтчбек",
    drive: "передний",
    engine: "1.3 бензин",
    features: [
      { icon: "📷", label: "Камера + парктроники" },
      { icon: "📱", label: "Apple CarPlay / Android Auto" },
      { icon: "🛋️", label: "Кожаный салон" },
      { icon: "🔑", label: "Бесключевой доступ / Start-Stop" },
    ],
  },

  58627: {
    displayName: "Mazda 2 Sedan",
    carClass: "Эконом+",
    year: 2023,
    description:
      "Комфортный и экономичный городской седан с хорошей комплектацией и проекцией на лобовое стекло.",
    bodyType: "седан",
    drive: "передний",
    engine: "1.3 бензин",
    highlight: "HUD",
    features: [
      { icon: "📷", label: "Камера + парктроники" },
      { icon: "📱", label: "Apple CarPlay / Android Auto" },
      { icon: "🖥️", label: "Проекция на лобовое стекло" },
      { icon: "🛋️", label: "Кожаный салон" },
    ],
  },

  43532: {
    displayName: "Mazda 2 Sedan",
    carClass: "Эконом+",
    year: 2023,
    description:
      "Комфортный и экономичный городской седан с хорошей комплектацией и проекцией на лобовое стекло.",
    bodyType: "седан",
    drive: "передний",
    engine: "1.3 бензин",
    highlight: "HUD",
    features: [
      { icon: "📷", label: "Камера + парктроники" },
      { icon: "📱", label: "Apple CarPlay / Android Auto" },
      { icon: "🖥️", label: "Проекция на лобовое стекло" },
      { icon: "🛋️", label: "Кожаный салон" },
    ],
  },

  43528: {
    displayName: "MG5 Sunroof",
    carClass: "Эконом Top",
    year: 2023,
    description:
      "Стильный седан с панорамным люком и богатой комплектацией. Просторный салон, современный дизайн и камеры 360°.",
    bodyType: "седан",
    drive: "передний",
    engine: "1.5 бензин",
    highlight: "Люк · 360°",
    features: [
      { icon: "🌤️", label: "Панорамный люк" },
      { icon: "📷", label: "Камеры 360°" },
      { icon: "📱", label: "Apple CarPlay / Android Auto" },
      { icon: "🛋️", label: "Кожаный салон" },
    ],
  },

  57167: {
    displayName: "MG5 Sunroof",
    carClass: "Эконом Top",
    year: 2023,
    description:
      "Стильный седан с панорамным люком и богатой комплектацией. Просторный салон, современный дизайн и камеры 360°.",
    bodyType: "седан",
    drive: "передний",
    engine: "1.5 бензин",
    highlight: "Люк · 360°",
    features: [
      { icon: "🌤️", label: "Панорамный люк" },
      { icon: "📷", label: "Камеры 360°" },
      { icon: "📱", label: "Apple CarPlay / Android Auto" },
      { icon: "🛋️", label: "Кожаный салон" },
    ],
  },

  52008: {
    displayName: "MG5 Sunroof",
    carClass: "Эконом Top",
    year: 2023,
    description:
      "Стильный седан с панорамным люком и богатой комплектацией. Просторный салон, современный дизайн и камеры 360°.",
    bodyType: "седан",
    drive: "передний",
    engine: "1.5 бензин",
    highlight: "Люк · 360°",
    features: [
      { icon: "🌤️", label: "Панорамный люк" },
      { icon: "📷", label: "Камеры 360°" },
      { icon: "📱", label: "Apple CarPlay / Android Auto" },
      { icon: "🛋️", label: "Кожаный салон" },
    ],
  },

  59267: {
    displayName: "Mazda 2 Sedan",
    carClass: "Эконом Top",
    year: 2024,
    description:
      "Современный городской седан в максимальной комплектации — идеальный баланс комфорта, технологий и экономичности.",
    bodyType: "седан",
    drive: "передний",
    engine: "1.3 бензин",
    features: [
      { icon: "📷", label: "Камера заднего вида" },
      { icon: "📱", label: "Apple CarPlay / Android Auto" },
      { icon: "🔑", label: "Бесключевой доступ / Start-Stop" },
      { icon: "🛋️", label: "Кожаный салон" },
    ],
  },

  43529: {
    displayName: "MG ZS",
    carClass: "Кроссовер",
    year: 2023,
    description:
      "Универсальный кроссовер с панорамной крышей — комфорт для поездок по Пхукету. Просторный, удобный и хорошо оснащённый.",
    bodyType: "кроссовер",
    drive: "передний",
    engine: "1.5 бензин",
    highlight: "Панорама",
    features: [
      { icon: "🌤️", label: "Панорамная крыша с люком" },
      { icon: "📷", label: "Камера заднего вида" },
      { icon: "📱", label: "Apple CarPlay / Android Auto" },
      { icon: "🛋️", label: "Кожаный салон" },
    ],
  },

  74245: {
    displayName: "Toyota Yaris Cross Hybrid",
    carClass: "Кроссовер",
    year: 2023,
    description:
      "Современный гибридный кроссовер — идеальный выбор для комфортных и экономичных поездок по Пхукету. Высокая посадка, плавный ход.",
    bodyType: "кроссовер",
    drive: "передний",
    engine: "1.5 гибрид",
    highlight: "Гибрид",
    features: [
      { icon: "🌿", label: "Гибридный двигатель" },
      { icon: "📷", label: "Камера заднего вида" },
      { icon: "📱", label: "Apple CarPlay / Android Auto" },
      { icon: "🔑", label: "Бесключевой доступ / Start-Stop" },
    ],
  },

  56089: {
    displayName: "MG HS",
    carClass: "Кроссовер",
    year: 2023,
    description:
      "Современный кроссовер с премиальной комплектацией и панорамной крышей. Просторный, мягкий и безопасный.",
    bodyType: "кроссовер",
    drive: "передний",
    engine: "1.5 турбо бензин",
    highlight: "Панорама · 360°",
    features: [
      { icon: "🌤️", label: "Панорамная крыша" },
      { icon: "📷", label: "Камеры 360°" },
      { icon: "📱", label: "Apple CarPlay / Android Auto" },
      { icon: "❄️", label: "Раздельный климат-контроль" },
    ],
  },

  71173: {
    displayName: "Mazda CX-30",
    carClass: "Кроссовер",
    year: 2023,
    description:
      "Премиальный кроссовер с турбированным двигателем и комфортом бизнес-класса. Мягкая подвеска, уверенная динамика, акустика Bose.",
    bodyType: "кроссовер",
    drive: "передний",
    engine: "2.0 турбо бензин (190 л.с.)",
    highlight: "Bose · 360°",
    features: [
      { icon: "📷", label: "Камеры 360°" },
      { icon: "🎶", label: "Акустика Bose" },
      { icon: "❄️", label: "Раздельный климат-контроль" },
      { icon: "🌤️", label: "Люк на крыше" },
    ],
  },

  76383: {
    displayName: "Toyota Veloz",
    carClass: "Кроссовер",
    year: 2023,
    description:
      "Просторный и современный 7-местный кроссовер — отличный вариант для поездок с семьёй или компанией. Комфортный и удобный.",
    bodyType: "кроссовер",
    drive: "передний",
    engine: "1.5 бензин",
    seats: 7,
    highlight: "7 мест",
    features: [
      { icon: "👨‍👩‍👧‍👦", label: "7 мест (кожа)" },
      { icon: "📷", label: "Камера заднего вида" },
      { icon: "📱", label: "Apple CarPlay / Android Auto" },
      { icon: "🔑", label: "Бесключевой доступ / Start-Stop" },
    ],
  },

  48914: {
    displayName: "Toyota Fortuner",
    carClass: "Кроссовер",
    year: 2023,
    description:
      "Надёжный и просторный 7-местный внедорожник — идеальный вариант для путешествий с семьёй или компанией. Мощный дизельный двигатель.",
    bodyType: "внедорожник",
    drive: "полный",
    engine: "2.4 дизель",
    seats: 7,
    highlight: "7 мест",
    features: [
      { icon: "👨‍👩‍👧‍👦", label: "7 мест (кожа)" },
      { icon: "📷", label: "Камера заднего вида" },
      { icon: "📱", label: "Apple CarPlay / Android Auto" },
      { icon: "🔑", label: "Бесключевой доступ / Start-Stop" },
    ],
  },

  54151: {
    displayName: "Ford Ranger",
    carClass: "Пикап",
    year: 2023,
    description:
      "Мощный и брутальный пикап для путешествий по Пхукету. Просторный, комфортный и уверенный на любой дороге.",
    bodyType: "пикап",
    drive: "задний",
    engine: "2.0 Bi-Turbo дизель (210 л.с.)",
    highlight: "210 л.с.",
    features: [
      { icon: "📷", label: "Камера заднего вида" },
      { icon: "❄️", label: "Климат-контроль" },
      { icon: "🛋️", label: "Кожаный салон" },
      { icon: "🔌", label: "USB / Type-C" },
    ],
  },

  71580: {
    displayName: "Ford Ranger",
    carClass: "Пикап",
    year: 2026,
    description:
      "Новый мощный пикап 2026 года с минимальным пробегом. Больше пространства, проходимости и ощущения контроля на дороге.",
    bodyType: "пикап",
    drive: "задний",
    engine: "2.0 Bi-Turbo дизель (210 л.с.)",
    highlight: "Новый 2026",
    features: [
      { icon: "📷", label: "Камера заднего вида" },
      { icon: "❄️", label: "Климат-контроль" },
      { icon: "🛋️", label: "Кожаный салон" },
      { icon: "🔌", label: "USB / Type-C" },
    ],
  },

  43533: {
    displayName: "BMW 330i M-Performance",
    carClass: "Премиум",
    year: 2020,
    description:
      "Премиальный спортивный седан — стиль, динамика и комфорт. Акустика Harman Kardon, M-пакет и настоящее удовольствие от вождения.",
    bodyType: "седан",
    drive: "задний",
    engine: "2.0 бензин (258 л.с.)",
    highlight: "M-пакет",
    features: [
      { icon: "📷", label: "Камера + парктроники" },
      { icon: "📱", label: "Apple CarPlay / Android Auto" },
      { icon: "🎶", label: "Harman Kardon" },
      { icon: "🔑", label: "Бесключевой доступ / Start-Stop" },
    ],
  },

  43534: {
    displayName: "BMW 420d Cabrio",
    carClass: "Кабриолет",
    year: 2017,
    description:
      "Стильный четырёхместный кабриолет с красным кожаным салоном — максимум эмоций на острове. Жёсткая складная крыша, M-пакет.",
    bodyType: "кабриолет",
    drive: "задний",
    engine: "2.0 дизель (190 л.с.)",
    seats: 4,
    highlight: "Кабриолет",
    features: [
      { icon: "🚗", label: "Жёсткая складная крыша" },
      { icon: "🛋️", label: "Красный кожаный салон" },
      { icon: "🎶", label: "Акустика BMW" },
      { icon: "🅿️", label: "Парктроники" },
    ],
  },

  43535: {
    displayName: "Mercedes-Benz E200 AMG Cabrio",
    carClass: "Кабриолет",
    year: 2016,
    description:
      "Премиальный четырёхместный кабриолет AMG для ярких поездок по Пхукету. Стиль, мощь и открытая крыша — каждая поездка особенная.",
    bodyType: "кабриолет",
    drive: "задний",
    engine: "2.0 бензин (190 л.с.)",
    seats: 4,
    highlight: "AMG · Кабриолет",
    features: [
      { icon: "🚗", label: "Складная крыша кабриолета" },
      { icon: "📷", label: "Камеры 360°" },
      { icon: "🎶", label: "Harman Kardon" },
      { icon: "🛋️", label: "Красный кожаный салон AMG" },
    ],
  },
};

// Фолбек если машина не найдена в конфиге
export const DEFAULT_FEATURES: Omit<CarFeatures, "displayName"> = {
  carClass: "Эконом",
  year: 2023,
  description: "Надёжный автомобиль для комфортных поездок по Пхукету.",
  bodyType: "седан",
  drive: "передний",
  engine: "автомат",
  features: [
    { icon: "❄️", label: "Кондиционер" },
    { icon: "🎵", label: "Bluetooth" },
    { icon: "🚗", label: "Автомат" },
    { icon: "🪟", label: "Тонировка" },
  ],
};

// ID машин (RentProg), на которые навешена акция "Низкая цена"
export const LOW_PRICE_CAR_IDS = new Set<number>([
  68767, // Mitsubishi Mirage
  43471, // MG3 yellow
  43472, // MG3 red
]);

const CRM_COLORS = ["white", "red", "grey", "gray", "silver", "black", "blue", "yellow"];

// Парсит отображаемое название из car_name RentProg, если для машины нет записи в CAR_FEATURES:
// убирает номер после "#", класс в скобках и название цвета.
export function parseDisplayName(rawName: string): string {
  const withoutNumber = rawName.split("#")[0];
  const withoutClass = withoutNumber.replace(/\([^)]*\)/g, "");
  const colorPattern = new RegExp(`\\b(${CRM_COLORS.join("|")})\\b`, "gi");
  const withoutColor = withoutClass.replace(colorPattern, "");
  return withoutColor.replace(/\s+/g, " ").trim();
}

export function getDisplayName(id: number, rawName: string): string {
  return CAR_FEATURES[id]?.displayName ?? parseDisplayName(rawName);
}

export function getCarFeatures(id: number, rawName = ""): CarFeatures {
  return CAR_FEATURES[id] ?? { ...DEFAULT_FEATURES, displayName: parseDisplayName(rawName) };
}

export const CAR_CLASS_EN: Record<CarClass, string> = {
  "Эконом": "Economy",
  "Эконом+": "Economy+",
  "Эконом Top": "Economy Top",
  "Кроссовер": "Crossover",
  "Пикап": "Pickup",
  "Премиум": "Premium",
  "Кабриолет": "Convertible",
};

const BODY_TYPE_EN: Record<string, string> = {
  "хэтчбек": "hatchback",
  "седан": "sedan",
  "кроссовер": "crossover",
  "пикап": "pickup",
  "внедорожник": "SUV",
  "кабриолет": "convertible",
};

const DRIVE_EN: Record<string, string> = {
  "передний": "front-wheel drive",
  "задний": "rear-wheel drive",
  "полный": "all-wheel drive",
};

const ENGINE_EN: Record<string, string> = {
  "1.0 Turbo бензин": "1.0 Turbo petrol",
  "1.2 бензин": "1.2 petrol",
  "1.3 бензин": "1.3 petrol",
  "1.5 бензин": "1.5 petrol",
  "1.5 гибрид": "1.5 hybrid",
  "1.5 турбо бензин": "1.5 turbo petrol",
  "2.0 Bi-Turbo дизель (210 л.с.)": "2.0 Bi-Turbo diesel (210 hp)",
  "2.0 бензин (190 л.с.)": "2.0 petrol (190 hp)",
  "2.0 бензин (258 л.с.)": "2.0 petrol (258 hp)",
  "2.0 дизель (190 л.с.)": "2.0 diesel (190 hp)",
  "2.0 турбо бензин (190 л.с.)": "2.0 turbo petrol (190 hp)",
  "2.4 дизель": "2.4 diesel",
  "автомат": "automatic",
};

const FEATURE_LABEL_EN: Record<string, string> = {
  "7 мест (кожа)": "7 seats (leather)",
  "Bluetooth + мультимедиа": "Bluetooth + multimedia",
  "Bluetooth / мультимедиа": "Bluetooth / multimedia",
  "Автомат": "Automatic",
  "Автоматическая коробка (CVT)": "Automatic transmission (CVT)",
  "Акустика BMW": "BMW sound system",
  "Акустика Bose": "Bose sound system",
  "Бензиновый двигатель 1.0 Turbo": "1.0 Turbo petrol engine",
  "Бесключевой доступ": "Keyless entry",
  "Бесключевой доступ / Start-Stop": "Keyless entry / Start-Stop",
  "Гибридный двигатель": "Hybrid engine",
  "Жёсткая складная крыша": "Hard folding roof",
  "Задние парктроники": "Rear parking sensors",
  "Камера + парктроники": "Camera + parking sensors",
  "Камера заднего вида": "Rear-view camera",
  "Камеры 360°": "360° cameras",
  "Климат-контроль": "Climate control",
  "Кожаный салон": "Leather interior",
  "Кондиционер": "Air conditioning",
  "Красный кожаный салон": "Red leather interior",
  "Красный кожаный салон AMG": "Red AMG leather interior",
  "Легкосплавные диски": "Alloy wheels",
  "Люк на крыше": "Sunroof",
  "Панорамная крыша": "Panoramic roof",
  "Панорамная крыша с люком": "Panoramic roof with sunroof",
  "Панорамный люк": "Panoramic sunroof",
  "Парктроники": "Parking sensors",
  "Парктроники и тонировка": "Parking sensors and tinted windows",
  "Передний привод": "Front-wheel drive",
  "Проекция на лобовое стекло": "Head-up display",
  "Просторный салон": "Spacious interior",
  "Раздельный климат-контроль": "Dual-zone climate control",
  "Складная крыша кабриолета": "Convertible folding roof",
  "Тонировка": "Tinted windows",
  "Экономичный расход": "Fuel-efficient",
};

const HIGHLIGHT_EN: Record<string, string> = {
  "Жёлтый": "Yellow",
  "Люк": "Sunroof",
  "Люк · 360°": "Sunroof · 360°",
  "Турбо": "Turbo",
  "Панорама": "Panoramic roof",
  "Панорама · 360°": "Panoramic roof · 360°",
  "Гибрид": "Hybrid",
  "Bose · 360°": "Bose · 360°",
  "7 мест": "7 seats",
  "210 л.с.": "210 hp",
  "Новый 2026": "New 2026",
  "M-пакет": "M Package",
  "Кабриолет": "Convertible",
  "AMG · Кабриолет": "AMG · Convertible",
};

const DESCRIPTION_EN: Record<string, string> = {
  "Компактный и максимально экономичный хэтчбек — идеальный вариант для бюджетных поездок по Пхукету. Лёгкий в управлении, манёвренный.":
    "A compact and ultra-efficient hatchback — ideal for budget trips around Phuket. Easy to drive and nimble.",
  "Компактный и экономичный автомобиль для поездок по Пхукету. Манёвренный, удобный и комфортный.":
    "A compact and fuel-efficient car for trips around Phuket. Nimble, convenient, and comfortable.",
  "Компактный и экономичный хэтчбек — отличный вариант для поездок по Пхукету. Манёвренный, удобный для города и очень экономичный.":
    "A compact and fuel-efficient hatchback — a great choice for trips around Phuket. Nimble, easy in the city, and very economical.",
  "Комфортный и экономичный городской седан с хорошей комплектацией и проекцией на лобовое стекло.":
    "A comfortable, fuel-efficient city sedan with a rich feature set and a head-up display.",
  "Комфортный и экономичный городской седан с хорошей комплектацией. Плавная езда, компактные размеры и современные опции.":
    "A comfortable, fuel-efficient city sedan with a rich feature set. Smooth ride, compact size, and modern options.",
  "Комфортный и экономичный городской седан — отличный вариант для поездок по Пхукету. Мягкая подвеска, просторный салон и низкий расход топлива делают Almera удобной машиной для путешествий по острову.":
    "A comfortable, fuel-efficient city sedan — a great choice for trips around Phuket. A soft suspension, roomy interior, and low fuel consumption make the Almera a convenient car for getting around the island.",
  "Комфортный и экономичный хэтчбек с хорошей комплектацией. Плавная езда, компактные размеры и современные опции.":
    "A comfortable, fuel-efficient hatchback with a rich feature set. Smooth ride, compact size, and modern options.",
  "Манёвренный и экономичный хэтчбек — отличный вариант для поездок по Пхукету. Компактный, удобный для города и очень простой в управлении.":
    "A nimble and fuel-efficient hatchback — a great choice for trips around Phuket. Compact, easy in the city, and very easy to drive.",
  "Мощный и брутальный пикап для путешествий по Пхукету. Просторный, комфортный и уверенный на любой дороге.":
    "A powerful, rugged pickup for trips around Phuket. Roomy, comfortable, and confident on any road.",
  "Надёжный и просторный 7-местный внедорожник — идеальный вариант для путешествий с семьёй или компанией. Мощный дизельный двигатель.":
    "A reliable, roomy 7-seat SUV — ideal for trips with family or a group. Powerful diesel engine.",
  "Новый мощный пикап 2026 года с минимальным пробегом. Больше пространства, проходимости и ощущения контроля на дороге.":
    "A brand-new, powerful 2026 pickup with minimal mileage. More space, off-road capability, and confidence on the road.",
  "Премиальный кроссовер с турбированным двигателем и комфортом бизнес-класса. Мягкая подвеска, уверенная динамика, акустика Bose.":
    "A premium crossover with a turbocharged engine and business-class comfort. Soft suspension, confident handling, Bose sound system.",
  "Премиальный спортивный седан — стиль, динамика и комфорт. Акустика Harman Kardon, M-пакет и настоящее удовольствие от вождения.":
    "A premium sports sedan — style, dynamics, and comfort. Harman Kardon sound system, M Package, and true driving pleasure.",
  "Премиальный четырёхместный кабриолет AMG для ярких поездок по Пхукету. Стиль, мощь и открытая крыша — каждая поездка особенная.":
    "A premium 4-seat AMG convertible for memorable trips around Phuket. Style, power, and an open roof — every drive is special.",
  "Просторный и современный 7-местный кроссовер — отличный вариант для поездок с семьёй или компанией. Комфортный и удобный.":
    "A roomy, modern 7-seat crossover — a great choice for trips with family or a group. Comfortable and convenient.",
  "Просторный и экономичный седан — идеален для комфортных поездок по Пхукету. Отлично подойдёт для пары или семьи: много места, плавный ход.":
    "A roomy, fuel-efficient sedan — perfect for comfortable trips around Phuket. Great for a couple or a family: lots of space, smooth ride.",
  "Современный гибридный кроссовер — идеальный выбор для комфортных и экономичных поездок по Пхукету. Высокая посадка, плавный ход.":
    "A modern hybrid crossover — the ideal choice for comfortable, fuel-efficient trips around Phuket. High seating position, smooth ride.",
  "Современный городской седан в максимальной комплектации — идеальный баланс комфорта, технологий и экономичности.":
    "A modern city sedan in top trim — the ideal balance of comfort, technology, and fuel efficiency.",
  "Современный и экономичный седан для поездок по Пхукету. Комфортный, надёжный и простой в управлении.":
    "A modern, fuel-efficient sedan for trips around Phuket. Comfortable, reliable, and easy to drive.",
  "Современный кроссовер с премиальной комплектацией и панорамной крышей. Просторный, мягкий и безопасный.":
    "A modern crossover with a premium feature set and a panoramic roof. Roomy, smooth, and safe.",
  "Стильный городской хэтчбек — компактный, экономичный и очень удобный. Яркий жёлтый цвет добавляет настроения.":
    "A stylish city hatchback — compact, fuel-efficient, and very convenient. The bright yellow color adds a fun touch.",
  "Стильный городской хэтчбек — компактный, экономичный и очень удобный. Яркий красный цвет добавляет настроения.":
    "A stylish city hatchback — compact, fuel-efficient, and very convenient. The bright red color adds a fun touch.",
  "Стильный и экономичный седан — отличный вариант для комфортных поездок по Пхукету. Надёжный, удобный в управлении.":
    "A stylish, fuel-efficient sedan — a great choice for comfortable trips around Phuket. Reliable and easy to drive.",
  "Стильный и экономичный хэтчбек — отличный вариант для комфортных поездок по Пхукету. Надёжный, удобный в управлении.":
    "A stylish, fuel-efficient hatchback — a great choice for comfortable trips around Phuket. Reliable and easy to drive.",
  "Стильный седан с панорамным люком и богатой комплектацией. Просторный салон, современный дизайн и камеры 360°.":
    "A stylish sedan with a panoramic sunroof and a rich feature set. Roomy interior, modern design, and 360° cameras.",
  "Стильный четырёхместный кабриолет с красным кожаным салоном — максимум эмоций на острове. Жёсткая складная крыша, M-пакет.":
    "A stylish 4-seat convertible with a red leather interior — maximum fun on the island. Hard folding roof, M Package.",
  "Универсальный кроссовер с панорамной крышей — комфорт для поездок по Пхукету. Просторный, удобный и хорошо оснащённый.":
    "A versatile crossover with a panoramic roof — comfort for trips around Phuket. Roomy, convenient, and well-equipped.",
  "Надёжный автомобиль для комфортных поездок по Пхукету.": "A reliable car for comfortable trips around Phuket.",
};

function translateOr<T extends string>(map: Record<string, string>, value: T): string {
  return map[value] ?? value;
}

const TRANSMISSION_EN: Record<string, string> = {
  "Автомат": "Automatic",
  "Механика": "Manual",
  "Ручная": "Manual",
};

export function translateTransmission(rawTransmission: string | undefined, locale: Locale, automaticLabel: string): string {
  if (!rawTransmission) return automaticLabel;
  if (locale !== "en") return rawTransmission;
  return TRANSMISSION_EN[rawTransmission] ?? rawTransmission;
}

export function translateCarFeatures(features: CarFeatures, locale: Locale): CarFeatures {
  if (locale !== "en") return features;

  return {
    ...features,
    carClass: features.carClass,
    description: translateOr(DESCRIPTION_EN, features.description),
    bodyType: translateOr(BODY_TYPE_EN, features.bodyType),
    drive: translateOr(DRIVE_EN, features.drive),
    engine: translateOr(ENGINE_EN, features.engine),
    highlight: features.highlight ? translateOr(HIGHLIGHT_EN, features.highlight) : features.highlight,
    features: features.features.map((feature) => ({
      ...feature,
      label: translateOr(FEATURE_LABEL_EN, feature.label),
    })),
  };
}
