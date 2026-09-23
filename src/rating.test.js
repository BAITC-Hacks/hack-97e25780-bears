import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRating, ratingInternals } from './domain/rating.js';

test('calculateRating follows the agreed seven-category formula', () => {
  const card = {
    context: 'Коротко',
    need: 'Нужно подробно описать изменение в рабочем процессе компании и ожидаемый эффект.',
    data: '',
    expectedResult: 'Прототип',
    successCriteria: 'Снизить время обработки до 5 минут',
    constraints: 'Две недели',
    users: 'Операторы',
    contact: 'business@example.kz',
    interactionFormat: '',
  };

  const rating = calculateRating(card);

  assert.equal(rating.score, 53);
  assert.equal(rating.level, 'working');
  assert.deepEqual(rating.breakdown, {
    contextAndNeed: 15,
    dataAndMaterials: 0,
    expectedResult: 7.5,
    successCriteria: 15,
    constraints: 5,
    users: 5,
    businessConnection: 5,
  });
  assert.deepEqual(rating.missing, ['data', 'interactionFormat']);
  assert.match(rating.suggestions[0], /данные/i);
});

test('rating levels change at the documented boundaries', () => {
  assert.equal(ratingInternals.ratingLevel(39), 'draft');
  assert.equal(ratingInternals.ratingLevel(40), 'working');
  assert.equal(ratingInternals.ratingLevel(69), 'working');
  assert.equal(ratingInternals.ratingLevel(70), 'ready');
  assert.equal(ratingInternals.ratingLevel(89), 'ready');
  assert.equal(ratingInternals.ratingLevel(90), 'priority');
});

test('contact accepts an email or phone and rejects arbitrary text', () => {
  assert.equal(ratingInternals.contactCoefficient('team@example.kz'), 1);
  assert.equal(ratingInternals.contactCoefficient('+7 (777) 123-45-67'), 1);
  assert.equal(ratingInternals.contactCoefficient('позвоните директору'), 0.5);
});
