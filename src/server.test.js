import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from './backend-app.js';
import { QuestionService } from './services/question-service.js';
import { MemoryStore } from './storage/memory-store.js';

function testContext() {
  const store = new MemoryStore({
    tasks: [],
    proposals: [],
    teams: [
      {
        id: 'team-1',
        name: 'Team One',
        interests: [],
        skills: [],
        technologies: [],
      },
      {
        id: 'team-2',
        name: 'Team Two',
        interests: [],
        skills: [],
        technologies: [],
      },
    ],
  });
  return {
    store,
    app: createApp({ store, questionService: new QuestionService() }),
  };
}

const completeTask = {
  title: 'Сокращение времени обработки заявок',
  industry: 'Сервисы',
  context: 'Операторы вручную переносят данные между двумя системами и часто допускают задержки.',
  need: 'Нужно сократить ручные операции и быстрее передавать заявку ответственному сотруднику.',
  users: 'Операторы контактного центра, которые ежедневно обрабатывают входящие заявки клиентов.',
  data: 'Доступна обезличенная выгрузка заявок за шесть месяцев в формате CSV.',
  constraints: 'Демо за две недели без доступа к production-системам и персональным данным.',
  expectedResult: 'Веб-прототип маршрутизации заявок и панель с основными показателями процесса.',
  successCriteria: 'Среднее время обработки тестовой заявки должно снизиться на 30%.',
  contact: 'owner@example.kz',
  interactionFormat: 'Две консультации в неделю и ответы на вопросы в рабочем чате.',
};

async function createPublishedTask(app) {
  const created = await request(app).post('/api/tasks').send({ draftText: 'Нужно ускорить заявки' });
  const taskId = created.body.task.id;
  await request(app).patch(`/api/tasks/${taskId}`).send(completeTask).expect(200);
  await request(app).post(`/api/tasks/${taskId}/confirm`).expect(200);
  const published = await request(app).post(`/api/tasks/${taskId}/publish`).expect(200);
  return published.body.task;
}

test('GET /health exposes runtime capabilities', async () => {
  const { app } = testContext();
  const response = await request(app).get('/health').expect(200);

  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.storage, 'memory');
  assert.equal(response.body.aiConfigured, false);
});

test('clarifications remain available without an API key', async () => {
  const { app } = testContext();
  const response = await request(app)
    .post('/api/clarifications')
    .send({ draftText: 'Нужен помощник для первокурсников' })
    .expect(200);

  assert.equal(response.body.source, 'fallback');
  assert.equal(response.body.fallbackReason, 'missing_api_key');
  assert.ok(response.body.questions.length >= 3);
});

test('frontend compatibility endpoint returns an explicitly labelled fallback card', async () => {
  const { app } = testContext();
  const response = await request(app)
    .post('/api/ai/optimize-task')
    .send({
      roughDescription: 'Нужен сервис для обработки заявок студентов',
      companyName: 'AI Sana',
      category: 'ai',
      targetLevel: 'Junior',
      budgetSuggestion: 'Стажировка',
    })
    .expect(200);

  assert.equal(response.body.success, true);
  assert.equal(response.body.source, 'fallback');
  assert.equal(response.body.fallbackReason, 'missing_api_key');
  assert.equal(response.body.card.shortSummary, 'Нужен сервис для обработки заявок студентов');
});

test('frontend compatibility endpoint rejects an empty task description', async () => {
  const { app } = testContext();
  const response = await request(app)
    .post('/api/ai/optimize-task')
    .send({ roughDescription: '   ' })
    .expect(400);

  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
});

test('active frontend receives labelled clarification fallback without a Gemini key', async () => {
  const { app } = testContext();
  const response = await request(app)
    .post('/api/ai/clarify-task')
    .send({ draft: 'Automate processing of student applications', companyName: 'Demo Company' })
    .expect(200);

  assert.equal(response.body.success, true);
  assert.equal(response.body.source, 'fallback');
  assert.equal(response.body.fallbackReason, 'missing_api_key');
  assert.equal(response.body.questions.length, 6);
  assert.deepEqual(
    response.body.questions.map((question) => question.id),
    ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'],
  );
});

