# Backend ↔ frontend: контракт MVP

Базовый URL при локальном запуске: `http://localhost:3000`. Все запросы и
ответы используют JSON. Авторизации в MVP нет: пользователь выбирает доступный
демонстрационный профиль без пароля. Переданный `profileId` определяет роль и
принадлежность записей в UI API, но не подтверждает личность и не защищает данные
от другого клиента, знающего этот ID. Общий API также остаётся открытым.

Активный интерфейс использует `/api/ai/*` для вопросов/сборки карточки и
`/api/ui/*` для каталога, публикации, откликов и ручного выбора. Сохранённый
общий контракт `/api/tasks/*` доступен отдельно и имеет другую форму карточки.

## Хранение и AI-провайдеры

Оба контракта используют одно хранилище: задачи, отклики и их идентификаторы общие.
По умолчанию `FileStore` сохраняет задачи, команды, UI-метаданные, профили и
уведомления в `data/runtime/startcard.json`. `DATA_FILE` меняет путь относительно
корня проекта; абсолютный путь тоже поддерживается. Файл и временные записи в
`data/runtime/` исключены из Git. Для другого расположения нужно самостоятельно
исключить файл из Git. `DATA_FILE=:memory:` включает одноразовый `MemoryStore`.

Операция UI записывает целый снимок через временный файл и атомарную замену.
При ошибке записи сервер возвращает `500` и откатывает изменения в памяти.
Перезапуск сохраняет профили, карточки, отклики, решения и отметки прочтения.
Демо-профили `demo-student`, `demo-business` и учебная карточка создаются только
при первом запуске, если файла ещё нет. Карточка `task-demo` явно принадлежит
`demo-business`; произвольные старые/общие задачи не получают этого владельца.
Повреждённый файл останавливает запуск и не перезаписывается начальными данными.

Этот формат предназначен для одного процесса сервера и небольшого демо.
Для нескольких серверов и настоящих аккаунтов потребуются БД и авторизация.

| Маршруты | Ключ backend | Модель по умолчанию |
|---|---|---|
| `/api/ai/clarify-task`, `/api/ai/build-card`, `/api/ai/optimize-task` | `GEMINI_API_KEY` | `gemini-flash-latest` |
| `/api/clarifications`, `/api/tasks/:taskId/clarifications` | `OPENAI_API_KEY` | `gpt-4o-mini` |

Оба ключа необязательны для запуска. Отсутствующий ключ включает явно отмеченный
резервный режим соответствующего провайдера; один провайдер не заменяет другого.
Модели и тайм-ауты задаются `GEMINI_MODEL`, `GEMINI_TIMEOUT_MS`, `OPENAI_MODEL`,
`OPENAI_TIMEOUT_MS` (тайм-аут по умолчанию 10000 мс). Ключи находятся только на
backend; `.env.example` перечисляет переменные без секретов.

`GET /health` возвращает `storage: "file"` (либо `"memory"`), `aiConfigured` и
`aiProviders: {openai, gemini}`. Флаги показывают наличие конфигурации, а не
подтверждают успешный запрос к модели.

## Общие правила

