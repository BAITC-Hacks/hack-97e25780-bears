const QUESTION_CATEGORIES = [
  'dataAndMaterials',
  'successCriteria',
  'constraints',
  'businessContact',
  'targetUsers',
  'expectedResult',
];

const QUESTION_TEXT = {
  dataAndMaterials: {
    question: 'Какие исходные данные, примеры или API вы готовы предоставить команде?',
    placeholder: 'Например: обезличенный CSV, документация API или примеры документов',
  },
  successCriteria: {
    question: 'По каким измеримым признакам вы примете результат работы?',
    placeholder: 'Например: время обработки до 5 минут или точность не ниже 85%',
  },
  constraints: {
    question: 'Какие есть сроки, технические ограничения и ограничения доступа?',
    placeholder: 'Например: две недели, тестовый контур, без персональных данных',
  },
  businessContact: {
    question: 'Кто будет консультировать команду и как часто можно получать обратную связь?',
    placeholder: 'Например: куратор, email и два созвона в неделю',
  },
  targetUsers: {
    question: 'Кто будет пользоваться результатом и в какой ситуации?',
    placeholder: 'Опишите основных пользователей и их рабочий процесс',
  },
  expectedResult: {
    question: 'Какой конкретный результат должна передать команда?',
    placeholder: 'Например: веб-прототип, исходный код и инструкция по запуску',
  },
};

const QUESTIONS_SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      minItems: 6,
      maxItems: 6,
      items: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: QUESTION_CATEGORIES },
          question: { type: 'string' },
          placeholder: { type: 'string' },
        },
        required: ['category', 'question', 'placeholder'],
        additionalProperties: false,
      },
    },
  },
  required: ['questions'],
  additionalProperties: false,
};

const FRONTEND_CARD_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    shortSummary: { type: 'string' },
    context: { type: 'string' },
    dataAndMaterials: { type: 'string' },
    expectedResult: { type: 'string' },
    successCriteria: { type: 'string' },
    constraints: { type: 'string' },
    targetUsers: { type: 'string' },
    businessContact: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
    deadlineDays: { type: 'integer', minimum: 1, maximum: 365 },
    reward: { type: 'string' },
  },
  required: [
    'title',
    'shortSummary',
    'context',
    'dataAndMaterials',
    'expectedResult',
    'successCriteria',
    'constraints',
    'targetUsers',
    'businessContact',
    'tags',
    'deadlineDays',
    'reward',
  ],
  additionalProperties: false,
};

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function fallbackQuestions() {
  return QUESTION_CATEGORIES.map((category, index) => ({
    id: `q${index + 1}`,
    category,
    ...QUESTION_TEXT[category],
  }));
}

function normalizeQuestions(payload) {
  const questions = payload?.questions;
  if (!Array.isArray(questions)) return null;
  const byCategory = new Map();
  for (const item of questions) {
    if (
      !item ||
      !QUESTION_CATEGORIES.includes(item.category) ||
      !cleanString(item.question) ||
      typeof item.placeholder !== 'string' ||
      byCategory.has(item.category)
    ) {
      return null;
    }
    byCategory.set(item.category, item);
  }
  if (byCategory.size !== QUESTION_CATEGORIES.length) return null;
  return QUESTION_CATEGORIES.map((category, index) => ({
    id: `q${index + 1}`,
    category,
    question: cleanString(byCategory.get(category).question),
    placeholder: cleanString(byCategory.get(category).placeholder),
  }));
}

function fallbackCard({ draft, answers = {} }) {
  const cleanDraft = cleanString(draft);
  const title = cleanDraft.split(/\s+/).filter(Boolean).slice(0, 7).join(' ');
  return {
    title: title || 'Новая бизнес-задача',
    shortSummary: cleanDraft,
    context: cleanDraft,
    dataAndMaterials: cleanString(answers.q1 || answers.dataAndMaterials),
    successCriteria: cleanString(answers.q2 || answers.successCriteria),
    constraints: cleanString(answers.q3 || answers.constraints),
    businessContact: cleanString(answers.q4 || answers.businessContact),
    targetUsers: cleanString(answers.q5 || answers.targetUsers),
    expectedResult: cleanString(answers.q6 || answers.expectedResult),
    tags: [],
    deadlineDays: 14,
    reward: '',
  };
}

function isValidCard(card) {
  const stringFields = [
    'title',
    'shortSummary',
    'context',
    'dataAndMaterials',
    'expectedResult',
    'successCriteria',
    'constraints',
    'targetUsers',
    'businessContact',
    'reward',
  ];
  return Boolean(
    card &&
      cleanString(card.title) &&
      stringFields.every((field) => typeof card[field] === 'string') &&
      Array.isArray(card.tags) &&
      card.tags.every((tag) => typeof tag === 'string') &&
      Number.isInteger(card.deadlineDays) &&
      card.deadlineDays >= 1 &&
      card.deadlineDays <= 365,
  );
}

