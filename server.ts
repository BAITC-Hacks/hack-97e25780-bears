import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent telemetry
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

/**
 * Шкала оценки готовности бизнес-задачи согласно ТЗ хакатона AI Sana (0-100 баллов):
 * 1. Контекст и потребность: 20 баллов
 * 2. Данные и материалы: 20 баллов
 * 3. Ожидаемый результат: 15 баллов
 * 4. Критерии успеха: 15 баллов
 * 5. Ограничения (сроки, технологии): 10 баллов
 * 6. Пользователи: 10 баллов
 * 7. Связь с бизнесом (контакт, ментор): 10 баллов
 */
export function calculateReadinessScore(card: any) {
  let score = 0;
  const breakdown: Record<string, { max: number; earned: number; present: boolean; advice: string }> = {
    context: {
      max: 20,
      earned: card.context && card.context.trim().length > 20 ? 20 : card.context && card.context.trim().length > 5 ? 10 : 0,
      present: Boolean(card.context && card.context.trim().length > 5),
      advice: 'Опишите подробнее, что происходит сейчас и почему возникла потребность в решении (+10..20 б.)',
    },
    dataAndMaterials: {
      max: 20,
      earned: card.dataAndMaterials && card.dataAndMaterials.trim().length > 15 ? 20 : card.dataAndMaterials && card.dataAndMaterials.trim().length > 3 ? 10 : 0,
      present: Boolean(card.dataAndMaterials && card.dataAndMaterials.trim().length > 3),
      advice: 'Укажите доступные данные, API, макеты или примеры для работы студентов (+10..20 б.)',
    },
    expectedResult: {
      max: 15,
      earned: card.expectedResult && card.expectedResult.trim().length > 15 ? 15 : card.expectedResult && card.expectedResult.trim().length > 3 ? 8 : 0,
      present: Boolean(card.expectedResult && card.expectedResult.trim().length > 3),
      advice: 'Укажите конкретный осязаемый результат команды (MVP, репозиторий, документация) (+7..15 б.)',
    },
    successCriteria: {
      max: 15,
      earned: card.successCriteria && card.successCriteria.trim().length > 15 ? 15 : card.successCriteria && card.successCriteria.trim().length > 3 ? 8 : 0,
      present: Boolean(card.successCriteria && card.successCriteria.trim().length > 3),
      advice: 'Добавьте измеримые критерии приемки: метрики, тесты, SLA (+7..15 б.)',
    },
    constraints: {
      max: 10,
      earned: card.constraints && card.constraints.trim().length > 10 ? 10 : card.constraints && card.constraints.trim().length > 2 ? 5 : 0,
      present: Boolean(card.constraints && card.constraints.trim().length > 2),
      advice: 'Укажите сроки, обязательный стек технологий или ограничения доступа (+5..10 б.)',
    },
    targetUsers: {
      max: 10,
      earned: card.targetUsers && card.targetUsers.trim().length > 10 ? 10 : card.targetUsers && card.targetUsers.trim().length > 2 ? 5 : 0,
      present: Boolean(card.targetUsers && card.targetUsers.trim().length > 2),
      advice: 'Уточните, кто является конечным пользователем решения (+5..10 б.)',
    },
    businessContact: {
      max: 10,
      earned: card.businessContact && card.businessContact.trim().length > 5 ? 10 : 0,
      present: Boolean(card.businessContact && card.businessContact.trim().length > 5),
      advice: 'Укажите контактное лицо бизнеса, формат консультаций и регулярность синка (+10 б.)',
    },
  };

  score = Object.values(breakdown).reduce((acc, item) => acc + item.earned, 0);

  // Уровни готовности по ТЗ
  let level: 'draft' | 'working' | 'ready' | 'priority' = 'draft';
  let levelLabel = 'Черновик (требует уточнения)';
  if (score >= 90) {
    level = 'priority';
    levelLabel = 'Приоритетная (высшая позиция в каталоге)';
  } else if (score >= 70) {
    level = 'ready';
    levelLabel = 'Готовая (повышенная позиция)';
  } else if (score >= 40) {
    level = 'working';
    levelLabel = 'Рабочая (доступна для откликов)';
  }

  const missingAdvice = Object.values(breakdown)
    .filter((b) => b.earned < b.max)
    .map((b) => b.advice);

  return { score, level, levelLabel, breakdown, missingAdvice };
}

