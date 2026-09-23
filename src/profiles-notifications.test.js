import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import request from 'supertest';
import { createApp } from './backend-app.js';
import { appDemoSeed } from './profile-seed.js';
import { MemoryStore } from './storage/memory-store.js';
import { FileStore } from './storage/file-store.js';

function temporaryDirectory(t, prefix) {
  const directory = mkdtempSync(join(tmpdir(), prefix));
  t.after(() => {
    const target = resolve(directory);
    if (dirname(target) !== resolve(tmpdir()) || !basename(target).startsWith(prefix)) {
      throw new Error('Refusing to clean an unexpected test directory.');
    }
    rmSync(target, { recursive: true, force: true });
  });
  return directory;
}

function context() {
  const store = new MemoryStore(appDemoSeed);
  return { store, app: createApp({ store }) };
}

async function profile(app, role, name) {
  const response = await request(app).post('/api/ui/profiles').send({ profile: {
    role, name, ...(role === 'student' ? { teamName: `${name} Team` } : { company: `${name} Company` }),
  } }).expect(201);
  return response.body.profile;
}

async function card(app, profileId = 'demo-business') {
  const response = await request(app).post('/api/ui/cards').send({ profileId, card: {
    title: 'Тестовая задача', context: 'Нужно сократить время ожидания.', businessContact: 'owner@example.com',
  } }).expect(201);
  return response.body.card;
}

async function propose(app, cardId, profileId = 'demo-student', overrides = {}) {
  const response = await request(app).post('/api/ui/proposals').send({ profileId, proposal: {
    cardId, solutionIdea: 'Прогноз очередей', workPlan: 'Изучить данные и собрать прототип', proposedDeadline: '14 дней',
    ...overrides,
  } }).expect(201);
  return response.body.proposal;
}

async function state(app, profileId) {
  const response = await request(app).get('/api/ui/state').query({ profileId }).expect(200);
  return response.body;
}

test('both profile roles can be created and edited with stable server identity and validated fields', async () => {
  const { app } = context();
  const student = await profile(app, 'student', 'Алия');
  const business = await profile(app, 'business', 'Сауле');
  assert.match(student.id, /^profile-/);
  assert.notEqual(student.id, business.id);
  assert.equal(student.rating, 0);
  assert.equal(business.verified, false);
  const edited = await request(app).patch(`/api/ui/profiles/${student.id}`).send({ profile: {
    name: 'Алия Т.', university: 'Тестовый университет', skills: [' React ', 'React', 'Node.js'],
    github: 'https://github.com/example',
  } }).expect(200);
  assert.equal(edited.body.profile.id, student.id);
  assert.equal(edited.body.profile.teamName, student.teamName);
  assert.deepEqual(edited.body.profile.skills, ['React', 'Node.js']);
  await request(app).patch(`/api/ui/profiles/${business.id}`).send({ profile: {
    company: 'Новое название', roleTitle: 'Куратор',
  } }).expect(200);
  for (const patch of [{ id: 'replacement' }, { role: 'business' }, { rating: 99 }, { name: ' ' },
    { github: 'javascript:alert(1)' }, { skills: [42] }, {}]) {
    await request(app).patch(`/api/ui/profiles/${student.id}`).send({ profile: patch }).expect(400);
  }
  await request(app).post('/api/ui/profiles').send({ profile: { role: 'student', name: 'No team' } }).expect(400);
  await request(app).post('/api/ui/profiles').send({ profile: { role: 'admin', name: 'No role' } }).expect(400);
  const all = await request(createApp()).get('/api/ui/profiles').expect(200);
  assert.deepEqual(all.body.profiles.map((item) => item.id), ['demo-student', 'demo-business']);
  const saved = await request(app).get('/api/ui/profiles').expect(200);
  assert.equal(saved.body.profiles.find((item) => item.id === business.id).company, 'Новое название');
});