- Идентификаторы — строки, даты — ISO 8601.
- Одиночный ресурс: `{ "task": ... }`, `{ "card": ... }` или `{ "proposal": ... }`.
- Общие списки: `{ "items": [], "total": 0 }`; UI: `{ "cards": [], "proposals": [], "notifications": [], "unreadCount": 0 }`.
- Ошибка:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "draftText is required and must be a non-empty string.",
    "details": {}
  }
}
```

- Коды: `400` — неверный ввод, `403` — неподходящая роль или владелец в UI API,
  `404` — ресурс не найден, `409` — действие невозможно в текущем статусе,
  `422` — не выполнены требования публикации, `500` — внутренняя ошибка/сбой записи.
- При сбое провайдера backend отвечает резервными вопросами/карточкой с `source`
  и `fallbackReason`. Неверное тело запроса по-прежнему даёт `400`.

## Профили и уведомления

| Метод и путь | Тело | Успешный ответ |
|---|---|---|
| `GET /api/ui/profiles` | — | `200 {profiles}` |
| `POST /api/ui/profiles` | `{profile: {role, name, ...}}` | `201 {profile}` |
| `PATCH /api/ui/profiles/:profileId` | `{profile: {name, ...}}` | `200 {profile}` |
| `PATCH /api/ui/notifications/:notificationId` | `{profileId, read: true}` | `200 {notification}` |
| `POST /api/ui/notifications/read-all` | `{profileId}` | `200 {unreadCount: 0}` |

Создание студента требует `role: "student"`, `name`, `teamName`; бизнеса —
`role: "business"`, `name`, `company`. Сервер создаёт неизменяемый `id`.
Редактирование частичное; нельзя передавать `id`, `role` или вычисляемые поля.

- Студент: `name`, `teamName`, `avatar`, `university`, `specialization`,
  `skills` (массив строк), `github`, `telegram`.
- Бизнес: `name`, `roleTitle`, `company`, `avatar`.

`avatar` и `github` — пустая строка либо HTTP(S)-URL. Текстовые поля профиля
ограничены 300 символами, ссылки — 2000; навыки — не более 30 строк по 80 символов.
Поля студента `rating: 0`, `completedTasks: 0` и бизнеса `verified: false` не
обозначают подтверждённые достижения. `activeCardsCount` вычисляется по принадлежащим
профилю незакрытым карточкам.

Уведомление содержит `id`, `profileId`, `type`, `title`, `message`, `cardId`,
`proposalId`, `createdAt`, `readAt` (`null` до прочтения). UI API создаёт:

- `new_proposal` — владельцу карточки при новом отклике;
- `proposal_accepted` или `proposal_rejected` — студенту при решении бизнеса.

Уведомления входят в `state`, сортируются от новых к старым; `unreadCount`
считает записи с `readAt: null`. Чтение чужого уведомления возвращает `404`.
Повторная отметка прочтения сохраняет исходную дату. «Прочитать все» меняет
только уведомления указанного профиля. Email, push и внешние рассылки не используются.
Исторические/общие записи без привязанного профиля не получают адресата автоматически.
Совместимые старые маршруты `/api/tasks/:taskId/proposals` и
`/api/tasks/:taskId/selection` не создают уведомления профилей. Действующий интерфейс
использует `/api/ui/proposals` и `/api/ui/proposals/:proposalId/selection`, где
изменение отклика и соответствующее уведомление сохраняются одной операцией.

## Активный UI: каталог, публикация, отклики и выбор

Формы `TaskCard` и `TeamProposal` определены в `src/types/index.ts`.

| Метод и путь | Тело | Успешный ответ |
|---|---|---|
| `GET /api/ui/state?profileId=ID` | — | `200 {cards, proposals, notifications, unreadCount}` |
| `POST /api/ui/cards` | `{profileId, card: {...}}` | `201 {card}` |
| `POST /api/ui/proposals` | `{profileId, proposal: {...}}` | `201 {proposal}` |
| `POST /api/ui/proposals/:proposalId/selection` | `{profileId, action: "accept"}` или `{profileId, action: "reject"}` | `200 {proposal}` |

`state` возвращает опубликованные задачи (включая выбор/закрытие) по убыванию
UI-рейтинга. Каталог общий, карточки содержат `businessId`, если известен владелец.
Студент получает только свои отклики, бизнес — отклики на свои карточки.
`applicantsCount` считается по всем реальным откликам, а `hasApplied` — только
для выбранного студента. Без `profileId` доступны карточки, пустые списки откликов
и уведомлений; неизвестный ID возвращает `404`. Начальный каталог содержит учебный
пример столовой. Избранные карточки не хранятся на backend.

Минимальный запрос публикации:

```json
{
  "profileId": "demo-business",
  "card": {
    "title": "Прогноз очередей",
    "company": "Учебная столовая",
    "context": "В обед посетители не знают ожидаемое время в очереди.",
    "businessContact": "canteen@example.kz, консультации по вторникам"
  }
}
```

Для публикации нужен бизнес-профиль. `businessId` и `company` берутся из него.
Обязательны непустые `title`, `businessContact` и хотя бы одно из
`context`/`shortSummary`. Остальные текстовые поля — `dataAndMaterials`,
`expectedResult`, `successCriteria`, `constraints`, `targetUsers`, `reward`,
`customLogoText` — необязательны и остаются пустыми при отсутствии.
`tags` — массив строк; `deadlineDays` — целое 1–365 (по умолчанию 14);
`brandColor` — шестизначный HEX (по умолчанию `#F59E0B`);
`category` — `all`, `ai`, `gamedev`, `web`, `bots`, `design`, `analytics`;
`logoType` — `custom`, `nvidia`, `sony`, `discord`, `telegram`, `yandex`, `tinkoff`;
`aiGenerated` — необязательный boolean.

