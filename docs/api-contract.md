# Backend ↔ frontend: контракт MVP

Базовый URL при локальном запуске: `http://localhost:3000`. Все запросы и
ответы используют JSON. Авторизации в MVP нет: роль «бизнес» или «студенты»
переключается только во frontend и не является средством контроля доступа.

## Общие правила

- Идентификаторы — строки, даты — ISO 8601.
- Успешный одиночный ресурс: `{ "task": ... }` или `{ "proposal": ... }`.
- Список: `{ "items": [], "total": 0 }`.
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

- Коды: `400` — неверный ввод, `404` — ресурс не найден, `409` — действие
  невозможно в текущем статусе, `422` — не выполнены требования публикации.
- Ошибка AI не становится HTTP-ошибкой: backend отвечает резервными вопросами.

## Уточнение

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

Ответ:

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

Активный `TaskConstructorModal` из архива `HackAlem-main-2.zip` использует два маршрута.

### Получить уточняющие вопросы

`POST /api/ai/clarify-task`

```json
{
  "draft": "Нужно автоматизировать обработку заявок студентов",
  "companyName": "Demo Company"
}
```

Успешный ответ (`200`):

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

Успешный ответ (`200`):

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

## Карточки и рейтинг

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

- `GET /api/teams` — демо-команды для переключателя студенческой роли.
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

Полная форма `TaskCard`, `Rating`, `Team` и `Proposal` соответствует файлу
`docs/product-spec.md` из ветки `feature/member-1-product` участника №1.