test('profile-scoped state and mutations separate owners and students, deriving identity on the server', async () => {
  const { app, store } = context();
  const otherStudent = await profile(app, 'student', 'Other student');
  const otherBusiness = await profile(app, 'business', 'Other business');
  const published = await card(app);
  assert.equal(published.businessId, 'demo-business');
  const proposal = await propose(app, published.id, 'demo-student', {
    studentId: otherStudent.id, leaderName: 'Forged identity', avatar: 'javascript:bad', teamName: 'Campus Team', telegram: '@proposal_contact',
  });
  assert.equal(proposal.studentId, 'demo-student');
  assert.equal(proposal.leaderName, 'Демо-студент');
  assert.equal(proposal.avatar, '');
  assert.equal(proposal.teamName, 'Campus Team');
  assert.equal(proposal.telegram, '@proposal_contact');
  for (const id of [otherStudent.id, otherBusiness.id]) {
    const unrelated = await state(app, id);
    assert.equal(unrelated.cards.length, 2);
    assert.equal(unrelated.cards.find((item) => item.id === published.id).hasApplied, false);
    assert.deepEqual(unrelated.proposals, []);
    assert.deepEqual(unrelated.notifications, []);
  }
  assert.equal((await state(app, 'demo-student')).cards.find((item) => item.id === published.id).hasApplied, true);
  assert.equal((await state(app, 'demo-business')).proposals.length, 1);
  const publicState = await request(app).get('/api/ui/state').expect(200);
  assert.deepEqual(publicState.body.proposals, []);
  await request(app).get('/api/ui/state?profileId=missing').expect(404);
  await request(app).post('/api/ui/cards').send({ card: {} }).expect(400);
  await request(app).post('/api/ui/cards').send({ profileId: 'demo-student', card: {} }).expect(403);
  await request(app).post('/api/ui/proposals').send({ profileId: 'demo-business', proposal: {} }).expect(403);
  await request(app).post(`/api/ui/proposals/${proposal.id}/selection`)
    .send({ profileId: otherBusiness.id, action: 'accept' }).expect(403);
  assert.equal(store.getProposal(proposal.id).status, 'submitted');
  await request(app).patch('/api/ui/profiles/demo-student').send({ profile: { name: 'Edited student', telegram: '@new_profile_contact' } }).expect(200);
  await request(app).post('/api/ui/proposals').send({ profileId: 'demo-student', proposal: {
    cardId: published.id, solutionIdea: 'Repeated', workPlan: 'Repeated', proposedDeadline: '1 day',
  } }).expect(409);
  assert.equal((await state(app, 'demo-business')).proposals[0].leaderName, 'Edited student');
  assert.equal((await state(app, 'demo-business')).proposals[0].telegram, '@proposal_contact');
});

test('new proposal and both decisions notify only the recipient; reading is idempotent and profile scoped', async () => {
  const { app } = context();
  const another = await profile(app, 'student', 'Second team');
  const published = await card(app);
  const first = await propose(app, published.id);
  const second = await propose(app, published.id, another.id);
  let businessState = await state(app, 'demo-business');
  assert.equal(businessState.unreadCount, 2);
  assert.equal(businessState.notifications[0].type, 'new_proposal');
  assert.equal((await state(app, 'demo-student')).unreadCount, 0);
  const notification = businessState.notifications[0];
  await request(app).patch(`/api/ui/notifications/${notification.id}`)
    .send({ profileId: 'demo-student', read: true }).expect(404);
  await request(app).patch(`/api/ui/notifications/${notification.id}`)
    .send({ profileId: 'demo-business', read: false }).expect(400);
  const read = await request(app).patch(`/api/ui/notifications/${notification.id}`)
    .send({ profileId: 'demo-business', read: true }).expect(200);
  const reread = await request(app).patch(`/api/ui/notifications/${notification.id}`)
    .send({ profileId: 'demo-business', read: true }).expect(200);
  assert.equal(read.body.notification.readAt, reread.body.notification.readAt);
  assert.equal((await state(app, 'demo-business')).unreadCount, 1);
  await request(app).post(`/api/ui/proposals/${first.id}/selection`)
    .send({ profileId: 'demo-business', action: 'accept' }).expect(200);
  await request(app).post(`/api/ui/proposals/${second.id}/selection`)
    .send({ profileId: 'demo-business', action: 'reject' }).expect(200);
  await request(app).post(`/api/ui/proposals/${first.id}/selection`)
    .send({ profileId: 'demo-business', action: 'accept' }).expect(409);
  const firstState = await state(app, 'demo-student');
  assert.equal(firstState.notifications.length, 1);
  assert.equal(firstState.notifications[0].type, 'proposal_accepted');
  assert.equal((await state(app, another.id)).notifications[0].type, 'proposal_rejected');
  await request(app).post('/api/ui/notifications/read-all').send({ profileId: 'demo-business' }).expect(200);
  businessState = await state(app, 'demo-business');
  assert.equal(businessState.unreadCount, 0);
  assert.ok(businessState.notifications.every((item) => item.readAt));
  assert.equal((await state(app, 'demo-student')).unreadCount, 1);
});