// 1. Endpoint: Анализ черновика и генерация уточняющих вопросов (Шаг 2 сквозного сценария)
app.post('/api/ai/clarify-task', async (req, res) => {
  try {
    const { draft, companyName } = req.body;

    if (!draft || draft.trim().length < 5) {
      return res.status(400).json({ error: 'Пожалуйста, введите описание черновика задачи' });
    }

    if (ai) {
      const prompt = `
Ты — ИИ-методолог хакатона AI Sana (платформа StartCard.ai).
Бизнес предоставил первоначальный черновик задачи:
Компания: "${companyName || 'Бизнес'}"
Черновик: "${draft}"

Правила хакатона требуют:
1. Задать не менее 3 уместных и конкретных уточняющих вопросов, чтобы заполнить недостающие разделы:
   - Данные и материалы (какие данные или примеры предоставит бизнес)
   - Критерии успеха (как измерить качество решения)
   - Ограничения и стек (сроки, технологии, требования к архитектуре)
   - Конечные пользователи (кто и как будет пользоваться)
2. Не выдумывать факты, которых нет в описании, а задать вопросы человеку.

Верни ответ строго в формате JSON:
{
  "questions": [
    {
      "id": "q1",
      "category": "dataAndMaterials",
      "question": "Текст первого уточняющего вопроса о данных/материалах",
      "placeholder": "Пример ответа..."
    },
    {
      "id": "q2",
      "category": "successCriteria",
      "question": "Текст второго уточняющего вопроса о критериях успеха",
      "placeholder": "Пример ответа..."
    },
    {
      "id": "q3",
      "category": "constraints",
      "question": "Текст третьего уточняющего вопроса о сроках и технологиях",
      "placeholder": "Пример ответа..."
    },
    {
      "id": "q4",
      "category": "targetUsers",
      "question": "Текст четвертого вопроса о пользователях и формате связи",
      "placeholder": "Пример ответа..."
    }
  ]
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.questions && parsed.questions.length >= 3) {
        return res.json({ success: true, questions: parsed.questions, source: 'gemini' });
      }
    }

    // Heuristic fallback matching exact hackathon domains
    const fallbackQuestions = [
      {
        id: 'q1',
        category: 'dataAndMaterials',
        question: 'Какие исходные данные, примеры или API вы готовы предоставить команде для работы?',
        placeholder: 'Например: Тестовый датасет в CSV, доступ к тестовому контуру API или примеры документов',
      },
      {
        id: 'q2',
        category: 'successCriteria',
        question: 'По каким измеримым признакам и метрикам вы оцените успешность решения?',
        placeholder: 'Например: Точность классификации от 90%, время отклика API < 100мс, чистый код по PEP8',
      },
      {
        id: 'q3',
        category: 'constraints',
        question: 'Какие ключевые ограничения (желаемый стек, дедлайн, требования к развертыванию)?',
        placeholder: 'Например: Python / FastAPI, развертывание в Docker-контейнере, срок выполнения — 14 дней',
      },
      {
        id: 'q4',
        category: 'businessContact',
        question: 'Кто будет куратором со стороны бизнеса и в каком формате будет обратная связь?',
        placeholder: 'Например: Тимлид Александр (@alex_tech), еженедельные 20-минутные синки в Telegram/Zoom',
      },
    ];

    return res.json({ success: true, questions: fallbackQuestions, source: 'heuristic' });
  } catch (err: any) {
    console.error('Error in clarify-task:', err);
    return res.status(500).json({ error: err.message || 'Ошибка генерации вопросов' });
  }
});

// 2. Endpoint: Формирование редактируемой карточки из черновика и ответов (Шаг 3 и 4)
app.post('/api/ai/build-card', async (req, res) => {
  try {
    const { draft, answers, companyName } = req.body;

    const baseContext = `${draft}. ` + Object.values(answers || {}).join('. ');

    let generatedCard: any = {
      title: draft && draft.length > 40 ? draft.slice(0, 38) + '...' : draft || 'Новая бизнес-задача',
      context: draft || 'Необходимо автоматизировать процесс решения задачи.',
      targetUsers: answers?.q4 || answers?.targetUsers || 'Сотрудники компании и студенты платформы',
      dataAndMaterials: answers?.q1 || answers?.dataAndMaterials || 'Тестовые наборы данных и документация API',
      expectedResult: 'Рабочий прототип MVP с документацией и инструкцией по развертыванию',
      successCriteria: answers?.q2 || answers?.successCriteria || 'Прохождение приемочных тестов и демонстрация работы',
      constraints: answers?.q3 || answers?.constraints || 'Срок: 14 дней. Чистый код в Git с Dockerfile',
      businessContact: answers?.businessContact || 'Куратор проекта (@tech_lead)',
    };

    if (ai) {
      try {
        const prompt = `
Ты — технический аналитик платформы StartCard.ai (хакатон AI Sana).
На основе черновика задачи и ответов представителя бизнеса сформируй структурированную карточку бизнес-задачи.
ВАЖНО: Согласно правилам хакатона, НЕ добавляй выдуманных фактов, которых пользователь не сообщал!

Компания: "${companyName || 'Технологическая компания'}"
Черновик: "${draft}"
Ответы на уточнения: ${JSON.stringify(answers || {})}

Сформируй карточку строго в JSON:
{
  "title": "Звучное, понятное название задачи (до 7 слов)",
  "shortSummary": "Краткая суть задачи для витрины каталога (1-2 предложения)",
  "context": "Контекст и потребность бизнеса: что происходит и что нужно решить",
  "targetUsers": "Конечные пользователи решения",
  "dataAndMaterials": "Доступные данные, примеры, макеты или источники",
  "expectedResult": "Конкретный ожидаемый результат работы команды",
  "successCriteria": "Измеримые критерии успеха и приёмки",
  "constraints": "Ограничения (сроки, рекомендуемый стек, формат)",
  "businessContact": "Контакт и формат взаимодействия",
  "tags": ["Тег1", "Тег2", "Тег3"],
  "category": "ai",
  "deadlineDays": 14,
  "reward": "70 000 ₽ + оффер"
}
`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        if (parsed.title) {
          generatedCard = { ...generatedCard, ...parsed };
        }
      } catch (e) {
        console.warn('Gemini build-card fallback:', e);
      }
    }

    // Расчет рейтинга готовности по формуле ТЗ
    const ratingData = calculateReadinessScore(generatedCard);

    return res.json({
      success: true,
      card: generatedCard,
      rating: ratingData,
    });
  } catch (err: any) {
    console.error('Error in build-card:', err);
    return res.status(500).json({ error: err.message || 'Ошибка построения карточки' });
  }
});

// Setup Vite middleware in dev or serve dist in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[StartCard.ai] Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