test('active frontend card endpoint transfers only the supplied draft and answers', async () => {
  const { app } = testContext();
  const answers = {
    q1: 'An anonymized CSV export is available.',
    q2: 'Processing time must fall below 5 minutes.',
    q3: 'Two weeks, test environment only.',
    q4: 'owner@example.kz, two calls per week.',
    q5: 'Admissions operators.',
    q6: 'A web prototype and launch instructions.',
  };
  const response = await request(app)
    .post('/api/ai/build-card')
    .send({
      draft: 'Automate processing of student applications',
      companyName: 'Demo Company',
      answers,
    })
    .expect(200);

  assert.equal(response.body.success, true);
  assert.equal(response.body.source, 'fallback');
  assert.equal(response.body.fallbackReason, 'missing_api_key');
  assert.equal(response.body.card.context, 'Automate processing of student applications');
  assert.equal(response.body.card.dataAndMaterials, answers.q1);
  assert.equal(response.body.card.successCriteria, answers.q2);
  assert.equal(response.body.card.constraints, answers.q3);
  assert.equal(response.body.card.businessContact, answers.q4);
  assert.equal(response.body.card.targetUsers, answers.q5);
  assert.equal(response.body.card.expectedResult, answers.q6);
  assert.deepEqual(response.body.card.tags, []);
  assert.equal(response.body.card.reward, '');
  assert.equal(typeof response.body.rating.score, 'number');
  assert.equal(response.body.rating.breakdown.context.max, 20);
});

test('active frontend AI endpoints validate their request body', async () => {
  const { app } = testContext();
  const emptyDraft = await request(app)
    .post('/api/ai/clarify-task')
    .send({ draft: '   ' })
    .expect(400);
  const invalidAnswers = await request(app)
    .post('/api/ai/build-card')
    .send({ draft: 'A valid draft', answers: ['not', 'an', 'object'] })
    .expect(400);

  assert.equal(emptyDraft.body.error.code, 'VALIDATION_ERROR');
  assert.equal(invalidAnswers.body.error.code, 'VALIDATION_ERROR');
});

test('task can be edited, confirmed, published and returned in the catalog', async () => {
  const { app } = testContext();
  const published = await createPublishedTask(app);
  const catalog = await request(app).get('/api/tasks').expect(200);

  assert.equal(published.status, 'published');
  assert.equal(published.rating.score, 100);
  assert.equal(catalog.body.total, 1);
  assert.equal(catalog.body.items[0].id, published.id);
});

test('publication rejects missing required fields even after confirmation', async () => {
  const { app } = testContext();
  const created = await request(app).post('/api/tasks').send({ draftText: 'Короткий черновик' });
  const taskId = created.body.task.id;
  await request(app).post(`/api/tasks/${taskId}/confirm`).expect(200);
  const response = await request(app).post(`/api/tasks/${taskId}/publish`).expect(422);

  assert.equal(response.body.error.code, 'PUBLICATION_REQUIREMENTS_NOT_MET');
  assert.deepEqual(response.body.error.details.missing, ['title', 'contextOrNeed', 'contact']);
});

test('student teams submit proposals and business manually accepts several', async () => {
  const { app } = testContext();
  const task = await createPublishedTask(app);
  const proposalIds = [];

  for (const teamId of ['team-1', 'team-2']) {
    const response = await request(app)
      .post(`/api/tasks/${task.id}/proposals`)
      .send({
        teamId,
        solutionIdea: 'Автоматизировать маршрутизацию заявок по правилам.',
        plan: 'Исследовать данные, собрать прототип и проверить метрики.',
        duration: '2 недели',
        prototypeUrl: '',
      })
      .expect(201);
    proposalIds.push(response.body.proposal.id);
  }

  const selection = await request(app)
    .post(`/api/tasks/${task.id}/selection`)
    .send({ action: 'accept', proposalIds })
    .expect(200);

  assert.equal(selection.body.task.status, 'in_selection');
  assert.equal(selection.body.task.selectionOutcome, 'selected');
  assert.deepEqual(
    selection.body.proposals.map((proposal) => proposal.status),
    ['accepted', 'accepted'],
  );

  const closed = await request(app)
    .post(`/api/tasks/${task.id}/selection`)
    .send({ action: 'close' })
    .expect(200);
  assert.equal(closed.body.task.status, 'closed');
  assert.equal(closed.body.task.selectionOutcome, 'selected');
});

test('business can close selection without choosing a team', async () => {
  const { app } = testContext();
  const task = await createPublishedTask(app);
  const submitted = await request(app)
    .post(`/api/tasks/${task.id}/proposals`)
    .send({
      teamId: 'team-1',
      solutionIdea: 'Собрать прототип маршрутизации.',
      plan: 'Проверить данные и реализовать основной сценарий.',
      duration: '1 неделя',
      prototypeUrl: '',
    })
    .expect(201);

  const closed = await request(app)
    .post(`/api/tasks/${task.id}/selection`)
    .send({ action: 'close' })
    .expect(200);

  assert.equal(closed.body.task.status, 'closed');
  assert.equal(closed.body.task.selectionOutcome, 'no_selection');
  assert.equal(closed.body.proposals[0].id, submitted.body.proposal.id);
  assert.equal(closed.body.proposals[0].status, 'rejected');
});