Сервер назначает ID и дату, рассчитывает рейтинг, количество откликов и статус.
Переданные клиентом ID/рейтинг/число откликов не принимаются за достоверные.
Финальное нажатие «Опубликовать» включает пользовательское подтверждение и
сразу создаёт опубликованную задачу. Низкий рейтинг сам по себе не блокирует API.

Минимальный отклик:

```json
{
  "profileId": "demo-student",
  "proposal": {
    "cardId": "идентификатор из ответа публикации",
    "teamName": "Campus Team",
    "solutionIdea": "Спрогнозировать ожидание по истории чеков.",
    "workPlan": "Изучить CSV, собрать модель и проверить результат.",
    "proposedDeadline": "14 дней",
    "prototypeLink": "",
    "telegram": ""
  }
}
```

Для отклика нужен студенческий профиль. Обязательны `cardId`, `solutionIdea`,
`workPlan`, `proposedDeadline`. `teamName` при отсутствии берётся из профиля.
`prototypeLink` может быть пустым; непустое значение должно быть HTTP(S)-URL.
`telegram` сохраняет введённый в отклике контакт, а при отсутствии поля берётся
из профиля. `studentId`, `leaderName`, `avatar` определяются сервером по профилю;
переданные клиентом значения этих полей игнорируются. При последующем редактировании
профиля ID и связи остаются прежними; имя и аватар отображаются актуальные,
а название команды и контакт в отправленном отклике остаются сохранённым снимком.
Сервер назначает `id`, `submittedAt`, `status: "pending"`, берёт `cardTitle` и
`companyName` из карточки. Один `studentId` может подать один отклик на задачу:
повторный отклик даёт `409 DUPLICATE_PROPOSAL`. Это идентификатор демо, не авторизация.

Выбор `accept`/`reject` разрешён бизнес-профилю владельца карточки,
только для ещё не рассмотренного отклика и
открытого выбора. Можно принять несколько разных команд. Повторное решение
даёт `409 PROPOSAL_ALREADY_DECIDED`; неизвестное действие — `400`; отсутствующий
отклик — `404`. Баллы и награды за принятие не начисляются. Завершение выбора
без принятия доступно через общий `/api/tasks/:taskId/selection` с `action: "close"`.

### Сохранённые различия UI и общего API

| Назначение | UI | Общий контракт |
|---|---|---|
| Данные | `dataAndMaterials` | `data` |
| Пользователи | `targetUsers` | `users` |
| Контакт | `businessContact`, непустой свободный текст | `contact`, email/телефон, и отдельный `interactionFormat` |
| Рейтинг | `readinessScore`, `scoreBreakdown` | `rating` |
| Отклик | `cardId`, `workPlan`, `proposedDeadline`, `prototypeLink` | `taskId`, `plan`, `duration`, `prototypeUrl` |
| Новый отклик | `pending` | `submitted` |

UI-рейтинг сохраняет формулу по длине семи полей из `src/utils/scoreCalculator.ts`;
сервер пересчитывает её функцией `frontendRating` в `src/services/frontend-ai-service.js`. Общий API сохраняет
`src/domain/rating.js`: отдельные context/need, contact/interactionFormat и проверку
измеримости критериев. Поэтому оценки одной задачи через два контракта могут
различаться. Конвертация не меняет исходную формулу общего API.

## Общее уточнение через OpenAI

`POST /api/clarifications`

