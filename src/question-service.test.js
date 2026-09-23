import test from 'node:test';
import assert from 'node:assert/strict';
import { QuestionService } from './services/question-service.js';

function clientReturning(content) {
  return {
    chat: {
      completions: {
        create: async () => ({ choices: [{ message: { content } }] }),
      },
    },
  };
}

test('QuestionService uses fallback when the API key is absent', async () => {
  const result = await new QuestionService().generate({ draftText: 'Нужен сервис' });

  assert.equal(result.source, 'fallback');
  assert.equal(result.fallbackReason, 'missing_api_key');
  assert.ok(result.questions.length >= 3);
});

test('QuestionService accepts a valid structured model response', async () => {
  const payload = {
    questions: [
      { id: 'q1', targetField: 'users', text: 'Кто пользователь?' },
      { id: 'q2', targetField: 'data', text: 'Какие есть данные?' },
      { id: 'q3', targetField: 'constraints', text: 'Какие ограничения?' },
    ],
  };
  const service = new QuestionService({ client: clientReturning(JSON.stringify(payload)) });

  const result = await service.generate({ draftText: 'Нужен сервис' });

  assert.equal(result.source, 'ai');
  assert.equal(result.fallbackReason, null);
  assert.deepEqual(result.questions, payload.questions);
});

test('QuestionService falls back on invalid JSON and timeouts', async () => {
  const invalid = new QuestionService({ client: clientReturning('{not-json') });
  const timeout = new QuestionService({
    client: {
      chat: {
        completions: {
          create: async () => {
            const error = new Error('Request timed out');
            error.name = 'APIConnectionTimeoutError';
            throw error;
          },
        },
      },
    },
  });

  assert.equal((await invalid.generate({ draftText: 'Текст' })).fallbackReason, 'invalid_response');
  assert.equal((await timeout.generate({ draftText: 'Текст' })).fallbackReason, 'timeout');
});