test('disk restart restores profiles, UI metadata, proposals, decisions and notification read flags', async (t) => {
  const directory = temporaryDirectory(t, 'startcard-persistence-');
  const filePath = join(directory, 'state.json');
  const app = createApp({ store: new FileStore(filePath, appDemoSeed) });
  const student = await profile(app, 'student', 'Persistent Student');
  const business = await profile(app, 'business', 'Persistent Business');
  await request(app).patch(`/api/ui/profiles/${student.id}`)
    .send({ profile: { university: 'Saved university' } }).expect(200);
  const published = await card(app, business.id);
  const proposal = await propose(app, published.id, student.id);
  await request(app).post(`/api/ui/proposals/${proposal.id}/selection`)
    .send({ profileId: business.id, action: 'reject' }).expect(200);
  await request(app).post('/api/ui/notifications/read-all').send({ profileId: business.id }).expect(200);
  const beforeStudent = await state(app, student.id);
  const beforeBusiness = await state(app, business.id);
  const restarted = createApp({ store: new FileStore(filePath, { tasks: [], profiles: [] }) });
  assert.deepEqual(await state(restarted, student.id), beforeStudent);
  assert.deepEqual(await state(restarted, business.id), beforeBusiness);
  const profiles = await request(restarted).get('/api/ui/profiles').expect(200);
  assert.equal(profiles.body.profiles.find((item) => item.id === student.id).university, 'Saved university');
  assert.equal(profiles.body.profiles.find((item) => item.id === business.id).activeCardsCount, 1);
  const health = await request(restarted).get('/health').expect(200);
  assert.equal(health.body.storage, 'file');
});

test('failed disk replacement rolls back a whole operation and corrupt files are never silently reset', async (t) => {
  const directory = temporaryDirectory(t, 'startcard-storage-failure-');
  const filePath = join(directory, 'state.json');
  const store = new FileStore(filePath, appDemoSeed);
  const app = createApp({ store });
  const diskBefore = readFileSync(filePath, 'utf8');
  const memoryBefore = store.snapshot();
  // Replacing a directory with a file fails on Windows and POSIX.
  store.filePath = directory;
  const log = t.mock.method(console, 'error', () => {});
  await request(app).post('/api/ui/proposals').send({ profileId: 'demo-student', proposal: {
    cardId: 'task-demo', solutionIdea: 'Idea', workPlan: 'Plan', proposedDeadline: '14 days',
  } }).expect(500);
  assert.equal(log.mock.calls.length, 1);
  assert.deepEqual(store.snapshot(), memoryBefore);
  assert.equal(readFileSync(filePath, 'utf8'), diskBefore);
  const corruptPath = join(directory, 'corrupt.json');
  for (const contents of ['{broken', JSON.stringify({ version: 99 }), JSON.stringify({ version: 1, tasks: [] })]) {
    writeFileSync(corruptPath, contents);
    assert.throws(() => new FileStore(corruptPath, appDemoSeed), /file was not changed/);
    assert.equal(readFileSync(corruptPath, 'utf8'), contents);
  }
});

test('legacy generic records are not silently assigned to the demo business', async () => {
  const { app, store } = context();
  const legacy = store.createTask({ title: 'Legacy', context: 'Old task' });
  store.updateTask(legacy.id, { status: 'published' });
  const ownerState = await state(app, 'demo-business');
  assert.equal(ownerState.cards.find((item) => item.id === legacy.id).businessId, undefined);
  assert.equal(ownerState.cards.find((item) => item.id === 'task-demo').businessId, 'demo-business');
});