function frontendRating(card) {
  const rules = [
    ['context', 20, 30, 8, 10, 'Опишите подробнее бизнес-контекст и потребность.'],
    ['dataAndMaterials', 20, 20, 5, 10, 'Укажите доступные данные, API или материалы.'],
    ['expectedResult', 15, 20, 5, 8, 'Опишите конкретный результат работы команды.'],
    ['successCriteria', 15, 20, 5, 8, 'Добавьте измеримые критерии успеха.'],
    ['constraints', 10, 15, 3, 5, 'Укажите сроки, технологии и ограничения доступа.'],
    ['targetUsers', 10, 12, 3, 5, 'Уточните конечных пользователей решения.'],
    ['businessContact', 10, 5, 5, 0, 'Укажите контакт и формат обратной связи.'],
  ];
  const breakdown = {};
  const missingAdvice = [];
  let score = 0;
  for (const [field, max, fullLength, partialLength, partialScore, advice] of rules) {
    const length = cleanString(card[field]).length;
    const earned = length > fullLength ? max : length > partialLength ? partialScore : 0;
    breakdown[field] = {
      max,
      earned,
      present: length > partialLength,
      advice,
    };
    score += earned;
    if (earned < max) missingAdvice.push(advice);
  }
  score = Math.round(score);
  const level = score >= 90 ? 'priority' : score >= 70 ? 'ready' : score >= 40 ? 'working' : 'draft';
  const labels = {
    draft: 'Черновик (0–39 б.)',
    working: 'Рабочая (40–69 б.)',
    ready: 'Готовая (70–89 б.)',
    priority: 'Приоритетная (90–100 б.)',
  };
  return { score, level, levelLabel: labels[level], breakdown, missingAdvice };
}

function reasonFor(error) {
  const name = String(error?.name || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();
  if (name.includes('abort') || name.includes('timeout') || message.includes('timeout')) return 'timeout';
  if (error instanceof SyntaxError) return 'invalid_response';
  return 'provider_error';
}

export class FrontendAiService {
  constructor({ apiKey = '', model = 'gemini-flash-latest', timeoutMs = 10_000, fetchImpl = globalThis.fetch } = {}) {
    this.apiKey = apiKey.trim();
    this.model = model;
    this.timeoutMs = timeoutMs;
    this.fetchImpl = fetchImpl;
  }

  async clarify({ draft, companyName = '' }) {
    if (!this.apiKey) return this.#questionsFallback('missing_api_key');
    try {
      const payload = await this.#generate(
        [
          'Задай ровно шесть коротких уточняющих вопросов к черновику бизнес-задачи.',
          'Не добавляй факты и не отвечай за пользователя.',
          `Компания: ${cleanString(companyName)}`,
          `Черновик: ${cleanString(draft)}`,
        ].join('\n'),
        QUESTIONS_SCHEMA,
      );
      const questions = normalizeQuestions(payload);
      if (!questions) return this.#questionsFallback('invalid_response');
      return { questions, source: 'gemini', fallbackReason: null };
    } catch (error) {
      return this.#questionsFallback(reasonFor(error));
    }
  }

  async buildCard({ draft, answers = {}, companyName = '' }) {
    const base = fallbackCard({ draft, answers });
    if (!this.apiKey) return this.#cardFallback(base, 'missing_api_key');
    try {
      const card = await this.#generate(
        [
          'Структурируй только сведения, которые сообщил пользователь, в карточку задачи.',
          'Не придумывай данные, контакты, пользователей, сроки, награды, требования или результаты.',
          'Если сведений нет, верни пустую строку или пустой массив. deadlineDays оставь 14 как рекомендацию интерфейса.',
          `Компания: ${cleanString(companyName)}`,
          `Черновик и ответы: ${JSON.stringify({ draft: cleanString(draft), answers })}`,
        ].join('\n'),
        FRONTEND_CARD_SCHEMA,
      );
      if (!isValidCard(card)) return this.#cardFallback(base, 'invalid_response');
      const safeCard = {
        ...card,
        shortSummary: base.shortSummary,
        context: base.context,
        dataAndMaterials: base.dataAndMaterials,
        expectedResult: base.expectedResult,
        successCriteria: base.successCriteria,
        constraints: base.constraints,
        targetUsers: base.targetUsers,
        businessContact: base.businessContact,
        deadlineDays: 14,
        reward: '',
      };
      return { card: safeCard, rating: frontendRating(safeCard), source: 'gemini', fallbackReason: null };
    } catch (error) {
      return this.#cardFallback(base, reasonFor(error));
    }
  }

  async #generate(prompt, schema) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-goog-api-key': this.apiKey },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
              responseSchema: schema,
            },
          }),
        },
      );
      if (!response.ok) throw new Error(`Gemini request failed with status ${response.status}.`);
      const payload = await response.json();
      const parts = payload?.candidates?.[0]?.content?.parts;
      if (!Array.isArray(parts)) throw new SyntaxError('Gemini response has no content.');
      const text = parts.map((part) => (typeof part?.text === 'string' ? part.text : '')).join('');
      if (!text.trim()) throw new SyntaxError('Gemini response is empty.');
      return JSON.parse(text);
    } finally {
      clearTimeout(timeout);
    }
  }

  #questionsFallback(reason) {
    return { questions: fallbackQuestions(), source: 'fallback', fallbackReason: reason };
  }

  #cardFallback(card, reason) {
    return { card, rating: frontendRating(card), source: 'fallback', fallbackReason: reason };
  }
}

export const frontendAiServiceInternals = {
  FRONTEND_CARD_SCHEMA,
  QUESTIONS_SCHEMA,
  fallbackCard,
  fallbackQuestions,
  frontendRating,
  normalizeQuestions,
};
