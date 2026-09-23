const FIELD_RULES = [
  {
    field: 'context',
    category: 'contextAndNeed',
    weight: 10,
    suggestion: 'Подробно опишите текущую ситуацию и проблему.',
  },
  {
    field: 'need',
    category: 'contextAndNeed',
    weight: 10,
    suggestion: 'Уточните потребность бизнеса и ожидаемое изменение.',
  },
  {
    field: 'data',
    category: 'dataAndMaterials',
    weight: 20,
    suggestion: 'Перечислите доступные данные, материалы и их формат.',
  },
  {
    field: 'expectedResult',
    category: 'expectedResult',
    weight: 15,
    suggestion: 'Опишите конкретный результат работы команды.',
  },
  {
    field: 'successCriteria',
    category: 'successCriteria',
    weight: 15,
    suggestion: 'Добавьте измеримое значение к критериям успеха.',
    coefficient: successCriteriaCoefficient,
  },
  {
    field: 'constraints',
    category: 'constraints',
    weight: 10,
    suggestion: 'Уточните сроки, технологии и ограничения доступа.',
  },
  {
    field: 'users',
    category: 'users',
    weight: 10,
    suggestion: 'Подробно опишите пользователей и их рабочий процесс.',
  },
  {
    field: 'contact',
    category: 'businessConnection',
    weight: 5,
    suggestion: 'Укажите корректный email или телефон представителя бизнеса.',
    coefficient: contactCoefficient,
  },
  {
    field: 'interactionFormat',
    category: 'businessConnection',
    weight: 5,
    suggestion: 'Опишите регулярность и канал консультаций с бизнесом.',
  },
];

const BREAKDOWN_KEYS = [
  'contextAndNeed',
  'dataAndMaterials',
  'expectedResult',
  'successCriteria',
  'constraints',
  'users',
  'businessConnection',
];

function normalized(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function textCoefficient(value) {
  const length = normalized(value).length;
  if (length === 0) return 0;
  return length < 40 ? 0.5 : 1;
}

function successCriteriaCoefficient(value) {
  const text = normalized(value);
  if (!text) return 0;
  return /\d|%/.test(text) ? 1 : 0.5;
}

export function isValidContact(value) {
  const text = normalized(value);
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
  const phoneDigits = text.replace(/\D/g, '');
  const isPhone = /^[+\d\s().-]+$/.test(text) && phoneDigits.length >= 7;
  return isEmail || isPhone;
}

function contactCoefficient(value) {
  const text = normalized(value);
  if (!text) return 0;
  return isValidContact(text) ? 1 : 0.5;
}

function ratingLevel(score) {
  if (score >= 90) return 'priority';
  if (score >= 70) return 'ready';
  if (score >= 40) return 'working';
  return 'draft';
}

export function calculateRating(card = {}) {
  const breakdown = Object.fromEntries(BREAKDOWN_KEYS.map((key) => [key, 0]));
  const weakFields = [];
  const missing = [];

  FIELD_RULES.forEach((rule, index) => {
    const value = card[rule.field];
    const coefficient = (rule.coefficient || textCoefficient)(value);
    breakdown[rule.category] += rule.weight * coefficient;

    if (coefficient === 0) missing.push(rule.field);
    if (coefficient < 1) {
      weakFields.push({
        index,
        lostPoints: rule.weight * (1 - coefficient),
        suggestion: rule.suggestion,
      });
    }
  });

  const rawScore = Object.values(breakdown).reduce((sum, points) => sum + points, 0);
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));
  const suggestions = weakFields
    .sort((left, right) => right.lostPoints - left.lostPoints || left.index - right.index)
    .map(({ suggestion }) => suggestion);

  return {
    score,
    level: ratingLevel(score),
    breakdown,
    missing,
    suggestions,
  };
}

export const ratingInternals = {
  contactCoefficient,
  ratingLevel,
  successCriteriaCoefficient,
  textCoefficient,
};
