import test from 'node:test';
import assert from 'node:assert/strict';
import { GeminiCardService } from './services/gemini-card-service.js';

const input = {
  roughDescription: 'Нужен сервис для обработки заявок студентов',
  companyName: 'AI Sana',
  category: 'ai',
  targetLevel: 'Junior',
  budgetSuggestion: 'Стажировка',
};

const modelCard = {
  title: 'Обработка студенческих заявок',
  shortSummary: input.roughDescription,
  fullDescription: input.roughDescription,
  deliverables: [],
  requirements: [],
  tags: ['ai'],
  recommendedDeadlineDays: 7,
  recommendedReward: 'Стажировка',
  aiAdvice: 'Уточните критерии приёмки.',
};

function responseWithCard(card) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: JSON.stringify(card) }] } }],
    }),
  };
}

test('GeminiCardService clearly labels missing-key fallback', async () => {
  const result = await new GeminiCardService().optimize(input);

  assert.equal(result.source, 'fallback');
  assert.equal(result.fallbackReason, 'missing_api_key');
  assert.equal(result.card.shortSummary, input.roughDescription);
  assert.deepEqual(result.card.deliverables, []);
});

test('GeminiCardService parses a mocked provider response without a network call', async () => {
  let requestedUrl = '';
  let requestOptions;
  const service = new GeminiCardService({
    apiKey: 'test-key',
    model: 'gemini-flash-latest',
    fetchImpl: async (url, options) => {
      requestedUrl = url;
      requestOptions = options;
      return responseWithCard(modelCard);
    },
  });

  const result = await service.optimize(input);

  assert.equal(result.source, 'gemini');
  assert.equal(result.fallbackReason, null);
  assert.deepEqual(result.card, modelCard);
  assert.match(requestedUrl, /gemini-flash-latest:generateContent$/);
  assert.equal(requestOptions.headers['X-goog-api-key'], 'test-key');
});

test('GeminiCardService falls back on invalid data and timeout errors', async () => {
  const invalid = new GeminiCardService({
    apiKey: 'test-key',
    fetchImpl: async () => responseWithCard({ title: 'Неполная карточка' }),
  });
  const timeout = new GeminiCardService({
    apiKey: 'test-key',
    fetchImpl: async () => {
      const error = new Error('Request timeout');
      error.name = 'AbortError';
      throw error;
    },
  });

  assert.equal((await invalid.optimize(input)).fallbackReason, 'invalid_response');
  assert.equal((await timeout.optimize(input)).fallbackReason, 'timeout');
});