```json
{
  "draftText": "Нужен сервис для сокращения очередей",
  "knownFields": {
    "context": "Очереди возникают в обед",
    "need": ""
  }
}
```

Ответ (показан один из 3–7 вопросов):

```json
{
  "questions": [
    {
      "id": "q1",
      "targetField": "data",
      "text": "Какие данные или материалы доступны команде?"
    }
  ],
  "source": "ai",
  "fallbackReason": null
}
```

`questions` всегда содержит 3–7 элементов. `source` равен `ai` или `fallback`.
В резервном режиме `fallbackReason`: `missing_api_key`, `timeout`,
`invalid_response` либо `provider_error`.

Если черновик уже сохранён, frontend может вызвать
`POST /api/tasks/:taskId/clarifications` без тела.

## Совместимость с frontend из AI Studio

Активный `TaskConstructorModal` использует два маршрута Gemini. Сборка карточки
не сохраняет её автоматически: сохранение выполняется последующим `/api/ui/cards`.

### Получить уточняющие вопросы

`POST /api/ai/clarify-task`

```json
{
  "draft": "Нужно автоматизировать обработку заявок студентов",
  "companyName": "Demo Company"
}
```

Успешный ответ (`200`, показан один из шести вопросов):

```json
{
  "success": true,
  "questions": [
    {
      "id": "q1",
      "category": "dataAndMaterials",
      "question": "Какие исходные данные готовы предоставить?",
      "placeholder": "CSV, API или примеры документов"
    }
  ],
  "source": "gemini",
  "fallbackReason": null
}
```

Backend всегда возвращает шесть вопросов с идентификаторами `q1`–`q6`. При отсутствии
ключа, тайм-ауте или неверном ответе Gemini HTTP-код остаётся `200`, но `source` равен
`fallback`, а `fallbackReason` явно сообщает `missing_api_key`, `timeout`,
`invalid_response` или `provider_error`. Пустой или слишком короткий `draft` даёт `400`.

### Собрать карточку и рейтинг

`POST /api/ai/build-card`

```json
{
  "draft": "Нужно автоматизировать обработку заявок студентов",
  "companyName": "Demo Company",
  "answers": {
    "q1": "Есть обезличенный CSV",
    "q2": "Обработка должна занимать менее 5 минут",
    "q3": "Две недели, только тестовый контур",
    "q4": "owner@example.kz, два созвона в неделю",
    "q5": "Операторы приёмной комиссии",
    "q6": "Веб-прототип и инструкция по запуску"
  }
}
```

Успешный ответ (`200`, содержимое `rating.breakdown` сокращено):

```json
{
  "success": true,
  "card": {
    "title": "Автоматизация обработки заявок",
    "shortSummary": "Нужно автоматизировать обработку заявок студентов",
    "context": "Нужно автоматизировать обработку заявок студентов",
    "dataAndMaterials": "Есть обезличенный CSV",
    "expectedResult": "Веб-прототип и инструкция по запуску",
    "successCriteria": "Обработка должна занимать менее 5 минут",
    "constraints": "Две недели, только тестовый контур",
    "targetUsers": "Операторы приёмной комиссии",
    "businessContact": "owner@example.kz, два созвона в неделю",
    "tags": [],
    "deadlineDays": 14,
    "reward": ""
  },
  "rating": {
    "score": 100,
    "level": "priority",
    "levelLabel": "Приоритетная (90–100 б.)",
    "breakdown": {},
    "missingAdvice": []
  },
  "source": "gemini",
  "fallbackReason": null
}
```

Поля фактов в карточке переносятся только из `draft` и `answers`; модель не подставляет
отсутствующие данные, контакты, награду или ограничения. `q1`–`q6` соответствуют полям
`dataAndMaterials`, `successCriteria`, `constraints`, `businessContact`, `targetUsers`,
`expectedResult`. Формат `rating.breakdown` совпадает с типом
`ReadinessScoreBreakdown` frontend.

Старый, сейчас не подключённый `AiTaskCreatorModal` использует следующий совместимый
маршрут.

`POST /api/ai/optimize-task` поддерживает форму конструктора StartCard:

