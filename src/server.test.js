import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from './server.js';

test('GET /health returns ok', async () => {
  const response = await request(app).get('/health');

  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.service, 'hack-97e25780-bears');
});

test('POST /api/recommend-tasks returns 503 when API key is missing', async () => {
  const response = await request(app).post('/api/recommend-tasks').send({
    businessProblem: 'Need to improve application onboarding',
    taskCount: 2,
  });

  assert.equal(response.status, 503);
  assert.match(response.body.error, /OPENAI_API_KEY/i);
});
