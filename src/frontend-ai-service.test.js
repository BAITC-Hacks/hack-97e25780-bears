import test from 'node:test';
import assert from 'node:assert/strict';
import { FrontendAiService } from './services/frontend-ai-service.js';

function geminiResponse(payload) {
  return {
    ok: true,
    async json() {
      return {
        candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }],
      };
    },
  };
}

test('FrontendAiService accepts a valid structured Gemini clarification response', async () => {
  let capturedRequest;
  const fetchImpl = async (url, options) => {
    capturedRequest = { url, options };
    return geminiResponse({
      questions: [
        ['dataAndMaterials', 'Data?', 'CSV or API'],
        ['successCriteria', 'Success?', 'A measurable metric'],
        ['constraints', 'Constraints?', 'Time and access'],
        ['businessContact', 'Contact?', 'Email and meeting cadence'],
        ['targetUsers', 'Users?', 'Primary users'],
        ['expectedResult', 'Deliverable?', 'Prototype and documentation'],
      ].map(([category, question, placeholder]) => ({ category, question, placeholder })),
    });
  };
  const service = new FrontendAiService({ apiKey: 'test-key', fetchImpl });
  const result = await service.clarify({ draft: 'A useful business task' });

  assert.equal(result.source, 'gemini');
  assert.equal(result.fallbackReason, null);
  assert.equal(result.questions.length, 6);
  assert.equal(result.questions[0].id, 'q1');
  assert.match(capturedRequest.url, /gemini-flash-latest/);
  assert.equal(capturedRequest.options.headers['X-goog-api-key'], 'test-key');
  assert.equal(JSON.parse(capturedRequest.options.body).generationConfig.responseMimeType, 'application/json');
});

test('FrontendAiService marks an invalid provider response as fallback', async () => {
  const service = new FrontendAiService({
    apiKey: 'test-key',
    fetchImpl: async () => geminiResponse({ questions: [] }),
  });
  const result = await service.clarify({ draft: 'A useful business task' });

  assert.equal(result.source, 'fallback');
  assert.equal(result.fallbackReason, 'invalid_response');
  assert.equal(result.questions.length, 6);
});

test('FrontendAiService marks a timeout as fallback', async () => {
  const fetchImpl = (url, { signal }) =>
    new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => {
        const error = new Error('Request timed out');
        error.name = 'AbortError';
        reject(error);
      });
    });
  const service = new FrontendAiService({ apiKey: 'test-key', timeoutMs: 5, fetchImpl });
  const result = await service.clarify({ draft: 'A useful business task' });

  assert.equal(result.source, 'fallback');
  assert.equal(result.fallbackReason, 'timeout');
});

test('FrontendAiService accepts a valid structured Gemini card response', async () => {
  const card = {
    title: 'Application workflow automation',
    shortSummary: 'Automate application processing.',
    context: 'Operators manually process incoming applications every day.',
    dataAndMaterials: 'An anonymized CSV export and API documentation are available.',
    expectedResult: 'A working web prototype and launch instructions.',
    successCriteria: 'Average processing time is below 5 minutes.',
    constraints: 'Two weeks and a test environment only.',
    targetUsers: 'Admissions operators who process incoming applications.',
    businessContact: 'owner@example.kz and two calls per week.',
    tags: ['web', 'automation'],
    deadlineDays: 14,
    reward: '',
  };
  const service = new FrontendAiService({
    apiKey: 'test-key',
    fetchImpl: async () => geminiResponse(card),
  });
  const result = await service.buildCard({ draft: card.shortSummary, answers: {} });

  assert.equal(result.source, 'gemini');
  assert.equal(result.card.title, card.title);
  assert.equal(result.card.context, card.shortSummary);
  assert.equal(result.card.dataAndMaterials, '');
  assert.equal(result.card.reward, '');
  assert.equal(result.rating.score, 20);
  assert.equal(result.rating.level, 'draft');
});