```json
{
  "roughDescription": "Нужен сервис для обработки заявок студентов",
  "companyName": "AI Sana",
  "category": "ai",
  "targetLevel": "Junior",
  "budgetSuggestion": "Стажировка"
}
```

Ответ сохраняет ожидаемые frontend поля `title`, `shortSummary`,
`fullDescription`, `deliverables`, `requirements`, `tags`,
`recommendedDeadlineDays`, `recommendedReward`, `aiAdvice`:

```json
{
  "success": true,
  "card": {},
  "source": "gemini",
  "fallbackReason": null
}
```

При отсутствии ключа, тайм-ауте или неверном ответе HTTP-сценарий не
блокируется: `source` равен `fallback`, а `fallbackReason` явно содержит
`missing_api_key`, `timeout`, `invalid_response` или `provider_error`.

## Общий API: карточки и рейтинг

### Создать черновик

`POST /api/tasks`

Минимальное тело: `{ "draftText": "..." }`. Можно сразу передать любые
редактируемые поля `TaskCard`: `title`, `industry`, `context`, `need`, `users`,
`data`, `constraints`, `expectedResult`, `successCriteria`, `contact`,
`interactionFormat`.

### Перенести ответы

`POST /api/tasks/:taskId/answers`

```json
{
  "answers": [
    { "targetField": "data", "value": "Есть выгрузка CSV за 6 месяцев" },
    { "targetField": "users", "value": "Операторы контактного центра" }
  ]
}
```

Backend переносит только переданные пользователем значения. AI не заполняет
карточку самостоятельно.

### Редактировать, подтвердить и опубликовать

- `PATCH /api/tasks/:taskId` — частичное изменение полей в `draft` или
  `confirmed`, рейтинг пересчитывается сразу.
- `POST /api/tasks/:taskId/confirm` — ручное подтверждение бизнеса.
- `POST /api/tasks/:taskId/publish` — публикация подтверждённой карточки.
- `GET /api/tasks/:taskId` — одна карточка.
- `GET /api/tasks` — каталог опубликованных карточек.

Для публикации нужны непустой `title`, хотя бы одно из `context`/`need`,
валидный email или телефон в `contact`, а также статус `confirmed`. Низкий
рейтинг не блокирует публикацию. Каталог сортируется по `rating.score` по
убыванию, затем по `updatedAt` от новых к старым.

## Команды, отклики и выбор

- `GET /api/teams` — команды серверного хранилища; активный UI не использует этот
  список для своего переключателя роли.
- `GET /api/tasks/:taskId/proposals` — отклики на карточку.
- `POST /api/tasks/:taskId/proposals` — создать отклик.

```json
{
  "teamId": "team-data-nomads",
  "solutionIdea": "Краткая идея решения",
  "plan": "План работ",
  "duration": "2 недели",
  "prototypeUrl": "https://example.com/demo"
}
```

`prototypeUrl` необязателен и может быть пустой строкой. Новые отклики
принимаются в статусах задачи `published` и `in_selection`.

`POST /api/tasks/:taskId/selection` выполняет только ручное решение бизнеса:

Это старый совместимый API без проверки выбранного профиля и без уведомлений.
Для действий через профили следует использовать UI API, описанный выше.
В общем API обновления нескольких откликов сохраняются последовательно,
а не одной транзакцией операции.

```json
{ "action": "accept", "proposalIds": ["proposal-1", "proposal-2"] }
```

- `accept` принимает один или несколько откликов, не отклоняя остальные;
- `reject` отклоняет перечисленные отклики;
- `close` завершает выбор и отклоняет оставшиеся `submitted`. Если принятых
  откликов нет, результат задачи — `no_selection`, иначе — `selected`.

## Статусы

`TaskCard.status`: `draft`, `confirmed`, `published`, `in_selection`, `closed`.

`TaskCard.selectionOutcome`: `pending`, `selected`, `no_selection`.

`Proposal.status`: `submitted`, `accepted`, `rejected`.

Эти статусы относятся к общему API; UI переводит `submitted` в `pending` и
использует формы из `src/types/index.ts`. Реализация общего API находится в
`src/backend-app.js`, адаптера — в `src/routes/ui-router.js`.
