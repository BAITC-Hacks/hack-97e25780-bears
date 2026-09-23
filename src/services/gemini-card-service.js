const CARD_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    shortSummary: { type: 'string' },
    fullDescription: { type: 'string' },
    deliverables: { type: 'array', items: { type: 'string' } },
    requirements: { type: 'array', items: { type: 'string' } },
    tags: { type: 'array', items: { type: 'string' } },
    recommendedDeadlineDays: { type: 'integer', minimum: 1, maximum: 365 },
    recommendedReward: { type: 'string' },
    aiAdvice: { type: 'string' },
  },
  required: [
    'title',
    'shortSummary',
    'fullDescription',
    'deliverables',
    'requirements',
    'tags',
    'recommendedDeadlineDays',
    'recommendedReward',
    'aiAdvice',
  ],
  additionalProperties: false,
};

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function fallbackCard(input) {
  const roughDescription = cleanString(input.roughDescription);
  const titleWords = roughDescription.split(/\s+/).filter(Boolean).slice(0, 6).join(' ');
  const category = cleanString(input.category);

  return {
    title: titleWords || 'Новая бизнес-задача',
    shortSummary: roughDescription,
    fullDescription: roughDescription,
    deliverables: [],
    requirements: [],
    tags: category && category !== 'all' ? [category] : [],
    recommendedDeadlineDays: 7,
    recommendedReward: cleanString(input.budgetSuggestion),
    aiAdvice: 'Использован резервный режим. Проверьте карточку и заполните недостающие сведения вручную.',
  };
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function isValidOptimizedCard(card) {
  return Boolean(
    card &&
      typeof card === 'object' &&
      cleanString(card.title) &&
      typeof card.shortSummary === 'string' &&
      typeof card.fullDescription === 'string' &&
      isStringArray(card.deliverables) &&
      isStringArray(card.requirements) &&
      isStringArray(card.tags) &&
      Number.isInteger(card.recommendedDeadlineDays) &&
      card.recommendedDeadlineDays >= 1 &&
      card.recommendedDeadlineDays <= 365 &&
      typeof card.recommendedReward === 'string' &&
      typeof card.aiAdvice === 'string',
  );
}

function parseGeminiResponse(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) throw new SyntaxError('Gemini response has no content parts.');
  const text = parts.map((part) => (typeof part?.text === 'string' ? part.text : '')).join('');
  if (!text.trim()) throw new SyntaxError('Gemini response is empty.');
  return JSON.parse(text);
}

function fallbackReason(error) {
  const name = String(error?.name || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();
  if (name.includes('abort') || name.includes('timeout') || message.includes('timeout')) return 'timeout';
  if (error instanceof SyntaxError) return 'invalid_response';
  return 'provider_error';
}

export class GeminiCardService {
  constructor({
    apiKey = '',
    model = 'gemini-flash-latest',
    timeoutMs = 10_000,
    fetchImpl = globalThis.fetch,
  } = {}) {
    this.apiKey = apiKey.trim();
    this.model = model;
    this.timeoutMs = timeoutMs;
    this.fetchImpl = fetchImpl;
  }

  async optimize(input) {
    if (!this.apiKey) return this.#fallback(input, 'missing_api_key');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': this.apiKey,
          },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: [
                      'Преобразуй введённые бизнесом сведения в карточку студенческой задачи.',
                      'Не добавляй компании, данные, ограничения, требования или результаты, которых нет во входе.',
                      'Если сведений недостаточно, оставляй строки и массивы пустыми. Срок является только рекомендацией.',
                      `Вход: ${JSON.stringify(input)}`,
                    ].join('\n'),
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
              responseSchema: CARD_SCHEMA,
            },
          }),
        },
      );

      if (!response.ok) throw new Error(`Gemini request failed with status ${response.status}.`);
      const card = parseGeminiResponse(await response.json());
      if (!isValidOptimizedCard(card)) return this.#fallback(input, 'invalid_response');
      return { card, source: 'gemini', fallbackReason: null };
    } catch (error) {
      return this.#fallback(input, fallbackReason(error));
    } finally {
      clearTimeout(timeout);
    }
  }

  #fallback(input, reason) {
    return {
      card: fallbackCard(input),
      source: 'fallback',
      fallbackReason: reason,
    };
  }
}

export const geminiCardServiceInternals = { CARD_SCHEMA, fallbackCard, parseGeminiResponse };
