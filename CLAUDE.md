@AGENTS.md

# Сайт KataCars — phuketrentcar.com

Next.js 16 + Tailwind 4, двуязычный (ru/en). Запуск для проверки: `npm run dev` (http://localhost:3000, в `.claude/launch.json` — конфигурация `dev`).

## Устройство

- `knowledge/` — база знаний компании: машины, доставка, условия аренды, о компании. Описание — `knowledge/README.md`. Код сайта читает JSON отсюда; эту же папку читает `../content-factory`. Данные о компании правим только здесь.
- `src/lib/rentprog.ts` + `src/app/api/cars` — свободные машины и цены из RentProg на нужные даты. Этим API пользуется и content-factory, менять формат ответа осторожно.
- `src/app/api/booking` + `src/lib/amocrm.ts` — заявки с сайта: сделка в amoCRM и письмо через Resend (запасной канал; если в amoCRM не попала, в теме письма будет пометка).
- `src/app/api/amocrm-webhook/[secret]` + `src/lib/lead-notify.ts` — amoCRM сообщает о новой сделке, и если у неё метка «Сайт» или это письмо со старого сайта (katacars.info, попадает в «Неразобранное»), бот пишет в Telegram-группу менеджеров. Адрес зарегистрирован в amoCRM как вебхук на `add_lead` и `update_lead`: о письмах в «Неразобранном» amoCRM сообщает только изменением сделки. Метка «Бот уведомил» защищает от повторных сообщений.
- `src/lib/payroll/` + `src/app/api/payroll/*` — зарплата менеджеров: каждый день в 18:00 по Пхукету (`vercel.json`) бот берёт из amoCRM машину, бюджет (только аренда), даты и поле «Менеджер», сверяет с RentProg по телефону и по машине с датой (брони без сделки, поставленные вчера или раньше, записываются на офис) и присылает всем менеджерам (каждому в личный Telegram) и владелице одинаковые блоки: новые брони с кнопкой «Не согласна», выдачи, сдачи, а для длинных помесячных аренд ещё блок оплат. Споры и непонятные заявки решает только владелица; любую заявку она меняет, прислав боту ссылку или номер сделки. Хранит всё в Google-таблице (служебные вкладки «Заявки», «Начисления», «Люди», «Итоги» и лист на каждый месяц из формул). Сценарии — `npm test`. Без переменных `PAYROLL_*`, `GOOGLE_*`, `CRON_SECRET` бот выключен, сайт работает как обычно.
- `public/cars/<id>/1.webp, 2.webp…` — фото машин, папка = ID машины в RentProg.
- Переменные окружения (значения не печатать): `RENTPROG_BASE_URL`, `RENTPROG_COMPANY_TOKEN`, `RESEND_API_KEY`, `CONTACT_EMAIL`, `AMOCRM_BASE_URL`, `AMOCRM_ACCESS_TOKEN`, необязательные `AMOCRM_PIPELINE_ID`, `AMOCRM_STATUS_ID`, для уведомлений `AMO_NOTIFY_TELEGRAM_TOKEN`, `AMO_NOTIFY_TELEGRAM_CHAT_ID`, `AMO_WEBHOOK_SECRET`, для зарплаты `PAYROLL_TELEGRAM_TOKEN`, `PAYROLL_TELEGRAM_SECRET`, `PAYROLL_OWNER_CODE`, `PAYROLL_START_DATE`, `PAYROLL_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `CRON_SECRET` — в `.env.local` и на хостинге.

## Правила

- Новая машина: описание в `knowledge/cars.json`, перевод — в `knowledge/cars-en.json`, фото — в `public/cars/<id>/`, место в `priority`.
- Тексты на сайте — на двух языках; не оставлять русский текст в английской версии.
- После правок JSON проверить `npm run build` — ошибка в запятой ломает сборку.
- Цены и наличие не хардкодить — они живые из RentProg.
- В планах: Telegram-бот и ИИ-продавец — будут жить в этом проекте (общий код RentProg).
