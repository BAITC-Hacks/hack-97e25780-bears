export const QUESTION_TARGET_FIELDS = [
  'title',
  'industry',
  'context',
  'need',
  'users',
  'data',
  'constraints',
  'expectedResult',
  'successCriteria',
  'contact',
  'interactionFormat',
];

const FALLBACK_QUESTIONS = [
  {
    targetField: 'users',
    text: 'Кто будет пользоваться результатом и в какой ситуации?',
  },
  {
    targetField: 'data',
    text: 'Какие данные или материалы доступны команде?',
  },
  {
    targetField: 'expectedResult',
    text: 'Какой конкретный результат вы ожидаете получить?',
  },
  {
    targetField: 'successCriteria',
    text: 'По каким измеримым признакам вы примете работу?',
  },
  {
    targetField: 'constraints',
    text: 'Какие есть сроки, технические ограничения и ограничения доступа?',
  },
  {
    targetField: 'interactionFormat',
    text: 'Как команда сможет консультироваться с представителем бизнеса?',
  },
];

const questionsSchema = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      minItems: 3,
      maxItems: 7,
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          targetField: { type: 'string', enum: QUESTION_TARGET_FIELDS },
          text: { type: 'string' },
        },
        required: ['id', 'targetField', 'text'],
        additionalProperties: false,
      },
    },
  },
  required: ['questions'],
  additionalProperties: false,
};

function fallbackQuestions(knownFields = {}) {
  const missingFirst = [...FALLBACK_QUESTIONS].sort((left, right) => {
    const leftKnown = String(knownFields[left.targetField] || '').trim() ? 1 : 0;
    const rightKnown = String(knownFields[right.targetField] || '').trim() ? 1 : 0;
    return leftKnown - rightKnown;
  });

  return missingFirst.slice(0, 6).map((question, index) => ({
    id: `fallback-${index + 1}`,
    ...question,
  }));
}

export function validateQuestions(payload) {
  const questions = payload?.questions;
  if (!Array.isArray(questions) || questions.length < 3 || questions.length > 7) return false;

  const ids = new Set();
  return questions.every((question) => {
    const valid =
      question &&
      typeof question.id === 'string' &&
      question.id.trim() &&
      !ids.has(question.id) &&
      QUESTION_TARGET_FIELDS.includes(question.targetField) &&
      typeof question.text === 'string' &&
      question.text.trim();
    ids.add(question?.id);
    return Boolean(valid);
  });
}

function fallbackReason(error) {
  const name = String(error?.name || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();
  if (name.includes('timeout') || message.includes('timeout') || message.includes('timed out')) {
    return 'timeout';
  }
  return 'provider_error';
}

export class QuestionService {
  constructor({ client = null, model = 'gpt-4o-mini', timeoutMs = 10_000 } = {}) {
    this.client = client;
    this.model = model;
    this.timeoutMs = timeoutMs;
  }

  async generate({ draftText, knownFields = {} }) {
    if (!this.client) return this.#fallback(knownFields, 'missing_api_key');

    try {
      const completion = await this.client.chat.completions.create(
        {
          model: this.model,
          temperature: 0.2,
          messages: [
            {
              role: 'system',
              content:
                'Определи недостающие сведения в бизнес-задаче и задай 3–7 коротких уточняющих вопросов. Не добавляй факты и не превращай предположения в ответы пользователя. Верни только JSON по заданной схеме.',
            },
            {
              role: 'user',
              content: JSON.stringify({ draftText, knownFields }),
            },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'clarifying_questions',
              strict: true,
              schema: questionsSchema,
            },
          },
        },
        { timeout: this.timeoutMs },
      );

      const raw = completion.choices?.[0]?.message?.content;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : null;
      if (!validateQuestions(parsed)) return this.#fallback(knownFields, 'invalid_response');

      return { questions: parsed.questions, source: 'ai', fallbackReason: null };
    } catch (error) {
      if (error instanceof SyntaxError) return this.#fallback(knownFields, 'invalid_response');
      return this.#fallback(knownFields, fallbackReason(error));
    }
  }

  #fallback(knownFields, reason) {
    return {
      questions: fallbackQuestions(knownFields),
      source: 'fallback',
      fallbackReason: reason,
    };
  }
}

export const questionServiceInternals = { fallbackQuestions, questionsSchema };
