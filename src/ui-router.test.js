import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from './backend-app.js';
import { calculateRating } from './domain/rating.js';
import { frontendAiServiceInternals } from './services/frontend-ai-service.js';
import { MemoryStore } from './storage/memory-store.js';

const sampleCard = {
  title: 'Прогноз очередей в кампусе', company: 'Тестовая компания',
  context: 'Посетители столовой не знают ожидаемое время в очереди и регулярно опаздывают.',
  shortSummary: 'Нужен прогноз времени ожидания.',
  dataAndMaterials: 'Обезличенные чеки за шесть месяцев в CSV.',
  expectedResult: 'Веб-прототип и инструкция запуска.',
  successCriteria: 'Ожидание снижается с 12 до 7 минут.',
  constraints: 'Две недели, работа только в тестовом контуре.',
  targetUsers: 'Студенты и сотрудники кампуса.',
  businessContact: 'owner@example.kz, консультации по вторникам',
  category: 'analytics', brandColor: '#F59E0B', logoType: 'custom',
  deadlineDays: 14, reward: '', tags: ['CSV'], aiGenerated: false,
};

function context() {
  const store = new MemoryStore({ tasks: [], proposals: [], teams: [] });
  return { store, app: createApp({ store }) };
}

async function publish(app, overrides = {}) {
  const result = await request(app).post('/api/ui/cards').send({ card: { ...sampleCard, ...overrides } }).expect(201);
  return result.body.card;
}

function proposalFor(card, overrides = {}) {
  return {
    cardId: card.id, teamName: 'Campus Team', leaderName: 'Demo Student', studentId: 'student-demo',
    solutionIdea: 'Спрогнозировать ожидание по истории чеков.',
    workPlan: 'Изучить CSV, собрать модель, проверить результат.',
    proposedDeadline: '14 дней', prototypeLink: '', avatar: '', telegram: '@demo',
    ...overrides,
  };
}

test('UI publication assigns identity and rating, preserves inputs and shares generic storage', async () => {
  const { app, store } = context();
  const card = await publish(app, { id: 'forged', readinessScore: -100, applicantsCount: 99 });
  assert.notEqual(card.id, 'forged');
  assert.match(card.id, /^task-/);
  assert.equal(card.readinessScore, frontendAiServiceInternals.frontendRating(sampleCard).score);
  assert.equal(card.applicantsCount, 0);
  assert.equal(card.reward, '');
  assert.equal(card.businessContact, sampleCard.businessContact);
  assert.equal(card.company, sampleCard.company);
  assert.deepEqual(card.tags, sampleCard.tags);
  const canonical = store.getTask(card.id);
  assert.equal(canonical.status, 'published');
  assert.deepEqual(canonical.rating, calculateRating(canonical));
  const generic = await request(app).get(`/api/tasks/${card.id}`).expect(200);
  assert.equal(generic.body.task.data, sampleCard.dataAndMaterials);
  const secondClient = await request(app).get('/api/ui/state').expect(200);
  assert.deepEqual(secondClient.body.cards, [card]);
});

test('UI proposals and manual selection survive fresh requests without fake awards', async () => {
  const { app, store } = context();
  const card = await publish(app);
  const created = await request(app).post('/api/ui/proposals').send({
    proposal: proposalFor(card, { id: 'forged', status: 'accepted', awardedScore: 85 }),
  }).expect(201);
  const proposal = created.body.proposal;
  assert.match(proposal.id, /^proposal-/);
  assert.equal(proposal.status, 'pending');
  assert.equal(proposal.awardedScore, undefined);
  assert.equal(proposal.cardTitle, card.title);
  assert.equal(proposal.prototypeLink, '');
  const selected = await request(app).post(`/api/ui/proposals/${proposal.id}/selection`)
    .send({ action: 'accept' }).expect(200);
  assert.equal(selected.body.proposal.status, 'accepted');
  assert.equal(selected.body.proposal.awardedScore, undefined);
  // A new client/app reading the same server store sees the full persisted shapes.
  const freshClient = request(createApp({ store }));
  const state = await freshClient.get('/api/ui/state').expect(200);
  assert.equal(state.body.proposals[0].status, 'accepted');
  assert.equal(state.body.proposals[0].teamName, 'Campus Team');
  assert.equal(state.body.cards[0].applicantsCount, 1);
  assert.equal(store.getTask(card.id).selectionOutcome, 'selected');
  await request(app).post(`/api/ui/proposals/${proposal.id}/selection`)
    .send({ action: 'reject' }).expect(409);
});

test('UI accepts several different teams and rejects invalid, duplicate or closed proposals', async () => {
  const { app, store } = context();
  const card = await publish(app);
  const ids = [];
  for (const studentId of ['student-a', 'student-b']) {
    const created = await request(app).post('/api/ui/proposals')
      .send({ proposal: proposalFor(card, { studentId }) }).expect(201);
    ids.push(created.body.proposal.id);
  }
  await request(app).post('/api/ui/proposals')
    .send({ proposal: proposalFor(card, { studentId: 'student-a' }) }).expect(409);
  for (const id of ids) {
    await request(app).post(`/api/ui/proposals/${id}/selection`).send({ action: 'accept' }).expect(200);
  }
  assert.equal(store.listProposals(card.id).filter((item) => item.status === 'accepted').length, 2);
  store.updateTask(card.id, { status: 'closed' });
  await request(app).post('/api/ui/proposals')
    .send({ proposal: proposalFor(card, { studentId: 'student-c' }) }).expect(409);
  await request(app).post(`/api/ui/proposals/${ids[0]}/selection`).send({ action: 'reject' }).expect(409);
});

test('UI rejects missing fields, unsafe URLs and invalid selections before mutating storage', async () => {
  const { app, store } = context();
  await request(app).post('/api/ui/cards').send({ card: { ...sampleCard, title: ' ' } }).expect(400);
  await request(app).post('/api/ui/cards').send({ card: { ...sampleCard, tags: [10] } }).expect(400);
  await request(app).post('/api/ui/cards').send({ card: { ...sampleCard, deadlineDays: 0 } }).expect(400);
  assert.equal(store.listCatalog().length, 0);
  const card = await publish(app);
  await request(app).post('/api/ui/proposals')
    .send({ proposal: proposalFor(card, { solutionIdea: '' }) }).expect(400);
  await request(app).post('/api/ui/proposals')
    .send({ proposal: proposalFor(card, { prototypeLink: 'javascript:alert(1)' }) }).expect(400);
  await request(app).post('/api/ui/proposals')
    .send({ proposal: proposalFor(card, { cardId: 'missing' }) }).expect(404);
  assert.equal(store.listProposals(card.id).length, 0);
  await request(app).post('/api/ui/proposals/missing/selection').send({ action: 'promote' }).expect(400);
  await request(app).post('/api/ui/proposals/missing/selection').send({ action: 'accept' }).expect(404);
});

test('a fresh server memory store resets UI records; generic task validation remains unchanged', async () => {
  const { app } = context();
  await publish(app);
  const restarted = context();
  const state = await request(restarted.app).get('/api/ui/state').expect(200);
  assert.deepEqual(state.body, { cards: [], proposals: [] });
  const draft = await request(app).post('/api/tasks').send({
    draftText: 'A generic task', title: 'Task', context: 'Context', contact: '@telegram-only',
  }).expect(201);
  await request(app).post(`/api/tasks/${draft.body.task.id}/confirm`).expect(200);
  await request(app).post(`/api/tasks/${draft.body.task.id}/publish`).expect(422);
});
