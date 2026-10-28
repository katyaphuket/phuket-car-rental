@AGENTS.md

# Сайт KataCars — phuketrentcar.com

Next.js 16 + Tailwind 4, двуязычный (ru/en). Запуск для проверки: `npm run dev` (http://localhost:3000, в `.claude/launch.json` — конфигурация `dev`).

## Устройство

- `knowledge/` — база знаний компании: машины, доставка, условия аренды, о компании. Описание — `knowledge/README.md`. Код сайта читает JSON отсюда; эту же папку читает `../content-factory`. Данные о компании правим только здесь.
- `src/lib/rentprog.ts` + `src/app/api/cars` — свободные машины и цены из RentProg на нужные даты. Этим API пользуется и content-factory, менять формат ответа осторожно.
- `src/app/api/booking` — заявки с сайта (письмо через Resend).
- `public/cars/<id>/1.webp, 2.webp…` — фото машин, папка = ID машины в RentProg.
- Переменные окружения (значения не печатать): `RENTPROG_BASE_URL`, `RENTPROG_COMPANY_TOKEN`, `RESEND_API_KEY`, `CONTACT_EMAIL` — в `.env.local` и на хостинге.

## Правила

- Новая машина: описание в `knowledge/cars.json`, перевод — в `knowledge/cars-en.json`, фото — в `public/cars/<id>/`, место в `priority`.
- Тексты на сайте — на двух языках; не оставлять русский текст в английской версии.
- После правок JSON проверить `npm run build` — ошибка в запятой ломает сборку.
- Цены и наличие не хардкодить — они живые из RentProg.
- В планах: Telegram-бот и ИИ-продавец — будут жить в этом проекте (общий код RentProg).
